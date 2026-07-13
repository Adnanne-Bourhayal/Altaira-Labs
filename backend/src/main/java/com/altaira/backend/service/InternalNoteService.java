package com.altaira.backend.service;

import com.altaira.backend.dto.note.CreateInternalNoteRequest;
import com.altaira.backend.dto.note.InternalNoteResponse;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.InternalNoteEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.exception.LeadNotFoundException;
import com.altaira.backend.repository.InternalNoteRepository;
import com.altaira.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class InternalNoteService {

    private final InternalNoteRepository internalNoteRepository;
    private final LeadRepository leadRepository;
    private final ClientManagementService clientManagementService;

    public InternalNoteService(
            InternalNoteRepository internalNoteRepository,
            LeadRepository leadRepository,
            ClientManagementService clientManagementService
    ) {
        this.internalNoteRepository = internalNoteRepository;
        this.leadRepository = leadRepository;
        this.clientManagementService = clientManagementService;
    }

    public InternalNoteResponse addLeadNote(UUID leadId, CreateInternalNoteRequest request) {
        LeadEntity lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new LeadNotFoundException(leadId));

        InternalNoteEntity entity = new InternalNoteEntity();
        entity.setLead(lead);
        entity.setContent(trimRequired(request.getContent()));
        entity.setAuthor(resolveAuthor(request.getAuthor()));

        return map(internalNoteRepository.save(entity));
    }

    public List<InternalNoteResponse> getLeadNotes(UUID leadId) {
        LeadEntity lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new LeadNotFoundException(leadId));

        return internalNoteRepository.findAllByLeadOrderByCreatedAtDesc(lead)
                .stream()
                .map(this::map)
                .toList();
    }

    public InternalNoteResponse addClientNote(UUID clientId, CreateInternalNoteRequest request) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);

        InternalNoteEntity entity = new InternalNoteEntity();
        entity.setClient(client);
        entity.setContent(trimRequired(request.getContent()));
        entity.setAuthor(resolveAuthor(request.getAuthor()));

        return map(internalNoteRepository.save(entity));
    }

    public List<InternalNoteResponse> getClientNotes(UUID clientId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);

        return internalNoteRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .map(this::map)
                .toList();
    }

    private InternalNoteResponse map(InternalNoteEntity entity) {
        UUID leadId = entity.getLead() == null ? null : entity.getLead().getId();
        UUID clientId = entity.getClient() == null ? null : entity.getClient().getId();

        return new InternalNoteResponse(
                entity.getId(),
                leadId,
                clientId,
                entity.getContent(),
                entity.getAuthor(),
                entity.getCreatedAt()
        );
    }

    private String resolveAuthor(String author) {
        if (author == null || author.isBlank()) {
            return "Admin";
        }

        return author.trim();
    }

    private String trimRequired(String value) {
        return value == null ? "" : value.trim();
    }
}
