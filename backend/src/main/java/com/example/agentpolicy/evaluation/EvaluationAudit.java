package com.example.agentpolicy.evaluation;

import com.example.agentpolicy.engine.PolicyDecision;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evaluation_audits")
public class EvaluationAudit {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String principal;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String resource;

    @Column(nullable = false, columnDefinition = "text")
    private String contextJson;

    @Column(nullable = false, columnDefinition = "text")
    private String entitiesJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyDecision decision;

    @Column(nullable = false, columnDefinition = "text")
    private String matchedPoliciesJson;

    @Column(nullable = false, columnDefinition = "text")
    private String errorsJson;

    @Column(nullable = false)
    private Instant createdAt;

    protected EvaluationAudit() {
    }

    public EvaluationAudit(
            UUID id,
            String principal,
            String action,
            String resource,
            String contextJson,
            String entitiesJson,
            PolicyDecision decision,
            String matchedPoliciesJson,
            String errorsJson,
            Instant createdAt
    ) {
        this.id = id;
        this.principal = principal;
        this.action = action;
        this.resource = resource;
        this.contextJson = contextJson;
        this.entitiesJson = entitiesJson;
        this.decision = decision;
        this.matchedPoliciesJson = matchedPoliciesJson;
        this.errorsJson = errorsJson;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getPrincipal() {
        return principal;
    }

    public String getAction() {
        return action;
    }

    public String getResource() {
        return resource;
    }

    public String getContextJson() {
        return contextJson;
    }

    public String getEntitiesJson() {
        return entitiesJson;
    }

    public PolicyDecision getDecision() {
        return decision;
    }

    public String getMatchedPoliciesJson() {
        return matchedPoliciesJson;
    }

    public String getErrorsJson() {
        return errorsJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

