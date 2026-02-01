import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useInterviewState } from '@/features/interview/context/../hooks/useInterviewState'
import { useRecording } from '@/features/interview/context/../hooks/useRecording'
import type { UseRecordingOptions } from '@/features/interview/context/../hooks/useRecording'
import { useTimer } from '@/features/interview/context/../hooks/useTimer'
import { useWebSocketConnection } from '@/features/interview/context/../hooks/useWebSocketConnection'
import type { UseWebSocketConnectionOptions } from '@/features/interview/context/../hooks/useWebSocketConnection'
import { useSessionManager } from '@/features/interview/context/../hooks/useSessionManager'
import type { UseSessionManagerOptions } from '@/features/interview/context/../hooks/useSessionManager'

// Context 타입 정의
interface InterviewContextType {
  // State
  interviewState: ReturnType<typeof useInterviewState>;
  recording: ReturnType<typeof useRecording>;
  timer: ReturnType<typeof useTimer>;
  websocket: ReturnType<typeof useWebSocketConnection>;
  session: ReturnType<typeof useSessionManager>;
}

// Context 생성
const InterviewContext = createContext<InterviewContextType | null>(null);

// Provider Props 타입
interface InterviewProviderProps {
  children: ReactNode;
  sessionId: string;
  userName: string;
  recordingOptions?: UseRecordingOptions;
  websocketOptions?: UseWebSocketConnectionOptions;
  sessionOptions?: Partial<UseSessionManagerOptions>;
}

// Provider 컴포넌트
export const InterviewProvider: React.FC<InterviewProviderProps> = ({
  children,
  sessionId,
  userName,
  recordingOptions = {},
  websocketOptions = {},
  sessionOptions: _sessionOptions = {},
}) => {
  // 상태 관리 훅들
  const interviewState = useInterviewState();
  
  const recording = useRecording({
    onRecordingStart: (recordingId) => {
      interviewState.actions.setRecordingId(recordingId);
      interviewState.actions.startAnswering();
    },
    onRecordingStop: (data) => {
      const interviewUuid = data?.interviewUuid || data?.result?.interviewUuid || data?.data?.interviewUuid;
      if (interviewUuid) {
        interviewState.actions.setResultId(interviewUuid);
      }
      // 🔧 수정: websocket 순환 의존성 제거 - handleNextQuestion에서 처리
    },
    ...recordingOptions,
  });

  const timer = useTimer({
    isActive: interviewState.state.step === 'answering',
    remainingTime: interviewState.state.remainingTime,
    onTick: () => {
      // 타이머 틱을 interviewState에 전달
      interviewState.actions.tick();
    },
    onTimeUp: () => {
      // 시간이 다 되면 다음 질문으로
      interviewState.actions.nextQuestion();
    },
  });

  const websocket = useWebSocketConnection({
    // 🔧 수정: GeneralInterview와 동일한 연결 조건으로 통일
    shouldConnect: 
      interviewState.state.questions.length > 0 && 
      (interviewState.state.step === 'waiting_recording' || interviewState.state.step === 'answering'),
    ...websocketOptions,
  });

  const session = useSessionManager(
    sessionId,
    userName,
    (_readySessionId: string) => {},
    (error: any) => {
      console.error('🔥 세션 오류:', error);
    }
  );

  const contextValue: InterviewContextType = {
    interviewState,
    recording,
    timer,
    websocket,
    session,
  };

  return (
    <InterviewContext.Provider value={contextValue}>
      {children}
    </InterviewContext.Provider>
  );
};

// Context 사용 훅
export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

// 개별 훅들 (편의성을 위해)
export const useInterviewContext = () => {
  const { interviewState } = useInterview();
  return interviewState;
};

export const useRecordingContext = () => {
  const { recording } = useInterview();
  return recording;
};

export const useTimerContext = () => {
  const { timer } = useInterview();
  return timer;
};

export const useWebSocketContext = () => {
  const { websocket } = useInterview();
  return websocket;
};

export const useSessionContext = () => {
  const { session } = useInterview();
  return session;
};
