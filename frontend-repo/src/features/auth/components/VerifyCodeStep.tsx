import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { verifyPasswordResetCodeAPI } from '@/shared/api/auth';

interface VerifyCodeStepProps {
  email: string;
  onVerified: (code: string) => void;
  onBackToEmail: () => void;
}

export default function VerifyCodeStep({ email, onVerified, onBackToEmail }: VerifyCodeStepProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(180); // 3분 = 180초
  const [isTimerActive, setIsTimerActive] = useState(true);

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      setError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const verifyMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => 
      verifyPasswordResetCodeAPI(email, code),
    onSuccess: (response: any) => {
      
      // 다양한 응답 구조를 처리
      const isVerified = response.data?.result?.verified === true || 
                        response.result?.verified === true ||
                        response.verified === true;
      
      if (isVerified) {
        setIsTimerActive(false); // 인증 성공 시 타이머 중지
        onVerified(code);
      } else {
        setError('인증이 완료되지 않았습니다. 다시 시도해주세요.');
      }
    },
    onError: (err: any) => {
      setError(err.message || '인증번호가 올바르지 않습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timer === 0) {
      setError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
      return;
    }
    if (!code.trim()) {
      setError('인증번호를 입력해주세요.');
      return;
    }
    setError('');
    verifyMutation.mutate({ email, code });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">인증번호 확인</h2>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold">{email}</span>으로 발송된 인증번호를 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            인증번호
          </label>
          <div className="flex items-center">
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError('');
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="인증번호를 입력하세요"
              disabled={timer === 0}
            />
            <span className={`ml-3 text-sm font-medium min-w-[50px] ${timer <= 60 ? 'text-red-600' : 'text-gray-600'}`}>
              {`${Math.floor(timer / 60)}:${timer % 60 < 10 ? `0${timer % 60}` : timer % 60}`}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBackToEmail}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            이메일 다시 입력
          </button>
          <button
            type="submit"
            disabled={verifyMutation.isPending || !code.trim() || timer === 0}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {verifyMutation.isPending ? '확인 중...' : '인증번호 확인'}
          </button>
        </div>
      </form>
    </div>
  );
}
