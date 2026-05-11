import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  ConfigProvider,
  Drawer,
  Form,
  Input,
  Layout,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  theme,
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  createPolicy,
  deletePolicy,
  enablePolicy,
  evaluatePolicy,
  getPolicy,
  listPolicies,
  updatePolicy,
  type Decision,
  type EvaluationRequest,
  type Policy,
  type PolicyRequest,
} from './api';
import { scenarioDefinitions } from './scenarios';
import './styles.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const defaultCedar = `permit(
  principal == User::"Alice",
  action == Action::"view",
  resource == Photo::"alice_photo"
);`;

interface ScenarioCaseResult {
  key: string;
  scenarioTitle: string;
  caseName: string;
  expectedDecision: Decision;
  actualDecision?: Decision;
  passed: boolean;
  errors: string[];
  request: EvaluationRequest;
}

type ScenarioPolicyIds = Record<string, string[]>;

function App() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [selectedCase, setSelectedCase] = useState<ScenarioCaseResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scenarioPolicyIds, setScenarioPolicyIds] = useState<ScenarioPolicyIds>({});
  const [caseResults, setCaseResults] = useState<ScenarioCaseResult[]>([]);
  const [form] = Form.useForm<PolicyRequest>();
  const [detailForm] = Form.useForm<PolicyRequest>();

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
        width: 130,
        render: (status: Policy['status']) => (
          <Tag color={status === 'ENABLED' ? 'green' : status === 'DISABLED' ? 'red' : 'blue'}>
            {status}
          </Tag>
        ),
      },
      {
        title: '版本',
        dataIndex: 'version',
        key: 'version',
        width: 90,
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button
            size="small"
            icon={<EyeOutlined />}
            aria-label={`查看 ${record.name}`}
            onClick={() => openPolicyDetail(record.id)}
          >
            查看
          </Button>
        ),
      },
    ],
    [],
  );

  const caseResultColumns = useMemo<ColumnsType<ScenarioCaseResult>>(
    () => [
      {
        title: '场景',
        dataIndex: 'scenarioTitle',
        key: 'scenarioTitle',
        width: 180,
      },
      {
        title: '用例',
        dataIndex: 'caseName',
        key: 'caseName',
      },
      {
        title: '期望',
        dataIndex: 'expectedDecision',
        key: 'expectedDecision',
        width: 110,
        render: renderDecision,
      },
      {
        title: '实际',
        dataIndex: 'actualDecision',
        key: 'actualDecision',
        width: 110,
        render: (decision?: Decision) => (decision ? renderDecision(decision) : '-'),
      },
      {
        title: '参数',
        key: 'request',
        width: 120,
        render: (_, record) => (
          <Button size="small" onClick={() => setSelectedCase(record)}>
            查看参数
          </Button>
        ),
      },
      {
        title: '结果',
        dataIndex: 'passed',
        key: 'passed',
        width: 100,
        render: (passed: boolean) => (
          <Tag color={passed ? 'green' : 'red'}>{passed ? 'PASS' : 'FAIL'}</Tag>
        ),
      },
    ],
    [],
  );

  async function refresh() {
    setLoading(true);
    try {
      setPolicies(await listPolicies());
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(values: PolicyRequest) {
    setSaving(true);
    try {
      await createPolicy(values);
      message.success('策略已创建');
      setDrawerOpen(false);
      form.resetFields();
      await refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略创建失败');
    } finally {
      setSaving(false);
    }
  }

  async function openPolicyDetail(id: string) {
    try {
      const policy = await getPolicy(id);
      setSelectedPolicy(policy);
      detailForm.setFieldsValue(toPolicyRequest(policy));
      setDetailOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略详情加载失败');
    }
  }

  async function handleUpdate(values: PolicyRequest) {
    if (!selectedPolicy) {
      return;
    }
    setDetailSaving(true);
    try {
      const policy = await updatePolicy(selectedPolicy.id, values);
      setSelectedPolicy(policy);
      detailForm.setFieldsValue(toPolicyRequest(policy));
      message.success('策略已更新');
      await refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略更新失败');
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedPolicy) {
      return;
    }
    setDeleting(true);
    try {
      await deletePolicy(selectedPolicy.id);
      message.success('策略已删除');
      setDetailOpen(false);
      setSelectedPolicy(null);
      await refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '策略删除失败');
    } finally {
      setDeleting(false);
    }
  }

  async function seedScenarioPolicies() {
    setSeeding(true);
    try {
      const idsByScenario = await ensureScenarioPolicies();
      const policyCount = Object.values(idsByScenario).reduce((sum, ids) => sum + ids.length, 0);
      message.success(`关键场景策略已预置：${policyCount} 条`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '预置关键场景失败');
    } finally {
      setSeeding(false);
    }
  }

  async function ensureScenarioPolicies(): Promise<ScenarioPolicyIds> {
    const existingPolicies = await listPolicies();
    const idsByScenario: ScenarioPolicyIds = {};
    const knownPolicies = [...existingPolicies];

    for (const scenario of scenarioDefinitions) {
      idsByScenario[scenario.scenarioId] = [];

      for (const template of scenario.policies) {
        let policy = knownPolicies.find((item) => item.name === template.name);
        if (!policy) {
          policy = await createPolicy(template);
          knownPolicies.push(policy);
        }
        if (policy.status !== 'ENABLED') {
          policy = await enablePolicy(policy.id);
        }
        idsByScenario[scenario.scenarioId].push(policy.id);
      }
    }

    setScenarioPolicyIds(idsByScenario);
    await refresh();
    return idsByScenario;
  }

  async function runScenarioCases() {
    setVerifying(true);
    try {
      const idsByScenario = hasScenarioPolicyIds(scenarioPolicyIds)
        ? scenarioPolicyIds
        : await ensureScenarioPolicies();
      const results: ScenarioCaseResult[] = [];

      for (const scenario of scenarioDefinitions) {
        const policyIds = idsByScenario[scenario.scenarioId] ?? [];
        for (const scenarioCase of scenario.cases) {
          const request = {
            ...scenarioCase.request,
            policyIds,
          };
          try {
            const response = await evaluatePolicy(request);
            results.push({
              key: `${scenario.scenarioId}-${scenarioCase.caseId}`,
              scenarioTitle: scenario.title,
              caseName: scenarioCase.name,
              expectedDecision: scenarioCase.expectedDecision,
              actualDecision: response.decision,
              passed: response.decision === scenarioCase.expectedDecision,
              errors: response.errors,
              request,
            });
          } catch (error) {
            results.push({
              key: `${scenario.scenarioId}-${scenarioCase.caseId}`,
              scenarioTitle: scenario.title,
              caseName: scenarioCase.name,
              expectedDecision: scenarioCase.expectedDecision,
              passed: false,
              errors: [error instanceof Error ? error.message : '用例执行失败'],
              request,
            });
          }
        }
      }

      setCaseResults(results);
      const failedCount = results.filter((result) => !result.passed).length;
      if (failedCount > 0) {
        message.warning(`用例验证完成，失败 ${failedCount} 条`);
      } else {
        message.success('全部用例验证通过');
      }
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
          colorPrimary: '#176b87',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <Layout className="app-shell">
        <Header className="app-header">
          <div>
            <Title level={3} className="app-title">
              Agent Policy Center
            </Title>
            <Text className="app-subtitle">策略管理与 Cedar 授权判断</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              aria-label="新建策略"
              onClick={() => setDrawerOpen(true)}
            >
              新建策略
            </Button>
          </Space>
        </Header>

        <Content className="app-content">
          <section className="scenario-workbench">
            <div className="section-heading">
              <div>
                <Title level={4}>关键场景验证</Title>
                <Text type="secondary">预置策略模板和正反用例，快速验证 Agent 授权链路。</Text>
              </div>
              <Space wrap>
                <Button
                  icon={<ThunderboltOutlined />}
                  aria-label="一键预置关键场景"
                  loading={seeding}
                  onClick={seedScenarioPolicies}
                >
                  一键预置关键场景
                </Button>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  aria-label="运行用例验证"
                  loading={verifying}
                  onClick={runScenarioCases}
                >
                  运行用例验证
                </Button>
              </Space>
            </div>

            <div className="scenario-list">
              {scenarioDefinitions.map((scenario) => (
                <article className="scenario-item" key={scenario.scenarioId}>
                  <div>
                    <Text strong>{scenario.title}</Text>
                    <Text type="secondary">{scenario.description}</Text>
                  </div>
                  <Space size={4} wrap>
                    <Tag>{scenario.policies.length} 条策略</Tag>
                    <Tag>{scenario.cases.length} 个用例</Tag>
                  </Space>
                </article>
              ))}
            </div>

            {caseResults.length > 0 && (
              <Table
                className="case-result-table"
                rowKey="key"
                columns={caseResultColumns}
                dataSource={caseResults}
                pagination={false}
                expandable={{
                  expandedRowRender: (record) =>
                    record.errors.length > 0 ? (
                      <Text type="danger">{record.errors.join('; ')}</Text>
                    ) : (
                      <Text type="secondary">无错误</Text>
                    ),
                }}
              />
            )}
          </section>

          <section className="policy-section">
            <div className="section-heading compact">
              <Title level={4}>策略列表</Title>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={policies}
              pagination={{ pageSize: 8 }}
            />
          </section>
        </Content>
      </Layout>

      <Drawer
        title="新建策略"
        size="large"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <PolicyForm form={form} onFinish={handleCreate} loading={saving} submitText="保存" />
      </Drawer>

      <Drawer
        title="策略详情"
        size="large"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        destroyOnClose
      >
        {selectedPolicy && (
          <>
            <Space className="detail-meta" wrap>
              <Tag color={selectedPolicy.status === 'ENABLED' ? 'green' : 'blue'}>
                {selectedPolicy.status}
              </Tag>
              <Text type="secondary">版本 {selectedPolicy.version}</Text>
              <Text type="secondary">ID {selectedPolicy.id}</Text>
            </Space>
            <PolicyForm
              form={detailForm}
              onFinish={handleUpdate}
              loading={detailSaving}
              submitText="保存修改"
              extraAction={
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  aria-label="删除策略"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  删除策略
                </Button>
              }
            />
          </>
        )}
      </Drawer>

      <Modal
        title="用例参数详情"
        open={selectedCase !== null}
        onCancel={() => setSelectedCase(null)}
        footer={null}
        width={720}
      >
        <pre className="json-preview">
          {selectedCase ? JSON.stringify(selectedCase.request, null, 2) : ''}
        </pre>
      </Modal>
    </ConfigProvider>
  );
}

interface PolicyFormProps {
  form: ReturnType<typeof Form.useForm<PolicyRequest>>[0];
  onFinish: (values: PolicyRequest) => void;
  loading: boolean;
  submitText: string;
  extraAction?: React.ReactNode;
}

function PolicyForm({ form, onFinish, loading, submitText, extraAction }: PolicyFormProps) {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        policyType: 'ADMIN',
        description: '',
        cedarText: defaultCedar,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        label="策略名称"
        name="name"
        rules={[{ required: true, message: '请输入策略名称' }]}
      >
        <Input placeholder="例如：允许 Alice 查看照片" />
      </Form.Item>

      <Form.Item label="描述" name="description">
        <Input.TextArea rows={2} placeholder="简要说明策略用途" />
      </Form.Item>

      <Form.Item
        label="策略类型"
        name="policyType"
        rules={[{ required: true, message: '请选择策略类型' }]}
      >
        <Select
          options={[
            { label: '管理员授权', value: 'ADMIN' },
            { label: '用户委托', value: 'USER_DELEGATION' },
            { label: '拒绝策略', value: 'FORBID' },
            { label: '低风险场景', value: 'LOW_RISK' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Cedar 策略"
        name="cedarText"
        rules={[{ required: true, message: '请输入 Cedar 策略' }]}
      >
        <Input.TextArea rows={10} className="code-textarea" />
      </Form.Item>

      <Space className="drawer-actions">
        {extraAction}
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          aria-label={submitText}
          loading={loading}
        >
          {submitText}
        </Button>
      </Space>
    </Form>
  );
}

function hasScenarioPolicyIds(idsByScenario: ScenarioPolicyIds): boolean {
  return scenarioDefinitions.every((scenario) => idsByScenario[scenario.scenarioId]?.length > 0);
}

function toPolicyRequest(policy: Policy): PolicyRequest {
  return {
    name: policy.name,
    description: policy.description,
    policyType: policy.policyType,
    cedarText: policy.cedarText,
  };
}

function renderDecision(decision: Decision) {
  return (
    <Tag color={decision === 'ALLOW' ? 'green' : 'red'} icon={<CheckCircleOutlined />}>
      {decision}
    </Tag>
  );
}

export default App;
