'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CompletionScreen from '@/pages/InterviewSession/components/CompletionScreen';

export default function InterviewCompletionPage() {
  const [searchParams] = useSearchParams();
  const interviewType = searchParams.get('type') || 'general';
  const resultId = searchParams.get('resultId');
  const attemptIdsParam = searchParams.get('attemptIds') || '';
  const attemptFromQuery = searchParams.get('attempt');

  const attemptIds = useMemo(() => {
    console.log('🔍 [InterviewCompletionPage] URL 파라미터 분석:');
    console.log('  - interviewType:', interviewType);
    console.log('  - attemptIdsParam:', attemptIdsParam);
    console.log('  - attemptFromQuery:', attemptFromQuery);
    
    // PT의 경우 빈 배열로 시작하여 WebSocket에서 실제 UUID를 받도록 함
    // attempt 쿼리는 UI 표시용이므로 attemptIds로 사용하지 않음
    if (interviewType === 'presentation') {
      console.log('🎯 [PT] PT 면접 - 빈 attemptIds로 시작, WebSocket에서 실제 UUID 대기');
      return [];
    }
    
    // 일반 면접의 경우 기존 로직 유지
    const result = attemptIdsParam
      ? attemptIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    console.log('🎯 [일반] 일반 면접 - attemptIds:', result);
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


