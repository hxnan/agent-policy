import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as api from './api';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  const policyFixture: api.Policy = {
    id: 'p1',
    name: 'Allow Alice',
    description: 'Simple policy',
    policyType: 'ADMIN',
    cedarText: 'permit(principal, action, resource);',
    status: 'ENABLED',
    version: 1,
    createdAt: '2026-05-11T00:00:00Z',
    updatedAt: '2026-05-11T00:00:00Z',
  };

  it('renders policy list and opens creation form', async () => {
    vi.spyOn(api, 'listPolicies').mockResolvedValue([policyFixture]);

    render(<App />);

    expect(await screen.findByText('Allow Alice')).toBeInTheDocument();
    expect(screen.getByText('ENABLED')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '新建策略' }));

    await waitFor(() => {
      expect(screen.getByLabelText('策略名称')).toBeInTheDocument();
    });
  }, 70000);

  it('views, edits and deletes a policy', async () => {
    vi.spyOn(api, 'listPolicies').mockResolvedValue([policyFixture]);
    const getPolicy = vi.spyOn(api, 'getPolicy').mockResolvedValue(policyFixture);
    const updatePolicy = vi.spyOn(api, 'updatePolicy').mockResolvedValue({
      ...policyFixture,
      name: 'Updated Alice policy',
    });
    const deletePolicy = vi.spyOn(api, 'deletePolicy').mockResolvedValue();

    render(<App />);

    expect(await screen.findByText('Allow Alice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看 Allow Alice' }));

    await waitFor(() => {
      expect(getPolicy).toHaveBeenCalledWith('p1');
      expect(screen.getByText('策略详情')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Allow Alice')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('策略名称'), {
      target: { value: 'Updated Alice policy' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }));

    await waitFor(() => {
      expect(updatePolicy).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 'Updated Alice policy' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '删除策略' }));

    await waitFor(() => {
      expect(deletePolicy).toHaveBeenCalledWith('p1');
    });
  }, 70000);

  it('creates preset scenario policies and runs scenario cases', async () => {
    vi.spyOn(api, 'listPolicies').mockResolvedValue([]);
    const createPolicy = vi.spyOn(api, 'createPolicy').mockImplementation(async (payload) => ({
      id: `${payload.policyType}-${payload.name}`,
      name: payload.name,
      description: payload.description,
      policyType: payload.policyType,
      cedarText: payload.cedarText,
      status: 'DRAFT',
      version: 1,
      createdAt: '2026-05-11T00:00:00Z',
      updatedAt: '2026-05-11T00:00:00Z',
    }));
    const enablePolicy = vi.spyOn(api, 'enablePolicy').mockImplementation(async (id) => ({
      id,
      name: id,
      description: '',
      policyType: 'ADMIN',
      cedarText: 'permit(principal, action, resource);',
      status: 'ENABLED',
      version: 1,
      createdAt: '2026-05-11T00:00:00Z',
      updatedAt: '2026-05-11T00:00:00Z',
    }));
    const evaluatePolicy = vi.spyOn(api, 'evaluatePolicy').mockImplementation(async (request) => ({
      auditId: `${request.principal}-${request.resource}`,
      decision: request.principal.includes('Bob') ? 'DENY' : 'ALLOW',
      principal: request.principal,
      action: request.action,
      resource: request.resource,
      matchedPolicies: request.principal.includes('Bob') ? [] : ['policy0'],
      errors: [],
      createdAt: '2026-05-11T00:00:00Z',
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '一键预置关键场景' }));

    await waitFor(() => {
      expect(createPolicy).toHaveBeenCalled();
      expect(enablePolicy).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: '运行用例验证' }));

    await waitFor(() => {
      expect(evaluatePolicy).toHaveBeenCalled();
      expect(screen.getAllByText('ALLOW').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DENY').length).toBeGreaterThan(0);
      expect(screen.getAllByText('查看参数').length).toBeGreaterThan(0);
    });
  }, 70000);
});
