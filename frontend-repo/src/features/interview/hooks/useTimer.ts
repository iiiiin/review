import { useEffect, useCallback, useRef } from 'react';

export interface UseTimerOptions {
  onTick?: () => void;
  onTimeUp?: () => void;
  isActive?: boolean;
  remainingTime: number;
}

export const useTimer = ({
  onTick,
  onTimeUp,
  isActive = false,
  remainingTime
}: UseTimerOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onTickRef = useRef(onTick);
  const onTimeUpRef = useRef(onTimeUp);

  // 콜백 함수들을 ref로 저장하여 의존성 문제 방지
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // 타이머 시작/중지 로직
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      if (remainingTime <= 1) {
        onTimeUpRef.current?.();
      } else {
        onTickRef.current?.();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, remainingTime]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 수동 타이머 제어 함수들
  const startTimer = useCallback(() => {
    // 이미 활성화된 경우 무시
    if (timerRef.current) return;
    
    timerRef.current = setInterval(() => {
      onTickRef.current?.();
    }, 1000);
  }, [remainingTime]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    // 타이머 리셋은 상위 컴포넌트에서 remainingTime을 재설정해야 함
  }, [stopTimer]);

  // 시간 포맷팅 유틸리티
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // 상태
    isRunning: !!timerRef.current,
    formattedTime: formatTime(remainingTime),
    
    // 제어 함수
    startTimer,
    stopTimer,
    resetTimer,
    
    // 유틸리티
    formatTime,
  };
};