import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/store/authStore';
import { withdrawAPI } from '@/shared/api/auth';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const loginType = useAuthStore((state) => state.loginType);

  const { mutate, isPending } = useMutation({
    mutationFn: withdrawAPI,
    onSuccess: () => {
      alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
      logout();
      
      // 소셜 로그인 사용자의 경우 구글 세션도 제거
      if (loginType === 'GOOGLE') {
        // 구글 로그아웃 후 홈페이지로 리다이렉트
        window.location.href = 'https://accounts.google.com/logout?continue=' + encodeURIComponent(window.location.origin);
      } else {
        navigate('/');
      }
    },
    onError: (err) => {
      setApiError(err.message);
    }
  });

  const handleSubmit = () => {
    setApiError(null);
    if (!isConfirmed) {
      alert('탈퇴 시 발생하는 문제를 확인해주세요.');
      return;
    }
    mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4 text-red-600">회원 탈퇴</h2>
      <p className="mb-6 text-gray-600">
        정말로 탈퇴하시겠습니까? 탈퇴 시 다음과 같은 문제가 발생합니다:
      </p>
      
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <ul className="text-sm text-red-700 space-y-2">
          <li>• 모든 면접 기록이 영구적으로 삭제됩니다</li>
          <li>• 개인 정보가 완전히 삭제되며 복구할 수 없습니다</li>
          <li>• 업로드한 지원서 및 자료가 모두 삭제됩니다</li>
          <li>• 계정 복구나 데이터 복원이 불가능합니다</li>
        </ul>
      </div>
      
      {apiError && <p className="text-sm text-red-600 mb-4">오류: {apiError}</p>}

      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mr-3 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">
            위 내용을 모두 확인했으며, 탈퇴로 인한 모든 결과를 이해하고 동의합니다.
          </span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button 
          variant="danger"
          onClick={handleSubmit}
          disabled={isPending || !isConfirmed}
        >
          {isPending ? '처리 중...' : '탈퇴하기'}
        </Button>
      </div>
    </Modal>
  );
}