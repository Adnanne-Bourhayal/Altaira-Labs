package com.altaira.backend.service;

import com.altaira.backend.dto.provisioning.CreateProvisioningDryRunRequest;
import com.altaira.backend.dto.provisioning.ProvisioningPlanResponse;
import com.altaira.backend.entity.*;
import com.altaira.backend.exception.LeadNotFoundException;
import com.altaira.backend.integration.provisioning.ProvisioningProviderRegistry;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.provisioning.ProvisioningDecision;
import com.altaira.backend.provisioning.ProvisioningDecisionEngine;
import com.altaira.backend.provisioning.ProvisioningRequirementNormalizer;
import com.altaira.backend.provisioning.RequirementSet;
import com.altaira.backend.provisioning.SharedResourceDecision;
import com.altaira.backend.provisioning.TrackDecision;
import com.altaira.backend.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class ProvisioningPlanService {

    private final LeadRepository leadRepository;
    private final LeadAssessmentRepository assessmentRepository;
    private final ProvisioningPlanRepository planRepository;
    private final ProvisioningPlanItemRepository itemRepository;
    private final ProvisioningSelectedToolRepository toolRepository;
    private final ProvisioningManualStepRepository manualStepRepository;
    private final ProvisioningExternalResourceRepository externalResourceRepository;
    private final ProvisioningRequirementNormalizer requirementNormalizer;
    private final ProvisioningDecisionEngine decisionEngine;
    private final ProvisioningProviderRegistry providerRegistry;
    private final ObjectMapper objectMapper;

    public ProvisioningPlanService(
            LeadRepository leadRepository,
            LeadAssessmentRepository assessmentRepository,
            ProvisioningPlanRepository planRepository,
            ProvisioningPlanItemRepository itemRepository,
            ProvisioningSelectedToolRepository toolRepository,
            ProvisioningManualStepRepository manualStepRepository,
            ProvisioningExternalResourceRepository externalResourceRepository,
            ProvisioningRequirementNormalizer requirementNormalizer,
            ProvisioningDecisionEngine decisionEngine,
            ProvisioningProviderRegistry providerRegistry,
            ObjectMapper objectMapper
    ) {
        this.leadRepository = leadRepository;
        this.assessmentRepository = assessmentRepository;
        this.planRepository = planRepository;
        this.itemRepository = itemRepository;
        this.toolRepository = toolRepository;
        this.manualStepRepository = manualStepRepository;
        this.externalResourceRepository = externalResourceRepository;
        this.requirementNormalizer = requirementNormalizer;
        this.decisionEngine = decisionEngine;
        this.providerRegistry = providerRegistry;
        this.objectMapper = objectMapper;
    }

    public ProvisioningPlanResponse generateDryRun(UUID leadId, CreateProvisioningDryRunRequest request) {
        LeadEntity lead = findLead(leadId);
        LeadAssessmentEntity assessment = resolveAssessment(lead, request == null ? null : request.getAssessmentId());
        Map<String, Object> responses = readMap(assessment.getResponsesJson());
        List<String> recommendedServices = readList(assessment.getRecommendedServicesJson());
        RequirementSet requirements = requirementNormalizer.normalize(
                assessment.getFormKey(),
                responses,
                recommendedServices
        );
        ProvisioningDecision decision = decisionEngine.decide(
                requirements,
                assessment.getFormKey(),
                responses,
                recommendedServices,
                lead.getBusinessName()
        );

        ProvisioningPlanEntity plan = planRepository.findByAssessment(assessment)
                .orElseGet(ProvisioningPlanEntity::new);
        plan.setLead(lead);
        plan.setAssessment(assessment);
        plan.setRouteKey(decision.route().name());
        plan.setAutomationLevel(decision.automationLevel().name());
        plan.setAutomationScope(decision.automationScope());
        plan.setStatus(ProvisioningPlanStatus.DRAFT.value());
        plan.setDryRun(true);
        plan.setNormalizedRequirementsJson(writeJson(requirements.asMap()));
        plan.setDecisionReason(decision.reason());
        plan.setRisksJson(writeJson(decision.risks()));
        plan.setCostEstimate(decision.costEstimate());
        plan.setTracksJson(writeJson(mapTracks(decision.tracks())));
        plan.setSharedResourcesJson(writeJson(mapSharedResources(decision.sharedResources())));
        plan = planRepository.saveAndFlush(plan);

        replacePlanDetails(plan, decision);
        return map(plan);
    }

    @Transactional(readOnly = true)
    public List<ProvisioningPlanResponse> getPlansForLead(UUID leadId) {
        LeadEntity lead = findLead(leadId);
        return planRepository.findAllByLeadOrderByUpdatedAtDesc(lead)
                .stream()
                .map(this::map)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProvisioningPlanResponse getPlan(UUID planId) {
        return map(findPlan(planId));
    }

    public ProvisioningPlanResponse updateStatus(UUID planId, String rawStatus) {
        ProvisioningPlanStatus status = ProvisioningPlanStatus.parse(rawStatus);
        if (!List.of(
                ProvisioningPlanStatus.DRAFT,
                ProvisioningPlanStatus.AWAITING_APPROVAL,
                ProvisioningPlanStatus.APPROVED
        ).contains(status)) {
            throw new IllegalArgumentException(
                    "Dry-run plans can only be draft, awaiting_approval or approved"
            );
        }
        ProvisioningPlanEntity plan = findPlan(planId);
        plan.setStatus(status.value());
        return map(planRepository.save(plan));
    }

    private void replacePlanDetails(ProvisioningPlanEntity plan, ProvisioningDecision decision) {
        externalResourceRepository.deleteAllByPlan(plan);
        itemRepository.deleteAllByPlan(plan);
        manualStepRepository.deleteAllByPlan(plan);
        toolRepository.deleteAllByPlan(plan);
        externalResourceRepository.flush();
        itemRepository.flush();
        manualStepRepository.flush();
        toolRepository.flush();

        for (int index = 0; index < decision.tools().size(); index++) {
            ProvisioningDecision.ToolDecision source = decision.tools().get(index);
            ProvisioningSelectedToolEntity entity = new ProvisioningSelectedToolEntity();
            entity.setPlan(plan);
            entity.setToolKey(source.key());
            entity.setDisplayName(source.displayName());
            entity.setSelectionState(source.selectionState());
            entity.setAutomationLevel(source.automationLevel().name());
            entity.setRequired(source.required());
            entity.setReason(source.reason());
            entity.setSortOrder(index);
            toolRepository.save(entity);
        }

        for (int index = 0; index < decision.items().size(); index++) {
            ProvisioningDecision.PlanItemDecision source = decision.items().get(index);
            ProvisioningPlanItemEntity entity = new ProvisioningPlanItemEntity();
            entity.setPlan(plan);
            entity.setProviderKey(source.providerKey());
            entity.setResourceType(source.resourceType());
            entity.setResourceName(source.resourceName());
            entity.setAction(source.action());
            entity.setStatus("planned");
            entity.setRequired(source.required());
            entity.setReason(source.reason());
            entity.setSortOrder(index);
            itemRepository.save(entity);

            if (providerRegistry.find(source.providerKey()).isPresent()) {
                ProvisioningExternalResourceEntity placeholder = new ProvisioningExternalResourceEntity();
                placeholder.setPlan(plan);
                placeholder.setProviderKey(source.providerKey());
                placeholder.setResourceType(source.resourceType());
                placeholder.setStatus("placeholder");
                placeholder.setIdempotencyKey(plan.getId() + ":" + source.providerKey() + ":" + source.resourceType() + ":" + index);
                externalResourceRepository.save(placeholder);
            }
        }

        for (int index = 0; index < decision.manualSteps().size(); index++) {
            ProvisioningDecision.ManualStepDecision source = decision.manualSteps().get(index);
            ProvisioningManualStepEntity entity = new ProvisioningManualStepEntity();
            entity.setPlan(plan);
            entity.setProviderKey(source.providerKey());
            entity.setTitle(source.title());
            entity.setReason(source.reason());
            entity.setRequired(source.required());
            entity.setStatus("pending");
            entity.setSortOrder(index);
            manualStepRepository.save(entity);
        }
    }

    private LeadAssessmentEntity resolveAssessment(LeadEntity lead, UUID assessmentId) {
        if (assessmentId != null) {
            LeadAssessmentEntity assessment = assessmentRepository.findById(assessmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));
            if (!assessment.getLead().getId().equals(lead.getId())) {
                throw new IllegalArgumentException("Assessment does not belong to this lead");
            }
            return assessment;
        }
        return assessmentRepository.findAllByLeadOrderByUpdatedAtDesc(lead)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "A saved lead assessment is required before generating a provisioning plan"
                ));
    }

    private LeadEntity findLead(UUID id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new LeadNotFoundException(id));
    }

    private ProvisioningPlanEntity findPlan(UUID id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Provisioning plan not found: " + id));
    }

    private ProvisioningPlanResponse map(ProvisioningPlanEntity plan) {
        List<ProvisioningPlanResponse.Tool> tools = toolRepository.findAllByPlanOrderBySortOrder(plan)
                .stream()
                .map(tool -> new ProvisioningPlanResponse.Tool(
                        tool.getId(),
                        tool.getToolKey(),
                        tool.getDisplayName(),
                        tool.getSelectionState(),
                        tool.getAutomationLevel(),
                        tool.isRequired(),
                        tool.getReason()
                ))
                .toList();
        List<ProvisioningPlanResponse.PlanItem> items = itemRepository.findAllByPlanOrderBySortOrder(plan)
                .stream()
                .map(item -> new ProvisioningPlanResponse.PlanItem(
                        item.getId(),
                        item.getProviderKey(),
                        item.getResourceType(),
                        item.getResourceName(),
                        item.getAction(),
                        item.getStatus(),
                        item.isRequired(),
                        item.getReason()
                ))
                .toList();
        List<ProvisioningPlanResponse.ManualStep> manualSteps = manualStepRepository.findAllByPlanOrderBySortOrder(plan)
                .stream()
                .map(step -> new ProvisioningPlanResponse.ManualStep(
                        step.getId(),
                        step.getProviderKey(),
                        step.getTitle(),
                        step.getReason(),
                        step.isRequired(),
                        step.getStatus()
                ))
                .toList();
        List<ProvisioningPlanResponse.ExternalResource> resources =
                externalResourceRepository.findAllByPlanOrderByProviderKey(plan)
                        .stream()
                        .map(resource -> new ProvisioningPlanResponse.ExternalResource(
                                resource.getId(),
                                resource.getProviderKey(),
                                resource.getResourceType(),
                                resource.getExternalResourceId(),
                                resource.getExternalUrl(),
                                resource.getStatus(),
                                resource.getIdempotencyKey()
                        ))
                        .toList();

        return new ProvisioningPlanResponse(
                plan.getId(),
                plan.getLead().getId(),
                plan.getAssessment().getId(),
                plan.getRouteKey(),
                plan.getAutomationLevel(),
                plan.getAutomationScope(),
                plan.getStatus(),
                plan.isDryRun(),
                false,
                readBooleanMap(plan.getNormalizedRequirementsJson()),
                plan.getDecisionReason(),
                plan.getCostEstimate(),
                readList(plan.getRisksJson()),
                tools,
                items,
                manualSteps,
                resources,
                readTracks(plan.getTracksJson()),
                readSharedResources(plan.getSharedResourcesJson()),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }

    private List<ProvisioningPlanResponse.Track> mapTracks(List<TrackDecision> tracks) {
        return tracks.stream()
                .map(track -> new ProvisioningPlanResponse.Track(
                        track.track().name(),
                        track.route().name(),
                        track.ruleId(),
                        track.matchedSignals(),
                        track.reason(),
                        track.confidence(),
                        track.requiresManualDecision(),
                        track.automationLevel().name(),
                        track.tools().stream()
                                .map(tool -> new ProvisioningPlanResponse.DecisionTool(
                                        tool.key(),
                                        tool.displayName(),
                                        tool.selectionState(),
                                        tool.automationLevel().name(),
                                        tool.required(),
                                        tool.reason()
                                ))
                                .toList(),
                        track.manualSteps().stream()
                                .map(step -> new ProvisioningPlanResponse.DecisionManualStep(
                                        step.providerKey(),
                                        step.title(),
                                        step.reason(),
                                        step.required()
                                ))
                                .toList(),
                        track.risks()
                ))
                .toList();
    }

    private List<ProvisioningPlanResponse.SharedResource> mapSharedResources(
            List<SharedResourceDecision> resources
    ) {
        return resources.stream()
                .map(resource -> new ProvisioningPlanResponse.SharedResource(
                        resource.key(),
                        resource.displayName(),
                        resource.selectionState(),
                        resource.automationLevel().name(),
                        resource.required(),
                        resource.reason(),
                        resource.usedByTracks().stream().map(Enum::name).toList()
                ))
                .toList();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Provisioning data could not be serialized", exception);
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored assessment responses are invalid", exception);
        }
    }

    private Map<String, Boolean> readBooleanMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored provisioning requirements are invalid", exception);
        }
    }

    private List<String> readList(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored provisioning list is invalid", exception);
        }
    }

    private List<ProvisioningPlanResponse.Track> readTracks(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored provisioning tracks are invalid", exception);
        }
    }

    private List<ProvisioningPlanResponse.SharedResource> readSharedResources(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored shared provisioning resources are invalid", exception);
        }
    }
}
