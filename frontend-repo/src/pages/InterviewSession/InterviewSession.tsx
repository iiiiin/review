'use client';

import React, { useMemo } from 'react';
import { InterviewSessionFactory, InterviewTypeUtils } from './factory';
import type { InterviewSessionProps } from './interfaces';

/**
 * 통합 InterviewSession 컴포넌트
 * 면접 타입에 따라 적절한 하위 컴포넌트를 렌더링합니다.
 * 
 * @param interviewType - 면접 타입 ('job' | 'personality' | 'presentation')
 * @param sessionId - 세션 ID  
 * @param initialAttemptIds - 재시도 모드를 위한 초기 시도 ID들
 */
const InterviewSession: React.FC<InterviewSessionProps> = ({ 
  interviewType: rawInterviewType, 
  sessionId, 
  initialAttemptIds 
}) => {
  // 타입 안전성을 위한 검증
  if (!rawInterviewType || !sessionId) {
    console.error('InterviewSession: interviewType과 sessionId는 필수입니다.');
    return <div className="p-4 text-red-500">면접 세션을 시작할 수 없습니다. 필수 파라미터가 누락되었습니다.</div>;
  }
  // 면접 타입 정규화
  const normalizedInterviewType = useMemo(() => {
    return InterviewTypeUtils.normalizeInterviewType(rawInterviewType);
  }, [rawInterviewType]);

  // 디버그 정보 출력
  console.log('🎯 [InterviewSession] 면접 세션 시작');
  console.log('  - 원본 타입:', rawInterviewType);
  console.log('  - 정규화된 타입:', normalizedInterviewType);
  console.log('  - 세션 ID:', sessionId);
  console.log('  - 초기 시도 ID들:', initialAttemptIds);
  console.log('  - 표시명:', InterviewTypeUtils.getInterviewDisplayName(normalizedInterviewType));
  console.log('  - 예상 질문 수:', InterviewTypeUtils.getDefaultQuestionCount(normalizedInterviewType));

  // 팩토리를 통해 적절한 컴포넌트 생성
  return InterviewSessionFactory.create({
    interviewType: normalizedInterviewType,
    sessionId,
    initialAttemptIds
  });
};

export default InterviewSession;