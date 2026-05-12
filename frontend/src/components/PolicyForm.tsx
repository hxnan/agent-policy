import { Button, Form, Input, Select, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import type { ReactNode } from 'react';
import type { PolicyRequest } from '../api';

export const defaultCedar = `permit(
  principal == User::"Alice",
  action == Action::"view",
  resource == Photo::"alice_photo"
);`;

interface PolicyFormProps {
  form: FormInstance<PolicyRequest>;
  onFinish: (values: PolicyRequest) => void;
  loading: boolean;
  submitText: string;
  extraAction?: ReactNode;
}

export function PolicyForm({ form, onFinish, loading, submitText, extraAction }: PolicyFormProps) {
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
