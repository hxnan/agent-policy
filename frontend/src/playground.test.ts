import { describe, expect, it } from 'vitest';
import type { Policy } from './api';
import { filterPoliciesForPlayground } from './playground';

const policies: Policy[] = [
  {
    id: 'p-admin',
    name: '管理员授权 Alice 使用 Agent_A',
    description: '允许 Alice 访问 Agent_A',
    policyType: 'ADMIN',
    cedarText: 'permit(principal == User::"Alice", action, resource == Agent::"Agent_A");',
    status: 'ENABLED',
    version: 1,
    createdAt: '2026-05-12T00:00:00Z',
    updatedAt: '2026-05-12T00:00:00Z',
  },
  {
    id: 'p-agent',
    name: 'Bob 委托 Agent_B 使用工具',
    description: 'Agent_B tool policy',
    policyType: 'USER_DELEGATION',
    cedarText: 'permit(principal == AgentSession::"bob_agent_b", action, resource);',
    status: 'ENABLED',
    version: 1,
    createdAt: '2026-05-12T00:00:00Z',
    updatedAt: '2026-05-12T00:00:00Z',
  },
  {
    id: 'p-draft',
    name: '草稿策略',
    description: 'Agent_A draft',
    policyType: 'ADMIN',
    cedarText: 'permit(principal, action, resource);',
    status: 'DRAFT',
    version: 1,
    createdAt: '2026-05-12T00:00:00Z',
    updatedAt: '2026-05-12T00:00:00Z',
  },
];

describe('filterPoliciesForPlayground', () => {
  it('filters enabled policies by user and agent text', () => {
    const result = filterPoliciesForPlayground(policies, {
      keyword: '',
      policyType: undefined,
      status: 'ENABLED',
      user: 'Alice',
      agent: 'Agent_A',
    });

    expect(result.map((policy) => policy.id)).toEqual(['p-admin']);
  });

  it('can select all enabled policies without user or agent filters', () => {
    const result = filterPoliciesForPlayground(policies, {
      keyword: '',
      policyType: undefined,
      status: 'ENABLED',
      user: '',
      agent: '',
    });

    expect(result.map((policy) => policy.id)).toEqual(['p-admin', 'p-agent']);
  });
});
