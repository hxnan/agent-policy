package com.example.agentpolicy.engine;

import com.example.agentpolicy.policy.Policy;

import java.util.List;
import java.util.Map;

public record PolicyDecisionRequest(
        String principal,
        String action,
        String resource,
        Map<String, Object> context,
        List<Object> entities,
        List<Policy> policies
) {
}

