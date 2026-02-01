import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import type { LoginResponse } from '@/shared/types/user';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // API 명세서에 따른 쿼리 파라미터
  const accessToken = searchParams.get('accessToken');
  const error = searchParams.get('error');

  useEffect(() => {
    // 로그인 실패 시
    if (error) {
      console.error('OAuth 오류:', error);
      let errorMessage = '소셜 로그인 중 오류가 발생했습니다.';
      
      if (error === 'access_denied') {
        errorMessage = '소셜 로그인이 취소되었습니다.';
      }
      
      navigate('/auth/login', { 
        replace: true,
        state: { error: errorMessage }
      });
      return;
    }

    // 로그인 성공 시 - 토큰이 모두 있는지 확인
    if (accessToken) {
      // LoginResponse 타입에 맞는 응답 형태로 변환하여 로그인 처리
      const loginResponse: LoginResponse = {
        status: 200,
        message: 'OAuth 로그인 성공',
        result: {
          id: '', // JWT 토큰에서 사용자 정보를 추출해야 함
          username: '', // 실제로는 JWT 토큰을 파싱하여 사용자 정보를 가져와야 함
          accessToken,
          loginType: 'GOOGLE'
        }
      };
      
      login(loginResponse);
      navigate('/', { replace: true });
      return;
    }

    // 필수 파라미터가 없는 경우
    navigate('/auth/login', { 
      replace: true,
      state: { error: '로그인 처리 중 오류가 발생했습니다.' }
    });
  }, [accessToken, error, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            로그인 처리 중...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
