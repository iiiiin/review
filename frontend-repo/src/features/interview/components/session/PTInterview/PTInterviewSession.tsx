'use client';

import { useRef, useCallback, useState } from 'react';
import { InterviewProvider, useInterview } from '@/features/interview/context/InterviewContext';
import CompletionScreen from '@/features/interview/components/session/CompletionScreen';
import PTInterviewLayout from '@/features/interview/components/session/PTInterviewLayout';

// PT면접 Props 타입
export interface PTInterviewSessionProps {
  interviewType: 'presentation';
  sessionId: string;
  initialAttemptIds?: string[];
}

// Context를 사용하는 내부 컴포넌트
function PTInterviewContent({ 
  sessionId, 
  initialAttemptIds 
}: Omit<PTInterviewSessionProps, 'interviewType'>) {
  const [isComplete, setIsComplete] = useState(false);
  const [answerAttemptIds, setAnswerAttemptIds] = useState<string[]>([]);
  const { interviewState } = useInterview();
  
  // PT 완료 핸들러
  const handlePTComplete = useCallback((ptAnswerAttemptIds: string[]) => {
    setAnswerAttemptIds(ptAnswerAttemptIds);
    setIsComplete(true);
  }, []);


  // 완료 화면 렌더링
  if (isComplete) {
    return (
      <CompletionScreen 
        resultId={interviewState.state.resultId} 
        interviewType="presentation" 
        answerAttemptIds={answerAttemptIds} 
      />
    );
  }

  // PT 면접 진행 화면
  return (
    <PTInterviewLayout 
      sessionId={sessionId} 
      initialAttemptIds={initialAttemptIds} 
      onComplete={handlePTComplete}
    />
  );
}

// PT면접 전용 컴포넌트 (Provider 래퍼)
export default function PTInterviewSession({ 
  sessionId, 
  initialAttemptIds 
}: PTInterviewSessionProps) {
  // WebSocket 연결을 위한 사용자명 생성
  const myUserName = useRef('User-' + crypto.randomUUID()).current;

  return (
    <InterviewProvider
      sessionId={sessionId}
      userName={myUserName}
      recordingOptions={{}}
      websocketOptions={{}}
      sessionOptions={{}}
    >
      <PTInterviewContent 
        sessionId={sessionId}
        initialAttemptIds={initialAttemptIds}
      />
    </InterviewProvider>
  );
}
