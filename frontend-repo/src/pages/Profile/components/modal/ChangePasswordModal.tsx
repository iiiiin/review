import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { changePasswordAPI } from '@/shared/api/auth';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  // const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: changePasswordAPI,
    onSuccess: () => {
      alert('비밀번호가 성공적으로 변경되었습니다.');
      onClose();
    },
    onError: (err) => {
      setApiError(err.message);
    }
  });

  const handleSubmit = () => {
    // 에러 상태 초기화
    setClientError('');
    setApiError(null);

    // 클라이언트 측 유효성 검사
    if (newPassword !== confirmPassword) {
      setClientError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setClientError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    mutate({ currentPassword, newPassword });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">비밀번호 변경</h2>
      {apiError && <p className="text-sm text-red-600 mb-4">{apiError}</p>}
      {clientError && <p className="text-sm text-red-600 mb-4">{clientError}</p>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? '변경 중...' : '변경하기'}
        </Button>
      </div>
    </Modal>
  );
}