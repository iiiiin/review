// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResponse } from '@/shared/types/user';
import { logoutAPI, refreshTokenAPI } from '@/shared/api/auth';

// 회원가입 폼에서 관리할 데이터 타입
interface RegisterFormData {
  id: string;
  email: string;
  password: string;
  name: string;
}

// 비밀번호 찾기 상태
interface ForgotPasswordState {
  step: number;
  email: string;
}

// 회원가입 상태
interface RegisterState {
  step: number;
  formData: RegisterFormData;
}

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  username: string | null;
  accessToken: string | null;
  loginType: string | null; 

  // 회원가입 상태
  register: RegisterState;
  
  // 비밀번호 찾기 상태
  forgotPassword: ForgotPasswordState;
  
  // 로그인 액션
  login: (loginResponse: LoginResponse) => void;
  logout: () => void;
  
  // 토큰 갱신 액션 (AccessToken만 업데이트)
  refreshAccessToken: (newAccessToken: string) => void;
  
  // 앱 초기화 시 토큰 복구
  initializeAuth: () => Promise<void>;
  
  // 회원가입 액션
  setRegisterStep: (step: number) => void;
  updateRegisterFormData: (data: Partial<RegisterFormData>) => void;
  resetRegister: () => void;
  
  // 비밀번호 찾기 액션
  setForgotPasswordStep: (step: number) => void;
  setForgotPasswordEmail: (email: string) => void;
  resetForgotPassword: () => void;
  
  reset: () => void; // 테스트를 위한 리셋 액션
}

// 회원가입 초기 단계(1단계)
const initialRegisterState: RegisterState = {
  step: 1,
  formData: {
    id: '',
    email: '',
    password: '',
    name: '',
  },
};

// 비밀번호 찾기 초기 단계(1단계)
const initialForgotPasswordState: ForgotPasswordState = {
  step: 1,
  email: '',
};

// 인증 상태
const initialState: Omit<AuthState, 'login' | 'logout' | 'refreshAccessToken' | 'initializeAuth' | 'setRegisterStep' | 'updateRegisterFormData' | 'resetRegister' | 'setForgotPasswordStep' | 'setForgotPasswordEmail' | 'resetForgotPassword' | 'reset'> = {
  isLoggedIn: false,
  userId: null,
  username: null,
  accessToken: null,
  loginType: null,
  register: initialRegisterState,
  forgotPassword: initialForgotPasswordState,
};

// Store: 사용자 인증 상태
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      login: (loginResponse: LoginResponse) => {
        const { result } = loginResponse;
        set({ 
          userId: result.id,
          username: result.username,
          isLoggedIn: true,
          accessToken: result.accessToken,
          loginType: result.loginType,
        });
      },
      logout: async () => {
        try {
          // 백엔드 로그아웃 API 호출 (refreshToken 무효화 및 쿠키 삭제)
          await logoutAPI();
        } catch (error) {
          console.error('로그아웃 API 호출 실패:', error);
          // API 실패해도 프론트 상태는 초기화
        } finally {
          // 프론트 상태 초기화
          set({ 
            userId: null,
            username: null,
            isLoggedIn: false,
            accessToken: null,
            loginType: null,
          });
        }
      },
            
      // 토큰 갱신 시 AccessToken만 업데이트
      refreshAccessToken: (newAccessToken) => {
        set((state) => ({ 
          ...state,
          accessToken: newAccessToken,
          token: newAccessToken // 기존 호환성을 위해 동일하게 설정
        }));
      },
      
      // 앱 초기화 시 토큰 복구
      initializeAuth: async () => {
        const state = useAuthStore.getState();
        
        // 로그인 상태이지만 토큰이 없는 경우 복구 시도
        if (state.isLoggedIn && !state.accessToken) {
          try {
            const response = await refreshTokenAPI();
            const { result } = response;
            const newAccessToken = result.accessToken;
            
            // 토큰 업데이트
            useAuthStore.getState().refreshAccessToken(newAccessToken);
          } catch (error) {
            console.error('토큰 복구 실패:', error);
            // 토큰 복구 실패 시 로그아웃 처리
            useAuthStore.getState().logout();
          }
        }
      },
      
      // 회원가입 액션들
      setRegisterStep: (step) => set((state) => ({
        register: { ...state.register, step }
      })),
      updateRegisterFormData: (data) => set((state) => ({
        register: {
          ...state.register,
          formData: { ...state.register.formData, ...data }
        }
      })),
      resetRegister: () => set(() => ({
        register: initialRegisterState
      })),
      
      // 비밀번호 찾기 액션들
      setForgotPasswordStep: (step) => set((state) => ({
        forgotPassword: { ...state.forgotPassword, step }
      })),
      setForgotPasswordEmail: (email) => set((state) => ({
        forgotPassword: { ...state.forgotPassword, email }
      })),
      resetForgotPassword: () => set(() => ({
        forgotPassword: initialForgotPasswordState
      })),
      
      reset: () => {
        set(initialState as AuthState);
      },
    }),
    {
      name: 'auth-storage', // localStorage에 저장될 때 사용될 키 이름
      // accessToken은 메모리에만 저장, localStorage에는 제외 (보안 강화)
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userId: state.userId,
        username: state.username,
        loginType: state.loginType,
        register: state.register,
        forgotPassword: state.forgotPassword,
      }),
    },
  ),
);

// --- Zustand 스토어의 상태를 초기화하는 유틸리티 함수 ---
// 주로 테스트 환경에서 각 테스트가 독립적으로 실행되도록 보장하기 위해 사용됩니다.
// `beforeEach`나 `afterEach`에서 이 함수를 호출하여 테스트 간의 상태 공유를 방지합니다.
export const resetAuthStore = () => {
  useAuthStore.setState(initialState as AuthState);
};

// 기존 코드와의 호환성을 위한 Export
export const useRegisterStore = () => {
  const register = useAuthStore((state) => state.register);
  const setStep = useAuthStore((state) => state.setRegisterStep);
  const updateFormData = useAuthStore((state) => state.updateRegisterFormData);
  const reset = useAuthStore((state) => state.resetRegister);
  
  return {
    step: register.step,
    formData: register.formData,
    setStep,
    updateFormData,
    reset,
  };
};

export const useForgotPasswordStore = () => {
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const setStep = useAuthStore((state) => state.setForgotPasswordStep);
  const setEmail = useAuthStore((state) => state.setForgotPasswordEmail);
  const reset = useAuthStore((state) => state.resetForgotPassword);
  
  return {
    step: forgotPassword.step,
    email: forgotPassword.email,
    setStep,
    setEmail,
    reset,
  };
};
