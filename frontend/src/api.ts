export type PolicyType = 'ADMIN' | 'USER_DELEGATION' | 'FORBID' | 'LOW_RISK';
export type PolicyStatus = 'DRAFT' | 'ENABLED' | 'DISABLED';

export interface Policy {
  id: string;
  name: string;
  description: string;
  policyType: PolicyType;
  cedarText: string;
  status: PolicyStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRequest {
  name: string;
  description: string;
  policyType: PolicyType;
  cedarText: string;
}

export type Decision = 'ALLOW' | 'DENY';

export interface EvaluationRequest {
  principal: string;
  action: string;
  resource: string;
  context: Record<string, unknown>;
  entities: unknown[];
  policyIds: string[];
}

export interface EvaluationResponse {
  auditId: string;
  decision: Decision;
  principal: string;
  action: string;
  resource: string;
  matchedPolicies: string[];
  errors: string[];
  createdAt: string;
}

type FetchLike = typeof fetch;

export async function listPolicies(fetcher: FetchLike = fetch): Promise<Policy[]> {
  return request<Policy[]>(fetcher, '/api/policies');
}

export async function createPolicy(
  payload: PolicyRequest,
  fetcher: FetchLike = fetch,
): Promise<Policy> {
  return request<Policy>(fetcher, '/api/policies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getPolicy(id: string, fetcher: FetchLike = fetch): Promise<Policy> {
  return request<Policy>(fetcher, `/api/policies/${id}`);
}

export async function updatePolicy(
  id: string,
  payload: PolicyRequest,
  fetcher: FetchLike = fetch,
): Promise<Policy> {
  return request<Policy>(fetcher, `/api/policies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deletePolicy(id: string, fetcher: FetchLike = fetch): Promise<void> {
  const response = await fetcher(`/api/policies/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}

export async function enablePolicy(id: string, fetcher: FetchLike = fetch): Promise<Policy> {
  return request<Policy>(fetcher, `/api/policies/${id}/enable`, { method: 'POST' });
}

export async function evaluatePolicy(
  payload: EvaluationRequest,
  fetcher: FetchLike = fetch,
): Promise<EvaluationResponse> {
  return request<EvaluationResponse>(fetcher, '/api/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function request<T>(
  fetcher: FetchLike,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = init === undefined ? await fetcher(input) : await fetcher(input, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
