package com.example.agentpolicy.policy;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PolicyControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createsAndListsPolicies() throws Exception {
        String response = mockMvc.perform(post("/api/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Allow Agent A Tool 1",
                                "description", "A user delegates Agent_A to call tool_1",
                                "policyType", "USER_DELEGATION",
                                "cedarText", """
                                        permit(
                                          principal,
                                          action == Action::"callTool",
                                          resource == MCPTool::"tool_1"
                                        );
                                        """))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String id = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/policies/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Allow Agent A Tool 1"))
                .andExpect(jsonPath("$.policyType").value("USER_DELEGATION"));

        mockMvc.perform(get("/api/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(id));
    }

    @Test
    void updatesEnablesDisablesAndDeletesPolicy() throws Exception {
        String createResponse = mockMvc.perform(post("/api/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Draft policy",
                                "description", "Initial",
                                "policyType", "ADMIN",
                                "cedarText", "permit(principal, action, resource);"))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(put("/api/policies/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Updated policy",
                                "description", "Updated",
                                "policyType", "LOW_RISK",
                                "cedarText", "permit(principal, action, resource);"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated policy"))
                .andExpect(jsonPath("$.policyType").value("LOW_RISK"))
                .andExpect(jsonPath("$.version").value(2));

        mockMvc.perform(post("/api/policies/" + id + "/enable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENABLED"));

        mockMvc.perform(post("/api/policies/" + id + "/disable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISABLED"));

        mockMvc.perform(delete("/api/policies/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/policies/" + id))
                .andExpect(status().isNotFound());
    }
}
