// 📁 src/shared/api/recording.ts
// OpenVidu 녹화 기능 통합 API - 안전한 개선 버전

import apiClient from '@/shared/api/client';

// ===========================================
// 🔧 유틸리티 함수들
// ===========================================

/**
 * 백엔드 응답에서 recordingId를 안전하게 추출하는 함수
 */
export const extractRecordingId = (response: any): string | null => {
  if (!response) return null;
  
  // 가능한 경로들을 순차적으로 확인
  const paths = [
    'data.recordingId',
    'recordingId', 
    'data.id',
    'id',
    'data.result.recordingId',
    'result.recordingId'
  ];
  
  for (const path of paths) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], response);
    if (value && typeof value === 'string') {
      console.log(`✅ recordingId 추출 성공 (경로: ${path}):`, value);
      return value;
    }
  }
  
  console.warn('⚠️ recordingId를 찾을 수 없습니다. 응답:', response);
  return null;
};

/**
 * 백엔드 응답에서 interviewUuid를 안전하게 추출하는 함수
 */
export const extractInterviewUuid = (response: any): string | null => {
  if (!response) return null;
  
  const paths = [
    'data.interviewUuid',
    'interviewUuid',
    'data.result.interviewUuid',
    'result.interviewUuid'
  ];
  
  for (const path of paths) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], response);
    if (value && typeof value === 'string') {
      console.log(`✅ interviewUuid 추출 성공 (경로: ${path}):`, value);
      return value;
    }
  }
  
  console.warn('⚠️ interviewUuid를 찾을 수 없습니다. 응답:', response);
  return null;
};

/**
 * 재시도 메커니즘을 제공하는 고차 함수
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'API 호출'
): Promise<T> => {
  let lastError: Error = new Error('재시도 실패');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} 시도 ${attempt}/${maxRetries}`);
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} 재시도 성공! (시도: ${attempt}/${maxRetries})`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ ${operationName} 실패 (시도 ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        console.error(`🚨 ${operationName} 최종 실패. 최대 재시도 횟수 초과.`);
        break;
      }
      
      // 지수 백오프: 1초, 2초, 4초...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ ${delay}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// ===========================================
// 🎯 개선된 녹화 API 함수들
// ===========================================

/**
 * 개선된 녹화 시작 API (재시도 메커니즘 포함)
 */
export const startRecordingEnhanced = async (
  sessionId: string,
  options: {
    maxRetries?: number;
    timeout?: number;
    enableRetry?: boolean;
  } = {}
): Promise<{
  recordingId: string | null;
  rawResponse: any;
  success: boolean;
}> => {
  const { maxRetries = 3, timeout = 10000, enableRetry = true } = options;
  
  const operation = async () => {
    console.log('🎬 녹화 시작 요청:', { sessionId, timeout });
    
    const response = await apiClient.post(
      '/api/recordings/start',
      { sessionId },
      { 
        timeout,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('🎬 녹화 시작 응답:', response);
    return response;
  };
  
  try {
    const rawResponse = enableRetry 
      ? await withRetry(operation, maxRetries, 1000, '녹화 시작')
      : await operation();
    
    const recordingId = extractRecordingId(rawResponse);
    
    // 🎯 녹화 시작 성공 로그 추가
    console.log('✅ 🎬 녹화가 성공적으로 시작되었습니다!');
    console.log('📋 녹화 시작 결과:', {
      sessionId,
      recordingId,
      success: !!recordingId,
      timestamp: new Date().toISOString()
    });
    
    if (recordingId) {
      console.log('🆔 생성된 recordingId:', recordingId);
    } else {
      console.warn('⚠️ recordingId를 추출할 수 없습니다. 응답 구조를 확인하세요.');
    }
    
    return {
      recordingId,
      rawResponse,
      success: !!recordingId
    };
  } catch (error) {
    console.error('🔥 🎬 녹화 시작 최종 실패:', error);
    console.error('🚨 녹화 시작 실패 상세:', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    return {
      recordingId: null,
      rawResponse: null,
      success: false
    };
  }
};

/**
 * 개선된 녹화 중지 API (재시도 메커니즘 포함)
 */
export const stopRecordingEnhanced = async (
  recordingId: string,
  options: {
    maxRetries?: number;
    timeout?: number;
    enableRetry?: boolean;
  } = {}
): Promise<{
  interviewUuid: string | null;
  rawResponse: any;
  success: boolean;
}> => {
  const { maxRetries = 3, timeout = 15000, enableRetry = true } = options;
  
  const operation = async () => {
    console.log('🛑 녹화 중지 요청:', { recordingId, timeout });
    
    const response = await apiClient.post(
      '/api/recordings/stop',
      { recordingId },
      {
        timeout,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('🛑 녹화 중지 응답:', response);
    return response;
  };
  
  try {
    const rawResponse = enableRetry
      ? await withRetry(operation, maxRetries, 1000, '녹화 중지') 
      : await operation();
    
    const interviewUuid = extractInterviewUuid(rawResponse);
    
    // 🎯 녹화 종료 성공 로그 추가
    console.log('✅ 🎬 녹화가 성공적으로 중지되었습니다!');
    console.log('📋 녹화 중지 결과:', {
      recordingId,
      interviewUuid,
      success: !!rawResponse,
      timestamp: new Date().toISOString()
    });
    
    if (interviewUuid) {
      console.log('🆔 추출된 interviewUuid:', interviewUuid);
    } else {
      console.warn('⚠️ interviewUuid를 추출할 수 없습니다. 응답 구조를 확인하세요.');
    }
    
    return {
      interviewUuid,
      rawResponse,
      success: !!rawResponse
    };
  } catch (error) {
    console.error('🔥 🎬 녹화 중지 최종 실패:', error);
    console.error('🚨 녹화 중지 실패 상세:', {
      recordingId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    return {
      interviewUuid: null,
      rawResponse: null,
      success: false
    };
  }
};

// ===========================================
// 🔄 하위 호환성을 위한 래퍼 함수들 
// ===========================================

/**
 * 기존 startRecording과 동일한 인터페이스 (하위 호환성 보장)
 * @deprecated 가능하면 startRecordingEnhanced 사용 권장
 */
export const startRecording = async (sessionId: string): Promise<any> => {
  console.log('📢 [호환성] 기존 startRecording 인터페이스 사용');
  const result = await startRecordingEnhanced(sessionId);
  return result.rawResponse;
};

/**
 * 기존 stopRecording과 동일한 인터페이스 (하위 호환성 보장)
 * @deprecated 가능하면 stopRecordingEnhanced 사용 권장
 */
export const stopRecording = async (recordingId: string): Promise<any> => {
  console.log('📢 [호환성] 기존 stopRecording 인터페이스 사용');
  const result = await stopRecordingEnhanced(recordingId);
  return result.rawResponse;
};

// ===========================================
// 🎛️ 고급 기능들
// ===========================================

/**
 * 녹화 상태 체크 함수 (선택적)
 */
export const checkRecordingStatus = async (recordingId: string): Promise<{
  isRecording: boolean;
  status: string | null;
  error: string | null;
}> => {
  try {
    // 실제 백엔드 API가 있다면 구현
    console.log('🔍 녹화 상태 확인:', recordingId);
    return {
      isRecording: true, // 임시값
      status: 'recording',
      error: null
    };
  } catch (error) {
    return {
      isRecording: false,
      status: null,
      error: (error as Error).message
    };
  }
};

/**
 * 녹화 설정 정보
 */
export const RECORDING_CONFIG = {
  DEFAULT_TIMEOUT: {
    START: 10000,  // 10초
    STOP: 15000    // 15초 (중지가 더 오래 걸릴 수 있음)
  },
  DEFAULT_RETRIES: 3,
  RETRY_DELAY: 1000, // 1초 기본 지연
  
  // 환경별 설정
  DEVELOPMENT: {
    ENABLE_DETAILED_LOGS: true,
    MOCK_API_DELAY: 1000
  }
};

export default {
  // 개선된 함수들
  startRecordingEnhanced,
  stopRecordingEnhanced,
  
  // 하위 호환성 함수들  
  startRecording,
  stopRecording,
  
  // 유틸리티들
  extractRecordingId,
  extractInterviewUuid,
  withRetry,
  checkRecordingStatus,
  
  // 설정
  RECORDING_CONFIG
};