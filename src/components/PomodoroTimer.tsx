import React from 'react';
import { Card, Button, Progress, Typography, Space, Row, Col, Tag } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePomodoro } from '../hooks/usePomodoro';

const { Title, Text } = Typography;

export const PomodoroTimer: React.FC = () => {
  const {
    timerState,
    settings,
    startSession,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer
  } = usePomodoro();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = (): number => {
    if (!timerState.currentSession) return 0;
    const totalSeconds = timerState.currentSession.duration * 60;
    const elapsedSeconds = totalSeconds - timerState.timeLeft;
    return (elapsedSeconds / totalSeconds) * 100;
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
        return 'Work Session';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Ready to Start';
    }
  };

  const handleStartStop = () => {
    if (timerState.isRunning) {
      pauseTimer();
    } else if (timerState.isPaused) {
      resumeTimer();
    } else {
      startSession();
    }
  };

  return (
    <Card
      style={{
        maxWidth: 500,
        margin: '0 auto',
        textAlign: 'center',
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Session Type Indicator */}
        <div>
          <Tag
            color={getSessionTypeColor(timerState.currentSession?.type || 'work')}
            style={{ fontSize: '16px', padding: '8px 16px', borderRadius: '20px' }}
          >
            {getSessionTypeName(timerState.currentSession?.type || 'work')}
          </Tag>
        </div>

        {/* Timer Display */}
        <div>
          <Title level={1} style={{ fontSize: '4rem', margin: 0, fontWeight: 300 }}>
            {formatTime(timerState.timeLeft)}
          </Title>
        </div>

        {/* Progress Circle */}
        <Progress
          type="circle"
          percent={getProgressPercent()}
          size={200}
          strokeColor={getSessionTypeColor(timerState.currentSession?.type || 'work')}
          strokeWidth={8}
          showInfo={false}
        />

        {/* Session Counter */}
        <div>
          <Text style={{ fontSize: '18px' }}>
            Sessions Completed: <strong>{timerState.sessionsCompleted}</strong>
          </Text>
        </div>

        {/* Control Buttons */}
        <Row gutter={16} justify="center">
          <Col>
            <Button
              type="primary"
              size="large"
              icon={
                timerState.isRunning ? (
                  <PauseCircleOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              onClick={handleStartStop}
              style={{
                borderRadius: 8,
                height: 48,
                fontSize: '16px',
                minWidth: 120,
                backgroundColor: getSessionTypeColor(timerState.currentSession?.type || 'work'),
                borderColor: getSessionTypeColor(timerState.currentSession?.type || 'work')
              }}
            >
              {timerState.isRunning ? 'Pause' : timerState.isPaused ? 'Resume' : 'Start'}
            </Button>
          </Col>
          <Col>
            <Button
              size="large"
              icon={<StopOutlined />}
              onClick={stopTimer}
              disabled={!timerState.isRunning && !timerState.isPaused}
              style={{ borderRadius: 8, height: 48, fontSize: '16px', minWidth: 80 }}
            >
              Stop
            </Button>
          </Col>
          <Col>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={resetTimer}
              disabled={timerState.isRunning}
              style={{ borderRadius: 8, height: 48, fontSize: '16px', minWidth: 80 }}
            >
              Reset
            </Button>
          </Col>
        </Row>

        {/* Quick Start Buttons */}
        <Row gutter={8} justify="center">
          <Col>
            <Button 
              size="small" 
              onClick={() => startSession('work')}
              disabled={timerState.isRunning}
              style={{ borderRadius: 20 }}
            >
              Work ({settings.workDuration}m)
            </Button>
          </Col>
          <Col>
            <Button 
              size="small" 
              onClick={() => startSession('break')}
              disabled={timerState.isRunning}
              style={{ borderRadius: 20 }}
            >
              Short Break ({settings.shortBreakDuration}m)
            </Button>
          </Col>
          <Col>
            <Button 
              size="small" 
              onClick={() => startSession('longBreak')}
              disabled={timerState.isRunning}
              style={{ borderRadius: 20 }}
            >
              Long Break ({settings.longBreakDuration}m)
            </Button>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};


