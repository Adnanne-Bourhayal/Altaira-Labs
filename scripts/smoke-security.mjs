const baseUrl = (process.env.ALTAIRA_SECURITY_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
const allowRemote = process.env.ALTAIRA_SECURITY_ALLOW_REMOTE === "true"
const adminUsername = process.env.ALTAIRA_SECURITY_ADMIN_USERNAME
const adminPassword = process.env.ALTAIRA_SECURITY_ADMIN_PASSWORD
const parsedBaseUrl = new URL(baseUrl)

if (!["localhost", "127.0.0.1", "::1"].includes(parsedBaseUrl.hostname) && !allowRemote) {
  throw new Error("Remote security smoke is blocked. Set ALTAIRA_SECURITY_ALLOW_REMOTE=true only with explicit authorization.")
}

const checks = []
const sensitivePatterns = [
  /\bsk_(?:test|live)_[A-Za-z0-9]+/,
  /\bwhsec_[A-Za-z0-9]+/,
  /\bre_[A-Za-z0-9]{12,}/,
  /\bghp_[A-Za-z0-9]+/,
  /\bnpg_[A-Za-z0-9]+/,
  /(?:jdbc:)?postgresql:\/\//i,
  /\b(?:RESEND_API_KEY|STRIPE_SECRET_KEY|INTERNAL_API_TOKEN|SPRING_DATASOURCE_PASSWORD|NEON_API_KEY)\b/,
]

function record(name, passed, details) {
  checks.push({ name, passed, details })
  console.log(`${passed ? "PASS" : "FAIL"} ${name}${details ? `: ${details}` : ""}`)
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    cache: "no-store",
    ...options,
  })
}

function hasNoSensitiveMaterial(content) {
  return sensitivePatterns.every((pattern) => !pattern.test(content))
}

const home = await request("/")
record("Public home responds", home.status === 200, `HTTP ${home.status}`)

const requiredHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
}

for (const [header, expected] of Object.entries(requiredHeaders)) {
  const actual = home.headers.get(header)
  record(`Global header ${header}`, actual === expected, actual || "missing")
}

const homeHtml = await home.text()
record("Public HTML contains no known secret pattern", hasNoSensitiveMaterial(homeHtml), "homepage")

const scriptSources = [...homeHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((source) => source.startsWith("/") || source.startsWith(baseUrl))

let scriptsSafe = true
for (const source of scriptSources) {
  const scriptUrl = source.startsWith("http") ? source : `${baseUrl}${source}`
  const scriptResponse = await fetch(scriptUrl, { cache: "no-store" })
  const scriptBody = await scriptResponse.text()
  if (!hasNoSensitiveMaterial(scriptBody)) {
    scriptsSafe = false
    break
  }
}
record("First-party scripts contain no known secret pattern", scriptsSafe, `${scriptSources.length} scripts checked`)

const unauthenticatedChecks = [
  ["Admin session endpoint rejects anonymous request", "/api/auth/me", undefined],
  ["Internal leads proxy rejects anonymous request", "/api/internal/leads", undefined],
  ["Client portal rejects anonymous request", "/api/client/portal", undefined],
  ["Admin session endpoint rejects forged cookie", "/api/auth/me", "altaira_admin_session=forged-security-smoke-token"],
  ["Client portal rejects forged cookie", "/api/client/portal", "altaira_client_session=forged-security-smoke-token"],
]

for (const [name, path, cookie] of unauthenticatedChecks) {
  const response = await request(path, cookie ? { headers: { Cookie: cookie } } : undefined)
  record(name, response.status === 401, `HTTP ${response.status}`)
}

const invalidLogin = await request("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "security-smoke-invalid", password: "invalid-security-smoke-password" }),
})
record("Invalid admin login is rejected", invalidLogin.status === 401, `HTTP ${invalidLogin.status}`)
record("Invalid admin login does not set a session cookie", !invalidLogin.headers.get("set-cookie"), "no Set-Cookie header")

if (adminUsername && adminPassword) {
  const validLogin = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: adminUsername, password: adminPassword }),
  })
  const validLoginBody = await validLogin.text()
  const setCookie = validLogin.headers.get("set-cookie") || ""
  const sessionCookieMatch = setCookie.match(/(?:^|,\s*)altaira_admin_session=([^;,\s]+)/)
  const sessionCookie = sessionCookieMatch
    ? `altaira_admin_session=${sessionCookieMatch[1]}`
    : ""

  record("Valid local admin login succeeds", validLogin.status === 200, `HTTP ${validLogin.status}`)
  record("Admin token is not exposed in login JSON", !validLoginBody.includes("sessionToken"), "response body")
  record("Admin session cookie is HttpOnly", /(?:^|;\s*)HttpOnly(?:;|,|$)/i.test(setCookie), "Set-Cookie")
  record("Admin session cookie uses SameSite=Strict", /SameSite=Strict/i.test(setCookie), "Set-Cookie")

  const authenticatedSession = await request("/api/auth/me", {
    headers: { Cookie: sessionCookie },
  })
  const authenticatedBody = await authenticatedSession.text()
  record("Valid admin cookie authorizes the session endpoint", authenticatedSession.status === 200, `HTTP ${authenticatedSession.status}`)
  record("Authenticated session response contains no known secret pattern", hasNoSensitiveMaterial(authenticatedBody), "session response")

  const logout = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: sessionCookie },
  })
  const logoutCookie = logout.headers.get("set-cookie") || ""
  record("Admin logout succeeds", logout.status === 200, `HTTP ${logout.status}`)
  record("Admin logout clears the session cookie", /altaira_admin_session=;/.test(logoutCookie) && /Max-Age=0/i.test(logoutCookie), "Set-Cookie")

  const replayAfterLogout = await request("/api/auth/me", {
    headers: { Cookie: sessionCookie },
  })
  record("Logged-out admin cookie cannot be replayed", replayAfterLogout.status === 401, `HTTP ${replayAfterLogout.status}`)
}

const failures = checks.filter((check) => !check.passed)
console.log(`\nSecurity smoke: ${checks.length - failures.length}/${checks.length} checks passed`)

if (failures.length > 0) {
  process.exitCode = 1
}
