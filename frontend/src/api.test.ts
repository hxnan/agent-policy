import { describe, expect, it, vi } from 'vitest';
import {
  createPolicy,
  deletePolicy,
  enablePolicy,
  evaluatePolicy,
  getPolicy,
  listPolicies,
  updatePolicy,
} from './api';

describe('policy api client', () => {
  it('lists policies from backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'p1', name: 'Admin allow', status: 'ENABLED' }],
    });

    const policies = await listPolicies(fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/policies');
    expect(policies).toHaveLength(1);
    expect(policies[0].name).toBe('Admin allow');
  });

  it('creates policy with json payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'p1', name: 'New policy' }),
    });

    const policy = await createPolicy(
      {
        name: 'New policy',
        description: '',
        policyType: 'ADMIN',
        cedarText: 'permit(principal, action, resource);',
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith('/api/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New policy',
        description: '',
        policyType: 'ADMIN',
        cedarText: 'permit(principal, action, resource);',
      }),
    });
    expect(policy.id).toBe('p1');
  });

  it('gets policy detail by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'p1', name: 'Policy detail' }),
    });

    const policy = await getPolicy('p1', fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/policies/p1');
    expect(policy.name).toBe('Policy detail');
  });

  it('updates policy with json payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'p1', name: 'Updated policy' }),
    });

    const policy = await updatePolicy(
      'p1',
      {
        name: 'Updated policy',
        description: 'changed',
        policyType: 'ADMIN',
        cedarText: 'permit(principal, action, resource);',
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith('/api/policies/p1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated policy',
        description: 'changed',
        policyType: 'ADMIN',
        cedarText: 'permit(principal, action, resource);',
      }),
    });
    expect(policy.name).toBe('Updated policy');
  });

  it('deletes policy by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('No body expected');
      },
    });

    await deletePolicy('p1', fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/policies/p1', { method: 'DELETE' });
  });

  it('enables policy by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'p1', status: 'ENABLED' }),
    });

    const policy = await enablePolicy('p1', fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/policies/p1/enable', { method: 'POST' });
    expect(policy.status).toBe('ENABLED');
  });

  it('evaluates a policy decision', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ decision: 'ALLOW', matchedPolicies: ['policy0'], errors: [] }),
    });

    const result = await evaluatePolicy(
      {
        principal: 'User::"Alice"',
        action: 'Action::"use"',
        resource: 'Agent::"Agent_A"',
        context: {},
        entities: [],
        policyIds: ['p1'],
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: 'User::"Alice"',
        action: 'Action::"use"',
        resource: 'Agent::"Agent_A"',
        context: {},
        entities: [],
        policyIds: ['p1'],
      }),
    });
    expect(result.decision).toBe('ALLOW');
  });
});
