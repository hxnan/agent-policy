package com.example.agentpolicy.evaluation;

import com.example.agentpolicy.engine.PolicyDecisionRequest;
import com.example.agentpolicy.engine.PolicyEngine;
import com.example.agentpolicy.policy.Policy;
import com.example.agentpolicy.policy.PolicyRepository;
import com.example.agentpolicy.policy.PolicyStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class EvaluationService {

    private final PolicyRepository policyRepository;
    private final EvaluationAuditRepository auditRepository;
    private final PolicyEngine policyEngine;
    private final ObjectMapper objectMapper;

    public EvaluationService(
            PolicyRepository policyRepository,
            EvaluationAuditRepository auditRepository,
            PolicyEngine policyEngine,
            ObjectMapper objectMapper
    ) {
        this.policyRepository = policyRepository;
        this.auditRepository = auditRepository;
        this.policyEngine = policyEngine;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public EvaluationResponse evaluate(EvaluationRequest request) {
        List<Policy> policies = policiesFor(request);
        var result = policyEngine.evaluate(new PolicyDecisionRequest(
                request.principal(),
                request.action(),
                request.resource(),
                request.context() == null ? java.util.Map.of() : request.context(),
                request.entities() == null ? List.of() : request.entities(),
                policies
        ));

        EvaluationAudit audit = new EvaluationAudit(
                UUID.randomUUID(),
                request.principal(),
                request.action(),
                request.resource(),
                toJson(request.context() == null ? java.util.Map.of() : request.context()),
                toJson(request.entities() == null ? List.of() : request.entities()),
                result.decision(),
                toJson(result.matchedPolicies()),
                toJson(result.errors()),
                Instant.now()
        );

        return toResponse(auditRepository.save(audit));
    }

    @Transactional(readOnly = true)
    public EvaluationResponse get(UUID id) {
        return auditRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluation audit not found"));
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> list() {
        return auditRepository.findAll().stream().map(this::toResponse).toList();
    }

    private List<Policy> policiesFor(EvaluationRequest request) {
        if (request.policyIds() == null || request.policyIds().isEmpty()) {
            return policyRepository.findByStatus(PolicyStatus.ENABLED);
        }
        return policyRepository.findAllById(request.policyIds()).stream()
                .filter(policy -> policy.getStatus() == PolicyStatus.ENABLED)
                .toList();
    }

    private EvaluationResponse toResponse(EvaluationAudit audit) {
        return new EvaluationResponse(
                audit.getId(),
                audit.getDecision(),
                audit.getPrincipal(),
                audit.getAction(),
                audit.getResource(),
                fromJsonList(audit.getMatchedPoliciesJson()),
                fromJsonList(audit.getErrorsJson()),
                audit.getCreatedAt()
        );
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Failed to serialize evaluation audit payload", ex);
        }
    }

    private List<String> fromJsonList(String value) {
        try {
            return objectMapper.readerForListOf(String.class).readValue(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Failed to deserialize evaluation audit payload", ex);
        }
    }
}

