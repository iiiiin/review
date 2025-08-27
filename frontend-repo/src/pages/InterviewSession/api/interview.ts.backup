import axios, { AxiosError } from 'axios';
import { interviewDataMap } from '@/pages/InterviewSession/interviewData';
import apiClient from '@/shared/api/client';
import type { InterviewData } from '@/shared/types/interview';

const OPENVIDU_URL = "https://i13e206.p.ssafy.io:8442/";
const SECRET = "i13e206";
const headers = {
  Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + SECRET),
  'Content-Type': 'application/json',
};

export const createSession = async (sessionId: string) => {
  try {
    console.log('=== OpenVidu 세션 생성 시작 ===');
    console.log('요청 URL:', `${OPENVIDU_URL}openvidu/api/sessions`);
    console.log('요청 데이터:', { customSessionId: sessionId });
    
    const res = await axios.post(`${OPENVIDU_URL}openvidu/api/sessions`,
      { customSessionId: sessionId }, { 
        headers,
        timeout: 60000 // 60초로 늘림
      });
    
    console.log('=== OpenVidu 세션 생성 성공 ===');
    console.log('응답 데이터:', res.data);
    console.log('요청한 customSessionId:', sessionId);
    console.log('실제 반환된 세션 ID:', res.data.id);
    
    // customSessionId가 무시되었는지 확인
    if (res.data.id !== sessionId) {
      console.warn('⚠️ OpenVidu가 customSessionId를 무시하고 자체 세션 ID를 생성했습니다.');
      console.warn('요청한 ID:', sessionId);
      console.warn('실제 세션 ID:', res.data.id);
    }
    
    return res.data.id;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.status === 409) {
      console.log('세션이 이미 존재합니다. 기존 세션 ID 반환:', sessionId);
      return sessionId;
    }
    console.error('=== OpenVidu 세션 생성 실패 ===');
    console.error('에러 객체:', error);
    if (axios.isAxiosError(error)) {
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      console.error('에러 메시지:', error.message);
    }
    throw error;
  }
};

export const createToken = async (sessionId: string) => {
  try {
    console.log('=== OpenVidu 토큰 생성 시작 ===');
    console.log('요청 URL:', `${OPENVIDU_URL}openvidu/api/sessions/${sessionId}/connection`);
    
    const res = await axios.post(`${OPENVIDU_URL}openvidu/api/sessions/${sessionId}/connection`, {}, { 
      headers,
      timeout: 60000 // 60초로 늘림
    });
    
    console.log('=== OpenVidu 토큰 생성 성공 ===');
    console.log('응답 데이터:', res.data);
    
    return res.data.token;
  } catch (error) {
    console.error('=== OpenVidu 토큰 생성 실패 ===');
    console.error('에러 객체:', error);
    if (axios.isAxiosError(error)) {
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      console.error('에러 메시지:', error.message);
    }
    throw error;
  }
};

// 사용할 인터뷰 타입 정의 (job: 직무, personality: 인성, pt: PT)
type InterviewType = 'job' | 'personality' | 'pt';

// (한글이 들어올 경우 변환해주는 맵, UI에서 영문 키만 쓰면 불필요)
const typeMap: Record<string, InterviewType> = {
  '직무': 'job',
  '인성': 'personality',
  'behavioral': 'personality', 
  'personality': 'personality', 
  'pt': 'pt',
  'PT': 'pt',
};

const API_MOCKING_ENABLED = import.meta.env.VITE_API_MOCKING === 'enabled';

// 면접 질문 목록을 가져오는 API
export const getInterviewQuestionsAPI = async (
  type: InterviewType | string
): Promise<InterviewData> => {
  // 한글 또는 잘못된 키 방지용 변환 처리
  const safeType: InterviewType =
    (typeMap[type] as InterviewType) ||
    (['job', 'personality', 'pt'].includes(type) ? (type as InterviewType) : 'job');

  if (API_MOCKING_ENABLED) {
    console.log(`✅ Mocking enabled: getInterviewQuestionsAPI for type "${safeType}"`);
    // 타입이 없을 경우 기본값('job') 사용
    const data = interviewDataMap[safeType] || interviewDataMap['job'];
    return new Promise(resolve => {
      setTimeout(() => resolve(data), 300);
    });
  }

  // 실제 API 호출
  const response = await apiClient.get<InterviewData>('/api/interview/questions', {
  params: { type: safeType }
  });
  return response.data;
};

/**
 * PT 면접 시작 API
 */
export const startPTInterview = async (interviewUuid: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/interview/start', { interviewUuid }, { withCredentials: true });
    return response;
  } catch (error) {
    console.error('PT 면접 시작 실패:', error);
    throw error;
  }
};

/**
 * 녹화 시작 API
 */
export const startRecording = async (interviewId: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/recordings/start', { interviewId });
    return response;
  } catch (error) {
    console.error('🔥 startRecording 실패:', error);
    throw error;
  }
};

/**
 * 녹화 중지 API
 */
export const stopRecording = async (recordingId: string): Promise<any> => {
  console.log('=== stopRecording 함수 호출 ===');
  console.log('recordingId:', recordingId);

  try {
    console.log('=== API 요청 정보 (중지) ===');
    const url = '/api/recordings/stop';
    console.log('URL:', url);
    console.log('데이터:', { recordingId });

    const response = await apiClient.post(
      url,
      { recordingId },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    );

    console.log('=== stopRecording 성공 ===');
    console.log('응답:', response);
    return response;
  } catch (error) {
    console.error('=== stopRecording 실패 ===');
    console.error('에러:', error);
    throw error;
  }
};