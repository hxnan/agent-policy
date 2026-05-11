package com.example.agentpolicy.policy;

import java.time.Instant;
import java.util.UUID;

public record PolicyResponse(
        UUID id,
        String name,
        String description,
        PolicyType policyType,
        String cedarText,
        PolicyStatus status,
        int version,
        Instant createdAt,
        Instant updatedAt
) {

    public static PolicyResponse from(Policy policy) {
        return new PolicyResponse(
                policy.getId(),
                policy.getName(),
                policy.getDescription(),
                policy.getPolicyType(),
                policy.getCedarText(),
                policy.getStatus(),
                policy.getVersion(),
                policy.getCreatedAt(),
                policy.getUpdatedAt()
        );
    }
}

