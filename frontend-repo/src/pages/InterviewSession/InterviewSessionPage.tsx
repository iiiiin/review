'use client';

import InterviewSession from '@/pages/InterviewSession/components/InterviewSession';
import Header from '@/shared/layout/Header';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function InterviewSessionPage() {
  const [searchParams] = useSearchParams();
  const interviewType = searchParams.get('type') || 'general';
  const interviewUuid = searchParams.get('interviewUuid') || '';
  const storeKey = searchParams.get('storeKey') || '';
  // 피드백 페이지에서 재시도로 넘어온 attemptIds와 count 유지
  const attemptIdsParam = searchParams.get('attemptIds');
  const initialAttemptIds = attemptIdsParam ? attemptIdsParam.split(',') : [];
  
  const sessionId = useMemo(() => {
    if (interviewType === 'presentation') {
      // 리트라이 모드: attemptId를 세션 ID로 사용 (인성/직무와 동일한 패턴)
      if (attemptIdsParam) {
        return attemptIdsParam.split(',')[0];
      }
      // 일반 모드: questionUuid 사용
      if (!storeKey) return '';
      try {
        const raw = sessionStorage.getItem(storeKey);
        if (!raw) return '';
        const saved = JSON.parse(raw);
        // 우선순위: ptInitial.questionUuid → questions[0].questionUuid → questions[0].id → questions[0].uuid
        const qid = saved?.ptInitial?.questionUuid 
          || saved?.questions?.[0]?.questionUuid 
          || saved?.questions?.[0]?.id 
          || saved?.questions?.[0]?.uuid;
        return typeof qid === 'string' ? qid : '';
      } catch {
        return '';
      }
    }
    return interviewUuid ? `OV_${interviewUuid}` : '';
  }, [interviewType, storeKey, interviewUuid, attemptIdsParam]);
  
  return (
    <div className="min-h-screen w-full animated-gradient-bg">
      <Header />
      {/* ③ sessionId prop으로 전달 */}
      <InterviewSession interviewType={interviewType} sessionId={sessionId} initialAttemptIds={initialAttemptIds} />
    </div>
  );
}
