package com.example.agentpolicy.engine;

import com.example.agentpolicy.policy.Policy;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class HttpCedarPolicyEngine implements PolicyEngine {

    private final RestTemplate restTemplate;
    private final String endpoint;

    public HttpCedarPolicyEngine(
            RestTemplate restTemplate,
            @Value("${agent-policy.cedar.endpoint:http://localhost:8180}") String endpoint
    ) {
        this.restTemplate = restTemplate;
        this.endpoint = endpoint;
    }

    @Override
    public PolicyDecisionResult evaluate(PolicyDecisionRequest request) {
        if (request.policies().isEmpty()) {
            return new PolicyDecisionResult(PolicyDecision.DENY, List.of(), List.of());
        }

        try {
            PdpResponse response = restTemplate.postForObject(
                    endpoint + "/evaluate",
                    toPdpRequest(request),
                    PdpResponse.class
            );
            if (response == null) {
                return new PolicyDecisionResult(PolicyDecision.DENY, List.of(), List.of("Empty PDP response"));
            }

            return new PolicyDecisionResult(
                    toDecision(response.decision()),
                    response.matchedPolicies() == null ? List.of() : response.matchedPolicies(),
                    response.errors() == null ? List.of() : response.errors()
            );
        } catch (RestClientException ex) {
            return new PolicyDecisionResult(PolicyDecision.DENY, List.of(), List.of(ex.getMessage()));
        }
    }

    private PdpRequest toPdpRequest(PolicyDecisionRequest request) {
        return new PdpRequest(
                request.policies().stream().map(Policy::getCedarText).toList(),
                request.principal(),
                request.action(),
                request.resource(),
                request.context(),
                request.entities()
        );
    }

    private PolicyDecision toDecision(String decision) {
        return switch (decision) {
            case "Allow", "ALLOW" -> PolicyDecision.ALLOW;
            case "Deny", "DENY" -> PolicyDecision.DENY;
            default -> throw new IllegalArgumentException("Unsupported PDP decision: " + decision);
        };
    }

    private record PdpRequest(
            List<String> policies,
            String principal,
            String action,
            String resource,
            Map<String, Object> context,
            List<Object> entities
    ) {
    }

    private record PdpResponse(
            String decision,
            @JsonProperty("matched_policies") List<String> matchedPolicies,
            List<String> errors
    ) {
    }
}
