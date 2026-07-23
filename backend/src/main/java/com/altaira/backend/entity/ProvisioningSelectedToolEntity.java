package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
        name = "provisioning_selected_tools",
        uniqueConstraints = @UniqueConstraint(
                name = "provisioning_tools_plan_key_unique",
                columnNames = {"plan_id", "tool_key"}
        )
)
public class ProvisioningSelectedToolEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private ProvisioningPlanEntity plan;

    @Column(name = "tool_key", nullable = false, length = 40)
    private String toolKey;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "selection_state", nullable = false, length = 20)
    private String selectionState;

    @Column(name = "automation_level", nullable = false, length = 4)
    private String automationLevel;

    @Column(nullable = false)
    private boolean required;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ProvisioningPlanEntity getPlan() { return plan; }
    public void setPlan(ProvisioningPlanEntity plan) { this.plan = plan; }
    public String getToolKey() { return toolKey; }
    public void setToolKey(String toolKey) { this.toolKey = toolKey; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getSelectionState() { return selectionState; }
    public void setSelectionState(String selectionState) { this.selectionState = selectionState; }
    public String getAutomationLevel() { return automationLevel; }
    public void setAutomationLevel(String automationLevel) { this.automationLevel = automationLevel; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
