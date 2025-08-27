import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { resetPasswordAPI } from '@/shared/api/auth';

interface ResetPasswordStepProps {
  email: string;
  verifiedCode: string;
  onBack: () => void;
}

export default function ResetPasswordStep({ email, onBack }: ResetPasswordStepProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const resetMutation = useMutation({
    mutationFn: resetPasswordAPI,
    onSuccess: () => {
      alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
      navigate('/auth/login');
    },
    onError: (err: any) => {
      setError(err.message || '비밀번호 변경에 실패했습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    setError('');
    resetMutation.mutate({ 
      email, 
      newPassword: password,
      confirmPassword: passwordConfirm
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">새 비밀번호 설정</h2>
        <p className="mt-2 text-sm text-gray-600">
          새로 사용할 비밀번호를 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            새 비밀번호
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="새 비밀번호를 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
            새 비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              if (error) setError('');
            }}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="새 비밀번호를 다시 입력하세요"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            이전 단계
          </button>
          <button
            type="submit"
            disabled={resetMutation.isPending || !password || !passwordConfirm}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {resetMutation.isPending ? '변경 중...' : '비밀번호 재설정'}
          </button>
        </div>
      </form>
    </div>
  );
}