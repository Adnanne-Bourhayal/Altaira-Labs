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
import com.altaira.backend.repository.LeadRepository;

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
	private ObjectMapper objectMapper;

	@BeforeEach
	void resetDatabase() {
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

}
