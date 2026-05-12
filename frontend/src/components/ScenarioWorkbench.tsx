import { useMemo, useState } from 'react';
import { Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  createPolicy,
  enablePolicy,
  evaluatePolicy,
  listPolicies,
  type Decision,
  type EvaluationRequest,
} from '../api';
import { scenarioDefinitions } from '../scenarios';
import { DecisionTag } from './DecisionTag';

const { Title, Text } = Typography;

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

interface ScenarioWorkbenchProps {
  onPoliciesChanged: () => Promise<void>;
}

export function ScenarioWorkbench({ onPoliciesChanged }: ScenarioWorkbenchProps) {
  const [seeding, setSeeding] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scenarioPolicyIds, setScenarioPolicyIds] = useState<ScenarioPolicyIds>({});
  const [caseResults, setCaseResults] = useState<ScenarioCaseResult[]>([]);
  const [selectedCase, setSelectedCase] = useState<ScenarioCaseResult | null>(null);

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
        render: (decision: Decision) => <DecisionTag decision={decision} />,
      },
      {
        title: '实际',
        dataIndex: 'actualDecision',
        key: 'actualDecision',
        width: 110,
        render: (decision?: Decision) => (decision ? <DecisionTag decision={decision} /> : '-'),
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
    await onPoliciesChanged();
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

  return (
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
    </section>
  );
}

function hasScenarioPolicyIds(idsByScenario: ScenarioPolicyIds): boolean {
  return scenarioDefinitions.every((scenario) => idsByScenario[scenario.scenarioId]?.length > 0);
}
