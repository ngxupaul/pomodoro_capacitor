import React, { useEffect, useState } from 'react';
import { Card, Form, InputNumber, Switch, Button, Typography, Space, Select, Divider } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
import { usePomodoro } from '../hooks/usePomodoro';
import { PomodoroSettings } from '../types/pomodoro';

const { Title } = Typography;
const { Option } = Select;

export const Settings: React.FC = () => {
  const { settings, saveSettings } = usePomodoro();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue(settings);
  }, [form, settings]);

  const handleSave = async (values: PomodoroSettings) => {
    setLoading(true);
    try {
      const normalizedSettings: PomodoroSettings = {
        ...values,
        selectedSound: values.soundEnabled ? values.selectedSound : 'none'
      };
      await saveSettings(normalizedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const soundOptions = [
    { value: 'default', label: 'Default' },
    { value: 'bell', label: 'Bell' },
    { value: 'chime', label: 'Chime' },
    { value: 'ding', label: 'Ding' },
    { value: 'none', label: 'Silent' }
  ];

  return (
    <Card
      title={
        <Title level={3} style={{ margin: 0 }}>
          <SettingOutlined /> Settings
        </Title>
      }
      style={{ marginTop: 24 }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSave}
      >
        <Title level={4}>Timer Durations</Title>
        <Space direction="horizontal" size="large" wrap>
          <Form.Item
            label="Work Session (minutes)"
            name="workDuration"
            rules={[
              { required: true, message: 'Please enter work duration' },
              { type: 'number', min: 1, max: 90, message: 'Must be between 1-90 minutes' }
            ]}
          >
            <InputNumber
              min={1}
              max={90}
              style={{ width: 120 }}
            />
          </Form.Item>

          <Form.Item
            label="Short Break (minutes)"
            name="shortBreakDuration"
            rules={[
              { required: true, message: 'Please enter short break duration' },
              { type: 'number', min: 1, max: 30, message: 'Must be between 1-30 minutes' }
            ]}
          >
            <InputNumber
              min={1}
              max={30}
              style={{ width: 120 }}
            />
          </Form.Item>

          <Form.Item
            label="Long Break (minutes)"
            name="longBreakDuration"
            rules={[
              { required: true, message: 'Please enter long break duration' },
              { type: 'number', min: 5, max: 60, message: 'Must be between 5-60 minutes' }
            ]}
          >
            <InputNumber
              min={5}
              max={60}
              style={{ width: 120 }}
            />
          </Form.Item>

          <Form.Item
            label="Sessions until Long Break"
            name="sessionsUntilLongBreak"
            rules={[
              { required: true, message: 'Please enter sessions count' },
              { type: 'number', min: 2, max: 10, message: 'Must be between 2-10 sessions' }
            ]}
          >
            <InputNumber
              min={2}
              max={10}
              style={{ width: 120 }}
            />
          </Form.Item>
        </Space>

        <Divider />

        <Title level={4}>Notifications & Feedback</Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Form.Item
            label="Enable Sound Notifications"
            name="soundEnabled"
            valuePropName="checked"
          >
            <Switch
              onChange={(checked) => {
                if (!checked) {
                  form.setFieldsValue({ selectedSound: 'none' });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Notification Sound"
            name="selectedSound"
            dependencies={['soundEnabled']}
          >
            <Select
              style={{ width: 200 }}
              disabled={!form.getFieldValue('soundEnabled')}
            >
              {soundOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Enable Vibration (Mobile)"
            name="vibrationEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
          >
            Save Settings
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};


