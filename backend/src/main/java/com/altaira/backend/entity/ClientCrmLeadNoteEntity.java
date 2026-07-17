package com.altaira.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_crm_lead_notes")
public class ClientCrmLeadNoteEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private ClientCrmLeadEntity lead;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id")
    private AppUserEntity authorUser;

    @Column(name = "author_role", nullable = false)
    private String authorRole;

    @Column(name = "visible_to_client", nullable = false)
    private boolean visibleToClient;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ClientCrmLeadNoteEntity() {}

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ClientCrmLeadEntity getLead() { return lead; }
    public void setLead(ClientCrmLeadEntity lead) { this.lead = lead; }

    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }

    public AppUserEntity getAuthorUser() { return authorUser; }
    public void setAuthorUser(AppUserEntity authorUser) { this.authorUser = authorUser; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public boolean isVisibleToClient() { return visibleToClient; }
    public void setVisibleToClient(boolean visibleToClient) { this.visibleToClient = visibleToClient; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
