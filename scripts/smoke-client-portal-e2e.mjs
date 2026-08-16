#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

loadLocalEnvFile(".env.local")

const frontendBaseUrl = normalizeBaseUrl(process.env.FRONTEND_BASE_URL || "http://localhost:3000")
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || "30000", 10)
const adminUsername = process.env.SMOKE_ADMIN_USERNAME || process.env.ALTAIRA_DEMO_ADMIN_USERNAME || ""
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || process.env.ALTAIRA_DEMO_ADMIN_PASSWORD || ""
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14)
const demoEmail = `client-e2e-${stamp}@example.com`
const demoPassword = `DemoPass${stamp}!`
const viewerEmail = `viewer-e2e-${stamp}@example.com`
const viewerPassword = `ViewerPass${stamp}!`
const results = []

if (!adminUsername || !adminPassword) {
  console.error(
    "Client portal E2E smoke requires SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD.",
  )
  process.exit(2)
}

await expectAdminOnboardingRoutesProtected()
const adminCookie = await adminLogin()
const client = await createClient(adminCookie)
const service = await pickService(adminCookie)
await assignService(adminCookie, client.id, service.id)
const generatedOnboarding = await generateOnboarding(adminCookie, client.id)
await expectOnboardingGenerationIdempotent(adminCookie, client.id, generatedOnboarding)
const invitation = await createInvitation(adminCookie, client.id, demoEmail, "client_user")
const clientCookie = await acceptInvitation(invitation.invitationUrl, demoPassword, "client_user")
const viewerInvitation = await createInvitation(adminCookie, client.id, viewerEmail, "viewer")
const viewerCookie = await acceptInvitation(viewerInvitation.invitationUrl, viewerPassword, "viewer")
await expectClientSessionRejectedByAdminApi(clientCookie)
await expectClientRejectedByAdminLogin()
const onboarding = await getClientOnboarding(clientCookie)
await expectViewerOnboardingReadOnly(viewerCookie)
const criticalSignatures = onboarding.tasks.filter((task) => task.critical && task.taskType === "signature")
assert(criticalSignatures.length > 0, "critical signature tasks exist", "Expected at least one critical signature task")
await expectPortalVisibleBeforeContract(clientCookie)

for (const task of criticalSignatures) {
  await submitSignature(clientCookie, task)
  await approveTask(adminCookie, task.id)
}

const portal = await expectPortalOpen(clientCookie)
const project = pickProject(portal.projects)
await expectViewerPortalReadOnly(viewerCookie, project.id)
await expectViewerProjectWritesRejected(viewerCookie, project.id)
await addProjectLink(clientCookie, project.id)
await submitProjectFeedback(clientCookie, project.id)
await updateProjectAsAdmin(adminCookie, project.id)
const snapshot = await createProjectConfigSnapshot(adminCookie, project.id)
await verifyProjectConfigSnapshot(adminCookie, project.id, snapshot.id)
await verifyClientProjectVisibility(clientCookie, project.id)
const crmLead = await createCrmLead(clientCookie)
await updateCrmLeadStatusAsClient(clientCookie, crmLead.id)
await addCrmLeadNoteAsClient(clientCookie, crmLead.id)
await addCrmFollowUpAsClient(clientCookie, crmLead.id)
await addCrmLeadNoteAsAdmin(adminCookie, client.id, crmLead.id, false)
await addCrmLeadNoteAsAdmin(adminCookie, client.id, crmLead.id, true)
await updateCrmLeadStatusAsAdmin(adminCookie, client.id, crmLead.id)
await addCrmFollowUpAsAdmin(adminCookie, client.id, crmLead.id, false)
const sharedFollowUp = await addCrmFollowUpAsAdmin(adminCookie, client.id, crmLead.id, true)
await completeSharedCrmFollowUpAsClient(clientCookie, crmLead.id, sharedFollowUp.id)
await verifyCrmVisibility(adminCookie, clientCookie, client.id, crmLead.id)
await verifyViewerCrmReadOnly(viewerCookie, crmLead.id)
await readAdminPortal(adminCookie, client.id, project.id)

const failed = results.filter((result) => result.status === "FAIL")

if (failed.length > 0) {
  console.error(`\nClient portal E2E smoke failed: ${failed.length}/${results.length} checks failed.`)
  process.exit(1)
}

const passed = results.filter((result) => result.status === "PASS").length
console.log(`\nClient portal E2E smoke passed: ${passed}/${results.length} checks passed.`)
console.log(`Demo client: ${client.id} (${demoEmail})`)
console.log(`Viewer: ${viewerEmail}`)
console.log(`Service: ${service.name}`)
console.log(`Project: ${project.projectKey || project.id}`)
console.log(`CRM lead: ${crmLead.id}`)
console.log(`Critical signatures approved: ${criticalSignatures.length}`)

async function adminLogin() {
  const response = await post("/api/auth/login", {
    username: adminUsername,
    password: adminPassword,
  })
  const cookie = extractCookie(response, "altaira_admin_session")
  const ok = response.status === 200 && Boolean(cookie)
  record(ok, "admin login", `expected 200 and admin session cookie, got ${response.status}`)
  assert(ok, "admin login strict", "Admin credentials are required for this E2E smoke.")
  return cookie
}

async function expectAdminOnboardingRoutesProtected() {
  const missingId = "00000000-0000-0000-0000-000000000000"
  const checks = [
    ["admin onboarding dashboard protected", await get(`/api/internal/onboarding/${missingId}`)],
    ["admin onboarding generate protected", await post(`/api/internal/onboarding/${missingId}`, {})],
    ["admin onboarding approval protected", await patch(`/api/internal/onboarding/tasks/${missingId}/approve`, {})],
    ["admin onboarding rejection protected", await patch(`/api/internal/onboarding/tasks/${missingId}/reject`, { feedback: "Unauthorized test" })],
    ["admin onboarding file download protected", await get(`/api/internal/onboarding/files/${missingId}/download`)],
  ]

  for (const [name, response] of checks) {
    const ok = response.status === 401
    record(ok, name, `expected 401 without admin session, got ${response.status}`)
    assert(ok, `${name} strict`, await response.text())
  }
}

async function createClient(adminCookie) {
  const response = await post("/api/internal/clients", {
    name: `E2E Client ${stamp}`,
    company: `Altaira E2E Company ${stamp}`,
    email: demoEmail,
    phone: "+32 470 00 00 00",
    status: "active",
    sectorType: "clinics",
  }, adminCookie)
  const data = await json(response)
  const ok = [200, 201].includes(response.status) && data?.id
  record(ok, "create client", `expected 200/201 and client id, got ${response.status}`)
  assert(ok, "create client strict", JSON.stringify(data))
  return data
}

async function pickService(adminCookie) {
  const response = await get("/api/internal/services", adminCookie)
  const data = await json(response)
  const services = Array.isArray(data) ? data : []
  const service = services.find((item) => /crm/i.test(`${item.name} ${item.category}`))
  const ok = response.status === 200 && service?.id
  record(ok, "select CRM service", `expected a CRM catalogue item, got ${response.status} with ${services.length} items`)
  assert(ok, "select CRM service strict", "Seed the CRM / Business Systems service before running this smoke.")
  return service
}

async function assignService(adminCookie, clientId, serviceId) {
  const response = await post(`/api/internal/clients/${clientId}/services`, {
    serviceId,
    status: "in_progress",
    notes: "Automated E2E smoke assignment.",
  }, adminCookie)
  const data = await json(response)
  const ok = [200, 201].includes(response.status) && data?.id
  record(ok, "assign service", `expected 200/201 and assignment id, got ${response.status}`)
  assert(ok, "assign service strict", JSON.stringify(data))
}

async function generateOnboarding(adminCookie, clientId) {
  const response = await post(`/api/internal/onboarding/${clientId}`, {}, adminCookie)
  const data = await json(response)
  const ok = response.status === 200 && Array.isArray(data?.tasks)
  record(ok, "generate onboarding", `expected 200 and tasks array, got ${response.status}`)
  assert(ok, "generate onboarding strict", JSON.stringify(data))
  return data
}

async function expectOnboardingGenerationIdempotent(adminCookie, clientId, initialOnboarding) {
  const response = await post(`/api/internal/onboarding/${clientId}`, {}, adminCookie)
  const data = await json(response)
  const initialIds = Array.isArray(initialOnboarding?.tasks)
    ? initialOnboarding.tasks.map((task) => task.id).sort()
    : []
  const repeatedIds = Array.isArray(data?.tasks)
    ? data.tasks.map((task) => task.id).sort()
    : []
  const ok = response.status === 200
    && initialIds.length > 0
    && JSON.stringify(initialIds) === JSON.stringify(repeatedIds)
  record(ok, "onboarding generation is idempotent", `expected the same ${initialIds.length} task ids, got ${repeatedIds.length}`)
  assert(ok, "onboarding idempotency strict", JSON.stringify(data))
}

async function createInvitation(adminCookie, clientId, email, role) {
  const response = await post(`/api/internal/clients/${clientId}/invitations`, {
    email,
    role,
  }, adminCookie)
  const data = await json(response)
  const ok = [200, 201].includes(response.status) && typeof data?.invitationUrl === "string"
  record(ok, `create ${role} invitation`, `expected 200/201 and invitationUrl, got ${response.status}`)
  assert(ok, `create ${role} invitation strict`, JSON.stringify(data))
  return data
}

async function acceptInvitation(invitationUrl, password, role) {
  const token = new URL(invitationUrl).searchParams.get("token")
  assert(Boolean(token), `extract ${role} invitation token`, "Invitation URL did not include token")

  const response = await post("/api/client/invitations/accept", {
    token,
    password,
    confirmPassword: password,
  })
  const cookie = extractCookie(response, "altaira_client_session")
  const data = await json(response)
  const ok = response.status === 200 && Boolean(cookie) && data?.success === true
  record(ok, `accept ${role} invitation`, `expected 200, success and client session cookie, got ${response.status}`)
  assert(ok, `accept ${role} invitation strict`, JSON.stringify(data))
  return cookie
}

async function expectClientRejectedByAdminLogin() {
  const response = await post("/api/auth/login", {
    username: demoEmail,
    password: demoPassword,
  })
  const adminCookie = extractCookie(response, "altaira_admin_session")
  const data = await json(response)
  const ok = response.status === 403
    && !adminCookie
    && data?.error === "Admin role required"
  record(ok, "client role rejected by admin login", `expected 403 and no admin cookie, got ${response.status}`)
  assert(ok, "admin role boundary strict", JSON.stringify(data))
}

async function expectClientSessionRejectedByAdminApi(clientCookie) {
  const separator = clientCookie.indexOf("=")
  const sessionToken = separator >= 0 ? clientCookie.slice(separator + 1) : ""
  assert(Boolean(sessionToken), "extract client session for role-boundary test", "Client session cookie was empty")

  const forgedAdminCookie = `altaira_admin_session=${sessionToken}`
  const response = await get("/api/internal/clients", forgedAdminCookie)
  const ok = response.status === 401
  record(ok, "client session rejected by internal admin API", `expected 401 for forged admin cookie, got ${response.status}`)
  assert(ok, "forged admin cookie boundary strict", await response.text())
}

async function getClientOnboarding(clientCookie) {
  const response = await get("/api/client/onboarding", clientCookie)
  const data = await json(response)
  const ok = response.status === 200 && Array.isArray(data?.tasks)
  record(ok, "client onboarding dashboard", `expected 200 and tasks, got ${response.status}`)
  assert(ok, "client onboarding strict", JSON.stringify(data))
  return data
}

async function expectViewerOnboardingReadOnly(viewerCookie) {
  const response = await get("/api/client/onboarding", viewerCookie)
  const data = await json(response)
  const ok = response.status === 200
    && data?.accessRole === "viewer"
    && data?.canEdit === false
    && Array.isArray(data?.tasks)
  record(ok, "viewer reads onboarding as read-only", `expected viewer/canEdit=false, got ${response.status}`)
  assert(ok, "viewer onboarding read-only strict", JSON.stringify(data))
}

async function expectPortalVisibleBeforeContract(clientCookie) {
  const response = await get("/api/client/portal", clientCookie)
  const data = await json(response)
  const ok = response.status === 200
    && data?.contractApproved === false
    && typeof data?.workspaceId === "string"
    && Array.isArray(data?.modules)
  record(
    ok,
    "portal visible before contract approval",
    `expected 200, contractApproved=false and workspace context; got ${response.status}`,
  )
  assert(ok, "pre-contract portal visibility strict", JSON.stringify(data))
}

async function submitSignature(clientCookie, task) {
  const response = await patch(`/api/client/onboarding/tasks/${task.id}/submit`, {
    signatureFullName: "Altaira E2E Client",
    signatureDocumentId: `E2E-${stamp}`,
    signatureConsent: true,
    data: {
      smoke: true,
      taskKey: task.taskKey,
    },
  }, clientCookie)
  const data = await json(response)
  const ok = response.status === 200 && ["submitted", "approved", "completed"].includes(data?.status)
  record(ok, `submit signature ${task.taskKey}`, `expected submitted/approved/completed, got ${response.status} ${data?.status || ""}`)
  assert(ok, "submit signature strict", JSON.stringify(data))
}

async function approveTask(adminCookie, taskId) {
  const response = await patch(`/api/internal/onboarding/tasks/${taskId}/approve`, {}, adminCookie)
  const data = await json(response)
  const ok = response.status === 200 && ["approved", "completed"].includes(data?.status)
  record(ok, `approve task ${taskId}`, `expected approved/completed, got ${response.status} ${data?.status || ""}`)
  assert(ok, "approve task strict", JSON.stringify(data))
}

async function expectPortalOpen(clientCookie) {
  const response = await get("/api/client/portal", clientCookie)
  const data = await json(response)
  const ok = response.status === 200 && data?.contractApproved === true && Array.isArray(data?.projects)
  record(ok, "portal opens after approvals", `expected 200, contractApproved and projects, got ${response.status}`)
  assert(ok, "portal open strict", JSON.stringify(data))
  return data
}

async function expectViewerPortalReadOnly(viewerCookie, projectId) {
  const response = await get("/api/client/portal", viewerCookie)
  const data = await json(response)
  const projectVisible = Array.isArray(data?.projects)
    && data.projects.some((item) => item.id === projectId)
  const ok = response.status === 200
    && data?.accessRole === "viewer"
    && data?.canEdit === false
    && projectVisible
  record(ok, "viewer reads portal as read-only", `expected viewer/canEdit=false with project, got ${response.status}`)
  assert(ok, "viewer portal read-only strict", JSON.stringify(data))
}

async function expectViewerProjectWritesRejected(viewerCookie, projectId) {
  const checks = [
    [
      "viewer project feedback rejected",
      await patch(`/api/client/portal/projects/${projectId}/feedback`, {
        feedback: "Viewer must not edit project feedback",
      }, viewerCookie),
    ],
    [
      "viewer project link rejected",
      await post(`/api/client/portal/projects/${projectId}/links`, {
        url: "https://example.com/viewer-write-must-fail",
        label: "Viewer write",
        description: "This request must be rejected.",
      }, viewerCookie),
    ],
    [
      "viewer CRM lead creation rejected",
      await post("/api/client/crm/leads", {
        fullName: "Viewer Write Must Fail",
        email: viewerEmail,
        source: "viewer_e2e",
      }, viewerCookie),
    ],
  ]

  for (const [name, response] of checks) {
    const ok = response.status === 403
    record(ok, name, `expected 403, got ${response.status}`)
    assert(ok, `${name} strict`, await response.text())
  }
}

function pickProject(projects) {
  const project = Array.isArray(projects) ? projects[0] : null
  const ok = Boolean(project?.id)
  record(ok, "select client project", `expected at least one project, got ${Array.isArray(projects) ? projects.length : "none"}`)
  assert(ok, "select project strict", "No client project found after portal unlock.")
  return project
}

async function addProjectLink(clientCookie, projectId) {
  const response = await post(`/api/client/portal/projects/${projectId}/links`, {
    url: "https://example.com/client-portal-e2e",
    label: "E2E project reference",
    assetType: "reference_link",
    notes: "Automated smoke link.",
  }, clientCookie)
  const data = await json(response)
  const ok = [200, 201].includes(response.status) && data?.id
  record(ok, "add project link", `expected 200/201 and asset id, got ${response.status}`)
  assert(ok, "add project link strict", JSON.stringify(data))
}

async function submitProjectFeedback(clientCookie, projectId) {
  const response = await patch(`/api/client/portal/projects/${projectId}/feedback`, {
    feedback: "Automated E2E smoke feedback for the active service track.",
  }, clientCookie)
  const data = await json(response)
  const ok = response.status === 200 && data?.latestClientFeedback
  record(ok, "submit project feedback", `expected 200 and latest feedback, got ${response.status}`)
  assert(ok, "submit project feedback strict", JSON.stringify(data))
}

async function updateProjectAsAdmin(adminCookie, projectId) {
  const response = await patch(`/api/internal/client-projects/${projectId}`, {
    currentPhase: "review",
    stagingUrl: `https://example.com/staging/${stamp}`,
  }, adminCookie)
  const data = await json(response)
  const ok = response.status === 200
    && data?.currentPhase === "review"
    && data?.stagingUrl === `https://example.com/staging/${stamp}`
  record(ok, "admin updates project phase and staging", `expected review phase and staging URL, got ${response.status}`)
  assert(ok, "admin project update strict", JSON.stringify(data))
}

async function createProjectConfigSnapshot(adminCookie, projectId) {
  const response = await post(`/api/internal/client-projects/${projectId}/config-snapshots`, {
    label: `CRM E2E configuration ${stamp}`,
    artifactType: "crm_schema_handoff",
    configJson: JSON.stringify({
      source: "client-portal-e2e",
      projectId,
      pipeline: ["new_lead", "contacted", "proposal_sent"],
    }),
  }, adminCookie)
  const data = await json(response)
  const ok = [200, 201].includes(response.status)
    && data?.id
    && data?.projectId === projectId
    && data?.artifactType === "crm_schema_handoff"
  record(ok, "admin creates project config snapshot", `expected persisted admin snapshot, got ${response.status}`)
  assert(ok, "create project config snapshot strict", JSON.stringify(data))
  return data
}

async function verifyProjectConfigSnapshot(adminCookie, projectId, snapshotId) {
  const response = await get(`/api/internal/client-projects/${projectId}/config-snapshots`, adminCookie)
  const data = await json(response)
  const snapshots = Array.isArray(data) ? data : []
  const ok = response.status === 200 && snapshots.some((snapshot) => snapshot.id === snapshotId)
  record(ok, "admin reads project config snapshot", `expected snapshot ${snapshotId}, got ${response.status} with ${snapshots.length} items`)
  assert(ok, "read project config snapshot strict", JSON.stringify(data))
}

async function verifyClientProjectVisibility(clientCookie, projectId) {
  const response = await get("/api/client/portal", clientCookie)
  const data = await json(response)
  const clientProject = Array.isArray(data?.projects)
    ? data.projects.find((item) => item.id === projectId)
    : null
  const serialized = JSON.stringify(clientProject || {})
  const ok = response.status === 200
    && clientProject?.currentPhase === "review"
    && clientProject?.stagingUrl === `https://example.com/staging/${stamp}`
    && !("configSnapshots" in (clientProject || {}))
    && !serialized.includes("crm_schema_handoff")
  record(ok, "client sees project phase without admin config", `expected review project and no admin-only snapshot, got ${response.status}`)
  assert(ok, "client project visibility strict", serialized)
}

async function createCrmLead(clientCookie) {
  const response = await post("/api/client/crm/leads", {
    fullName: `CRM Lead ${stamp}`,
    email: `crm-lead-${stamp}@example.com`,
    phone: "+32 470 11 22 33",
    source: "client_portal_e2e",
    priority: "high",
    sectorFields: {
      clinic_type: "dental",
      requested_service: "booking and CRM",
    },
    initialNote: `Initial client CRM note ${stamp}`,
  }, clientCookie)
  const data = await json(response)
  const ok = response.status === 201
    && data?.id
    && data?.status === "new_lead"
    && data?.clientId === client.id
  record(ok, "client creates CRM lead", `expected 201 new_lead scoped to client, got ${response.status}`)
  assert(ok, "create CRM lead strict", JSON.stringify(data))
  return data
}

async function updateCrmLeadStatusAsClient(clientCookie, leadId) {
  const response = await patch(`/api/client/crm/leads/${leadId}/status`, {
    status: "contacted",
  }, clientCookie)
  const data = await json(response)
  const ok = response.status === 200 && data?.status === "contacted"
  record(ok, "client updates CRM lead status", `expected contacted, got ${response.status} ${data?.status || ""}`)
  assert(ok, "client CRM status strict", JSON.stringify(data))
}

async function addCrmLeadNoteAsClient(clientCookie, leadId) {
  const content = `Client-visible CRM note ${stamp}`
  const response = await post(`/api/client/crm/leads/${leadId}/notes`, { content }, clientCookie)
  const data = await json(response)
  const ok = response.status === 200
    && Array.isArray(data?.notes)
    && data.notes.some((note) => note.content === content && note.visibleToClient === true)
  record(ok, "client adds CRM note", `expected persisted client-visible note, got ${response.status}`)
  assert(ok, "client CRM note strict", JSON.stringify(data))
}

async function addCrmFollowUpAsClient(clientCookie, leadId) {
  const title = `Client follow-up ${stamp}`
  const response = await post(`/api/client/crm/leads/${leadId}/follow-up-actions`, {
    title,
    description: "Call the lead and confirm the requested service.",
  }, clientCookie)
  const data = await json(response)
  const ok = response.status === 200
    && Array.isArray(data?.followUpActions)
    && data.followUpActions.some((action) => action.title === title && action.visibleToClient === true)
  record(ok, "client creates CRM follow-up", `expected visible follow-up action, got ${response.status}`)
  assert(ok, "client CRM follow-up strict", JSON.stringify(data))
}

async function addCrmLeadNoteAsAdmin(adminCookie, clientId, leadId, visibleToClient) {
  const visibility = visibleToClient ? "shared" : "private"
  const content = `Admin ${visibility} CRM note ${stamp}`
  const response = await post(`/api/internal/clients/${clientId}/crm-leads/${leadId}/notes`, {
    content,
    visibleToClient,
  }, adminCookie)
  const data = await json(response)
  const ok = response.status === 200
    && Array.isArray(data?.notes)
    && data.notes.some((note) => note.content === content && note.visibleToClient === visibleToClient)
  record(ok, `admin adds ${visibility} CRM note`, `expected persisted ${visibility} note, got ${response.status}`)
  assert(ok, `admin ${visibility} CRM note strict`, JSON.stringify(data))
}

async function updateCrmLeadStatusAsAdmin(adminCookie, clientId, leadId) {
  const response = await patch(`/api/internal/clients/${clientId}/crm-leads/${leadId}/status`, {
    status: "proposal_sent",
  }, adminCookie)
  const data = await json(response)
  const ok = response.status === 200 && data?.status === "proposal_sent"
  record(ok, "admin updates CRM lead status", `expected proposal_sent, got ${response.status} ${data?.status || ""}`)
  assert(ok, "admin CRM status strict", JSON.stringify(data))
}

async function addCrmFollowUpAsAdmin(adminCookie, clientId, leadId, visibleToClient) {
  const visibility = visibleToClient ? "shared" : "private"
  const title = `Admin ${visibility} follow-up ${stamp}`
  const response = await post(`/api/internal/clients/${clientId}/crm-leads/${leadId}/follow-up-actions`, {
    title,
    description: `Automated ${visibility} admin follow-up.`,
    visibleToClient,
  }, adminCookie)
  const data = await json(response)
  const action = Array.isArray(data?.followUpActions)
    ? data.followUpActions.find((item) => item.title === title)
    : null
  const ok = response.status === 200 && action?.visibleToClient === visibleToClient
  record(ok, `admin creates ${visibility} CRM follow-up`, `expected persisted ${visibility} action, got ${response.status}`)
  assert(ok, `admin ${visibility} CRM follow-up strict`, JSON.stringify(data))
  return action
}

async function completeSharedCrmFollowUpAsClient(clientCookie, leadId, actionId) {
  const response = await patch(`/api/client/crm/leads/${leadId}/follow-up-actions/${actionId}/status`, {
    status: "done",
  }, clientCookie)
  const data = await json(response)
  const action = Array.isArray(data?.followUpActions)
    ? data.followUpActions.find((item) => item.id === actionId)
    : null
  const ok = response.status === 200 && action?.status === "done" && action?.createdByUsername == null
  record(ok, "client completes shared CRM follow-up", `expected done action without admin username, got ${response.status}`)
  assert(ok, "client shared follow-up strict", JSON.stringify(data))
}

async function verifyCrmVisibility(adminCookie, clientCookie, clientId, leadId) {
  const adminResponse = await get(`/api/internal/clients/${clientId}/crm-leads`, adminCookie)
  const adminData = await json(adminResponse)
  const adminLead = Array.isArray(adminData) ? adminData.find((item) => item.id === leadId) : null
  const adminSeesPrivate = adminLead?.notes?.some((note) => note.content === `Admin private CRM note ${stamp}`)
    && adminLead?.followUpActions?.some((action) => action.title === `Admin private follow-up ${stamp}`)
  const adminOk = adminResponse.status === 200
    && adminLead?.status === "proposal_sent"
    && adminSeesPrivate
  record(adminOk, "admin reads complete CRM record", `expected proposal_sent plus private records, got ${adminResponse.status}`)
  assert(adminOk, "admin CRM readback strict", JSON.stringify(adminLead))

  const clientResponse = await get(`/api/client/crm/leads/${leadId}`, clientCookie)
  const clientLead = await json(clientResponse)
  const clientNotes = Array.isArray(clientLead?.notes) ? clientLead.notes : []
  const clientActions = Array.isArray(clientLead?.followUpActions) ? clientLead.followUpActions : []
  const clientOk = clientResponse.status === 200
    && clientLead?.status === "proposal_sent"
    && clientNotes.some((note) => note.content === `Admin shared CRM note ${stamp}`)
    && !clientNotes.some((note) => note.content === `Admin private CRM note ${stamp}`)
    && clientActions.some((action) => action.title === `Admin shared follow-up ${stamp}` && action.status === "done")
    && !clientActions.some((action) => action.title === `Admin private follow-up ${stamp}`)
    && clientNotes.every((note) => note.authorUsername == null)
    && clientActions.every((action) => action.createdByUsername == null)
  record(clientOk, "client CRM response hides admin-only data", `expected shared records only, got ${clientResponse.status}`)
  assert(clientOk, "client CRM visibility strict", JSON.stringify(clientLead))

  const listResponse = await get("/api/client/crm/leads", clientCookie)
  const listData = await json(listResponse)
  const listOk = listResponse.status === 200
    && Array.isArray(listData)
    && listData.some((item) => item.id === leadId && item.clientId === clientId)
  record(listOk, "client CRM list persists lead", `expected lead ${leadId} in scoped list, got ${listResponse.status}`)
  assert(listOk, "client CRM list strict", JSON.stringify(listData))
}

async function verifyViewerCrmReadOnly(viewerCookie, leadId) {
  const listResponse = await get("/api/client/crm/leads", viewerCookie)
  const listData = await json(listResponse)
  const readsList = listResponse.status === 200
    && Array.isArray(listData)
    && listData.some((item) => item.id === leadId)
  record(readsList, "viewer reads scoped CRM list", `expected lead ${leadId}, got ${listResponse.status}`)
  assert(readsList, "viewer CRM list strict", JSON.stringify(listData))

  const detailResponse = await get(`/api/client/crm/leads/${leadId}`, viewerCookie)
  const detailData = await json(detailResponse)
  const readsDetail = detailResponse.status === 200 && detailData?.id === leadId
  record(readsDetail, "viewer reads scoped CRM detail", `expected lead ${leadId}, got ${detailResponse.status}`)
  assert(readsDetail, "viewer CRM detail strict", JSON.stringify(detailData))

  const writeChecks = [
    [
      "viewer CRM status update rejected",
      await patch(`/api/client/crm/leads/${leadId}/status`, {
        status: "won",
      }, viewerCookie),
    ],
    [
      "viewer CRM note rejected",
      await post(`/api/client/crm/leads/${leadId}/notes`, {
        content: "Viewer must not create notes",
      }, viewerCookie),
    ],
    [
      "viewer CRM follow-up rejected",
      await post(`/api/client/crm/leads/${leadId}/follow-up-actions`, {
        title: "Viewer must not create follow-ups",
      }, viewerCookie),
    ],
  ]

  for (const [name, response] of writeChecks) {
    const ok = response.status === 403
    record(ok, name, `expected 403, got ${response.status}`)
    assert(ok, `${name} strict`, await response.text())
  }
}

async function readAdminPortal(adminCookie, clientId, projectId) {
  const response = await get(`/api/internal/client-portal/${clientId}`, adminCookie)
  const data = await json(response)
  const adminProject = Array.isArray(data?.projects)
    ? data.projects.find((item) => item.id === projectId)
    : null
  const ok = response.status === 200
    && data?.contractApproved === true
    && adminProject?.currentPhase === "review"
    && adminProject?.stagingUrl === `https://example.com/staging/${stamp}`
  record(ok, "admin reads updated client portal", `expected approved portal with updated project, got ${response.status}`)
  assert(ok, "admin portal strict", JSON.stringify(data))
}

async function get(path, cookie = "") {
  return request(path, { method: "GET", cookie })
}

async function post(path, body, cookie = "") {
  return request(path, { method: "POST", cookie, body })
}

async function patch(path, body, cookie = "") {
  return request(path, { method: "PATCH", cookie, body })
}

async function request(path, options) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 10000)

  try {
    return await fetch(`${frontendBaseUrl}${path}`, {
      method: options.method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        ...(options.cookie ? { Cookie: options.cookie } : {}),
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function json(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
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

  return cookiePart ? cookiePart.split(";")[0] : ""
}

function record(ok, name, detail) {
  const result = {
    status: ok ? "PASS" : "FAIL",
    name,
    detail,
  }

  results.push(result)
  console.log(`${result.status} ${result.name}: ${result.detail}`)
}

function assert(condition, name, detail) {
  if (condition) {
    return
  }

  record(false, name, detail)
  process.exit(1)
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "")
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
  let value = rawValue.trim()

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }

  return value
}
