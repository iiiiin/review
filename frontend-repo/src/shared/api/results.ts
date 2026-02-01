// src/api/results.ts
import apiClient from '@/shared/api/client';
import type { InterviewHistoryResponse, InterviewItem, InterviewResultSummary, InterviewType } from '@/shared/types/result';

// API 타입을 프론트엔드 타입으로 변환하는 헬퍼 함수
const convertApiTypeToFrontendType = (apiType: 'TENACITY' | 'JOB' | 'PT'): InterviewType => {
  switch (apiType) {
    case 'TENACITY':
      return '인성';
    case 'JOB':
      return '직무';
    case 'PT':
      return 'PT';
    default:
      return '직무'; // 기본값
  }
};

// InterviewItem을 InterviewResultSummary로 변환하는 함수
const convertToResultSummary = (item: InterviewItem): InterviewResultSummary => ({
  interviewUuid: item.interviewUuid,
  interviewType: convertApiTypeToFrontendType(item.interviewType),
  enterpriseName: item.enterpriseName,
  position: item.position,
  createdAt: item.createdAt,
  averageScore: 85, // API에서 제공하지 않으므로 기본값 설정 (추후 API 업데이트 필요)
});

// --- API 호출 함수 ---

/**
 * 전체 면접 결과 목록을 가져오는 API
 * @returns {Promise<InterviewResultSummary[]>}
 */
export const getResultsAPI = async (): Promise<InterviewResultSummary[]> => {
  
  const response: InterviewHistoryResponse = await apiClient.get('/api/interview/history');
  
  // API 응답 구조 검증
  if (response && response.result && Array.isArray(response.result.interviews)) {
    // InterviewItem[]을 InterviewResultSummary[]로 변환
    return response.result.interviews.map(convertToResultSummary);
  } else {
    console.error('❌ Unexpected API response structure:', response);
    return [];
  }
};

/**
 * 특정 면접 결과 상세 정보를 가져오는 API (통합)
 */
export const getResultDetailAPI = async (interviewUuid: string) => {
  
  const response = await apiClient.get(`/api/interview/history/${interviewUuid}`);
  
  return response;
};

/**
 * 면접 기록을 삭제하는 API
 */
export const deleteInterviewAPI = async (interviewUuid: string) => {
  
  const response = await apiClient.delete(`/api/interview/history/${interviewUuid}`);
  
  return response;
};

/**
 * 개별 답변 시도에 대한 피드백을 가져오는 API
 */
export const getFeedbackAPI = async (answerAttemptId: string) => {
  
  const response = await apiClient.get(`/api/feedback/${answerAttemptId}`);
  
  return response;
};

/**
 * PT 피드백 조회 API
 * body: { ptAnswerAttemptUuid: string; attemptNumber: number }
 */
export const getPTFeedbackAPI = async (ptAnswerAttemptUuid: string, attemptNumber = 1) => {
  const url = '/api/feedback/pt';
  const body = { ptAnswerAttemptUuid, attemptNumber };
  const response = await apiClient.post(url, body, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  
  
  // getFeedbackAPI 호출 추가
  try {
    const feedbackResponse = await getFeedbackAPI(ptAnswerAttemptUuid);

    // modelAnswer가 있는 응답을 우선 사용
    const fbResult = (feedbackResponse as any)?.result || (feedbackResponse as any)?.data?.result || {};
    const ptResult = (response as any)?.result || (response as any)?.data?.result || {};
    
    
    // modelAnswer가 있는 응답을 우선 사용
    if (fbResult?.modelAnswer && !ptResult?.modelAnswer) {
      return feedbackResponse; // modelAnswer가 있는 일반 피드백 응답 사용
    }
    
    // 비디오 경로 병합: PT 응답에 비디오 경로가 없으면 일반 피드백의 비디오 경로를 보강
    const fbVideoPath = fbResult?.videoPath || fbResult?.videoUrl;
    if (ptResult && fbVideoPath && !ptResult.videoPath) {
      ptResult.videoPath = fbVideoPath;
    }
  } catch (error) {
    console.error('❌ [PT] getFeedbackAPI Error:', error);
    console.error('❌ [PT] getFeedbackAPI Error Details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      statusText: (error as any)?.response?.statusText,
      data: (error as any)?.response?.data
    });
  }
  
  return response;
};

/**
 * PT 리트라이 API - 동일한 문제를 새로운 attemptId로 재시도
 * URL: GET /api/interview/pt/retry/{interviewUuid}
 */
export const getPTRetryAPI = async (interviewUuid: string) => {
  const url = `/api/interview/pt/retry/${interviewUuid}`;
  
  const response = await apiClient.get(url);
  
  return response;
};

/**
 * 다음 PT 문제 생성 API
 * body: { ptUuid: string }
 */
export const generateNextPTProblemAPI = async (ptUuid: string) => {
  const url = '/api/interview/pt/generateProblem';
  const rawPtUuid = (ptUuid || '').toString();
  const sanitizedPtUuid = rawPtUuid.includes('~') ? rawPtUuid.split('~')[0].trim() : rawPtUuid.trim();
  if (sanitizedPtUuid !== rawPtUuid) {
  }
  const body = { ptUuid: sanitizedPtUuid };
  const response = await apiClient.post(url, body, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  return response;
};
