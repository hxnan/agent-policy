package com.example.agentpolicy.engine;

import com.example.agentpolicy.policy.Policy;
import com.example.agentpolicy.policy.PolicyType;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.POST;

class HttpCedarPolicyEngineTests {

    @Test
    void mapsAllowResponseFromPdp() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server.expect(once(), requestTo("http://localhost:8180/evaluate"))
                .andExpect(method(POST))
                .andExpect(jsonPath("$.principal").value("User::\"Alice\""))
                .andExpect(jsonPath("$.policies[0]").value(containsString("principal == User")))
                .andRespond(withSuccess("""
                        {
                          "decision": "Allow",
                          "matched_policies": ["policy0"],
                          "errors": []
                        }
                        """, MediaType.APPLICATION_JSON));

        HttpCedarPolicyEngine engine = new HttpCedarPolicyEngine(restTemplate, "http://localhost:8180");

        Policy policy = Policy.create("allow alice", "", PolicyType.ADMIN, """
                permit(
                  principal == User::"Alice",
                  action == Action::"view",
                  resource == Photo::"alice_photo"
                );
                """);
        PolicyDecisionResult result = engine.evaluate(new PolicyDecisionRequest(
                "User::\"Alice\"",
                "Action::\"view\"",
                "Photo::\"alice_photo\"",
                Map.of(),
                List.of(),
                List.of(policy)
        ));

        assertThat(result.decision()).isEqualTo(PolicyDecision.ALLOW);
        assertThat(result.matchedPolicies()).containsExactly("policy0");
        assertThat(result.errors()).isEmpty();
        server.verify();
    }
}
