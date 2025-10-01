import React, { useState } from 'react';
import { Card, List, Typography, Tag, Button, Empty, Space } from 'antd';
import { DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { usePomodoro } from '../hooks/usePomodoro';
import { PomodoroSession } from '../types/pomodoro';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const SessionHistory: React.FC = () => {
  const { sessions, clearHistory } = usePomodoro();
  const [clearing, setClearing] = useState(false);

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await clearHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setClearing(false);
    }
  };

  const getSessionTypeColor = (type: string): string => {
    switch (type) {
      case 'work':
        return '#ff4d4f';
      case 'break':
        return '#52c41a';
      case 'longBreak':
        return '#1890ff';
      default:
        return '#d9d9d9';
    }
  };

  const getSessionTypeName = (type: string): string => {
    switch (type) {
      case 'work':
        return 'Work';
      case 'break':
        return 'Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (minutes: number): string => {
    return `${minutes}m`;
  };

  const getSessionStats = () => {
    const completedSessions = sessions.filter(s => s.completed);
    const workSessions = completedSessions.filter(s => s.type === 'work');
    const totalWorkTime = workSessions.reduce((acc, s) => acc + s.duration, 0);
    const totalBreakTime = completedSessions
      .filter(s => s.type === 'break' || s.type === 'longBreak')
      .reduce((acc, s) => acc + s.duration, 0);

    return {
      totalSessions: completedSessions.length,
      workSessions: workSessions.length,
      totalWorkTime,
      totalBreakTime
    };
  };

  const stats = getSessionStats();
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            <ClockCircleOutlined /> Session History
          </Title>
          {sessions.length > 0 && (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={clearing}
              onClick={handleClearHistory}
            >
              Clear History
            </Button>
          )}
        </div>
      }
      style={{ marginTop: 24 }}
    >
      {/* Statistics */}
      {stats.totalSessions > 0 && (
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
          <Space direction="horizontal" size="large" wrap>
            <Text><strong>Total Sessions:</strong> {stats.totalSessions}</Text>
            <Text><strong>Work Sessions:</strong> {stats.workSessions}</Text>
            <Text><strong>Work Time:</strong> {formatDuration(stats.totalWorkTime)}</Text>
            <Text><strong>Break Time:</strong> {formatDuration(stats.totalBreakTime)}</Text>
          </Space>
        </Card>
      )}

      {/* Session List */}
      {sortedSessions.length === 0 ? (
        <Empty 
          description="No sessions yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={sortedSessions}
          renderItem={(session: PomodoroSession) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Tag color={getSessionTypeColor(session.type)}>
                      {getSessionTypeName(session.type)}
                    </Tag>
                    <Text strong>{formatDuration(session.duration)}</Text>
                    {!session.completed && <Tag color="orange">Incomplete</Tag>}
                  </Space>
                  <Text type="secondary">
                    {dayjs(session.startTime).format('MMM DD, HH:mm')}
                  </Text>
                </div>
                {session.endTime && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Duration: {dayjs(session.endTime).diff(session.startTime, 'minute')}m
                    </Text>
                  </div>
                )}
              </div>
            </List.Item>
          )}
          pagination={sortedSessions.length > 10 ? { pageSize: 10, size: 'small' } : false}
        />
      )}
    </Card>
  );
};


