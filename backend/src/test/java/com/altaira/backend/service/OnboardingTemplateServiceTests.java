package com.altaira.backend.service;

import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.entity.ServiceEntity;
import com.altaira.backend.model.OnboardingTaskType;
import com.altaira.backend.model.SectorType;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OnboardingTemplateServiceTests {

    private final OnboardingTemplateService onboardingTemplateService = new OnboardingTemplateService();

    @Test
    void createsWebSeoOnboardingTasksWithLegalAndBrandInputs() {
        Map<String, OnboardingTemplateService.TaskTemplate> tasks = templatesFor("Professional Websites and SEO");

        assertSignatureTask(tasks.get("web-seo-contract-signature"), "web_seo");
        assertEquals(OnboardingTaskType.FILE_UPLOAD, tasks.get("web-brand-assets").taskType());
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("web-pages-content").taskType());
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("web-domain-access-context").taskType());
        assertTrue(tasks.get("web-pages-content").description().contains("competitor websites"));
        assertTrue(tasks.get("web-domain-access-context").description().contains("Do not submit passwords"));
    }

    @Test
    void createsBookingOnboardingTasksForRulesPoliciesAndIntegrations() {
        Map<String, OnboardingTemplateService.TaskTemplate> tasks = templatesFor("Booking System");

        assertSignatureTask(tasks.get("booking-contract-signature"), "booking");
        assertCriticalForm(tasks.get("booking-business-rules"), "booking");
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("booking-resources-spaces").taskType());
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("booking-policies-cancellations").taskType());
        assertFalse(tasks.get("booking-integrations").required());
    }

    @Test
    void createsCrmOnboardingTasksForDataProcessingCatalogueAndMigration() {
        Map<String, OnboardingTemplateService.TaskTemplate> tasks = templatesFor("CRM Lead Management Systems");

        assertSignatureTask(tasks.get("crm-data-processing-signature"), "crm");
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("crm-service-catalogue").taskType());
        assertCriticalForm(tasks.get("crm-pipeline-fields"), "crm");
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("crm-web-form-integrations").taskType());
        assertTrue(tasks.get("crm-web-form-integrations").description().contains("CRM intake endpoint"));
        assertEquals(OnboardingTaskType.FILE_UPLOAD, tasks.get("crm-contact-import").taskType());
    }

    @Test
    void createsAutomationOnboardingTasksForChannelsToneAndRecipes() {
        Map<String, OnboardingTemplateService.TaskTemplate> tasks = templatesFor("Workflow Automation");

        assertSignatureTask(tasks.get("automation-gdpr-signature"), "automation");
        assertCriticalForm(tasks.get("automation-channel-connections"), "automation");
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("automation-brand-tone").taskType());
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("automation-goals-recipes").taskType());
    }

    @Test
    void createsDashboardOnboardingTasksForNdaRolesProtocolsAndMigration() {
        Map<String, OnboardingTemplateService.TaskTemplate> tasks = templatesFor("Management Dashboard");

        assertSignatureTask(tasks.get("dashboard-nda-signature"), "dashboard");
        assertCriticalForm(tasks.get("dashboard-roles-staff"), "dashboard");
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("dashboard-operational-protocols").taskType());
        assertEquals(OnboardingTaskType.FILE_UPLOAD, tasks.get("dashboard-data-migration").taskType());
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, tasks.get("dashboard-kpis").taskType());
    }

    private Map<String, OnboardingTemplateService.TaskTemplate> templatesFor(String serviceName) {
        ClientServiceEntity clientService = new ClientServiceEntity();
        ServiceEntity service = new ServiceEntity();
        service.setName(serviceName);
        clientService.setService(service);

        List<OnboardingTemplateService.TaskTemplate> templates = onboardingTemplateService.serviceTemplates(
                clientService,
                SectorType.CLINICS
        );

        return templates.stream().collect(Collectors.toMap(
                OnboardingTemplateService.TaskTemplate::taskKey,
                Function.identity()
        ));
    }

    private void assertSignatureTask(OnboardingTemplateService.TaskTemplate task, String expectedServiceKey) {
        assertEquals(OnboardingTaskType.SIGNATURE, task.taskType());
        assertEquals(expectedServiceKey, task.serviceKey());
        assertTrue(task.required());
        assertTrue(task.critical());
    }

    private void assertCriticalForm(OnboardingTemplateService.TaskTemplate task, String expectedServiceKey) {
        assertEquals(OnboardingTaskType.PREFERENCES_FORM, task.taskType());
        assertEquals(expectedServiceKey, task.serviceKey());
        assertTrue(task.required());
        assertTrue(task.critical());
    }
}
