import { useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  evaluatePolicy,
  listPolicies,
  type EvaluationRequest,
  type EvaluationResponse,
  type Policy,
  type PolicyStatus,
  type PolicyType,
} from '../api';
import { DecisionTag } from '../components/DecisionTag';
import { filterPoliciesForPlayground, type PlaygroundPolicyFilters } from '../playground';

const { Title, Text } = Typography;

interface PlaygroundFormValues {
  principal: string;
  action: string;
  resource: string;
  contextJson: string;
  entitiesJson: string;
}

const defaultFormValues: PlaygroundFormValues = {
  principal: 'AgentSession::"alice_agent_a"',
  action: 'Action::"invoke"',
  resource: 'McpTool::"tool_1"',
  contextJson: '{}',
  entitiesJson: '[]',
};

export function PolicyPlaygroundPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<Key[]>([]);
  const [filters, setFilters] = useState<PlaygroundPolicyFilters>({
    keyword: '',
    status: 'ENABLED',
    policyType: undefined,
    user: '',
    agent: '',
  });
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<EvaluationRequest | null>(null);
  const [form] = Form.useForm<PlaygroundFormValues>();

  const filteredPolicies = useMemo(
    () => filterPoliciesForPlayground(policies, filters),
    [filters, policies],
  );

  const columns = useMemo<ColumnsType<Policy>>(
    () => [
      {
        title: '策略名称',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record) => (
          <Space orientation="vertical" size={2}>
            <Text strong>{value}</Text>
            <Text type="secondary">{record.description || '无描述'}</Text>
          </Space>
        ),
      },
      {
        title: '类型',
        dataIndex: 'policyType',
        key: 'policyType',
        width: 150,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: PolicyStatus) => (
          <Tag color={status === 'ENABLED' ? 'green' : status === 'DISABLED' ? 'red' : 'blue'}>
            {status}
          </Tag>
        ),
      },
    ],
    [],
  );

  async function refresh() {
    setLoading(true);
    try {
      const nextPolicies = await listPolicies();
      setPolicies(nextPolicies);
      setSelectedPolicyIds((ids) =>
        ids.filter((id) => nextPolicies.some((policy) => policy.id === id)),
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  function selectFilteredPolicies() {
    setSelectedPolicyIds(filteredPolicies.map((policy) => policy.id));
  }

  function selectAllEnabledPolicies() {
    setFilters((current) => ({ ...current, status: 'ENABLED' }));
    setSelectedPolicyIds(policies.filter((policy) => policy.status === 'ENABLED').map((policy) => policy.id));
  }

  async function runEvaluation(values: PlaygroundFormValues) {
    if (selectedPolicyIds.length === 0) {
      message.warning('请先选择至少一条策略');
      return;
    }

    setEvaluating(true);
    try {
      const request: EvaluationRequest = {
        principal: values.principal,
        action: values.action,
        resource: values.resource,
        context: parseJsonObject(values.contextJson, 'context'),
        entities: parseJsonArray(values.entitiesJson, 'entities'),
        policyIds: selectedPolicyIds.map(String),
      };
      const response = await evaluatePolicy(request);
      setLastRequest(request);
      setResult(response);
      message.success('策略判断完成');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略判断失败');
    } finally {
      setEvaluating(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="playground-page">
      <div className="section-heading">
        <div>
          <Title level={4}>策略 Playground</Title>
          <Text type="secondary">按条件筛选并多选策略，输入授权请求后执行 Cedar 判断。</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          刷新策略
        </Button>
      </div>

      <div className="playground-grid">
        <section className="playground-panel">
          <Title level={5}>策略选择</Title>
          <Space direction="vertical" className="full-width" size="middle">
            <Input
              placeholder="搜索策略名称、描述或 Cedar 文本"
              value={filters.keyword}
              onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
            />
            <Space wrap>
              <Select
                allowClear
                placeholder="策略类型"
                className="filter-select"
                value={filters.policyType}
                onChange={(value?: PolicyType) => setFilters({ ...filters, policyType: value })}
                options={[
                  { label: '管理员授权', value: 'ADMIN' },
                  { label: '用户委托', value: 'USER_DELEGATION' },
                  { label: '拒绝策略', value: 'FORBID' },
                  { label: '低风险场景', value: 'LOW_RISK' },
                ]}
              />
              <Select
                allowClear
                placeholder="策略状态"
                className="filter-select"
                value={filters.status}
                onChange={(value?: PolicyStatus) => setFilters({ ...filters, status: value })}
                options={[
                  { label: 'ENABLED', value: 'ENABLED' },
                  { label: 'DRAFT', value: 'DRAFT' },
                  { label: 'DISABLED', value: 'DISABLED' },
                ]}
              />
            </Space>
            <Space wrap>
              <Input
                placeholder="用户，例如 Alice"
                value={filters.user}
                onChange={(event) => setFilters({ ...filters, user: event.target.value })}
              />
              <Input
                placeholder="Agent，例如 Agent_A"
                value={filters.agent}
                onChange={(event) => setFilters({ ...filters, agent: event.target.value })}
              />
            </Space>
            <Space wrap>
              <Button onClick={selectAllEnabledPolicies}>选中所有已启用策略</Button>
              <Button onClick={selectFilteredPolicies}>选中当前筛选结果</Button>
              <Button onClick={() => setSelectedPolicyIds([])}>清空选择</Button>
            </Space>
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={filteredPolicies}
              pagination={{ pageSize: 6 }}
              rowSelection={{
                selectedRowKeys: selectedPolicyIds,
                onChange: setSelectedPolicyIds,
              }}
            />
          </Space>
        </section>

        <section className="playground-panel">
          <Title level={5}>验证用例</Title>
          <Form
            form={form}
            layout="vertical"
            initialValues={defaultFormValues}
            onFinish={runEvaluation}
          >
            <Form.Item
              label="principal"
              name="principal"
              rules={[{ required: true, message: '请输入 principal' }]}
            >
              <Input className="code-input" />
            </Form.Item>
            <Form.Item
              label="action"
              name="action"
              rules={[{ required: true, message: '请输入 action' }]}
            >
              <Input className="code-input" />
            </Form.Item>
            <Form.Item
              label="resource"
              name="resource"
              rules={[{ required: true, message: '请输入 resource' }]}
            >
              <Input className="code-input" />
            </Form.Item>
            <Form.Item label="context JSON" name="contextJson">
              <Input.TextArea rows={4} className="code-textarea" />
            </Form.Item>
            <Form.Item label="entities JSON" name="entitiesJson">
              <Input.TextArea rows={5} className="code-textarea" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlayCircleOutlined />}
              loading={evaluating}
            >
              执行判断
            </Button>
          </Form>

          {result && (
            <div className="evaluation-result">
              <Title level={5}>判断结果</Title>
              <Space direction="vertical" className="full-width">
                <Space>
                  <Text>决策</Text>
                  <DecisionTag decision={result.decision} />
                </Space>
                <Text>命中策略：{result.matchedPolicies.join(', ') || '无'}</Text>
                <Text type={result.errors.length > 0 ? 'danger' : 'secondary'}>
                  错误信息：{result.errors.join('; ') || '无'}
                </Text>
                <pre className="json-preview">{JSON.stringify(lastRequest, null, 2)}</pre>
              </Space>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function parseJsonObject(value: string, fieldName: string): Record<string, unknown> {
  const parsed = JSON.parse(value || '{}') as unknown;
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${fieldName} 必须是 JSON 对象`);
  }
  return parsed as Record<string, unknown>;
}

function parseJsonArray(value: string, fieldName: string): unknown[] {
  const parsed = JSON.parse(value || '[]') as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldName} 必须是 JSON 数组`);
  }
  return parsed;
}
