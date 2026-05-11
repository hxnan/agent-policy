package com.example.agentpolicy.evaluation;

import com.example.agentpolicy.engine.PolicyDecision;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EvaluationResponse(
        UUID auditId,
        PolicyDecision decision,
        String principal,
        String action,
        String resource,
        List<String> matchedPolicies,
        List<String> errors,
        Instant createdAt
) {
}

