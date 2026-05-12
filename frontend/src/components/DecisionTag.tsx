import { CheckCircleOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import type { Decision } from '../api';

export function DecisionTag({ decision }: { decision: Decision }) {
  return (
    <Tag color={decision === 'ALLOW' ? 'green' : 'red'} icon={<CheckCircleOutlined />}>
      {decision}
    </Tag>
  );
}
