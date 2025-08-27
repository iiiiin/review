'use client';

import { motion } from 'framer-motion';

interface CircularTimerProps {
  remainingTime: number;
  totalTime: number;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CircularTimer({ remainingTime, totalTime }: CircularTimerProps) {
  const progress = totalTime > 0 ? remainingTime / totalTime : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = remainingTime <= 10;

  const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
  const seconds = (remainingTime % 60).toString().padStart(2, '0');

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          strokeWidth="8"
          className="stroke-gray-200"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={RADIUS}
          strokeWidth="8"
          strokeLinecap="round"
          className={isUrgent ? 'stroke-red-500' : 'stroke-blue-500'}
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold font-mono tracking-tighter ${isUrgent ? 'text-red-500' : 'text-gray-800'}`}>
          {minutes}:{seconds}
        </span>
        <span className="text-xs text-gray-500">남은 시간</span>
      </div>
    </div>
  );
}
