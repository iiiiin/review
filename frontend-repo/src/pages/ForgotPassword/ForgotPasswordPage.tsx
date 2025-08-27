import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForgotPasswordStore } from '@/shared/store/authStore';
import { requestPasswordResetAPI } from '@/shared/api/auth';
import AuthLayout from '@/shared/layout/AuthLayout';
import VerifyCodeStep from '@/pages/ForgotPassword/components/VerifyCodeStep';
import ResetPasswordStep from '@/pages/ForgotPassword/components/ResetPasswordStep';

// 이메일 유효성 검사 함수
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export default function ForgotPasswordPage() {
  const { step, email, setStep, setEmail, reset } = useForgotPasswordStore();
  
  // 상태 관리
  const [verifiedCode, setVerifiedCode] = useState('');
  const [emailError, setEmailError] = useState('');

  // 페이지를 벗어날 때 스토어 상태를 초기화합니다.
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // 이메일 인증번호 발송 mutation
  const emailMutation = useMutation({
    mutationFn: requestPasswordResetAPI,
    onSuccess: () => {
      setStep(2);
    },
  });

  // 이메일 제출 핸들러
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    setEmailError('');
    emailMutation.mutate(email);
  };

  // 인증번호 확인 완료 핸들러
  const handleCodeVerified = (code: string) => {
    setVerifiedCode(code);
    setStep(3);
  };

  // 이전 단계로 돌아가기 핸들러
  const handleBackToEmail = () => {
    setStep(1);
    setVerifiedCode('');
  };

  const handleBackToCode = () => {
    setStep(2);
  };

  // Step 1: 이메일 입력
  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h2>
        <p className="mt-2 text-sm text-gray-600">
          가입 시 사용한 이메일 주소를 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-6">
        {emailMutation.isSuccess && (
          <p className="text-sm text-green-600">
            입력하신 이메일로 인증번호를 발송했습니다.
          </p>
        )}
        {emailMutation.error && (
          <p className="text-sm text-red-600">오류: {emailMutation.error.message}</p>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            가입한 이메일 주소
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              emailError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="이메일을 입력하세요"
          />
          {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
        </div>
        
        <button
          type="submit"
          disabled={emailMutation.isPending || !email || !!emailError}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {emailMutation.isPending ? '발송 중...' : '인증번호 발송'}
        </button>
      </form>
    </div>
  );

  // 단계별 렌더링
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderEmailStep();
      case 2:
        return (
          <VerifyCodeStep
            email={email}
            onVerified={handleCodeVerified}
            onBackToEmail={handleBackToEmail}
          />
        );
      case 3:
        return (
          <ResetPasswordStep
            email={email}
            verifiedCode={verifiedCode}
            onBack={handleBackToCode}
          />
        );
      default:
        return renderEmailStep();
    }
  };

  return (
    <AuthLayout title="Re:View" subtitle="가입 시 사용한 이메일로 비밀번호를 재설정하세요">
      {renderCurrentStep()}
      <p className="mt-6 text-center text-sm text-gray-600">
        로그인 페이지로 돌아가시겠어요?{' '}
        <Link
          to="/auth/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          로그인
        </Link>
      </p>
    </AuthLayout>
  );
}
