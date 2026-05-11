import type { Decision, EvaluationRequest, PolicyRequest } from './api';

export interface ScenarioPolicyTemplate extends PolicyRequest {
  templateId: string;
}

export interface ScenarioCase {
  caseId: string;
  name: string;
  expectedDecision: Decision;
  request: Omit<EvaluationRequest, 'policyIds'>;
}

export interface ScenarioDefinition {
  scenarioId: string;
  title: string;
  description: string;
  policies: ScenarioPolicyTemplate[];
  cases: ScenarioCase[];
}

export const scenarioDefinitions: ScenarioDefinition[] = [
  {
    scenarioId: 'agent-access',
    title: '用户访问 Agent',
    description: '管理员允许指定用户访问指定 Agent。',
    policies: [
      {
        templateId: 'admin-user-agent-a',
        name: '管理员授权 Alice 使用 Agent_A',
        description: '允许 Alice 访问 Agent_A，Bob 不在授权范围内。',
        policyType: 'ADMIN',
        cedarText: `permit(
  principal == User::"Alice",
  action == Action::"use",
  resource == Agent::"Agent_A"
);`,
      },
    ],
    cases: [
      {
        caseId: 'alice-use-agent-a',
        name: 'Alice 可以使用 Agent_A',
        expectedDecision: 'ALLOW',
        request: {
          principal: 'User::"Alice"',
          action: 'Action::"use"',
          resource: 'Agent::"Agent_A"',
          context: {},
          entities: [],
        },
      },
      {
        caseId: 'bob-use-agent-a',
        name: 'Bob 不能使用 Agent_A',
        expectedDecision: 'DENY',
        request: {
          principal: 'User::"Bob"',
          action: 'Action::"use"',
          resource: 'Agent::"Agent_A"',
          context: {},
          entities: [],
        },
      },
    ],
  },
  {
    scenarioId: 'user-delegation',
    title: '用户委托 Agent 使用工具',
    description: '用户允许 AgentSession 代表自己调用指定 MCP 工具。',
    policies: [
      {
        templateId: 'alice-agent-a-tools',
        name: 'Alice 委托 Agent_A 使用工具1和工具2',
        description: '只允许 Alice 与 Agent_A 组成的会话调用工具1、工具2。',
        policyType: 'USER_DELEGATION',
        cedarText: `permit(
  principal == AgentSession::"alice_agent_a",
  action == Action::"invoke",
  resource
) when {
  resource == McpTool::"tool_1" || resource == McpTool::"tool_2"
};`,
      },
    ],
    cases: [
      {
        caseId: 'alice-agent-tool-1',
        name: 'Alice 的 Agent_A 会话可以调用工具1',
        expectedDecision: 'ALLOW',
        request: {
          principal: 'AgentSession::"alice_agent_a"',
          action: 'Action::"invoke"',
          resource: 'McpTool::"tool_1"',
          context: {},
          entities: [],
        },
      },
      {
        caseId: 'alice-agent-send-email',
        name: 'Alice 的 Agent_A 会话不能调用邮件工具',
        expectedDecision: 'DENY',
        request: {
          principal: 'AgentSession::"alice_agent_a"',
          action: 'Action::"invoke"',
          resource: 'McpTool::"send_email"',
          context: {},
          entities: [],
        },
      },
    ],
  },
  {
    scenarioId: 'low-risk',
    title: '低风险公共访问',
    description: '管理员一键允许低风险工具和子 Agent 被所有主体调用。',
    policies: [
      {
        templateId: 'low-risk-public',
        name: '低风险公共访问工具和子Agent',
        description: '允许任意主体调用天气工具和 FAQ 子 Agent。',
        policyType: 'LOW_RISK',
        cedarText: `permit(
  principal,
  action == Action::"invoke",
  resource
) when {
  resource == McpTool::"weather" || resource == SubAgent::"faq_agent"
};`,
      },
    ],
    cases: [
      {
        caseId: 'anyone-weather',
        name: '任意用户可以调用天气工具',
        expectedDecision: 'ALLOW',
        request: {
          principal: 'User::"Guest"',
          action: 'Action::"invoke"',
          resource: 'McpTool::"weather"',
          context: {},
          entities: [],
        },
      },
      {
        caseId: 'anyone-payment',
        name: '低风险公共访问不包含支付工具',
        expectedDecision: 'DENY',
        request: {
          principal: 'User::"Guest"',
          action: 'Action::"invoke"',
          resource: 'McpTool::"payment"',
          context: {},
          entities: [],
        },
      },
    ],
  },
  {
    scenarioId: 'skill-access',
    title: 'Agent 使用 Skill',
    description: '用户委托 AgentSession 使用指定 Skill。',
    policies: [
      {
        templateId: 'alice-agent-summarize',
        name: 'Alice 委托 Agent_A 使用摘要 Skill',
        description: '允许 Alice 的 Agent_A 会话使用 summarize Skill。',
        policyType: 'USER_DELEGATION',
        cedarText: `permit(
  principal == AgentSession::"alice_agent_a",
  action == Action::"use",
  resource == Skill::"summarize"
);`,
      },
    ],
    cases: [
      {
        caseId: 'alice-agent-summarize',
        name: 'Alice 的 Agent_A 会话可以使用摘要 Skill',
        expectedDecision: 'ALLOW',
        request: {
          principal: 'AgentSession::"alice_agent_a"',
          action: 'Action::"use"',
          resource: 'Skill::"summarize"',
          context: {},
          entities: [],
        },
      },
      {
        caseId: 'alice-agent-export',
        name: 'Alice 的 Agent_A 会话不能使用导出 Skill',
        expectedDecision: 'DENY',
        request: {
          principal: 'AgentSession::"alice_agent_a"',
          action: 'Action::"use"',
          resource: 'Skill::"export_data"',
          context: {},
          entities: [],
        },
      },
    ],
  },
];

