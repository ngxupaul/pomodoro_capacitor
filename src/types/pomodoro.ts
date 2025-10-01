export interface PomodoroSession {
  id: string;
  type: 'work' | 'break' | 'longBreak';
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  selectedSound: string;
}

export interface TimerState {
  timeLeft: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  currentSession: PomodoroSession | null;
  sessionsCompleted: number;
  sessionEndTimestamp: number | null; // unix ms timestamp when the active session should finish
}


