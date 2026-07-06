package com.altaira.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientServiceRepository;
import com.altaira.backend.repository.InternalNoteRepository;
import com.altaira.backend.repository.LeadRepository;
import com.altaira.backend.repository.ServiceRepository;

import java.util.UUID;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendApplicationTests {

	private static final String INTERNAL_TOKEN = "test-internal-token";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private LeadRepository leadRepository;

	@Autowired
	private ClientRepository clientRepository;

	@Autowired
	private ServiceRepository serviceRepository;

	@Autowired
	private ClientServiceRepository clientServiceRepository;

	@Autowired
	private InternalNoteRepository internalNoteRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@BeforeEach
	void resetDatabase() {
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
								  "industry": " Software ",
								  "goals": " Capture leads reliably "
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(matchesPattern("[0-9a-fA-F-]{36}")))
				.andExpect(jsonPath("$.fullName").value("Ada Lovelace"))
				.andExpect(jsonPath("$.businessName").value("Analytical Engines"))
				.andExpect(jsonPath("$.email").value("ada@example.com"))
				.andExpect(jsonPath("$.status").value("new"));
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

	private String firstServiceId() {
		return serviceRepository.findAllByOrderByNameAsc().get(0).getId().toString();
	}

}
