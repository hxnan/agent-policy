package com.example.agentpolicy.policy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PolicyRequest(
        @NotBlank String name,
        String description,
        @NotNull PolicyType policyType,
        @NotBlank String cedarText
) {
}

