// src/api/auth.ts
import apiClient from '@/shared/api/client';

// 회원가입 입력 데이터 타입 설정
interface RegisterFormData {
  id: string;
  email: string;
  password: string;
  name: string;
}

// 로그인 API
export const loginAPI = async ({
  // 객체에서 구조 분해 할당으로 아이디, 비밀번호 가져오기
  id,
  password,
}: {
  // 데이터 타입 설정
  id: string;
  password: string;
}) => {
  // API 요청: body에 데이터 담아 전송
  const response = await apiClient.post('/api/auth/login', { id, password });
  return response;
};

// 아이디 중복확인 API
export const checkIdAPI = async (id: string) => {
  // API 요청: id 파라미터에 담아 요청
  const response = await apiClient.get(`/api/user/signup/checkId?id=${id}`);
  return response;
};

// 이메일 인증 API
export const sendEmailVerificationAPI = async (email: string) => {
  // API 요청: body에 데이터 담아 전송
  const response = await apiClient.post('/api/user/signup/verify', { email });
  return response;
};

// 이메일 인증코드 확인 API
export const verifyEmailCodeAPI = async (email: string, code: string) => {
  // API 요청: body에 데이터 담아 전송
  const response = await apiClient.post('/api/user/signup/code', { email, code });
  return response;
};

// 회원가입 API
export const registerAPI = async (formData: RegisterFormData) => {
  const signupData = {
    // 입력받은 데이터로부터 각 항목을 가져옴
    id: formData.id,
    password: formData.password,
    email: formData.email,
    username: formData.name,
    // API 요청 전에 loginType 설정
    loginType: 'LOCAL'
  };
  const response = await apiClient.post('/api/user/signup', signupData);
  return response;
};

// 비밀번호 재설정 요청 (인증번호 발송) API
export const requestPasswordResetAPI = async (email: string) => {
  const response = await apiClient.post(`/api/auth/password/verify`,{email});
  return response;
};

// 비밀번호 찾기 인증번호 확인 API
export const verifyPasswordResetCodeAPI = async (email: string, code: string) => {
  const response = await apiClient.post('/api/auth/password/code', { email, code });
  return response;
};


// 새 비밀번호 설정 API
export const resetPasswordAPI = async ({
  email,
  newPassword,
  confirmPassword,
}: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const response = await apiClient.post('/api/auth/password/reset', {
    email,
    newPassword,
    confirmPassword,
  });
  return response;
};

// 회원 탈퇴 API
export const withdrawAPI = async () => {
  const response = await apiClient.delete('/api/user/mypage');
  return response;
};

// 비밀번호 변경 API
export const changePasswordAPI = async ({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) => {
  const response = await apiClient.put('/api/user/mypage',{currentPassword, newPassword});
  return response;
};

// 로그아웃 API
export const logoutAPI = async () => {
  const response = await apiClient.post('/api/auth/logout');
  return response;
};

// 토큰 갱신 API
export const refreshTokenAPI = async () => {
  // apiClient 대신 axios를 직접 사용하여 무한 루프 방지
  const axios = (await import('axios')).default;
  // 개발환경에서는 프록시 사용, 프로덕션에서는 직접 백엔드 호출
  const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
  const response = await axios.post(
    `${baseURL}/api/auth/refresh`,
    {},
    { withCredentials: true }
  );
  return response.data;
};
