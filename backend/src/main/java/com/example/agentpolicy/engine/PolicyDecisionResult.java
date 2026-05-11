package com.example.agentpolicy.engine;

import java.util.List;

public record PolicyDecisionResult(
        PolicyDecision decision,
        List<String> matchedPolicies,
        List<String> errors
) {
}

