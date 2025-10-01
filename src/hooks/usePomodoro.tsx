import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { Dialog } from '@capacitor/dialog';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { PomodoroSession, PomodoroSettings, TimerState } from '../types/pomodoro';

interface PomodoroContextValue {
  settings: PomodoroSettings;
  timerState: TimerState;
  sessions: PomodoroSession[];
  saveSettings: (newSettings: PomodoroSettings) => Promise<void>;
  startSession: (sessionType?: 'work' | 'break' | 'longBreak') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  clearHistory: () => Promise<void>;
}

interface StoredPomodoroSession {
  id: string;
  type: 'work' | 'break' | 'longBreak';
  duration: number;
  startTime: string;
  endTime?: string;
  completed: boolean;
}

interface StoredTimerState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionsCompleted: number;
  sessionEndTimestamp: number | null;
  currentSession: StoredPomodoroSession | null;
}

const PomodoroContext = createContext<PomodoroContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  soundEnabled: true,
  vibrationEnabled: true,
  selectedSound: 'default'
};

const SETTINGS_STORAGE_KEY = 'pomodoroSettings';
const SESSIONS_STORAGE_KEY = 'pomodoroSessions';
const ACTIVE_SESSION_STORAGE_KEY = 'pomodoroActiveSession';

const serializeSession = (session: PomodoroSession): StoredPomodoroSession => ({
  ...session,
  startTime: session.startTime.toISOString(),
  endTime: session.endTime ? session.endTime.toISOString() : undefined
});

const deserializeSession = (session: StoredPomodoroSession): PomodoroSession => ({
  ...session,
  startTime: new Date(session.startTime),
  endTime: session.endTime ? new Date(session.endTime) : undefined
});

const buildCompletionNotification = (
  currentType: 'work' | 'break' | 'longBreak',
  nextType: 'work' | 'break' | 'longBreak',
  nextDuration: number
) => {
  if (currentType === 'work') {
    const breakLabel = nextType === 'longBreak' ? 'long break' : 'short break';
    return {
      title: 'Work Session Complete!',
      body: `Great job! Time for a ${breakLabel} (${nextDuration} min).`
    };
  }

  return {
    title: 'Break Finished!',
    body: `Break's over! Ready for a ${nextDuration} min work session?`
  };
};

const usePomodoroController = (): PomodoroContextValue => {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: DEFAULT_SETTINGS.workDuration * 60,
    isRunning: false,
    isPaused: false,
    currentSession: null,
    sessionsCompleted: 0,
    sessionEndTimestamp: null
  });
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeNotificationIdRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const saveSessions = useCallback(async (sessionsToSave: PomodoroSession[]) => {
    try {
      await Preferences.set({
        key: SESSIONS_STORAGE_KEY,
        value: JSON.stringify(sessionsToSave.map(serializeSession))
      });
      // Note: Don't call setSessions here as it's handled by the caller
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: SETTINGS_STORAGE_KEY });
      if (value) {
        const savedSettings = JSON.parse(value);
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: SESSIONS_STORAGE_KEY });
      if (value) {
        const savedSessions: StoredPomodoroSession[] = JSON.parse(value);
        setSessions(savedSessions.map(deserializeSession));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: PomodoroSettings) => {
    try {
      await Preferences.set({
        key: SETTINGS_STORAGE_KEY,
        value: JSON.stringify(newSettings)
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const persistActiveTimerState = useCallback(async (state: TimerState) => {
    try {
      if (state.currentSession) {
        const payload: StoredTimerState = {
          timeLeft: state.timeLeft,
          isRunning: state.isRunning,
          isPaused: state.isPaused,
          sessionsCompleted: state.sessionsCompleted,
          sessionEndTimestamp: state.sessionEndTimestamp,
          currentSession: serializeSession(state.currentSession)
        };
        await Preferences.set({
          key: ACTIVE_SESSION_STORAGE_KEY,
          value: JSON.stringify(payload)
        });
      } else {
        await Preferences.remove({ key: ACTIVE_SESSION_STORAGE_KEY });
      }
    } catch (error) {
      console.error('Error persisting active session:', error);
    }
  }, []);

  const requestNotificationPermissions = useCallback(async () => {
    try {
      await LocalNotifications.requestPermissions();
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }, []);

  const determineNextSessionType = useCallback((currentType?: 'work' | 'break' | 'longBreak' | null) => {
    if (currentType === 'work') {
      const completedWorkSessions = sessions.filter(s => s.type === 'work' && s.completed).length + 1;
      return completedWorkSessions % settings.sessionsUntilLongBreak === 0 ? 'longBreak' : 'break';
    }
    return 'work';
  }, [sessions, settings.sessionsUntilLongBreak]);

  const getDurationForSessionType = useCallback((type: 'work' | 'break' | 'longBreak'): number => {
    switch (type) {
      case 'work':
        return settings.workDuration;
      case 'break':
        return settings.shortBreakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return settings.workDuration;
    }
  }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const resolveNotificationSound = useCallback(() => {
    if (!settings.soundEnabled || settings.selectedSound === 'none') {
      return undefined;
    }
    return settings.selectedSound || 'default';
  }, [settings.soundEnabled, settings.selectedSound]);

  const cancelActiveNotification = useCallback(async () => {
    if (activeNotificationIdRef.current === null) {
      return;
    }
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: activeNotificationIdRef.current }]
      });
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
    activeNotificationIdRef.current = null;
  }, []);

  const scheduleSessionNotification = useCallback(async (session: PomodoroSession, endTimestamp: number) => {
    try {
      await cancelActiveNotification();
      const id = Math.floor(endTimestamp / 1000);
      const nextType = determineNextSessionType(session.type);
      const nextDuration = getDurationForSessionType(nextType);
      const notificationContent = buildCompletionNotification(session.type, nextType, nextDuration);

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: notificationContent.title,
            body: notificationContent.body,
            schedule: { at: new Date(endTimestamp) },
            sound: resolveNotificationSound(),
            extra: {
              sessionType: session.type,
              nextType
            }
          }
        ]
      });
      activeNotificationIdRef.current = id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, [cancelActiveNotification, determineNextSessionType, getDurationForSessionType, resolveNotificationSound]);

  const completeSession = useCallback(async (session: PomodoroSession) => {
    const completedSession: PomodoroSession = {
      ...session,
      endTime: new Date(),
      completed: true
    };

    // Use functional update to avoid dependency on sessions array
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions, completedSession];
      // Call saveSessions with the updated sessions
      void saveSessions(updatedSessions);
      return updatedSessions;
    });
    await cancelActiveNotification();

    const nextType = determineNextSessionType(session.type);
    const nextDuration = getDurationForSessionType(nextType);
    const notificationContent = buildCompletionNotification(session.type, nextType, nextDuration);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: notificationContent.title,
            body: notificationContent.body,
            schedule: { at: new Date(Date.now() + 100) },
            sound: resolveNotificationSound()
          }
        ]
      });
    } catch (error) {
      console.error('Error showing completion notification:', error);
    }

    if (settings.vibrationEnabled) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.error('Error triggering haptics:', error);
      }
    }

    if (typeof document !== 'undefined' && !document.hidden) {
      try {
        await Dialog.alert({
          title: notificationContent.title,
          message: notificationContent.body
        });
      } catch (error) {
        console.error('Error showing completion dialog:', error);
      }
    }
  }, [cancelActiveNotification, determineNextSessionType, getDurationForSessionType, resolveNotificationSound, settings.vibrationEnabled, saveSessions]);

  // Use ref to store completeSession to avoid frequent effect recreations
  const completeSessionRef = useRef(completeSession);
  completeSessionRef.current = completeSession;

  const loadActiveSession = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: ACTIVE_SESSION_STORAGE_KEY });
      if (!value) {
        return;
      }

      const storedState: StoredTimerState = JSON.parse(value);
      if (!storedState.currentSession) {
        return;
      }

      const restoredSession = deserializeSession(storedState.currentSession);
      const endTimestamp = storedState.sessionEndTimestamp;
      const now = Date.now();
      const remaining = endTimestamp
        ? Math.max(0, Math.ceil((endTimestamp - now) / 1000))
        : storedState.timeLeft;

      if (remaining <= 0) {
        await completeSession(restoredSession);
        setTimerState(prev => ({
          ...prev,
          timeLeft: 0,
          isRunning: false,
          isPaused: false,
          currentSession: null,
          sessionsCompleted: restoredSession.type === 'work'
            ? storedState.sessionsCompleted + 1
            : storedState.sessionsCompleted,
          sessionEndTimestamp: null
        }));
        return;
      }

      setTimerState(prev => ({
        ...prev,
        timeLeft: remaining,
        isRunning: storedState.isRunning,
        isPaused: storedState.isPaused,
        currentSession: restoredSession,
        sessionsCompleted: storedState.sessionsCompleted,
        sessionEndTimestamp: storedState.isRunning ? endTimestamp : null
      }));

      if (storedState.isRunning && endTimestamp) {
        await scheduleSessionNotification(restoredSession, endTimestamp);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  }, [completeSession, scheduleSessionNotification]);

  useEffect(() => {
    console.debug('[usePomodoro] init effect: load persisted data');
    (async () => {
      await loadSettings();
      await loadSessions();
      await requestNotificationPermissions();
      await loadActiveSession();
    })();
  }, [loadSettings, loadSessions, requestNotificationPermissions, loadActiveSession]);

  const syncTimeWithNow = useCallback(() => {
    setTimerState(prev => {
      if (!prev.currentSession || !prev.isRunning || prev.isPaused || !prev.sessionEndTimestamp) {
        return prev;
      }

      const remaining = Math.max(0, Math.ceil((prev.sessionEndTimestamp - Date.now()) / 1000));
      if (remaining <= 0) {
        const completedSession = prev.currentSession;
        void completeSessionRef.current(completedSession);
        return {
          timeLeft: 0,
          isRunning: false,
          isPaused: false,
          currentSession: null,
          sessionsCompleted: completedSession.type === 'work'
            ? prev.sessionsCompleted + 1
            : prev.sessionsCompleted,
          sessionEndTimestamp: null
        };
      }

      if (remaining === prev.timeLeft) {
        return prev;
      }

      return {
        ...prev,
        timeLeft: remaining
      };
    });
  }, []);

  useEffect(() => {
    console.debug('[usePomodoro] visibility effect: registering listeners');
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncTimeWithNow();
      }
    };

    const handleFocus = () => syncTimeWithNow();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      console.debug('[usePomodoro] visibility effect: cleaning up listeners');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncTimeWithNow]);

  useEffect(() => {
    console.debug('[usePomodoro] interval effect: evaluating timer interval', {
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
      sessionEndTimestamp: timerState.sessionEndTimestamp
    });
    if (timerState.isRunning && !timerState.isPaused && timerState.sessionEndTimestamp) {
      console.debug('[usePomodoro] interval effect: starting interval tick');
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (!prev.isRunning || prev.isPaused || !prev.sessionEndTimestamp) {
            return prev;
          }

          const remaining = Math.max(0, Math.ceil((prev.sessionEndTimestamp - Date.now()) / 1000));
          if (remaining <= 0) {
            if (prev.currentSession) {
              const completedSession = prev.currentSession;
              void completeSessionRef.current(completedSession);
              return {
                timeLeft: 0,
                isRunning: false,
                isPaused: false,
                currentSession: null,
                sessionsCompleted: completedSession.type === 'work'
                  ? prev.sessionsCompleted + 1
                  : prev.sessionsCompleted,
                sessionEndTimestamp: null
              };
            }

            return {
              ...prev,
              timeLeft: 0,
              isRunning: false,
              sessionEndTimestamp: null
            };
          }

          if (remaining === prev.timeLeft) {
            return prev;
          }

          return {
            ...prev,
            timeLeft: remaining
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        console.debug('[usePomodoro] interval effect: clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.isPaused, timerState.sessionEndTimestamp]);

  const lastPersistedStateRef = useRef<TimerState | null>(null);
  const lastPersistTimeRef = useRef<number>(0);

  useEffect(() => {
    const prev = lastPersistedStateRef.current;
    const now = Date.now();

    // Determine if this is an important state change that should be persisted immediately
    const isImportantChange = !prev
      || prev.currentSession !== timerState.currentSession
      || prev.isRunning !== timerState.isRunning
      || prev.isPaused !== timerState.isPaused
      || prev.sessionEndTimestamp !== timerState.sessionEndTimestamp
      || prev.sessionsCompleted !== timerState.sessionsCompleted;

    // For timeLeft changes during active timer, only persist every 10 seconds to avoid excessive I/O
    const isTimeLeftChange = prev && prev.timeLeft !== timerState.timeLeft;
    const shouldThrottleTimeLeft = timerState.isRunning && !timerState.isPaused;
    const timeSinceLastPersist = now - lastPersistTimeRef.current;
    const canPersistTimeLeft = !shouldThrottleTimeLeft || timeSinceLastPersist > 10000; // 10 seconds

    const shouldPersist = isImportantChange || (isTimeLeftChange && canPersistTimeLeft);

    if (!shouldPersist) {
      return;
    }

    lastPersistedStateRef.current = timerState;
    lastPersistTimeRef.current = now;

    console.debug('[usePomodoro] persist effect: persisting timer state', {
      currentSessionId: timerState.currentSession?.id ?? null,
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
      timeLeft: timerState.timeLeft,
      sessionsCompleted: timerState.sessionsCompleted,
      isImportantChange,
      isTimeLeftChange,
      timeSinceLastPersist
    });
    void persistActiveTimerState(timerState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState]);

  const startSession = useCallback((sessionType?: 'work' | 'break' | 'longBreak') => {
    const type = sessionType ?? determineNextSessionType(timerState.currentSession?.type ?? null);
    const duration = getDurationForSessionType(type);
    const newSession: PomodoroSession = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      duration,
      startTime: new Date(),
      completed: false
    };
    const sessionEndTimestamp = Date.now() + duration * 60 * 1000;

    const newState: TimerState = {
      timeLeft: duration * 60,
      isRunning: true,
      isPaused: false,
      currentSession: newSession,
      sessionsCompleted: timerState.sessionsCompleted,
      sessionEndTimestamp
    };

    setTimerState(newState);
    void persistActiveTimerState(newState);
    void scheduleSessionNotification(newSession, sessionEndTimestamp);
  }, [
    determineNextSessionType,
    getDurationForSessionType,
    timerState.currentSession?.type,
    timerState.sessionsCompleted,
    persistActiveTimerState,
    scheduleSessionNotification
  ]);

  const pauseTimer = useCallback(() => {
    void cancelActiveNotification();
    let updatedState: TimerState | null = null;

    setTimerState(prev => {
      if (!prev.currentSession) {
        return prev;
      }

      updatedState = {
        ...prev,
        isRunning: false,
        isPaused: true,
        sessionEndTimestamp: null
      };
      return updatedState;
    });

    if (updatedState) {
      void persistActiveTimerState(updatedState);
    }
  }, [cancelActiveNotification, persistActiveTimerState]);

  const resumeTimer = useCallback(() => {
    const currentSession = timerState.currentSession;
    if (!currentSession) {
      return;
    }

    const sessionEndTimestamp = Date.now() + timerState.timeLeft * 1000;
    const newState: TimerState = {
      ...timerState,
      currentSession,
      isRunning: true,
      isPaused: false,
      sessionEndTimestamp
    };

    setTimerState(newState);
    void persistActiveTimerState(newState);
    void scheduleSessionNotification(currentSession, sessionEndTimestamp);
  }, [timerState, persistActiveTimerState, scheduleSessionNotification]);

  const stopTimer = useCallback(() => {
    // Prevent multiple rapid clicks causing conflicts
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    // Cancel notifications immediately and non-blocking
    void cancelActiveNotification();

    // Handle session completion if there's an active session
    if (timerState.currentSession) {
      const updatedSession: PomodoroSession = {
        ...timerState.currentSession,
        endTime: new Date(),
        completed: false
      };
      
      // Use functional update to avoid dependency on sessions array
      setSessions(prevSessions => {
        const newSessions = [...prevSessions, updatedSession];
        // Save sessions asynchronously without blocking
        void saveSessions(newSessions);
        return newSessions;
      });
    }

    // Update timer state immediately
    const newState: TimerState = {
      timeLeft: settings.workDuration * 60,
      isRunning: false,
      isPaused: false,
      currentSession: null,
      sessionsCompleted: timerState.sessionsCompleted,
      sessionEndTimestamp: null
    };

    setTimerState(newState);
    
    // Persist state asynchronously without blocking
    void persistActiveTimerState(newState);

    // Reset processing flag immediately since we're not doing blocking operations
    isProcessingRef.current = false;
  }, [
    timerState.currentSession,
    timerState.sessionsCompleted,
    settings.workDuration,
    saveSessions,
    cancelActiveNotification,
    persistActiveTimerState
  ]);

  const resetTimer = useCallback(() => {
    void cancelActiveNotification();
    let updatedState: TimerState | null = null;

    setTimerState(prev => {
      const duration = prev.currentSession
        ? getDurationForSessionType(prev.currentSession.type)
        : settings.workDuration;

      updatedState = {
        ...prev,
        timeLeft: duration * 60,
        isRunning: false,
        isPaused: false,
        sessionEndTimestamp: null
      };
      return updatedState;
    });

    if (updatedState) {
      void persistActiveTimerState(updatedState);
    }
  }, [cancelActiveNotification, getDurationForSessionType, settings.workDuration, persistActiveTimerState]);

  const clearHistory = useCallback(async () => {
    try {
      const { value } = await Dialog.confirm({
        title: 'Clear History',
        message: 'This will remove all recorded sessions. Continue?',
        okButtonTitle: 'Clear',
        cancelButtonTitle: 'Cancel'
      });

      if (!value) {
        return;
      }
    } catch (error) {
      console.error('Error showing confirmation dialog:', error);
      return;
    }

    await Preferences.remove({ key: SESSIONS_STORAGE_KEY });
    setSessions([]);
    setTimerState(prev => ({
      ...prev,
      sessionsCompleted: 0
    }));
  }, []);

  return {
    settings,
    timerState,
    sessions,
    saveSettings,
    startSession,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    clearHistory
  };
};

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const value = usePomodoroController();
  return (
    <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
