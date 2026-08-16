package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class ProvisioningDecision {

    private static final Set<String> SHARED_KEYS = Set.of(
            "DRIVE", "JIRA", "GITHUB", "AUTH", "NEON", "RESEND", "CALENDAR", "STRIPE"
    );

    private final ProvisioningRoute route;
    private final String routeKey;
    private final AutomationLevel automationLevel;
    private final String automationScope;
    private final String reason;
    private final String costEstimate;
    private final List<String> risks;
    private final List<ToolDecision> tools;
    private final List<PlanItemDecision> items;
    private final List<ManualStepDecision> manualSteps;
    private final List<TrackDecision> tracks;
    private final List<SharedResourceDecision> sharedResources;

    private ProvisioningDecision(
            ProvisioningRoute route,
            String routeKey,
            AutomationLevel automationLevel,
            String automationScope,
            String reason,
            String costEstimate,
            List<String> risks,
            List<ToolDecision> tools,
            List<PlanItemDecision> items,
            List<ManualStepDecision> manualSteps,
            List<TrackDecision> tracks,
            List<SharedResourceDecision> sharedResources
    ) {
        this.route = route;
        this.routeKey = routeKey;
        this.automationLevel = automationLevel;
        this.automationScope = automationScope;
        this.reason = reason;
        this.costEstimate = costEstimate;
        this.risks = List.copyOf(risks);
        this.tools = List.copyOf(tools);
        this.items = List.copyOf(items);
        this.manualSteps = List.copyOf(manualSteps);
        this.tracks = List.copyOf(tracks);
        this.sharedResources = List.copyOf(sharedResources);
    }

    public static ProvisioningDecision compose(
            List<TrackDecision> tracks,
            List<ManualStepDecision> planManualSteps
    ) {
        if (tracks == null || tracks.isEmpty()) {
            throw new IllegalArgumentException("At least one provisioning track is required");
        }
        List<TrackDecision> orderedTracks = tracks.stream()
                .sorted(java.util.Comparator.comparingInt(track -> track.track().ordinal()))
                .toList();
        ProvisioningRoute route = orderedTracks.size() == 1
                ? orderedTracks.getFirst().route()
                : ProvisioningRoute.COMPOSITE;
        String routeKey = orderedTracks.size() == 1
                ? route.name()
                : "COMPOSITE[" + orderedTracks.stream()
                .map(track -> track.route().name())
                .collect(java.util.stream.Collectors.joining(",")) + "]";

        List<ToolDecision> flattenedTools = flattenTools(orderedTracks);
        List<SharedResourceDecision> shared = buildSharedResources(orderedTracks, flattenedTools);
        List<PlanItemDecision> items = orderedTracks.stream().flatMap(track -> track.items().stream()).toList();
        List<ManualStepDecision> manualSteps = deduplicateManualSteps(orderedTracks, planManualSteps);
        List<String> risks = orderedTracks.stream()
                .flatMap(track -> track.risks().stream())
                .distinct()
                .toList();

        return new ProvisioningDecision(
                route,
                routeKey,
                weakestLevel(orderedTracks),
                "partial",
                orderedTracks.stream()
                        .map(track -> track.track().name() + ": " + track.reason())
                        .collect(java.util.stream.Collectors.joining(" ")),
                "Dry-run only. Provider plans, subscriptions and usage costs require admin approval.",
                risks,
                flattenedTools,
                items,
                manualSteps,
                orderedTracks,
                shared
        );
    }

    private static List<ToolDecision> flattenTools(List<TrackDecision> tracks) {
        Map<String, ToolDecision> decisions = new LinkedHashMap<>();
        tracks.stream().flatMap(track -> track.tools().stream()).forEach(candidate -> {
            ToolDecision current = decisions.get(candidate.key());
            if (current == null || "selected".equals(candidate.selectionState())) {
                decisions.put(candidate.key(), candidate);
            }
        });
        return List.copyOf(decisions.values());
    }

    private static List<SharedResourceDecision> buildSharedResources(
            List<TrackDecision> tracks,
            List<ToolDecision> flattenedTools
    ) {
        List<SharedResourceDecision> result = new ArrayList<>();
        for (ToolDecision tool : flattenedTools) {
            if (!SHARED_KEYS.contains(tool.key())) {
                continue;
            }
            List<ProvisioningTrack> users = tracks.stream()
                    .filter(track -> track.tools().stream().anyMatch(candidate ->
                            candidate.key().equals(tool.key()) && "selected".equals(candidate.selectionState())))
                    .map(TrackDecision::track)
                    .toList();
            result.add(new SharedResourceDecision(
                    tool.key(),
                    tool.displayName(),
                    tool.selectionState(),
                    tool.automationLevel(),
                    tool.required(),
                    users.isEmpty()
                            ? tool.reason()
                            : "Shared once across tracks: " + users,
                    users
            ));
        }
        return List.copyOf(result);
    }

    private static List<ManualStepDecision> deduplicateManualSteps(
            List<TrackDecision> tracks,
            List<ManualStepDecision> planManualSteps
    ) {
        Map<String, ManualStepDecision> steps = new LinkedHashMap<>();
        if (planManualSteps != null) {
            planManualSteps.forEach(step -> steps.putIfAbsent(step.providerKey(), step));
        }
        tracks.stream().flatMap(track -> track.manualSteps().stream())
                .forEach(step -> steps.putIfAbsent(step.providerKey(), step));
        return List.copyOf(steps.values());
    }

    private static AutomationLevel weakestLevel(List<TrackDecision> tracks) {
        Set<AutomationLevel> levels = new LinkedHashSet<>();
        tracks.forEach(track -> levels.add(track.automationLevel()));
        if (levels.contains(AutomationLevel.M)) return AutomationLevel.M;
        if (levels.contains(AutomationLevel.A1)) return AutomationLevel.A1;
        if (levels.contains(AutomationLevel.A2)) return AutomationLevel.A2;
        return AutomationLevel.A3;
    }

    public ProvisioningRoute route() { return route; }
    public String routeKey() { return routeKey; }
    public AutomationLevel automationLevel() { return automationLevel; }
    public String automationScope() { return automationScope; }
    public String reason() { return reason; }
    public String costEstimate() { return costEstimate; }
    public List<String> risks() { return risks; }
    public List<ToolDecision> tools() { return tools; }
    public List<PlanItemDecision> items() { return items; }
    public List<ManualStepDecision> manualSteps() { return manualSteps; }
    public List<TrackDecision> tracks() { return tracks; }
    public List<SharedResourceDecision> sharedResources() { return sharedResources; }

    public record ToolDecision(
            String key,
            String displayName,
            String selectionState,
            AutomationLevel automationLevel,
            boolean required,
            String reason
    ) {}

    public record PlanItemDecision(
            String providerKey,
            String resourceType,
            String resourceName,
            String action,
            boolean required,
            String reason
    ) {}

    public record ManualStepDecision(
            String providerKey,
            String title,
            String reason,
            boolean required
    ) {}
}
