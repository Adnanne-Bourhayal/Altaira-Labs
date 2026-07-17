#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const commandEnv = { ...process.env }

loadLocalEnvFile(".env.local")

const frontendBaseUrl = normalizeBaseUrl(process.env.FRONTEND_BASE_URL || "http://localhost:3000")
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || "8000", 10)

const adminUsername = process.env.SMOKE_ADMIN_USERNAME || process.env.ADMIN_EMAIL || process.env.ALTAIRA_DEMO_ADMIN_USERNAME || ""
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || process.env.ALTAIRA_DEMO_ADMIN_PASSWORD || ""
const clientEmail = process.env.SMOKE_CLIENT_EMAIL || ""
const clientPassword = process.env.SMOKE_CLIENT_PASSWORD || ""
const explicitAdminCredentials = Boolean(commandEnv.SMOKE_ADMIN_USERNAME && commandEnv.SMOKE_ADMIN_PASSWORD)

const results = []

await check("admin login page", "GET", "/admin/login", [200])
await check("client login page", "GET", "/client/login", [200])
await checkRedirect("legacy login redirects to admin login", "/login", "/admin/login")

await check("admin me without session", "GET", "/api/auth/me", [401])
await check("client me without session", "GET", "/api/client/auth/me", [401])
await check("admin clients API without session", "GET", "/api/internal/clients", [401])
await check("client portal API without session", "GET", "/api/client/portal", [401])

await checkRedirect("clients page redirects without admin session", "/clients", "/admin/login")
await checkRedirect("admin services page redirects without admin session", "/admin/services", "/admin/login")
await checkRedirect("admin onboarding redirects without admin session", "/admin/onboarding/example-client", "/admin/login")
await checkRedirect("client dashboard redirects without client session", "/client/dashboard", "/client/login")
await checkRedirect("onboarding redirects without client session", "/onboarding", "/client/login")

if (adminUsername && adminPassword) {
  const adminLogin = await postLogin("admin login with provided credentials", "/api/auth/login", {
    username: adminUsername,
    password: adminPassword,
  }, "altaira_admin_session", {
    softFail: !explicitAdminCredentials,
    softFailDetail: "Local admin credentials were detected but did not authenticate. Pass SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD explicitly to make this check strict.",
  })

  if (adminLogin.cookie) {
    await check("admin me with session", "GET", "/api/auth/me", [200], adminLogin.cookie)
    await check("clients page with admin session", "GET", "/clients", [200], adminLogin.cookie)
    await check("admin services page with session", "GET", "/admin/services", [200], adminLogin.cookie)
    await check("admin clients API with session", "GET", "/api/internal/clients", [200], adminLogin.cookie)
  }
} else {
  skip("admin login with provided credentials", "Set SMOKE_ADMIN_USERNAME/SMOKE_ADMIN_PASSWORD or local ADMIN_EMAIL/ADMIN_PASSWORD to run this check.")
}

if (clientEmail && clientPassword) {
  const clientLogin = await postLogin("client login with provided credentials", "/api/client/auth/login", {
    email: clientEmail,
    password: clientPassword,
  }, "altaira_client_session")

  if (clientLogin.cookie) {
    await check("client me with session", "GET", "/api/client/auth/me", [200], clientLogin.cookie)
    await check("client dashboard with session", "GET", "/client/dashboard", [200], clientLogin.cookie)
  }
} else {
  skip("client login with provided credentials", "Set SMOKE_CLIENT_EMAIL and SMOKE_CLIENT_PASSWORD to run this check.")
}

printResults()

const failed = results.filter((result) => result.status === "FAIL")

if (failed.length > 0) {
  console.error(`\nAuth CRM smoke failed: ${failed.length}/${results.length} checks failed.`)
  process.exit(1)
}

const passed = results.filter((result) => result.status === "PASS").length
const skipped = results.filter((result) => result.status === "SKIP").length
console.log(`\nAuth CRM smoke completed: ${passed} passed, ${skipped} skipped, ${failed.length} failed.`)

async function check(name, method, path, statuses, cookie = "") {
  const url = `${frontendBaseUrl}${path}`

  try {
    const response = await request(url, {
      method,
      redirect: "manual",
      headers: cookie ? { Cookie: cookie } : undefined,
    })

    const ok = statuses.includes(response.status)
    results.push({
      status: ok ? "PASS" : "FAIL",
      name,
      detail: `expected ${statuses.join("/")}, got ${response.status} - ${url}`,
    })
  } catch (error) {
    results.push({
      status: "FAIL",
      name,
      detail: `${errorMessage(error)} - ${url}`,
    })
  }
}

async function checkRedirect(name, path, expectedLocationPath) {
  const url = `${frontendBaseUrl}${path}`

  try {
    const response = await request(url, {
      method: "GET",
      redirect: "manual",
    })
    const location = response.headers.get("location") || ""
    const locationPath = safePathname(location)
    const ok = [307, 308].includes(response.status) && locationPath === expectedLocationPath

    results.push({
      status: ok ? "PASS" : "FAIL",
      name,
      detail: `expected redirect to ${expectedLocationPath}, got ${response.status} ${location || "(no location)"}`,
    })
  } catch (error) {
    results.push({
      status: "FAIL",
      name,
      detail: `${errorMessage(error)} - ${url}`,
    })
  }
}

async function postLogin(name, path, body, expectedCookieName, options = {}) {
  const url = `${frontendBaseUrl}${path}`

  try {
    const response = await request(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const cookie = extractCookie(response, expectedCookieName)
    const ok = response.status === 200 && Boolean(cookie)

    results.push({
      status: ok ? "PASS" : options.softFail ? "SKIP" : "FAIL",
      name,
      detail: ok
        ? `expected 200 and ${expectedCookieName}, got ${response.status} with session cookie - ${url}`
        : options.softFail
          ? options.softFailDetail
          : `expected 200 and ${expectedCookieName}, got ${response.status}${cookie ? " with session cookie" : " without session cookie"} - ${url}`,
    })

    return { cookie }
  } catch (error) {
    results.push({
      status: "FAIL",
      name,
      detail: `${errorMessage(error)} - ${url}`,
    })
    return { cookie: "" }
  }
}

async function request(url, options) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 8000)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function skip(name, detail) {
  results.push({
    status: "SKIP",
    name,
    detail,
  })
}

function printResults() {
  for (const result of results) {
    console.log(`${result.status} ${result.name}: ${result.detail}`)
  }
}

function extractCookie(response, cookieName) {
  const setCookie = response.headers.get("set-cookie")

  if (!setCookie) {
    return ""
  }

  const cookiePart = setCookie
    .split(/,(?=\s*[^;,=\s]+=[^;,]+)/)
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`))

  if (!cookiePart) {
    return ""
  }

  return cookiePart.split(";")[0]
}

function safePathname(value) {
  try {
    return new URL(value, frontendBaseUrl).pathname
  } catch {
    return ""
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "")
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "Unknown request error"
}

function loadLocalEnvFile(path) {
  const envPath = resolve(process.cwd(), path)

  if (!existsSync(envPath)) {
    return
  }

  const content = readFileSync(envPath, "utf8")

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)

    if (!match) {
      continue
    }

    const [, key, rawValue] = match

    if (process.env[key] !== undefined) {
      continue
    }

    process.env[key] = parseEnvValue(rawValue)
  }
}

function parseEnvValue(rawValue) {
  const value = rawValue.trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
