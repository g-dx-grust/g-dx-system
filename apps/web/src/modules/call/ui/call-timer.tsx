'use client';

import { useState, useEffect, useRef } from 'react';

interface CallTimerProps {
    isActive: boolean;
    onElapsedChange?: (seconds: number) => void;
}

export function CallTimer({ isActive, onElapsedChange }: CallTimerProps) {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();

    useEffect(() => {
        if (isActive) {
            setSeconds(0);
            intervalRef.current = setInterval(() => {
                setSeconds((s) => {
                    const next = s + 1;
                    onElapsedChange?.(next);
                    return next;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, onElapsedChange]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
        <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-gray-600">
            {isActive && (
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
            )}
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
    );
}
