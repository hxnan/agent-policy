package com.example.agentpolicy.evaluation;

import com.example.agentpolicy.engine.PolicyDecision;
import com.example.agentpolicy.engine.PolicyDecisionResult;
import com.example.agentpolicy.engine.PolicyEngine;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class EvaluationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PolicyEngine policyEngine;

    @Test
    void allowsRequestWhenEnabledCedarPolicyPermitsIt() throws Exception {
        when(policyEngine.evaluate(any()))
                .thenReturn(new PolicyDecisionResult(PolicyDecision.ALLOW, List.of("policy0"), List.of()));

        String policyResponse = mockMvc.perform(post("/api/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Allow Alice view photo",
                                "description", "Simple Cedar permit",
                                "policyType", "ADMIN",
                                "cedarText", """
                                        permit(
                                          principal == User::"Alice",
                                          action == Action::"view",
                                          resource == Photo::"alice_photo"
                                        );
                                        """))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String policyId = objectMapper.readTree(policyResponse).get("id").asText();

        mockMvc.perform(post("/api/policies/" + policyId + "/enable"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/evaluations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "principal", "User::\"Alice\"",
                                "action", "Action::\"view\"",
                                "resource", "Photo::\"alice_photo\"",
                                "context", Map.of(),
                                "entities", List.of()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("ALLOW"))
                .andExpect(jsonPath("$.matchedPolicies", hasSize(1)))
                .andExpect(jsonPath("$.auditId").isNotEmpty());
    }

    @Test
    void deniesRequestWhenNoEnabledPolicyPermitsItAndRecordsAudit() throws Exception {
        when(policyEngine.evaluate(any()))
                .thenReturn(new PolicyDecisionResult(PolicyDecision.DENY, List.of(), List.of()));

        String response = mockMvc.perform(post("/api/evaluations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "principal", "User::\"Bob\"",
                                "action", "Action::\"view\"",
                                "resource", "Photo::\"alice_photo\"",
                                "context", Map.of(),
                                "entities", List.of()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("DENY"))
                .andExpect(jsonPath("$.matchedPolicies", hasSize(0)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String auditId = objectMapper.readTree(response).get("auditId").asText();

        mockMvc.perform(get("/api/evaluations/" + auditId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("DENY"))
                .andExpect(jsonPath("$.principal").value("User::\"Bob\""));
    }
}
