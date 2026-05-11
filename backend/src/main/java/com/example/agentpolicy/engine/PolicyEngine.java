package com.example.agentpolicy.engine;

public interface PolicyEngine {

    PolicyDecisionResult evaluate(PolicyDecisionRequest request);
}

