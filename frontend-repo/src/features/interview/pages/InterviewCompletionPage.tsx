'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CompletionScreen from '@/features/interview/components/session/CompletionScreen';

export default function InterviewCompletionPage() {
  const [searchParams] = useSearchParams();
  const interviewType = searchParams.get('type') || 'general';
  const resultId = searchParams.get('resultId');
  const attemptIdsParam = searchParams.get('attemptIds') || '';
  const attemptFromQuery = searchParams.get('attempt');

  const attemptIds = useMemo(() => {
    
    // PT의 경우 빈 배열로 시작하여 WebSocket에서 실제 UUID를 받도록 함
    // attempt 쿼리는 UI 표시용이므로 attemptIds로 사용하지 않음
    if (interviewType === 'presentation') {
      return [];
    }
    
    // 일반 면접의 경우 기존 로직 유지
    const result = attemptIdsParam
      ? attemptIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    return result;
  }, [attemptIdsParam, attemptFromQuery, interviewType]);

  return (
    <CompletionScreen
      resultId={resultId || null}
      interviewType={interviewType}
      answerAttemptIds={attemptIds}
    />
  );
}


