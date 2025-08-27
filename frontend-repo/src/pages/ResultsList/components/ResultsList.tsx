// src/components/results/list/ResultsList.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Modal from '@/shared/components/Modal';
import { deleteInterviewAPI } from '@/shared/api/results';
import type { InterviewResultSummary } from '@/shared/types/result';

interface ResultsListProps {
  results: InterviewResultSummary[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const typeColorMap: { [key: string]: string } = {
  직무: 'bg-blue-100 text-blue-800',
  인성: 'bg-indigo-100 text-indigo-800',
  PT: 'bg-green-100 text-green-800',
};

const ResultsList = ({ results, currentPage, totalPages, onPageChange }: ResultsListProps) => {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    interviewUuid: string;
    enterpriseName: string;
  }>({ isOpen: false, interviewUuid: '', enterpriseName: '' });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteInterviewAPI,
    onSuccess: (response) => {
      // 성공 시 캐시 무효화하여 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['results'] });
      
      // 삭제 확인 모달 닫기
      setDeleteModal({ isOpen: false, interviewUuid: '', enterpriseName: '' });
      
      // 성공 메시지 모달 표시
      setSuccessModal({ 
        isOpen: true, 
        message: (response as { message?: string })?.message || '면접 이력이 성공적으로 삭제되었습니다.' 
      });
    },
    onError: (error) => {
      // 삭제 확인 모달 닫기
      setDeleteModal({ isOpen: false, interviewUuid: '', enterpriseName: '' });
      
      // 에러 메시지 모달 표시
      setSuccessModal({ 
        isOpen: true, 
        message: '삭제 중 오류가 발생했습니다. 다시 시도해 주세요.' 
      });
      console.error('Delete error:', error);
    }
  });

  const handleDeleteClick = (interviewUuid: string, enterpriseName: string) => {
    setDeleteModal({ isOpen: true, interviewUuid, enterpriseName });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.interviewUuid) {
      deleteMutation.mutate(deleteModal.interviewUuid);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, interviewUuid: '', enterpriseName: '' });
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal({ isOpen: false, message: '' });
  };
  
  if (results.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-4 text-xl font-semibold text-gray-900">결과를 찾을 수 없습니다.</h3>
        <p className="mt-2 text-sm text-gray-500">선택하신 필터에 맞는 면접 결과가 없습니다. 다른 조건을 시도해 보세요.</p>
      </div>
    );
  }

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`mx-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            currentPage === i
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((result) => (
          <Card 
            key={result.interviewUuid} 
            padding="lg" 
            className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex flex-col h-full">
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${typeColorMap[result.interviewType] || 'bg-gray-100 text-gray-800'}`}>
                    {result.interviewType} 면접
                  </span>
                  <p className="text-sm text-gray-400">
                    {format(new Date(result.createdAt), 'yyyy년 MM월 dd일')}
                  </p>
                </div>
                <h3 className="text-xl font-bold text-gray-800 truncate">
                  {result.enterpriseName || '회사 정보 없음'}
                </h3>
                <p className="text-gray-600 mt-1">{result.position || '직무 정보 없음'}</p>
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 mt-6">
                <Button 
                  asLink 
                  href={`/results/${result.interviewUuid}?type=${result.interviewType}`}
                  variant="primary" 
                  className="w-full sm:w-auto"
                >
                  상세 분석 보기
                </Button>
                <Button
                  onClick={() => handleDeleteClick(result.interviewUuid, result.enterpriseName)}
                  variant="outline"
                  className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  삭제
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 pt-4 border-t border-gray-200">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </Button>
          <div className="hidden sm:flex mx-4">
            {renderPageNumbers()}
          </div>
          <div className="sm:hidden mx-2 text-sm text-gray-600">
            {currentPage} / {totalPages}
          </div>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </Button>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        title="면접 결과 삭제"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <span className="font-semibold">{deleteModal.enterpriseName}</span>의 면접 결과를 삭제하시겠습니까?
          </p>
          <p className="text-sm text-red-600">
            삭제된 면접 결과는 복구할 수 없습니다.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCloseDeleteModal}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 성공/에러 메시지 모달 */}
      <Modal
        isOpen={successModal.isOpen}
        onClose={handleCloseSuccessModal}
        title="알림"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{successModal.message}</p>
          <div className="pt-4">
            <Button
              onClick={handleCloseSuccessModal}
              variant="primary"
              className="w-full"
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResultsList;