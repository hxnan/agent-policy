import type { Policy, PolicyStatus, PolicyType } from './api';

export interface PlaygroundPolicyFilters {
  keyword: string;
  policyType?: PolicyType;
  status?: PolicyStatus;
  user: string;
  agent: string;
}

export function filterPoliciesForPlayground(
  policies: Policy[],
  filters: PlaygroundPolicyFilters,
): Policy[] {
  return policies.filter((policy) => {
    if (filters.policyType && policy.policyType !== filters.policyType) {
      return false;
    }
    if (filters.status && policy.status !== filters.status) {
      return false;
    }

    const searchable = `${policy.name}\n${policy.description}\n${policy.cedarText}`.toLowerCase();
    return matches(searchable, filters.keyword) &&
      matchesPolicyEntity(searchable, filters.user, 'User') &&
      matchesPolicyEntity(searchable, filters.agent, 'Agent');
  });
}

function matches(searchable: string, value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || searchable.includes(normalized);
}

function matchesPolicyEntity(searchable: string, value: string, entityType: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return true;
  }

  const lower = normalized.toLowerCase();
  const entityUid = `${entityType}::"${normalized}"`.toLowerCase();
  return searchable.includes(lower) || searchable.includes(entityUid);
}
