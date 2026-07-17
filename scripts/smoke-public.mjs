#!/usr/bin/env node

const frontendBaseUrl = normalizeBaseUrl(process.env.FRONTEND_BASE_URL || "http://localhost:3000")
const backendBaseUrl = normalizeBaseUrl(process.env.BACKEND_BASE_URL || "http://localhost:8080")
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || "8000", 10)

const checks = [
  { name: "frontend home", url: `${frontendBaseUrl}/`, statuses: [200] },
  { name: "contact page", url: `${frontendBaseUrl}/contact`, statuses: [200] },
  { name: "services index", url: `${frontendBaseUrl}/services`, statuses: [200] },
  { name: "professional website service", url: `${frontendBaseUrl}/services/professional-website`, statuses: [200] },
  { name: "business clinics page", url: `${frontendBaseUrl}/business/clinics`, statuses: [200] },
  { name: "calculator page", url: `${frontendBaseUrl}/calculator`, statuses: [200] },
  { name: "blog index", url: `${frontendBaseUrl}/blog`, statuses: [200] },
  { name: "admin login shell", url: `${frontendBaseUrl}/admin/login`, statuses: [200] },
  { name: "client login shell", url: `${frontendBaseUrl}/client/login`, statuses: [200] },
  { name: "client area shell", url: `${frontendBaseUrl}/client-area`, statuses: [200] },
  { name: "privacy policy", url: `${frontendBaseUrl}/legal/privacy-policy`, statuses: [200] },
  { name: "backend health", url: `${backendBaseUrl}/api/v1/health`, statuses: [200] },
]

const results = []

for (const check of checks) {
  results.push(await runCheck(check))
}

const failed = results.filter((result) => !result.ok)

for (const result of results) {
  const marker = result.ok ? "PASS" : "FAIL"
  const expected = result.statuses.join("/")
  const actual = result.status ?? "no response"
  console.log(`${marker} ${result.name}: expected ${expected}, got ${actual} - ${result.url}`)
  if (result.error) {
    console.log(`  ${result.error}`)
  }
}

if (failed.length > 0) {
  console.error(`\nPublic smoke failed: ${failed.length}/${results.length} checks failed.`)
  process.exit(1)
}

console.log(`\nPublic smoke passed: ${results.length}/${results.length} checks passed.`)

async function runCheck(check) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 8000)

  try {
    const response = await fetch(check.url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    })

    return {
      ...check,
      ok: check.statuses.includes(response.status),
      status: response.status,
    }
  } catch (error) {
    return {
      ...check,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown request error",
    }
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "")
}
