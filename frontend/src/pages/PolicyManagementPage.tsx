import { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Form, Space, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  createPolicy,
  deletePolicy,
  getPolicy,
  listPolicies,
  updatePolicy,
  type Policy,
  type PolicyRequest,
} from '../api';
import { PolicyForm } from '../components/PolicyForm';
import { ScenarioWorkbench } from '../components/ScenarioWorkbench';

const { Title, Text } = Typography;

export function PolicyManagementPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <>
      <ScenarioWorkbench onPoliciesChanged={refresh} />

      <section className="policy-section">
        <div className="section-heading compact">
          <Title level={4}>策略列表</Title>
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
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={policies}
          pagination={{ pageSize: 8 }}
        />
      </section>

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
    </>
  );
}

function toPolicyRequest(policy: Policy): PolicyRequest {
  return {
    name: policy.name,
    description: policy.description,
    policyType: policy.policyType,
    cedarText: policy.cedarText,
  };
}
