import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Volume2, Star, Clock, ArrowRight, RotateCcw, Loader } from 'lucide-react';
import Button from '@/shared/components/Button';
import { getFeedbackAPI } from '@/shared/api/results';

// 피드백 응답 타입 정의
interface FeedbackResponse {
  status: number;
  message: string;
  result: {
    feedbackType: 'PT' | 'NORMAL';
    videoPath: string;
    segment: Array<{
      start: number;
      end: number;
      text: string;
      intent: string;
    }>;
    transcript: string;
    expressions: Array<{
      second: number;
      expression: string;
    }>;
    question?: string;
    title?: string;
    situation?: string;
  };
}

interface SetFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  setIndex: number;
  answerAttemptIds: string[];
  onNextSet: () => void;
  onRetrySet: () => void;
  isLastSet: boolean;
  interviewUuid?: string;
}

export default function SetFeedbackModal({ 
  isOpen, 
  onClose, 
  setIndex, 
  answerAttemptIds, 
  onNextSet,
  onRetrySet,
  isLastSet,
  interviewUuid: _interviewUuid
}: SetFeedbackModalProps) {
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  
  // 모달이 닫힐 때 로딩 상태 리셋
  useEffect(() => {
    if (!isOpen) {
      setIsGeneratingNext(false);
      setCurrentFeedbackIndex(0);
    }
  }, [isOpen]);
  
  // 현재 피드백 데이터 로드
  const currentAnswerAttemptId = answerAttemptIds[currentFeedbackIndex];
  
  const { 
    data: feedbackData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['setFeedback', currentAnswerAttemptId],
    queryFn: async () => {
      if (!currentAnswerAttemptId) return null;
      const response = await getFeedbackAPI(currentAnswerAttemptId);
      return response as unknown as FeedbackResponse;
    },
    enabled: !!currentAnswerAttemptId && isOpen,
  });

  // 세트별로 질문 번호 계산 (본질문 번호는 세트 번호 + 1)
  const mainQuestionNumber = setIndex + 1;
  const questionTitles = [
    `질문 ${mainQuestionNumber}`,
    `꼬리질문 ${mainQuestionNumber}-1`,
    `꼬리질문 ${mainQuestionNumber}-2`
  ];

  const handleNext = () => {
    if (currentFeedbackIndex < answerAttemptIds.length - 1) {
      setCurrentFeedbackIndex(currentFeedbackIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFeedbackIndex > 0) {
      setCurrentFeedbackIndex(currentFeedbackIndex - 1);
    }
  };

  const handleRetrySet = () => {
    onRetrySet();
  };

  const handleContinue = () => {
    if (isLastSet) {
      // 마지막 세트면 면접 완료
      onClose();
    } else {
      // 다음 세트로 진행 - InterviewSession에서 질문 생성 처리
      setIsGeneratingNext(true);
      onNextSet();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  세트 {setIndex + 1} 피드백
                </h2>
                <p className="text-gray-600 mt-1">
                  {questionTitles[currentFeedbackIndex]} ({currentFeedbackIndex + 1}/3)
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">피드백을 불러오는 중...</span>
                </div>
              )}

              {isError && (
                <div className="text-center py-12">
                  <p className="text-red-600">피드백을 불러오는데 실패했습니다.</p>
                </div>
              )}

              {feedbackData && (
                <div className="space-y-6">
                  {/* 질문 */}
                  {feedbackData.result.question && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">질문</h3>
                      <p className="text-blue-800">{feedbackData.result.question}</p>
                    </div>
                  )}

                  {/* 비디오 */}
                  {feedbackData.result.videoPath && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Play className="w-5 h-5 mr-2" />
                        답변 영상
                      </h3>
                      <video
                        controls
                        className="w-full max-w-md mx-auto rounded-lg"
                        src={feedbackData.result.videoPath}
                      >
                        영상을 재생할 수 없습니다.
                      </video>
                    </div>
                  )}

                  {/* 전사 텍스트 */}
                  {feedbackData.result.transcript && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Volume2 className="w-5 h-5 mr-2" />
                        답변 전사
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {feedbackData.result.transcript}
                      </p>
                    </div>
                  )}

                  {/* 표정 분석 */}
                  {feedbackData.result.expressions && feedbackData.result.expressions.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        표정 분석
                      </h3>
                      <div className="space-y-2">
                        {feedbackData.result.expressions.slice(0, 5).map((expr, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-green-600" />
                            <span className="text-green-800">
                              {Math.floor(expr.second)}초: {expr.expression}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t bg-gray-50">
              {/* 질문 네비게이션 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentFeedbackIndex === 0}
                    size="sm"
                  >
                    이전 질문
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentFeedbackIndex === answerAttemptIds.length - 1}
                    size="sm"
                  >
                    다음 질문
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  {currentFeedbackIndex + 1} / {answerAttemptIds.length} 피드백
                </div>
              </div>

              {/* 세트 완료 후 액션 */}
              {currentFeedbackIndex === answerAttemptIds.length - 1 && (
                <div className="border-t pt-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      세트 {setIndex + 1} 완료
                    </h3>
                    <p className="text-gray-600">
                      {isLastSet 
                        ? '모든 질문이 완료되었습니다. 면접을 종료하거나 이 세트를 다시 시도할 수 있습니다.'
                        : '이 세트를 다시 시도하거나 다음 세트로 진행할 수 있습니다.'
                      }
                    </p>
                    {!isLastSet && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">다음 세트 미리보기</p>
                        <p className="text-sm text-blue-700">
                          질문 {setIndex + 2}, 꼬리질문 {setIndex + 2}-1, 꼬리질문 {setIndex + 2}-2
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleRetrySet}
                      className="flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      세트 리트라이
                    </Button>
                    
                    <Button
                      onClick={handleContinue}
                      disabled={isGeneratingNext}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center"
                    >
                      {isGeneratingNext ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          질문 생성 중...
                        </>
                      ) : (
                        <>
                          {isLastSet ? '면접 완료' : '다음 세트로'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* 닫기 버튼 (마지막 질문이 아닐 때만) */}
              {currentFeedbackIndex < answerAttemptIds.length - 1 && (
                <div className="flex justify-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    나중에 보기
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
