import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { startRecording, stopRecording } from '../api/interview';

export interface UseRecordingOptions {
  onRecordingStart?: (recordingId: string) => void;
  onRecordingStop?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useRecording = ({
  onRecordingStart,
  onRecordingStop,
  onError
}: UseRecordingOptions = {}) => {
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [recordingStarted, setRecordingStarted] = useState<{[key: string]: boolean}>({});
  const recordingIdRef = useRef<string | null>(null);

  // currentRecordingId 변경 시 ref 업데이트
  useEffect(() => {
    recordingIdRef.current = currentRecordingId;
  }, [currentRecordingId]);

  // 녹화 시작 뮤테이션
  const startRecordingMutation = useMutation({
    mutationFn: (variables: { interviewId: string }) => startRecording(variables.interviewId),
    onSuccess: (data) => {
      console.log('✅ 녹화 시작 성공, 응답:', data);
      const recordingId = data?.recordingId || data?.id;
      if (recordingId) {
        setCurrentRecordingId(recordingId);
        onRecordingStart?.(recordingId);
      } else {
        console.error('응답에서 recordingId를 찾을 수 없습니다.');
      }
    },
    onError: (error: any) => {
      console.error('🔥 녹화 시작 실패', error);
      onError?.(error);
    },
  });

  // 녹화 중지 뮤테이션
  const stopRecordingMutation = useMutation({
    mutationFn: (recordingId: string) => stopRecording(recordingId),
    onSuccess: (data: any) => {
      console.log('✅ 녹화 중지 성공');
      setCurrentRecordingId(null);
      onRecordingStop?.(data);
    },
    onError: (error: any) => {
      console.error('🔥 녹화 중지 실패', error);
      setCurrentRecordingId(null);
      onError?.(error);
    },
  });

  // 녹화 시작 함수
  const startRecordingSession = useCallback((sessionId: string) => {
    if (recordingStarted[sessionId] || currentRecordingId || startRecordingMutation.isPending) {
      console.log('🔍 녹화 시작 건너뛰기 - 이미 시작됨 또는 진행 중');
      return;
    }

    console.log('🎥 녹화 시작! sessionId:', sessionId);
    setRecordingStarted(prev => ({ ...prev, [sessionId]: true }));
    startRecordingMutation.mutate({ interviewId: sessionId });
  }, [recordingStarted, currentRecordingId, startRecordingMutation.isPending]);

  // 녹화 중지 함수
  const stopRecordingSession = useCallback((recordingId?: string) => {
    const targetRecordingId = recordingId || currentRecordingId;
    if (!targetRecordingId) {
      console.warn('중지할 녹화 ID가 없습니다.');
      return Promise.resolve();
    }

    return new Promise<any>((resolve, reject) => {
      stopRecordingMutation.mutate(targetRecordingId, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error),
      });
    });
  }, [currentRecordingId, stopRecordingMutation]);

  // 페이지 이탈 시 녹화 정리
  useEffect(() => {
    return () => {
      if (recordingIdRef.current) {
        console.log('🎬 페이지 이탈로 인한 녹화 종료');
        
        // sendBeacon으로 안전한 전송
        if (navigator.sendBeacon) {
          const data = new Blob([JSON.stringify({ recordingId: recordingIdRef.current })], {
            type: 'application/json'
          });
          navigator.sendBeacon('/api/recordings/stop', data);
        }
      }
    };
  }, []);

  return {
    // 상태
    currentRecordingId,
    isRecording: !!currentRecordingId,
    recordingStarted,
    
    // 액션
    startRecordingSession,
    stopRecordingSession,
    
    // 뮤테이션 상태
    isStarting: startRecordingMutation.isPending,
    isStopping: stopRecordingMutation.isPending,
    startError: startRecordingMutation.error,
    stopError: stopRecordingMutation.error,

    // 내부 함수들 (필요한 경우)
    setCurrentRecordingId,
    setRecordingStarted,
  };
};