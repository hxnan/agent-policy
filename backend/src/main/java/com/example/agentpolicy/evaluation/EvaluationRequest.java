package com.example.agentpolicy.evaluation;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record EvaluationRequest(
        @NotBlank String principal,
        @NotBlank String action,
        @NotBlank String resource,
        Map<String, Object> context,
        List<Object> entities,
        List<UUID> policyIds
) {
}

