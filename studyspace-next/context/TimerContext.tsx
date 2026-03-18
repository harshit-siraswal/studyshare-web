// src/context/TimerContext.tsx
// Global timer state persistence so timer continues when Sheet closes on mobile

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

type TimerMode = 'focus' | 'break';

interface TimerState {
    // Timer settings
    focusMinutes: number;
    breakMinutes: number;
    // Current state
    mode: TimerMode;
    timeLeft: number;
    isRunning: boolean;
    sessions: number;
    // Actions
    setFocusMinutes: (minutes: number) => void;
    setBreakMinutes: (minutes: number) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
    switchMode: (mode: TimerMode) => void;
}

const TimerContext = createContext<TimerState | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
    const [focusMinutes, setFocusMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const FOCUS_TIME = focusMinutes * 60;
    const BREAK_TIME = breakMinutes * 60;

    // Timer tick effect - runs independent of component mounting
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Timer completed
            if (mode === 'focus') {
                setSessions((prev) => prev + 1);
                setMode('break');
                setTimeLeft(BREAK_TIME);
            } else {
                setMode('focus');
                setTimeLeft(FOCUS_TIME);
            }
            setIsRunning(false);

            // Play notification sound (optional)
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { }); // Ignore if audio fails
            } catch { }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft, mode, FOCUS_TIME, BREAK_TIME]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
    };

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
        setIsRunning(false);
    };

    const handleFocusChange = (value: number) => {
        if (!Number.isFinite(value)) return;
        const next = Math.min(120, Math.max(1, Math.round(value)));
        setFocusMinutes(next);
        if (mode === 'focus' && !isRunning) {
            setTimeLeft(next * 60);
        }
    };

    const handleBreakChange = (value: number) => {
        if (!Number.isFinite(value)) return;
        const next = Math.min(60, Math.max(1, Math.round(value)));
        setBreakMinutes(next);
        if (mode === 'break' && !isRunning) {
            setTimeLeft(next * 60);
        }
    };

    return (
        <TimerContext.Provider
            value={{
                focusMinutes,
                breakMinutes,
                mode,
                timeLeft,
                isRunning,
                sessions,
                setFocusMinutes: handleFocusChange,
                setBreakMinutes: handleBreakChange,
                toggleTimer,
                resetTimer,
                switchMode,
            }}
        >
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
