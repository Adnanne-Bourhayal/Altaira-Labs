package com.altaira.backend.service;

import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.model.OnboardingTaskType;
import com.altaira.backend.model.SectorType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class OnboardingTemplateService {

    public List<TaskTemplate> generalTemplates(SectorType sectorType) {
        List<TaskTemplate> templates = new ArrayList<>();
        templates.add(new TaskTemplate(
                "service-contract-signature",
                "Sign the service agreement",
                "Review the service agreement and confirm it with your full name, document ID and explicit consent.",
                OnboardingTaskType.SIGNATURE,
                "general",
                sectorType,
                true,
                true,
                10
        ));
        templates.add(new TaskTemplate(
                "business-profile",
                "Confirm business profile",
                "Share the essential details we need to adapt the project to your business, sector and daily operation.",
                OnboardingTaskType.PREFERENCES_FORM,
                "general",
                sectorType,
                true,
                false,
                20
        ));
        templates.add(new TaskTemplate(
                "brand-assets",
                "Upload brand assets",
                "Add logos, brand manual, preferred images and any existing visual material. File storage is prepared; this first version records the submitted file list.",
                OnboardingTaskType.FILE_UPLOAD,
                "general",
                sectorType,
                true,
                false,
                30
        ));

        templates.add(sectorTemplate(sectorType));
        return templates;
    }

    public List<TaskTemplate> serviceTemplates(ClientServiceEntity clientService, SectorType sectorType) {
        String serviceKey = serviceKey(clientService);
        List<TaskTemplate> templates = new ArrayList<>();

        switch (serviceKey) {
            case "web_seo" -> {
                templates.add(new TaskTemplate(
                        "web-seo-contract-signature",
                        "Sign Web and SEO service agreement",
                        "Confirm the web development and SEO strategy agreement with written full name, DNI/CIF or company ID and explicit legal acceptance.",
                        OnboardingTaskType.SIGNATURE,
                        serviceKey,
                        sectorType,
                        true,
                        true,
                        100
                ));
                templates.add(new TaskTemplate(
                        "web-brand-assets",
                        "Upload logo and brand material",
                        "Upload the vector logo or transparent PNG, brand manual, color references and approved visual material for the website. Altaira Labs will store accepted files securely with the project.",
                        OnboardingTaskType.FILE_UPLOAD,
                        serviceKey,
                        sectorType,
                        true,
                        false,
                        105
                ));
                templates.add(new TaskTemplate(
                        "web-pages-content",
                        "Website pages and content checklist",
                        "Tell us which pages you need, what each page should explain, competitor websites, SEO keywords and the local SME offer that must be clear online.",
                        OnboardingTaskType.PREFERENCES_FORM,
                        serviceKey,
                        sectorType,
                        true,
                        false,
                        110
                ));
                templates.add(new TaskTemplate(
                        "web-domain-access-context",
                        "Domain, hosting and technical access context",
                        "Describe the current domain, hosting, analytics, email domain and who controls each account. Do not submit passwords in this form.",
                        OnboardingTaskType.PREFERENCES_FORM,
                        serviceKey,
                        sectorType,
                        true,
                        false,
                        115
                ));
                templates.add(new TaskTemplate(
                        "web-legal-content",
                        "Website legal and trust content",
                        "Upload or describe privacy policy, cookies, terms, accreditations, certifications or other trust signals that must appear on the website.",
                        OnboardingTaskType.FILE_UPLOAD,
                        serviceKey,
                        sectorType,
                        true,
                        false,
                        120
                ));
            }
            case "booking" -> addBookingTemplates(templates, serviceKey, sectorType);
            case "crm" -> addCrmTemplates(templates, serviceKey, sectorType);
            case "automation" -> addAutomationTemplates(templates, serviceKey, sectorType);
            case "dashboard" -> addDashboardTemplates(templates, serviceKey, sectorType);
            default -> templates.add(new TaskTemplate(
                    "service-specific-context",
                    "Service-specific requirements",
                    "Share any extra context, files or rules that apply to this service.",
                    OnboardingTaskType.PREFERENCES_FORM,
                    serviceKey,
                    sectorType,
                    false,
                    false,
                    900
            ));
        }

        return templates;
    }

    public String serviceKey(ClientServiceEntity clientService) {
        if (clientService == null || clientService.getService() == null || clientService.getService().getName() == null) {
            return "general";
        }

        String normalized = clientService.getService().getName().trim().toLowerCase(Locale.ROOT);

        if (normalized.contains("website") || normalized.contains("web") || normalized.contains("seo")) {
            return "web_seo";
        }

        if (normalized.contains("booking") || normalized.contains("reservation") || normalized.contains("schedule")) {
            return "booking";
        }

        if (normalized.contains("crm") || normalized.contains("lead")) {
            return "crm";
        }

        if (normalized.contains("automation") || normalized.contains("workflow")) {
            return "automation";
        }

        if (normalized.contains("dashboard") || normalized.contains("management")) {
            return "dashboard";
        }

        return normalized.replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
    }

    private void addBookingTemplates(List<TaskTemplate> templates, String serviceKey, SectorType sectorType) {
        templates.add(new TaskTemplate(
                "booking-contract-signature",
                "Sign Booking System service agreement and SLA",
                "Confirm the booking implementation agreement with written full name, DNI/CIF or company ID and explicit legal acceptance.",
                OnboardingTaskType.SIGNATURE,
                serviceKey,
                sectorType,
                true,
                true,
                200
        ));
        templates.add(new TaskTemplate(
                "booking-business-rules",
                "Booking rules, opening hours and capacity",
                "Define opening days, start/end times, slot duration, maximum capacity per time range, minimum advance notice and the operational rules for reservations or appointments.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                true,
                210
        ));
        templates.add(new TaskTemplate(
                "booking-resources-spaces",
                "Resources, spaces and appointment units",
                "List the rooms, tables, doctors, cabinets, advisors, vehicles or other bookable units that the booking engine must control.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                220
        ));
        templates.add(new TaskTemplate(
                "booking-policies-cancellations",
                "Cancellation and delay policies",
                "Write the customer-facing cancellation, delay, deposit, courtesy margin and late-arrival rules that should appear in automated booking messages.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                230
        ));
        templates.add(new TaskTemplate(
                "booking-integrations",
                "Calendar and payment integrations",
                "Select optional integrations such as Google Calendar, Apple Calendar or Stripe deposits so the technical scope is clear before configuration. Do not submit API secrets here.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                false,
                false,
                240
        ));
    }

    private void addCrmTemplates(List<TaskTemplate> templates, String serviceKey, SectorType sectorType) {
        templates.add(new TaskTemplate(
                "crm-data-processing-signature",
                "Sign CRM data custody agreement",
                "Confirm the data-processing agreement for storing and managing customer or lead records with written identity and explicit consent.",
                OnboardingTaskType.SIGNATURE,
                serviceKey,
                sectorType,
                true,
                true,
                300
        ));
        templates.add(new TaskTemplate(
                "crm-service-catalogue",
                "Client service catalogue and base prices",
                "Describe the products or services your business sells, including base prices or ranges, so future customer records can be linked to real service history.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                310
        ));
        templates.add(new TaskTemplate(
                "crm-pipeline-fields",
                "CRM pipeline, lead fields and sources",
                "Define lead stages, status names, required contact fields, lead sources and sector-specific fields for your daily sales or appointment flow.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                true,
                320
        ));
        templates.add(new TaskTemplate(
                "crm-web-form-integrations",
                "Web forms and lead capture integrations",
                "List the website forms, landing pages, campaigns or external lead sources that should connect to the CRM intake endpoint.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                325
        ));
        templates.add(new TaskTemplate(
                "crm-contact-import",
                "Upload existing contacts CSV or Excel",
                "Upload your current contact list, lead spreadsheet or legacy customer export so Altaira Labs can prepare the migration safely. Accepted files will remain private to your project.",
                OnboardingTaskType.FILE_UPLOAD,
                serviceKey,
                sectorType,
                false,
                false,
                330
        ));
    }

    private void addAutomationTemplates(List<TaskTemplate> templates, String serviceKey, SectorType sectorType) {
        templates.add(new TaskTemplate(
                "automation-gdpr-signature",
                "Sign automated messaging and GDPR agreement",
                "Confirm the legal basis for automated email, SMS or WhatsApp reminders with written identity and explicit consent.",
                OnboardingTaskType.SIGNATURE,
                serviceKey,
                sectorType,
                true,
                true,
                400
        ));
        templates.add(new TaskTemplate(
                "automation-channel-connections",
                "Messaging channels and sender access",
                "Describe the email, WhatsApp Business or SMS channels you want to connect, including sender names and account ownership. Do not submit production passwords here; use secure handoff when requested.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                true,
                410
        ));
        templates.add(new TaskTemplate(
                "automation-brand-tone",
                "Brand tone and message style",
                "Explain how your business speaks to customers: level of formality, preferred phrases, languages, banned wording and examples of a good message.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                420
        ));
        templates.add(new TaskTemplate(
                "automation-goals-recipes",
                "Automation goals and recipes",
                "Choose the priority flows: no-show reduction, Google review requests, birthday loyalty, booking confirmations, delayed follow-up or custom reminders.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                430
        ));
    }

    private void addDashboardTemplates(List<TaskTemplate> templates, String serviceKey, SectorType sectorType) {
        templates.add(new TaskTemplate(
                "dashboard-nda-signature",
                "Sign dashboard confidentiality agreement",
                "Confirm the NDA and internal software use agreement for handling business metrics, staff data and operational records.",
                OnboardingTaskType.SIGNATURE,
                serviceKey,
                sectorType,
                true,
                true,
                500
        ));
        templates.add(new TaskTemplate(
                "dashboard-roles-staff",
                "Staff roles and organization chart",
                "List team members, roles, departments and permission expectations for owner, manager, employee, service-assigned and read-only views.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                true,
                510
        ));
        templates.add(new TaskTemplate(
                "dashboard-operational-protocols",
                "Operational protocols and internal notes",
                "Document recurring rules, service protocols, exception handling and fixed internal notes that should guide daily work in the management dashboard.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                520
        ));
        templates.add(new TaskTemplate(
                "dashboard-data-migration",
                "Upload historical operations data",
                "Upload CSV or Excel files with old customer, service, staff or operational history if you want it migrated into the dashboard. Accepted files will remain private to your project.",
                OnboardingTaskType.FILE_UPLOAD,
                serviceKey,
                sectorType,
                false,
                false,
                530
        ));
        templates.add(new TaskTemplate(
                "dashboard-kpis",
                "Dashboard KPIs and data sources",
                "List the KPIs, data sources and access rules you want to see in your management dashboard.",
                OnboardingTaskType.PREFERENCES_FORM,
                serviceKey,
                sectorType,
                true,
                false,
                540
        ));
    }

    private TaskTemplate sectorTemplate(SectorType sectorType) {
        return switch (sectorType) {
            case CLINICS -> new TaskTemplate(
                    "sector-clinic-context",
                    "Clinic context and patient flow",
                    "Tell us your clinic type, treatments, appointment flow, patient intake needs and follow-up rules.",
                    OnboardingTaskType.PREFERENCES_FORM,
                    "general",
                    sectorType,
                    true,
                    false,
                    40
            );
            case RESTAURANTS -> new TaskTemplate(
                    "sector-restaurant-context",
                    "Restaurant menu, spaces and service rhythm",
                    "Share menu photos, allergy information, areas, table flow, opening hours and reservation rules.",
                    OnboardingTaskType.PREFERENCES_FORM,
                    "general",
                    sectorType,
                    true,
                    false,
                    40
            );
            case CAR_DEALERS -> new TaskTemplate(
                    "sector-car-dealer-context",
                    "Vehicle inventory and sales flow",
                    "Describe your inventory, lead qualification process, vehicle photo needs and sales follow-up rules.",
                    OnboardingTaskType.PREFERENCES_FORM,
                    "general",
                    sectorType,
                    true,
                    false,
                    40
            );
            case CUSTOM -> new TaskTemplate(
                    "sector-custom-context",
                    "Custom business workflow",
                    "Describe your daily operation, manual work, client journey and the parts that should become easier.",
                    OnboardingTaskType.PREFERENCES_FORM,
                    "general",
                    sectorType,
                    true,
                    false,
                    40
            );
        };
    }

    public record TaskTemplate(
            String taskKey,
            String title,
            String description,
            OnboardingTaskType taskType,
            String serviceKey,
            SectorType sectorType,
            boolean required,
            boolean critical,
            int sortOrder
    ) {}
}
