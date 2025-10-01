import React, { useState } from 'react';
import { Layout, Menu, Typography, Space } from 'antd';
import { ClockCircleOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import { PomodoroTimer } from './components/PomodoroTimer';
import { SessionHistory } from './components/SessionHistory';
import { Settings } from './components/Settings';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

type TabKey = 'timer' | 'history' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('timer');

  const menuItems = [
    {
      key: 'timer',
      icon: <ClockCircleOutlined />,
      label: 'Timer',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'History',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'timer':
        return <PomodoroTimer />;
      case 'history':
        return <SessionHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <PomodoroTimer />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header style={{ 
        backgroundColor: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '0 24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '100%'
        }}>
          <Space>
            <ClockCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              Pomodoro Timer
            </Title>
          </Space>
          <Menu
            mode="horizontal"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => setActiveTab(key as TabKey)}
            style={{ 
              border: 'none',
              backgroundColor: 'transparent',
              minWidth: 300
            }}
          />
        </div>
      </Header>
      <Content style={{ 
        padding: '24px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%'
      }}>
        {renderContent()}
      </Content>
    </Layout>
  );
}

export default App;
