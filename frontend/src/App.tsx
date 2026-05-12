import { ConfigProvider, Layout, Tabs, Typography, theme } from 'antd';
import { ExperimentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PolicyManagementPage } from './pages/PolicyManagementPage';
import { PolicyPlaygroundPage } from './pages/PolicyPlaygroundPage';
import './styles.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function App() {
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
        </Header>

        <Content className="app-content">
          <Tabs
            defaultActiveKey="policies"
            items={[
              {
                key: 'policies',
                label: (
                  <span>
                    <SafetyCertificateOutlined /> 策略管理
                  </span>
                ),
                children: <PolicyManagementPage />,
              },
              {
                key: 'playground',
                label: (
                  <span>
                    <ExperimentOutlined /> 策略 Playground
                  </span>
                ),
                children: <PolicyPlaygroundPage />,
              },
            ]}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
