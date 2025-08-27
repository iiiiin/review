import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/shared/store/authStore';
import { loginAPI } from '@/shared/api/auth';
import AuthLayout from '@/shared/layout/AuthLayout';
import SocialLoginButtons from '@/shared/components/SocialLoginButtons';
import type { LoginResponse } from '@/shared/types/user';

const LoginPage = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: loginAPI,
    onSuccess: (data) => {
      // 응답을 login 함수에 전달
      login(data as unknown as LoginResponse);
      // 로그인 성공 후, 사용자를 랜딩 페이지로 이동시킵니다.
      navigate('/');
    },
    onError: (error: AxiosError) => {
      // 로그인 실패 시 전체 응답 출력
      const axiosError = error as AxiosError;
      console.error('로그인 실패 - 전체 응답:', axiosError);
      console.error('에러 응답 데이터:', axiosError.response?.data);
      console.error('에러 상태 코드:', axiosError.response?.status);
      console.error('에러 헤더:', axiosError.response?.headers);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ id, password });
  };

  return (
    <AuthLayout title="Re:View" subtitle="로그인하고 AI 면접을 경험해보세요">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
            role="alert"
          >
            <span className="font-medium">로그인 실패:</span> {(error as AxiosError<{ message?: string }>).response?.data?.message || error.message}
          </div>
        )}
        <div>
          <label
            htmlFor="id"
            className="block text-sm font-medium text-gray-700"
          >
            아이디
          </label>
          <div className="mt-1">
            <input
              id="id"
              name="id"
              type="text"
              autoComplete="username"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            비밀번호
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isPending ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </form>
      
      <SocialLoginButtons />
      
      <p className="mt-6 text-center text-sm text-gray-600">
        아직 회원이 아니신가요?{' '}
        <Link
          to="/auth/register"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
