package com.altaira.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientUserAccessEntity;
import com.altaira.backend.repository.AppUserRepository;
import com.altaira.backend.repository.AppUserSessionRepository;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientCrmFollowUpActionRepository;
import com.altaira.backend.repository.ClientCrmLeadEventRepository;
import com.altaira.backend.repository.ClientCrmLeadNoteRepository;
import com.altaira.backend.repository.ClientCrmLeadRepository;
import com.altaira.backend.repository.ClientCrmWebhookTokenRepository;
import com.altaira.backend.repository.ClientInvitationRepository;
import com.altaira.backend.repository.ClientProjectAssetRepository;
import com.altaira.backend.repository.ClientProjectRepository;
import com.altaira.backend.repository.ClientServiceRepository;
import com.altaira.backend.repository.ClientUserAccessRepository;
import com.altaira.backend.repository.ClientWorkspaceRepository;
import com.altaira.backend.repository.InternalNoteRepository;
import com.altaira.backend.repository.LeadRepository;
import com.altaira.backend.repository.OnboardingAuditLogRepository;
import com.altaira.backend.repository.OnboardingFileRepository;
import com.altaira.backend.repository.OnboardingTaskRepository;
import com.altaira.backend.repository.SecurityEventRepository;
import com.altaira.backend.repository.ServiceRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockMultipartFile;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
		"altaira.contact.email.timeout-ms=250",
		"altaira.rate-limit.leads.capacity=100",
		"altaira.rate-limit.leads.refill-per-minute=100",
		"altaira.rate-limit.login.capacity=100",
		"altaira.rate-limit.login.refill-per-five-minutes=100",
		"altaira.onboarding.storage-dir=${java.io.tmpdir}/altaira-onboarding-test-files"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendApplicationTests {

	private static final String INTERNAL_TOKEN = "test-internal-token";
	private static final MockGoogleTokenInfoServer GOOGLE_TOKEN_INFO_SERVER = MockGoogleTokenInfoServer.start();
	private static final MockResendEmailServer CLIENT_CRM_ALERT_EMAIL_SERVER = MockResendEmailServer.start();

	@DynamicPropertySource
	static void configureGoogleTokenInfo(DynamicPropertyRegistry registry) {
		registry.add("altaira.client.google.client-id", () -> "test-google-client-id");
		registry.add("altaira.client.google.token-info-url", GOOGLE_TOKEN_INFO_SERVER::url);
		registry.add("altaira.client-crm.alerts.enabled", () -> "true");
		registry.add("altaira.client-crm.alerts.from", () -> "onboarding@resend.dev");
		registry.add("altaira.client-crm.alerts.resend.api-key", () -> "test-resend-api-key");
		registry.add("altaira.client-crm.alerts.resend.api-url", CLIENT_CRM_ALERT_EMAIL_SERVER::url);
		registry.add("altaira.client-crm.alerts.dashboard-url", () -> "https://altaira.test/client/dashboard?lead={leadId}&client={clientId}");
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private LeadRepository leadRepository;

	@Autowired
	private AppUserRepository appUserRepository;

	@Autowired
	private AppUserSessionRepository appUserSessionRepository;

	@Autowired
	private SecurityEventRepository securityEventRepository;

	@Autowired
	private ClientRepository clientRepository;

	@Autowired
	private ClientCrmLeadRepository clientCrmLeadRepository;

	@Autowired
	private ClientCrmFollowUpActionRepository clientCrmFollowUpActionRepository;

	@Autowired
	private ClientCrmLeadEventRepository clientCrmLeadEventRepository;

	@Autowired
	private ClientCrmLeadNoteRepository clientCrmLeadNoteRepository;

	@Autowired
	private ClientCrmWebhookTokenRepository clientCrmWebhookTokenRepository;

	@Autowired
	private ClientInvitationRepository clientInvitationRepository;

	@Autowired
	private ServiceRepository serviceRepository;

	@Autowired
	private ClientServiceRepository clientServiceRepository;

	@Autowired
	private ClientProjectRepository clientProjectRepository;

	@Autowired
	private ClientProjectAssetRepository clientProjectAssetRepository;

	@Autowired
	private ClientUserAccessRepository clientUserAccessRepository;

	@Autowired
	private ClientWorkspaceRepository clientWorkspaceRepository;

	@Autowired
	private OnboardingTaskRepository onboardingTaskRepository;

	@Autowired
	private OnboardingFileRepository onboardingFileRepository;

	@Autowired
	private OnboardingAuditLogRepository onboardingAuditLogRepository;

	@Autowired
	private InternalNoteRepository internalNoteRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	private JavaMailSender mailSender;

	@BeforeEach
	void resetDatabase() {
		Mockito.reset(mailSender);
		CLIENT_CRM_ALERT_EMAIL_SERVER.clear();
		appUserSessionRepository.deleteAll();
		securityEventRepository.deleteAll();
		onboardingAuditLogRepository.deleteAll();
		onboardingFileRepository.deleteAll();
		onboardingTaskRepository.deleteAll();
		clientWorkspaceRepository.deleteAll();
		clientCrmLeadEventRepository.deleteAll();
		clientCrmFollowUpActionRepository.deleteAll();
		clientCrmLeadNoteRepository.deleteAll();
		clientCrmLeadRepository.deleteAll();
		clientCrmWebhookTokenRepository.deleteAll();
		clientProjectAssetRepository.deleteAll();
		clientProjectRepository.deleteAll();
		clientInvitationRepository.deleteAll();
		clientUserAccessRepository.deleteAll();
		internalNoteRepository.deleteAll();
		clientServiceRepository.deleteAll();
		clientRepository.deleteAll();
		leadRepository.deleteAll();
	}

	@Test
	void contextLoads() {
	}

	@Test
	void createsLeadWithoutInternalToken() throws Exception {
		mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": " Ada Lovelace ",
								  "businessName": " Analytical Engines ",
								  "email": "ADA@EXAMPLE.COM",
								  "phone": " +32 470 11 22 33 ",
								  "industry": " Software ",
								  "serviceInterest": " Workflow Automation ",
								  "goals": " Capture leads reliably "
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(matchesPattern("[0-9a-fA-F-]{36}")))
				.andExpect(jsonPath("$.fullName").value("Ada Lovelace"))
				.andExpect(jsonPath("$.businessName").value("Analytical Engines"))
				.andExpect(jsonPath("$.email").value("ada@example.com"))
				.andExpect(jsonPath("$.phone").value("+32 470 11 22 33"))
				.andExpect(jsonPath("$.serviceInterest").value("Workflow Automation"))
				.andExpect(jsonPath("$.status").value("new"));
	}

	@Test
	void sendsEmailNotificationWithFullPublicContactContext() throws Exception {
		mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Marta Ruiz",
								  "businessName": "Ruiz Dental Studio",
								  "email": "marta@example.com",
								  "phone": "+32 470 44 55 66",
								  "industry": "Service request",
								  "serviceInterest": "Booking Systems",
								  "goals": "Needs appointment requests and patient follow-up."
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.emailNotificationSent").value(true));

		ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
		Mockito.verify(mailSender).send(messageCaptor.capture());

		SimpleMailMessage message = messageCaptor.getValue();
		String body = message.getText();

		org.junit.jupiter.api.Assertions.assertEquals("altairalabs@gmail.com", message.getTo()[0]);
		org.junit.jupiter.api.Assertions.assertEquals("marta@example.com", message.getReplyTo());
		org.junit.jupiter.api.Assertions.assertEquals("New Altaira Labs contact lead: Ruiz Dental Studio", message.getSubject());
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Name: Marta Ruiz"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Business: Ruiz Dental Studio"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Email: marta@example.com"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Phone: +32 470 44 55 66"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Sector / context: Service request"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Service interest: Booking Systems"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Created at: "));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Recommended next step:"));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Review this request in the admin dashboard and schedule a discovery call."));
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("Needs appointment requests and patient follow-up."));
	}

	@Test
	void savesLeadWhenEmailNotificationTimesOut() throws Exception {
		Mockito.doAnswer(invocation -> {
			Thread.sleep(1500);
			return null;
		}).when(mailSender).send(Mockito.any(SimpleMailMessage.class));

		String responseBody = mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Slow SMTP",
								  "businessName": "Timeout Test",
								  "email": "slow-smtp@example.com",
								  "phone": "+32 470 00 00 00",
								  "industry": "Email timeout",
								  "serviceInterest": "General contact",
								  "goals": "The lead must be saved even if SMTP is slow."
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.emailNotificationSent").value(false))
				.andExpect(jsonPath("$.emailNotificationMessage").value("Email notification timed out; lead was saved."))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode response = objectMapper.readTree(responseBody);
		UUID leadId = UUID.fromString(response.get("id").asText());

		org.junit.jupiter.api.Assertions.assertTrue(leadRepository.findById(leadId).isPresent());
	}

	@Test
	void reportsEmailAuthenticationFailureWithoutLosingLead() throws Exception {
		Mockito.doThrow(new MailAuthenticationException("Bad credentials"))
				.when(mailSender).send(Mockito.any(SimpleMailMessage.class));

		String responseBody = mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "SMTP Auth Failure",
								  "businessName": "Auth Test",
								  "email": "smtp-auth@example.com",
								  "phone": "+32 470 00 00 01",
								  "industry": "Email authentication",
								  "serviceInterest": "General contact",
								  "goals": "The lead must be saved even if SMTP authentication fails."
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.emailNotificationSent").value(false))
				.andExpect(jsonPath("$.emailNotificationMessage")
						.value("Email authentication failed. Check Render SMTP username/password or Google App Password."))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode response = objectMapper.readTree(responseBody);
		UUID leadId = UUID.fromString(response.get("id").asText());

		org.junit.jupiter.api.Assertions.assertTrue(leadRepository.findById(leadId).isPresent());
	}

	@Test
	void rejectsInvalidPublicLeadRequest() throws Exception {
		mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "",
								  "businessName": "Altaira QA",
								  "email": "not-an-email"
								}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Validation failed"))
				.andExpect(jsonPath("$.fields.fullName").value("Full name is required"))
				.andExpect(jsonPath("$.fields.email").value("Email must be valid"));
	}

	@Test
	void rejectsTooShortLeadIdentityFields() throws Exception {
		mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "A",
								  "businessName": "B",
								  "email": "lead@example.com"
								}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Validation failed"))
				.andExpect(jsonPath("$.fields.fullName").value("Full name must be between 2 and 100 characters"))
				.andExpect(jsonPath("$.fields.businessName").value("Business name must be between 2 and 120 characters"));
	}

	@Test
	void rejectsLeadListingWithoutInternalToken() throws Exception {
		mockMvc.perform(get("/api/v1/leads"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void allowsLeadListingWithInternalToken() throws Exception {
		createLead("Grace Hopper", "Compiler Co", "grace@example.com");

		mockMvc.perform(get("/api/v1/leads")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].fullName").value("Grace Hopper"));
	}

	@Test
	void returnsLeadDetailWithInternalToken() throws Exception {
		String leadId = createLead("Katherine Johnson", "Orbital Math", "katherine@example.com");

		mockMvc.perform(get("/api/v1/leads/" + leadId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(leadId))
				.andExpect(jsonPath("$.status").value("new"));
	}

	@Test
	void rejectsEmailDiagnosticsWithoutAdminAccess() throws Exception {
		mockMvc.perform(get("/api/v1/diagnostics/email"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsSafeEmailDiagnosticsWithInternalToken() throws Exception {
		mockMvc.perform(get("/api/v1/diagnostics/email")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.enabled").value(true))
				.andExpect(jsonPath("$.provider").value("smtp"))
				.andExpect(jsonPath("$.notificationTo").value("altairalabs@gmail.com"))
				.andExpect(jsonPath("$.timeoutMs").value(250))
				.andExpect(jsonPath("$.resendApiUrl").value("https://api.resend.com/emails"))
				.andExpect(jsonPath("$.resendApiKeyConfigured").value(false))
				.andExpect(jsonPath("$.smtpPort").value(587))
				.andExpect(jsonPath("$.smtpAuthEnabled").value(true))
				.andExpect(jsonPath("$.smtpStartTlsEnabled").value(true))
				.andExpect(jsonPath("$.smtpStartTlsRequired").value(true))
				.andExpect(jsonPath("$.resendApiKey").doesNotExist())
				.andExpect(jsonPath("$.smtpPassword").doesNotExist());
	}

	@Test
	void updatesLeadStatusWithInternalToken() throws Exception {
		String leadId = createLead("Mary Jackson", "Engineering Lab", "mary@example.com");

		mockMvc.perform(patch("/api/v1/leads/" + leadId + "/status")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"status\":\" CONTACTED \"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("contacted"));
	}

	@Test
	void rejectsInvalidLeadStatus() throws Exception {
		String response = mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Grace Hopper",
								  "businessName": "Compiler Co",
								  "email": "grace@example.com"
								}
								"""))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode leadJson = objectMapper.readTree(response);
		String leadId = leadJson.get("id").asText();

		mockMvc.perform(patch("/api/v1/leads/" + leadId + "/status")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"status\":\"archived\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Invalid lead status"));
	}

	@Test
	void returnsNotFoundForMissingLead() throws Exception {
		String missingLeadId = UUID.randomUUID().toString();

		mockMvc.perform(get("/api/v1/leads/" + missingLeadId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Lead not found"));
	}

	@Test
	void rejectsClientListingWithoutInternalToken() throws Exception {
		mockMvc.perform(get("/api/v1/clients"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void logsInDemoAdminWithBcryptPasswordAndCreatesHashedSession() throws Exception {
		String response = mockMvc.perform(post("/api/v1/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "username": "admin123",
								  "password": "admin123"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sessionToken").exists())
				.andExpect(jsonPath("$.user.username").value("admin123"))
				.andExpect(jsonPath("$.user.role").value("admin"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String sessionToken = objectMapper.readTree(response).get("sessionToken").asText();
		var user = appUserRepository.findByUsernameIgnoreCase("admin123").orElseThrow();
		var session = appUserSessionRepository.findAll().get(0);

		org.junit.jupiter.api.Assertions.assertNotEquals("admin123", user.getPasswordHash());
		org.junit.jupiter.api.Assertions.assertTrue(user.getPasswordHash().startsWith("$2"));
		org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("admin123", user.getPasswordHash()));
		org.junit.jupiter.api.Assertions.assertNotEquals(sessionToken, session.getSessionTokenHash());
		org.junit.jupiter.api.Assertions.assertEquals(64, session.getSessionTokenHash().length());
		org.junit.jupiter.api.Assertions.assertEquals(1, securityEventRepository.countByEventType("login_success"));
	}

	@Test
	void rejectsInvalidDemoAdminLoginAndStoresFailedLoginEvent() throws Exception {
		mockMvc.perform(post("/api/v1/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "username": "admin123",
								  "password": "wrong-password"
								}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Invalid credentials"));

		org.junit.jupiter.api.Assertions.assertEquals(1, securityEventRepository.countByEventType("login_failed"));
	}

	@Test
	void blocksCurrentUserEndpointWithoutSession() throws Exception {
		mockMvc.perform(get("/api/v1/auth/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void allowsAdminEndpointWithValidSessionToken() throws Exception {
		createLead("Session Admin", "Session Co", "session-admin@example.com");
		String sessionToken = loginAndReturnSessionToken();

		mockMvc.perform(get("/api/v1/leads")
						.header("X-Admin-Session-Token", sessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].fullName").value("Session Admin"));
	}

	@Test
	void revokesPreviousAdminSessionWhenLoggingInAgain() throws Exception {
		String firstSessionToken = loginAndReturnSessionToken();
		String secondSessionToken = loginAndReturnSessionToken();

		mockMvc.perform(get("/api/v1/auth/me")
						.header("X-Admin-Session-Token", firstSessionToken))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(get("/api/v1/auth/me")
						.header("X-Admin-Session-Token", secondSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("admin123"));

		var sessions = appUserSessionRepository.findAll();
		org.junit.jupiter.api.Assertions.assertEquals(2, sessions.size());
		org.junit.jupiter.api.Assertions.assertEquals(1, sessions.stream().filter(session -> session.getRevokedAt() != null).count());
	}

	@Test
	void roleSpecificLoginRejectsWrongPortalWithoutRevokingExistingClientSession() throws Exception {
		String clientId = createClientWithSector("Role Boundary Client", "Role Boundary Co", "role-boundary@example.com", "custom");
		createClientUserAccess(clientId, "role-boundary@example.com", "client-pass-789");

		String clientLoginBody = mockMvc.perform(post("/api/v1/auth/client/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "username": "role-boundary@example.com",
							  "password": "client-pass-789"
							}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.user.role").value("client_user"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String clientSessionToken = objectMapper.readTree(clientLoginBody).get("sessionToken").asText();

		mockMvc.perform(post("/api/v1/auth/admin/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "username": "role-boundary@example.com",
							  "password": "client-pass-789"
							}
							"""))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Admin role required"));

		mockMvc.perform(get("/api/v1/auth/me")
					.header("X-Admin-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("role-boundary@example.com"));

		mockMvc.perform(post("/api/v1/auth/client/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "username": "admin123",
							  "password": "admin123"
							}
							"""))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Client role required"));

		org.junit.jupiter.api.Assertions.assertEquals(1, appUserSessionRepository.count());
	}

	@Test
	void createsClientWithInternalToken() throws Exception {
		mockMvc.perform(post("/api/v1/clients")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": " Ada Client ",
								  "company": " Altaira Client Co ",
								  "email": "CLIENT@EXAMPLE.COM",
								  "phone": " +32 470 00 00 00 "
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(matchesPattern("[0-9a-fA-F-]{36}")))
				.andExpect(jsonPath("$.name").value("Ada Client"))
				.andExpect(jsonPath("$.company").value("Altaira Client Co"))
				.andExpect(jsonPath("$.email").value("client@example.com"))
				.andExpect(jsonPath("$.status").value("active"));
	}

	@Test
	void createsClientFromLeadIdempotently() throws Exception {
		String leadId = createLead("Lead Owner", "Lead Company", "owner@example.com");

		String firstResponse = mockMvc.perform(post("/api/v1/clients/from-lead/" + leadId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sourceLeadId").value(leadId))
				.andExpect(jsonPath("$.name").value("Lead Owner"))
				.andExpect(jsonPath("$.company").value("Lead Company"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String secondResponse = mockMvc.perform(post("/api/v1/clients/from-lead/" + leadId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String firstClientId = objectMapper.readTree(firstResponse).get("id").asText();
		String secondClientId = objectMapper.readTree(secondResponse).get("id").asText();

		org.junit.jupiter.api.Assertions.assertEquals(firstClientId, secondClientId);
	}

	@Test
	void listsSeededServiceCatalogueWithInternalToken() throws Exception {
		mockMvc.perform(get("/api/v1/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").exists());
	}

	@Test
	void assignsServiceToClientAndUpdatesStatus() throws Exception {
		String clientId = createClient("Service Client", "Service Co", "service-client@example.com");
		String serviceId = firstServiceId();

		String assignmentResponse = mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "notes": "Start with an internal dashboard."
								}
								""".formatted(serviceId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.service.id").value(serviceId))
				.andExpect(jsonPath("$.status").value("planned"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String assignmentId = objectMapper.readTree(assignmentResponse).get("id").asText();

		String duplicateResponse = mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "notes": "Updated internal dashboard scope."
								}
								""".formatted(serviceId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.service.id").value(serviceId))
				.andExpect(jsonPath("$.notes").value("Updated internal dashboard scope."))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String duplicateAssignmentId = objectMapper.readTree(duplicateResponse).get("id").asText();
		org.junit.jupiter.api.Assertions.assertEquals(assignmentId, duplicateAssignmentId);
		org.junit.jupiter.api.Assertions.assertEquals(1, clientServiceRepository.count());

		mockMvc.perform(patch("/api/v1/client-services/" + assignmentId + "/status")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"status\":\" in_progress \"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("in_progress"));
	}

	@Test
	void addsNotesToLeadAndClient() throws Exception {
		String leadId = createLead("Note Lead", "Notes Co", "note-lead@example.com");
		String clientId = createClient("Note Client", "Client Notes Co", "note-client@example.com");

		mockMvc.perform(post("/api/v1/leads/" + leadId + "/notes")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"content\":\" Call this lead tomorrow. \",\"author\":\"Admin\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.leadId").value(leadId))
				.andExpect(jsonPath("$.content").value("Call this lead tomorrow."));

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/notes")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"content\":\" Prepare service proposal. \"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.author").value("Admin"));

		mockMvc.perform(get("/api/v1/clients/" + clientId + "/notes")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].content").value("Prepare service proposal."));
	}

	@Test
	void adminCanInviteClientAndClientCanActivateWorkspace() throws Exception {
		String clientId = createClientWithSector("Invited Client", "Invitation Clinic", "invited-client@example.com", "clinics");
		String serviceId = serviceIdByName("Website Development");

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "notes": "Prepare onboarding for invited client."
								}
								""".formatted(serviceId)))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/onboarding/admin/clients/" + clientId + "/generate")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk());

		String invitationBody = mockMvc.perform(post("/api/v1/clients/" + clientId + "/invitations")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.header("User-Agent", "JUnit invitation test")
						.header("X-Forwarded-For", "203.0.113.77")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.email").value("invited-client@example.com"))
				.andExpect(jsonPath("$.role").value("client_user"))
				.andExpect(jsonPath("$.status").value("pending"))
				.andExpect(jsonPath("$.emailSent").value(false))
				.andExpect(jsonPath("$.invitationUrl").exists())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String invitationUrl = objectMapper.readTree(invitationBody).get("invitationUrl").asText();
		String invitationToken = invitationUrl.substring(invitationUrl.indexOf("token=") + "token=".length());

		String activationBody = mockMvc.perform(post("/api/v1/client-invitations/accept")
						.header("User-Agent", "JUnit invited client")
						.header("X-Forwarded-For", "203.0.113.78")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "token": "%s",
								  "password": "client-secure-123",
								  "confirmPassword": "client-secure-123"
								}
								""".formatted(invitationToken)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sessionToken").exists())
				.andExpect(jsonPath("$.user.username").value("invited-client@example.com"))
				.andExpect(jsonPath("$.user.role").value("client_user"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String clientSessionToken = objectMapper.readTree(activationBody).get("sessionToken").asText();

		mockMvc.perform(get("/api/v1/onboarding/client/me")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.client.id").value(clientId))
				.andExpect(jsonPath("$.contractSubmitted").value(false));

		mockMvc.perform(get("/api/v1/clients/" + clientId + "/invitations")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].status").value("accepted"))
				.andExpect(jsonPath("$[0].acceptedAt").exists())
				.andExpect(jsonPath("$[0].invitationUrl").value(org.hamcrest.Matchers.nullValue()));

		var user = appUserRepository.findByUsernameIgnoreCase("invited-client@example.com").orElseThrow();
		org.junit.jupiter.api.Assertions.assertEquals(1, clientUserAccessRepository.findAllByUserAndActiveTrue(user).size());
		org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("client-secure-123", user.getPasswordHash()));
		org.junit.jupiter.api.Assertions.assertEquals(1, securityEventRepository.countByEventType("client_invitation_created"));
		org.junit.jupiter.api.Assertions.assertEquals(1, securityEventRepository.countByEventType("client_invitation_accepted"));
	}

	@Test
	void adminPortalCreatesProjectsForEveryActiveClientModule() throws Exception {
		String clientId = createClientWithSector("Multi Module Client", "Operations Lab", "operations-lab@example.com", "custom");
		assignServiceToClient(clientId, "Booking Systems", "Booking implementation.");
		assignServiceToClient(clientId, "CRM / Business Systems", "CRM implementation.");
		assignServiceToClient(clientId, "Automation Workflows", "Automation implementation.");
		assignServiceToClient(clientId, "Internal Dashboards", "Dashboard implementation.");

		String portalBody = mockMvc.perform(get("/api/v1/client-portal/admin/clients/" + clientId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'booking')].active").value(true))
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'crm')].active").value(true))
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'automation')].active").value(true))
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'dashboard')].active").value(true))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode projects = objectMapper.readTree(portalBody).get("projects");
		org.junit.jupiter.api.Assertions.assertEquals(4, projects.size());
		org.junit.jupiter.api.Assertions.assertTrue(projectsContainKey(projects, "booking"));
		org.junit.jupiter.api.Assertions.assertTrue(projectsContainKey(projects, "crm"));
		org.junit.jupiter.api.Assertions.assertTrue(projectsContainKey(projects, "automation"));
		org.junit.jupiter.api.Assertions.assertTrue(projectsContainKey(projects, "dashboard"));
		org.junit.jupiter.api.Assertions.assertFalse(projectsContainKey(projects, "web_seo"));
		org.junit.jupiter.api.Assertions.assertEquals(4, clientProjectRepository.count());

		mockMvc.perform(get("/api/v1/client-portal/admin/clients/" + clientId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk());

		org.junit.jupiter.api.Assertions.assertEquals(4, clientProjectRepository.count());
	}

	@Test
	void clientGoogleLoginOnlyWorksForActivatedInvitedClientUsers() throws Exception {
		String clientId = createClientWithSector("Google Client", "Google Clinic", "google-client@example.com", "clinics");
		createClientUserAccess(clientId, "google-client@example.com", "old-pass-123");

		String googleLoginBody = mockMvc.perform(post("/api/v1/auth/client/google")
						.header("User-Agent", "JUnit Google login")
						.header("X-Forwarded-For", "203.0.113.90")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "credential": "valid-client-google-token"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sessionToken").exists())
				.andExpect(jsonPath("$.user.username").value("google-client@example.com"))
				.andExpect(jsonPath("$.user.role").value("client_user"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String clientSessionToken = objectMapper.readTree(googleLoginBody).get("sessionToken").asText();

		mockMvc.perform(get("/api/v1/onboarding/client/me")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.client.id").value(clientId));

		mockMvc.perform(post("/api/v1/auth/client/google")
						.header("User-Agent", "JUnit Google login")
						.header("X-Forwarded-For", "203.0.113.91")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "credential": "not-invited-google-token"
								}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Google account is not invited to a client workspace"));

		org.junit.jupiter.api.Assertions.assertTrue(securityEventRepository.countByEventType("login_success") >= 1);
		org.junit.jupiter.api.Assertions.assertTrue(securityEventRepository.countByEventType("login_failed") >= 1);
	}

	@Test
	void clientCanManageOwnCrmLeadsWhenCrmModuleIsActive() throws Exception {
		String clientId = createClientWithSector("Restaurant Owner", "Pipeline Bistro", "pipeline-bistro@example.com", "restaurants");
		String crmServiceId = serviceIdByName("CRM / Business Systems");

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "status": "in_progress",
								  "notes": "Start the CRM module for restaurant enquiries."
								}
								""".formatted(crmServiceId)))
				.andExpect(status().isCreated());

		String adminDashboardBody = mockMvc.perform(post("/api/v1/onboarding/admin/clients/" + clientId + "/generate")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tasks[?(@.taskKey == 'crm-pipeline-fields')]").exists())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode adminDashboard = objectMapper.readTree(adminDashboardBody);
		createClientUserAccess(clientId, "restaurant-client", "client-pass-456");
		String clientSessionToken = loginAndReturnSessionToken("restaurant-client", "client-pass-456");

		mockMvc.perform(get("/api/v1/client-crm/client/leads")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isLocked())
				.andExpect(jsonPath("$.error").value("Client CRM is locked until the service contract is approved"));

		submitAndApproveSignatureTask(adminDashboard, "service-contract-signature", clientSessionToken, "Restaurant Owner", "BE-CRM-456");
		submitAndApproveSignatureTask(adminDashboard, "crm-data-processing-signature", clientSessionToken, "Restaurant Owner", "BE-CRM-DATA-456");

		String createdLeadBody = mockMvc.perform(post("/api/v1/client-crm/client/leads")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Private Event Lead",
								  "email": "event-lead@example.com",
								  "phone": "+32 470 22 33 44",
								  "source": "web_form",
								  "priority": "urgent",
								  "sectorFields": {
								    "event_type": "Birthday dinner",
								    "guest_count": "18"
								  },
								  "initialNote": "Asked for a Saturday evening private table."
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.fullName").value("Private Event Lead"))
				.andExpect(jsonPath("$.status").value("new_lead"))
				.andExpect(jsonPath("$.priority").value("urgent"))
				.andExpect(jsonPath("$.sectorType").value("restaurants"))
				.andExpect(jsonPath("$.sectorFields.event_type").value("Birthday dinner"))
				.andExpect(jsonPath("$.sectorFields.guest_count").value("18"))
				.andExpect(jsonPath("$.notes[0].content").value("Asked for a Saturday evening private table."))
				.andExpect(jsonPath("$.notes[0].authorRole").value("client"))
				.andExpect(jsonPath("$.notes[0].visibleToClient").value(true))
				.andExpect(jsonPath("$.events[0].eventType").value("lead_created"))
				.andExpect(jsonPath("$.events[0].actorRole").value("client"))
				.andExpect(jsonPath("$.events[1].eventType").value("note_added"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String crmLeadId = objectMapper.readTree(createdLeadBody).get("id").asText();

		mockMvc.perform(get("/api/v1/client-crm/client/leads")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(crmLeadId))
				.andExpect(jsonPath("$[0].source").value("web_form"));

		mockMvc.perform(get("/api/v1/client-crm/client/leads/" + crmLeadId)
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(crmLeadId))
				.andExpect(jsonPath("$.fullName").value("Private Event Lead"))
				.andExpect(jsonPath("$.notes[0].authorRole").value("client"))
				.andExpect(jsonPath("$.events[0].eventType").value("lead_created"));

		mockMvc.perform(patch("/api/v1/client-crm/client/leads/" + crmLeadId + "/status")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "status": "appointment_scheduled"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("appointment_scheduled"));

		mockMvc.perform(post("/api/v1/client-crm/client/leads/" + crmLeadId + "/notes")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "content": "Confirmed interest in the terrace area and sent menu options."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes[1].content").value("Confirmed interest in the terrace area and sent menu options."))
				.andExpect(jsonPath("$.notes[1].authorRole").value("client"))
				.andExpect(jsonPath("$.notes[1].visibleToClient").value(true));

		mockMvc.perform(get("/api/v1/client-crm/admin/clients/" + clientId + "/leads")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(crmLeadId))
				.andExpect(jsonPath("$[0].clientId").value(clientId))
				.andExpect(jsonPath("$[0].status").value("appointment_scheduled"))
				.andExpect(jsonPath("$[0].sectorFields.event_type").value("Birthday dinner"))
				.andExpect(jsonPath("$[0].notes[1].content").value("Confirmed interest in the terrace area and sent menu options."))
				.andExpect(jsonPath("$[0].notes[1].authorRole").value("client"))
				.andExpect(jsonPath("$[0].notes[1].visibleToClient").value(true))
				.andExpect(jsonPath("$[0].events[2].eventType").value("status_changed"))
				.andExpect(jsonPath("$[0].events[2].fromStatus").value("new_lead"))
				.andExpect(jsonPath("$[0].events[2].toStatus").value("appointment_scheduled"))
				.andExpect(jsonPath("$[0].events[3].eventType").value("note_added"));

		mockMvc.perform(patch("/api/v1/client-crm/admin/clients/" + clientId + "/leads/" + crmLeadId + "/status")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "status": "proposal_sent"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(crmLeadId))
				.andExpect(jsonPath("$.status").value("proposal_sent"))
				.andExpect(jsonPath("$.events[4].eventType").value("status_changed"))
				.andExpect(jsonPath("$.events[4].fromStatus").value("appointment_scheduled"))
				.andExpect(jsonPath("$.events[4].toStatus").value("proposal_sent"));

		mockMvc.perform(post("/api/v1/client-crm/admin/clients/" + clientId + "/leads/" + crmLeadId + "/notes")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "content": "Admin reviewed the enquiry and prepared a proposal follow-up."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes[2].content").value("Admin reviewed the enquiry and prepared a proposal follow-up."))
				.andExpect(jsonPath("$.notes[2].authorRole").value("admin"))
				.andExpect(jsonPath("$.notes[2].visibleToClient").value(false))
				.andExpect(jsonPath("$.events[5].eventType").value("note_added"))
				.andExpect(jsonPath("$.events[5].actorRole").value("admin"));

		mockMvc.perform(post("/api/v1/client-crm/admin/clients/" + clientId + "/leads/" + crmLeadId + "/notes")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "content": "Shared summary: proposal is ready for review.",
								  "visibleToClient": true
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notes[3].content").value("Shared summary: proposal is ready for review."))
				.andExpect(jsonPath("$.notes[3].authorRole").value("admin"))
				.andExpect(jsonPath("$.notes[3].visibleToClient").value(true))
				.andExpect(jsonPath("$.events[6].eventType").value("note_added"))
				.andExpect(jsonPath("$.events[6].actorRole").value("admin"));

		String clientFollowUpBody = mockMvc.perform(post("/api/v1/client-crm/client/leads/" + crmLeadId + "/follow-up-actions")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Call guest to confirm proposal preference",
								  "description": "Ask whether they prefer terrace or private dining room."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.followUpActions[0].title").value("Call guest to confirm proposal preference"))
				.andExpect(jsonPath("$.followUpActions[0].status").value("open"))
				.andExpect(jsonPath("$.followUpActions[0].ownerRole").value("client"))
				.andExpect(jsonPath("$.followUpActions[0].visibleToClient").value(true))
				.andExpect(jsonPath("$.events[4].eventType").value("follow_up_created"))
				.andExpect(jsonPath("$.events[4].actorRole").value("client"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String clientFollowUpActionId = objectMapper.readTree(clientFollowUpBody)
				.get("followUpActions")
				.get(0)
				.get("id")
				.asText();

		mockMvc.perform(patch("/api/v1/client-crm/client/leads/" + crmLeadId + "/follow-up-actions/" + clientFollowUpActionId + "/status")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "status": "done"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.followUpActions[0].status").value("done"))
				.andExpect(jsonPath("$.followUpActions[0].completedAt").exists())
				.andExpect(jsonPath("$.events[5].eventType").value("follow_up_status_changed"))
				.andExpect(jsonPath("$.events[5].actorRole").value("client"));

		mockMvc.perform(post("/api/v1/client-crm/admin/clients/" + clientId + "/leads/" + crmLeadId + "/follow-up-actions")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Internal pricing review",
								  "description": "Check margin before sending the final quote."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.followUpActions[1].title").value("Internal pricing review"))
				.andExpect(jsonPath("$.followUpActions[1].ownerRole").value("admin"))
				.andExpect(jsonPath("$.followUpActions[1].visibleToClient").value(false))
				.andExpect(jsonPath("$.events[9].eventType").value("follow_up_created"))
				.andExpect(jsonPath("$.events[9].actorRole").value("admin"));

		mockMvc.perform(post("/api/v1/client-crm/admin/clients/" + clientId + "/leads/" + crmLeadId + "/follow-up-actions")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Client should send final event date",
								  "description": "Shared action so the restaurant owner can complete the enquiry context.",
								  "visibleToClient": true
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.followUpActions[2].title").value("Client should send final event date"))
				.andExpect(jsonPath("$.followUpActions[2].ownerRole").value("admin"))
				.andExpect(jsonPath("$.followUpActions[2].visibleToClient").value(true))
				.andExpect(jsonPath("$.events[10].eventType").value("follow_up_created"))
				.andExpect(jsonPath("$.events[10].actorRole").value("admin"));

		mockMvc.perform(get("/api/v1/client-crm/client/leads")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(crmLeadId))
				.andExpect(jsonPath("$[0].status").value("proposal_sent"))
				.andExpect(jsonPath("$[0].followUpActions.length()").value(2))
				.andExpect(jsonPath("$[0].followUpActions[0].title").value("Call guest to confirm proposal preference"))
				.andExpect(jsonPath("$[0].followUpActions[0].status").value("done"))
				.andExpect(jsonPath("$[0].followUpActions[1].title").value("Client should send final event date"))
				.andExpect(jsonPath("$[0].followUpActions[1].visibleToClient").value(true))
				.andExpect(jsonPath("$[0].notes.length()").value(3))
				.andExpect(jsonPath("$[0].notes[0].authorRole").value("client"))
				.andExpect(jsonPath("$[0].notes[1].authorRole").value("client"))
				.andExpect(jsonPath("$[0].notes[2].content").value("Shared summary: proposal is ready for review."))
				.andExpect(jsonPath("$[0].notes[2].authorRole").value("admin"))
				.andExpect(jsonPath("$[0].notes[2].visibleToClient").value(true))
				.andExpect(jsonPath("$[0].events.length()").value(6))
				.andExpect(jsonPath("$[0].events[0].actorRole").value("client"))
				.andExpect(jsonPath("$[0].events[3].actorRole").value("client"))
				.andExpect(jsonPath("$[0].events[4].eventType").value("follow_up_created"))
				.andExpect(jsonPath("$[0].events[5].eventType").value("follow_up_status_changed"));

		org.junit.jupiter.api.Assertions.assertEquals(1, clientCrmLeadRepository.count());
		org.junit.jupiter.api.Assertions.assertEquals(3, clientCrmFollowUpActionRepository.count());
		org.junit.jupiter.api.Assertions.assertEquals(4, clientCrmLeadNoteRepository.count());
		org.junit.jupiter.api.Assertions.assertEquals(11, clientCrmLeadEventRepository.count());
	}

	@Test
	void publicCrmWebhookCreatesLeadWithActiveTokenAndStopsAfterRevocation() throws Exception {
		String clientId = createClientWithSector("Clinic Owner", "Webhook Dental", "webhook-dental@example.com", "clinics");
		String crmServiceId = serviceIdByName("CRM / Business Systems");

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "status": "in_progress",
								  "notes": "Allow website forms to feed the client CRM."
								}
								""".formatted(crmServiceId)))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/client-crm/webhooks/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Missing Token Lead"
								}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Client CRM webhook API key is required"));

		String tokenBody = mockMvc.perform(post("/api/v1/client-crm/admin/clients/" + clientId + "/webhook-tokens")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "label": "Clinic website form"
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.label").value("Clinic website form"))
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.apiKey").value(matchesPattern("alw_[A-Za-z0-9_-]+")))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode tokenJson = objectMapper.readTree(tokenBody);
		String apiKey = tokenJson.get("apiKey").asText();
		String tokenId = tokenJson.get("id").asText();

		mockMvc.perform(get("/api/v1/client-crm/admin/clients/" + clientId + "/webhook-tokens")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].apiKey").doesNotExist())
				.andExpect(jsonPath("$[0].tokenPrefix").value(apiKey.substring(0, 16)));

		String createdLeadBody = mockMvc.perform(post("/api/v1/client-crm/webhooks/leads")
						.header("X-Altaira-Webhook-Key", apiKey)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Dental Implant Lead",
								  "email": "implant-lead@example.com",
								  "phone": "+32 470 55 66 77",
								  "source": "clinic_website",
								  "priority": "high",
								  "sectorFields": {
								    "treatment_interest": "Dental implants",
								    "preferred_day": "Thursday"
								  },
								  "initialNote": "Asked for a first consultation from the clinic website."
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.fullName").value("Dental Implant Lead"))
				.andExpect(jsonPath("$.source").value("clinic_website"))
				.andExpect(jsonPath("$.priority").value("high"))
				.andExpect(jsonPath("$.sectorType").value("clinics"))
				.andExpect(jsonPath("$.sectorFields.treatment_interest").value("Dental implants"))
				.andExpect(jsonPath("$.notes[0].content").value("Asked for a first consultation from the clinic website."))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String crmLeadId = objectMapper.readTree(createdLeadBody).get("id").asText();

		mockMvc.perform(get("/api/v1/client-crm/admin/clients/" + clientId + "/webhook-tokens")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].lastUsedAt").exists());

		mockMvc.perform(patch("/api/v1/client-crm/admin/clients/" + clientId + "/webhook-tokens/" + tokenId + "/revoke")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.active").value(false))
				.andExpect(jsonPath("$.revokedAt").exists());

		mockMvc.perform(post("/api/v1/client-crm/webhooks/leads")
						.header("X-Altaira-Webhook-Key", apiKey)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Revoked Token Lead"
								}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Invalid client CRM webhook API key"));

		org.junit.jupiter.api.Assertions.assertEquals(1, clientCrmLeadRepository.count());
		org.junit.jupiter.api.Assertions.assertEquals(1, clientCrmLeadNoteRepository.count());
		org.junit.jupiter.api.Assertions.assertEquals(1, clientCrmWebhookTokenRepository.count());
		org.junit.jupiter.api.Assertions.assertNotNull(clientCrmLeadRepository.findById(UUID.fromString(crmLeadId)).orElseThrow());
	}

	@Test
	void urgentPublicCrmWebhookLeadSendsOwnerEmailAlert() throws Exception {
		String clientId = createClientWithSector("Alert Owner", "Alert Dental", "alert-owner@example.com", "clinics");
		String crmServiceId = serviceIdByName("CRM / Business Systems");

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "status": "in_progress",
								  "notes": "Alert the owner for urgent website leads."
								}
								""".formatted(crmServiceId)))
				.andExpect(status().isCreated());

		String tokenBody = mockMvc.perform(post("/api/v1/client-crm/admin/clients/" + clientId + "/webhook-tokens")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "label": "Urgent clinic website form"
								}
								"""))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String apiKey = objectMapper.readTree(tokenBody).get("apiKey").asText();

		String createdLeadBody = mockMvc.perform(post("/api/v1/client-crm/webhooks/leads")
						.header("X-Altaira-Webhook-Key", apiKey)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Emergency Appointment",
								  "email": "emergency-appointment@example.com",
								  "phone": "+32 470 88 99 00",
								  "source": "clinic_website",
								  "priority": "urgent",
								  "sectorFields": {
								    "treatment_interest": "Dental pain",
								    "preferred_day": "Today"
								  },
								  "initialNote": "Same-day booking request from the emergency contact form."
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.clientId").value(clientId))
				.andExpect(jsonPath("$.priority").value("urgent"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String crmLeadId = objectMapper.readTree(createdLeadBody).get("id").asText();

		org.junit.jupiter.api.Assertions.assertEquals(1, CLIENT_CRM_ALERT_EMAIL_SERVER.requestBodies().size());
		org.junit.jupiter.api.Assertions.assertEquals(
				"Bearer test-resend-api-key",
				CLIENT_CRM_ALERT_EMAIL_SERVER.authorizationHeaders().get(0)
		);

		JsonNode emailPayload = objectMapper.readTree(CLIENT_CRM_ALERT_EMAIL_SERVER.requestBodies().get(0));
		org.junit.jupiter.api.Assertions.assertEquals("onboarding@resend.dev", emailPayload.get("from").asText());
		org.junit.jupiter.api.Assertions.assertEquals("alert-owner@example.com", emailPayload.get("to").get(0).asText());
		org.junit.jupiter.api.Assertions.assertEquals("emergency-appointment@example.com", emailPayload.get("reply_to").asText());
		org.junit.jupiter.api.Assertions.assertEquals("Urgent new Altaira CRM lead: Emergency Appointment", emailPayload.get("subject").asText());

		String html = emailPayload.get("html").asText();
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("New urgent lead received"));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("Alert Dental"));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("Emergency Appointment"));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("emergency-appointment@example.com"));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("Dental pain"));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("Same-day booking request"));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains(crmLeadId));
		org.junit.jupiter.api.Assertions.assertTrue(html.contains("https://altaira.test/client/dashboard?lead=" + crmLeadId + "&amp;client=" + clientId));
	}

	@Test
	void clientCanSubmitWrittenSignatureAndAdminCanApproveOnboardingTask() throws Exception {
		String clientId = createClientWithSector("Clinic Owner", "Clinic Onboarding Co", "clinic-onboarding@example.com", "clinics");
		String serviceId = serviceIdByName("Website Development");
		String bookingServiceId = serviceIdByName("Booking Systems");

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "notes": "Start with onboarding for web and SEO."
								}
								""".formatted(serviceId)))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "notes": "Prepare appointment rules and booking flow."
								}
								""".formatted(bookingServiceId)))
				.andExpect(status().isCreated());

		String adminDashboardBody = mockMvc.perform(post("/api/v1/onboarding/admin/clients/" + clientId + "/generate")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.client.id").value(clientId))
				.andExpect(jsonPath("$.contractSubmitted").value(false))
				.andExpect(jsonPath("$.contractApproved").value(false))
				.andExpect(jsonPath("$.tasks[?(@.taskKey == 'service-contract-signature')]").exists())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode adminDashboard = objectMapper.readTree(adminDashboardBody);
		String signatureTaskId = findTaskIdByKey(adminDashboard, "service-contract-signature");
		String webSignatureTaskId = findTaskIdByKey(adminDashboard, "web-seo-contract-signature");
		String bookingSignatureTaskId = findTaskIdByKey(adminDashboard, "booking-contract-signature");
		String fileUploadTaskId = findTaskIdByType(adminDashboard, "file_upload");

		createClientUserAccess(clientId, "clinic-client", "client-pass-123");

		String clientSessionToken = loginAndReturnSessionToken("clinic-client", "client-pass-123");

		mockMvc.perform(get("/api/v1/client-portal/me")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isLocked())
				.andExpect(jsonPath("$.error").value("Client dashboard is locked until the service contract is approved"));

		mockMvc.perform(get("/api/v1/onboarding/client/me")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.client.id").value(clientId))
				.andExpect(jsonPath("$.onboardingCompleted").value(false));

		byte[] logoBytes = "fake transparent logo".getBytes(StandardCharsets.UTF_8);
		MockMultipartFile logo = new MockMultipartFile("files", "clinic-logo.png", "image/png", logoBytes);

		String fileUploadBody = mockMvc.perform(multipart("/api/v1/onboarding/client/tasks/" + fileUploadTaskId + "/files")
						.file(logo)
						.param("notes", "Transparent logo and clinic reception photos.")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("submitted"))
				.andExpect(jsonPath("$.fileMetadataJson").exists())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode uploadedTask = objectMapper.readTree(fileUploadBody);
		JsonNode fileMetadata = objectMapper.readTree(uploadedTask.get("fileMetadataJson").asText());
		String onboardingFileId = fileMetadata.get(0).get("id").asText();

		mockMvc.perform(get("/api/v1/onboarding/admin/tasks/" + fileUploadTaskId + "/files")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(onboardingFileId))
				.andExpect(jsonPath("$[0].originalFilename").value("clinic-logo.png"))
				.andExpect(jsonPath("$[0].contentType").value("image/png"));

		mockMvc.perform(get("/api/v1/onboarding/admin/files/" + onboardingFileId + "/download")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", "image/png"))
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("clinic-logo.png")))
				.andExpect(content().bytes(logoBytes));

		mockMvc.perform(patch("/api/v1/onboarding/client/tasks/" + signatureTaskId + "/submit")
						.header("X-Client-Session-Token", clientSessionToken)
						.header("User-Agent", "JUnit onboarding test")
						.header("X-Forwarded-For", "203.0.113.10")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "signatureFullName": "Clinic Owner",
								  "signatureDocumentId": "BE-TEST-123",
								  "signatureConsent": true
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("submitted"))
				.andExpect(jsonPath("$.signatureFullName").value("Clinic Owner"))
				.andExpect(jsonPath("$.signatureDocumentId").value("BE-TEST-123"))
				.andExpect(jsonPath("$.signatureConsent").value(true));

		mockMvc.perform(get("/api/v1/onboarding/admin/clients/" + clientId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contractSubmitted").value(false))
				.andExpect(jsonPath("$.contractApproved").value(false))
				.andExpect(jsonPath("$.submittedTasks").value(2));

		mockMvc.perform(patch("/api/v1/onboarding/admin/tasks/" + signatureTaskId + "/approve")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("approved"))
				.andExpect(jsonPath("$.approvedAt").exists());

		mockMvc.perform(get("/api/v1/onboarding/admin/clients/" + clientId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contractApproved").value(false))
				.andExpect(jsonPath("$.completedRequiredTasks").value(1));

		submitAndApproveSignatureTask(webSignatureTaskId, clientSessionToken, "Clinic Owner", "BE-WEB-123");
		submitAndApproveSignatureTask(bookingSignatureTaskId, clientSessionToken, "Clinic Owner", "BE-BOOKING-123");

		mockMvc.perform(get("/api/v1/onboarding/admin/clients/" + clientId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contractApproved").value(true));

		String portalBody = mockMvc.perform(get("/api/v1/client-portal/me")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contractApproved").value(true))
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'web_seo')].active").value(true))
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'booking')].active").value(true))
				.andExpect(jsonPath("$.modules[?(@.moduleKey == 'crm')].locked").value(true))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode portalProjects = objectMapper.readTree(portalBody).get("projects");
		String projectId = projectIdByKey(portalProjects, "web_seo");
		String bookingProjectId = projectIdByKey(portalProjects, "booking");

		byte[] homepageCopyBytes = "Approved homepage copy and service notes".getBytes(StandardCharsets.UTF_8);
		MockMultipartFile homepageCopy = new MockMultipartFile(
				"files",
				"homepage-copy.txt",
				MediaType.TEXT_PLAIN_VALUE,
				homepageCopyBytes
		);
		MockMultipartFile projectAssetType = new MockMultipartFile(
				"assetType",
				"",
				MediaType.TEXT_PLAIN_VALUE,
				"website-copy".getBytes(StandardCharsets.UTF_8)
		);
		MockMultipartFile projectAssetNotes = new MockMultipartFile(
				"notes",
				"",
				MediaType.TEXT_PLAIN_VALUE,
				"Homepage draft copy for the Web & SEO project.".getBytes(StandardCharsets.UTF_8)
		);

		String projectAssetBody = mockMvc.perform(multipart("/api/v1/client-portal/client/projects/" + projectId + "/assets")
						.file(homepageCopy)
						.file(projectAssetType)
						.file(projectAssetNotes)
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].projectId").value(projectId))
				.andExpect(jsonPath("$[0].assetType").value("website-copy"))
				.andExpect(jsonPath("$[0].originalFilename").value("homepage-copy.txt"))
				.andExpect(jsonPath("$[0].contentType").value(MediaType.TEXT_PLAIN_VALUE))
				.andExpect(jsonPath("$[0].status").value("uploaded"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String projectAssetId = objectMapper.readTree(projectAssetBody).get(0).get("id").asText();

		mockMvc.perform(get("/api/v1/client-portal/client/projects/" + projectId + "/assets")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(projectAssetId))
				.andExpect(jsonPath("$[0].notes").value("Homepage draft copy for the Web & SEO project."))
				.andExpect(jsonPath("$[0].status").value("uploaded"));

		mockMvc.perform(get("/api/v1/client-portal/admin/projects/" + projectId + "/assets")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(projectAssetId))
				.andExpect(jsonPath("$[0].clientId").value(clientId))
				.andExpect(jsonPath("$[0].originalFilename").value("homepage-copy.txt"));

		mockMvc.perform(get("/api/v1/client-portal/admin/project-assets/" + projectAssetId + "/download")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", MediaType.TEXT_PLAIN_VALUE))
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("homepage-copy.txt")))
				.andExpect(content().bytes(homepageCopyBytes));

		mockMvc.perform(patch("/api/v1/client-portal/admin/project-assets/" + projectAssetId + "/reject")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "feedback": "Please upload the final approved copy instead of the draft."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("rejected"))
				.andExpect(jsonPath("$.adminFeedback").value("Please upload the final approved copy instead of the draft."))
				.andExpect(jsonPath("$.reviewedAt").exists());

		mockMvc.perform(patch("/api/v1/client-portal/admin/project-assets/" + projectAssetId + "/approve")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("approved"))
				.andExpect(jsonPath("$.reviewedAt").exists());

		mockMvc.perform(patch("/api/v1/client-portal/admin/projects/" + projectId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Clinic website launch",
								  "currentPhase": "design",
								  "stagingUrl": "https://preview.altaira.test/clinic"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Clinic website launch"))
				.andExpect(jsonPath("$.currentPhase").value("design"))
				.andExpect(jsonPath("$.stagingUrl").value("https://preview.altaira.test/clinic"));

		mockMvc.perform(patch("/api/v1/client-portal/admin/projects/" + projectId)
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "stagingUrl": "javascript:alert(document.domain)"
								}
								"""))
				.andExpect(status().isBadRequest());

		mockMvc.perform(get("/api/v1/client-portal/me")
						.header("X-Client-Session-Token", clientSessionToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.projects[0].name").value("Clinic website launch"))
				.andExpect(jsonPath("$.projects[0].currentPhase").value("design"))
				.andExpect(jsonPath("$.projects[0].stagingUrl").value("https://preview.altaira.test/clinic"))
				.andExpect(jsonPath("$.projects[0].assets[0].id").value(projectAssetId))
				.andExpect(jsonPath("$.projects[0].assets[0].status").value("approved"));

		String bookingLinkBody = mockMvc.perform(post("/api/v1/client-portal/client/projects/" + bookingProjectId + "/links")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "url": "https://example.com/clinic-opening-hours",
								  "label": "Clinic opening hours",
								  "assetType": "booking_rules",
								  "notes": "Opening hours and appointment buffer rules for the booking track."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.projectId").value(bookingProjectId))
				.andExpect(jsonPath("$.assetType").value("booking_rules"))
				.andExpect(jsonPath("$.originalFilename").value("Clinic opening hours"))
				.andExpect(jsonPath("$.externalUrl").value("https://example.com/clinic-opening-hours"))
				.andExpect(jsonPath("$.sizeBytes").value(0))
				.andReturn()
				.getResponse()
				.getContentAsString();

		String bookingLinkId = objectMapper.readTree(bookingLinkBody).get("id").asText();

		mockMvc.perform(get("/api/v1/client-portal/admin/projects/" + bookingProjectId + "/assets")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(bookingLinkId))
				.andExpect(jsonPath("$[0].externalUrl").value("https://example.com/clinic-opening-hours"));

		mockMvc.perform(get("/api/v1/client-portal/admin/project-assets/" + bookingLinkId + "/download")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isBadRequest());

		mockMvc.perform(patch("/api/v1/client-portal/client/projects/" + bookingProjectId + "/feedback")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "feedback": "Please add appointment buffers and separate first visits from follow-up appointments."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.projectKey").value("booking"))
				.andExpect(jsonPath("$.currentPhase").value("review"))
				.andExpect(jsonPath("$.latestClientFeedback").value("Please add appointment buffers and separate first visits from follow-up appointments."))
				.andExpect(jsonPath("$.assets[0].externalUrl").value("https://example.com/clinic-opening-hours"));

		mockMvc.perform(patch("/api/v1/client-portal/client/projects/" + projectId + "/feedback")
						.header("X-Client-Session-Token", clientSessionToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "feedback": "Please update the homepage hero image and make the appointment CTA clearer."
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.currentPhase").value("review"))
				.andExpect(jsonPath("$.latestClientFeedback").value("Please update the homepage hero image and make the appointment CTA clearer."))
				.andExpect(jsonPath("$.revisionPendingAt").exists());

		org.junit.jupiter.api.Assertions.assertTrue(onboardingAuditLogRepository.count() >= 2);
	}

	private String createLead(String fullName, String businessName, String email) throws Exception {
		String response = mockMvc.perform(post("/api/v1/leads")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "%s",
								  "businessName": "%s",
								  "email": "%s"
								}
								""".formatted(fullName, businessName, email)))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		return objectMapper.readTree(response).get("id").asText();
	}

	private String createClient(String name, String company, String email) throws Exception {
		String response = mockMvc.perform(post("/api/v1/clients")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "%s",
								  "company": "%s",
								  "email": "%s"
								}
								""".formatted(name, company, email)))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		return objectMapper.readTree(response).get("id").asText();
	}

	private String createClientWithSector(String name, String company, String email, String sectorType) throws Exception {
		String response = mockMvc.perform(post("/api/v1/clients")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "%s",
								  "company": "%s",
								  "email": "%s",
								  "sectorType": "%s"
								}
								""".formatted(name, company, email, sectorType)))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();

		return objectMapper.readTree(response).get("id").asText();
	}

	private String loginAndReturnSessionToken() throws Exception {
		String response = mockMvc.perform(post("/api/v1/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "username": "admin123",
								  "password": "admin123"
								}
								"""))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		return objectMapper.readTree(response).get("sessionToken").asText();
	}

	private String loginAndReturnSessionToken(String username, String password) throws Exception {
		String response = mockMvc.perform(post("/api/v1/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "username": "%s",
								  "password": "%s"
								}
								""".formatted(username, password)))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		return objectMapper.readTree(response).get("sessionToken").asText();
	}

	private void createClientUserAccess(String clientId, String username, String password) {
		AppUserEntity user = new AppUserEntity();
		user.setUsername(username);
		user.setPasswordHash(passwordEncoder.encode(password));
		user.setRole("client_user");
		user.setActive(true);
		AppUserEntity savedUser = appUserRepository.save(user);

		ClientUserAccessEntity access = new ClientUserAccessEntity();
		access.setUser(savedUser);
		access.setClient(clientRepository.findById(UUID.fromString(clientId)).orElseThrow());
		access.setRole("client_user");
		access.setActive(true);
		clientUserAccessRepository.save(access);
	}

	private void assignServiceToClient(String clientId, String serviceName, String notes) throws Exception {
		String serviceId = serviceIdByName(serviceName);

		mockMvc.perform(post("/api/v1/clients/" + clientId + "/services")
						.header("X-Internal-API-Token", INTERNAL_TOKEN)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "serviceId": "%s",
								  "status": "in_progress",
								  "notes": "%s"
								}
								""".formatted(serviceId, notes)))
				.andExpect(status().isCreated());
	}

	private boolean projectsContainKey(JsonNode projects, String projectKey) {
		for (JsonNode project : projects) {
			if (projectKey.equals(project.get("projectKey").asText())) {
				return true;
			}
		}

		return false;
	}

	private String projectIdByKey(JsonNode projects, String projectKey) {
		for (JsonNode project : projects) {
			if (projectKey.equals(project.get("projectKey").asText())) {
				return project.get("id").asText();
			}
		}

		throw new IllegalStateException("Project not found: " + projectKey);
	}

	private void submitAndApproveSignatureTask(
			JsonNode dashboard,
			String taskKey,
			String clientSessionToken,
			String signerName,
			String documentId
	) throws Exception {
		submitAndApproveSignatureTask(
				findTaskIdByKey(dashboard, taskKey),
				clientSessionToken,
				signerName,
				documentId
		);
	}

	private void submitAndApproveSignatureTask(
			String taskId,
			String clientSessionToken,
			String signerName,
			String documentId
	) throws Exception {
		mockMvc.perform(patch("/api/v1/onboarding/client/tasks/" + taskId + "/submit")
						.header("X-Client-Session-Token", clientSessionToken)
						.header("User-Agent", "JUnit onboarding signature")
						.header("X-Forwarded-For", "203.0.113.120")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "signatureFullName": "%s",
								  "signatureDocumentId": "%s",
								  "signatureConsent": true
								}
								""".formatted(signerName, documentId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("submitted"));

		mockMvc.perform(patch("/api/v1/onboarding/admin/tasks/" + taskId + "/approve")
						.header("X-Internal-API-Token", INTERNAL_TOKEN))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("approved"));
	}

	private String findTaskIdByKey(JsonNode dashboard, String taskKey) {
		for (JsonNode task : dashboard.get("tasks")) {
			if (taskKey.equals(task.get("taskKey").asText())) {
				return task.get("id").asText();
			}
		}

		throw new IllegalStateException("Task not found: " + taskKey);
	}

	private String findTaskIdByType(JsonNode dashboard, String taskType) {
		for (JsonNode task : dashboard.get("tasks")) {
			if (taskType.equals(task.get("taskType").asText())) {
				return task.get("id").asText();
			}
		}

		throw new IllegalStateException("Task type not found: " + taskType);
	}

	private String firstServiceId() {
		return serviceRepository.findAllByOrderByNameAsc().get(0).getId().toString();
	}

	private String serviceIdByName(String name) {
		return serviceRepository.findByNameIgnoreCase(name).orElseThrow().getId().toString();
	}

	private static class MockResendEmailServer {
		private final HttpServer server;
		private final List<String> requestBodies = Collections.synchronizedList(new ArrayList<>());
		private final List<String> authorizationHeaders = Collections.synchronizedList(new ArrayList<>());

		private MockResendEmailServer(HttpServer server) {
			this.server = server;
		}

		static MockResendEmailServer start() {
			try {
				HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
				MockResendEmailServer wrapper = new MockResendEmailServer(server);
				server.createContext("/emails", exchange -> {
					wrapper.authorizationHeaders.add(exchange.getRequestHeaders().getFirst("Authorization"));
					wrapper.requestBodies.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));

					byte[] bytes = "{\"id\":\"test-email-id\"}".getBytes(StandardCharsets.UTF_8);
					exchange.getResponseHeaders().add("Content-Type", "application/json");
					exchange.sendResponseHeaders(200, bytes.length);
					try (OutputStream output = exchange.getResponseBody()) {
						output.write(bytes);
					}
				});
				server.start();
				return wrapper;
			} catch (IOException ex) {
				throw new IllegalStateException("Could not start mock Resend email server", ex);
			}
		}

		void clear() {
			requestBodies.clear();
			authorizationHeaders.clear();
		}

		List<String> requestBodies() {
			return requestBodies;
		}

		List<String> authorizationHeaders() {
			return authorizationHeaders;
		}

		String url() {
			return "http://127.0.0.1:" + server.getAddress().getPort() + "/emails";
		}
	}

	private static class MockGoogleTokenInfoServer {
		private final HttpServer server;

		private MockGoogleTokenInfoServer(HttpServer server) {
			this.server = server;
		}

		static MockGoogleTokenInfoServer start() {
			try {
				HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
				MockGoogleTokenInfoServer wrapper = new MockGoogleTokenInfoServer(server);
				server.createContext("/tokeninfo", exchange -> {
					String query = exchange.getRequestURI().getRawQuery();
					String body;
					int status;

					if (query != null && query.contains("valid-client-google-token")) {
						status = 200;
						body = """
								{
								  "aud": "test-google-client-id",
								  "email": "google-client@example.com",
								  "email_verified": "true"
								}
								""";
					} else if (query != null && query.contains("not-invited-google-token")) {
						status = 200;
						body = """
								{
								  "aud": "test-google-client-id",
								  "email": "not-invited@example.com",
								  "email_verified": "true"
								}
								""";
					} else {
						status = 401;
						body = "{\"error\":\"invalid_token\"}";
					}

					byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
					exchange.getResponseHeaders().add("Content-Type", "application/json");
					exchange.sendResponseHeaders(status, bytes.length);
					try (OutputStream output = exchange.getResponseBody()) {
						output.write(bytes);
					}
				});
				server.start();
				return wrapper;
			} catch (IOException ex) {
				throw new IllegalStateException("Could not start mock Google tokeninfo server", ex);
			}
		}

		String url() {
			return "http://127.0.0.1:" + server.getAddress().getPort() + "/tokeninfo";
		}
	}

}
