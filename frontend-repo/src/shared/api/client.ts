// src/api/client.ts
import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/shared/store/authStore';

// 타입 정의
interface QueueItem {
  resolve: (value: string | null) => void;
  reject: (error: AxiosError) => void;
}

const apiClient = axios.create({
  // 개발환경에서는 프록시 사용, 프로덕션에서는 직접 백엔드 호출
  baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'),
  timeout: 10000,
  withCredentials: true, // 쿠키를 포함하여 요청
});

// 토큰 갱신 중복 요청 방지
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

// 요청 인터셉터: 모든 요청이 보내지기 전에 실행
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Zustand 스토어에서 토큰 가져오기
    // authStore에 'token' 상태가 추가되어야 정상 동작
    const { accessToken } = useAuthStore.getState();
    
    
    if (accessToken) {
      // 헤더에 'Bearer 토큰' 형식으로 인증 정보를 추가
      // 로그인 상태에서 API 요청 보낼 수 있게 처리
      // 서버는 API에서 이 토큰을 확인해서 사용자 인증 확인
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
    }
    
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 응답 인터셉터 - 토큰 갱신 로직 포함
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 성공적인 응답 데이터만 반환
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러이고 토큰 갱신을 시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // refreshToken은 HttpOnly 쿠키로 관리되므로 별도 확인 불필요

      // 이미 토큰 갱신 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({ 
            resolve: (token: string | null) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(apiClient(originalRequest));
              } else {
                reject(new AxiosError('Token refresh failed'));
              }
            }, 
            reject 
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 토큰 갱신 요청 (쿠키의 refreshToken 자동 사용)
        const refreshBaseURL = import.meta.env.DEV 
          ? '' 
          : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
          
        const response = await axios.post(
          `${refreshBaseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { result } = response.data;
        const newAccessToken = result.accessToken;

        // AccessToken만 업데이트 (간소화된 처리)
        const authStore = useAuthStore.getState();
        authStore.refreshAccessToken(newAccessToken);

        // 대기 중인 요청들 처리
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // 토큰 갱신 실패 시 세부적인 에러 처리
        const error = refreshError as AxiosError<{ message?: string }>;
        const errorMessage = error.response?.data?.message;
        
        console.error('토큰 갱신 실패:', errorMessage || error.message);
        
        // 로그아웃된 사용자이거나 유효하지 않은 refreshToken인 경우
        if (errorMessage === '로그아웃된 사용자입니다.' || 
            errorMessage === '유효하지 않은 refreshToken 토큰입니다.') {
        }
        
        processQueue(error, null);
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
