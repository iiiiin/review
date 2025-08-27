import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFeedbackAPI } from '@/shared/api/results';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import EmotionTimelineGraph from '@/pages/ResultDetail/components/EmotionTimelineGraph';

// API 응답 타입 정의
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
    question?: string; // 인성/직무 면접에만 있음
    title?: string; // PT 면접에만 있음
    situation?: string; // PT 면접에만 있음
    whiteboard?: string; // PT 면접에만 있음
  };
}

interface QuestionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingIds: string[]; // 세트의 3개 recordingId
  setIndex: number; // 몇 번째 세트인지
  onNextSet: () => void;
  onRetrySet: () => void;
  isLastSet: boolean;
  availableRecordingIds?: string[]; // 외부에서 전달받은 available recordingIds
}

export default function QuestionFeedbackModal({ 
  isOpen, 
  onClose, 
  recordingIds, 
  setIndex,
  onNextSet,
  onRetrySet,
  isLastSet,
  availableRecordingIds = []
}: QuestionFeedbackModalProps) {
  
  // 모달 상태 변화 로깅
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 [QuestionFeedbackModal] 모달 열림');
      console.log('🔍 setIndex:', setIndex);
      console.log('🔍 recordingIds:', recordingIds);
      console.log('🔍 isLastSet:', isLastSet);
    } else {
      console.log('🔍 [QuestionFeedbackModal] 모달 닫힘');
    }
  }, [isOpen, setIndex, recordingIds, isLastSet]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [availableFeedbacks, setAvailableFeedbacks] = useState<{[recordingId: string]: boolean}>({});
  
  // 현재 질문의 recordingId
  const currentRecordingId = recordingIds[currentQuestionIndex];
  
  // 현재 질문의 피드백 데이터 로드
  const { 
    data: feedbackData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['questionFeedback', currentRecordingId],
    queryFn: async () => {
      if (!currentRecordingId) return null;
      console.log(`🔍 질문 ${currentQuestionIndex + 1} 피드백 로드:`, currentRecordingId);
      const response = await getFeedbackAPI(currentRecordingId);
      
      // 피드백 로드 성공 시 available로 표시
      setAvailableFeedbacks(prev => ({
        ...prev,
        [currentRecordingId]: true
      }));
      
      return response as unknown as FeedbackResponse;
    },
    enabled: !!currentRecordingId && isOpen,
  });

  const questionTitles = ['본질문', '꼬리질문 1', '꼬리질문 2'];

  // 모달이 열릴 때 현재 인덱스 초기화 및 첫 번째 질문 available 표시
  useEffect(() => {
    if (isOpen && recordingIds.length > 0) {
      setCurrentQuestionIndex(0);
      setAvailableFeedbacks(prev => ({
        ...prev,
        [recordingIds[0]]: true // 첫 번째 질문은 항상 available
      }));
    }
  }, [isOpen, recordingIds]);

  // 외부에서 전달받은 available recordingIds 업데이트
  useEffect(() => {
    if (availableRecordingIds.length > 0) {
      const newAvailable: {[key: string]: boolean} = {};
      availableRecordingIds.forEach(id => {
        newAvailable[id] = true;
      });
      setAvailableFeedbacks(prev => ({
        ...prev,
        ...newAvailable
      }));
    }
  }, [availableRecordingIds]);

  // recordingIds가 실시간으로 업데이트될 때 available 상태도 업데이트
  useEffect(() => {
    if (recordingIds.length > 0) {
      console.log('🔍 [QuestionFeedbackModal] recordingIds 업데이트됨:', recordingIds);
      const newAvailable: {[key: string]: boolean} = {};
      recordingIds.forEach(id => {
        if (id) { // null이 아닌 경우만
          newAvailable[id] = true;
        }
      });
      setAvailableFeedbacks(prev => {
        const updated = { ...prev, ...newAvailable };
        console.log('🔍 [QuestionFeedbackModal] availableFeedbacks 업데이트:', updated);
        return updated;
      });
    }
  }, [recordingIds]);

  const handleNext = () => {
    console.log('🔍 [QuestionFeedbackModal] handleNext 버튼 클릭됨');
    console.log('🔍 현재 질문 인덱스:', currentQuestionIndex);
    console.log('🔍 전체 recordingIds:', recordingIds);
    console.log('🔍 availableFeedbacks:', availableFeedbacks);
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < recordingIds.length) {
      const nextRecordingId = recordingIds[nextIndex];
      console.log(`🔍 다음 질문 인덱스: ${nextIndex}, recordingId: ${nextRecordingId}`);
      
      // 다음 질문의 피드백이 준비되었을 때만 이동
      if (availableFeedbacks[nextRecordingId]) {
        console.log(`✅ 질문 ${nextIndex + 1} 피드백 준비됨 - 이동`);
        setCurrentQuestionIndex(nextIndex);
      } else {
        console.log(`⏳ 질문 ${nextIndex + 1}의 피드백이 아직 준비되지 않았습니다.`);
      }
    } else {
      console.log('🔍 마지막 질문에 도달함');
    }
  };

  // 다음 질문 버튼 활성화 여부 확인
  const isNextQuestionAvailable = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= recordingIds.length) {
      console.log('🔍 [QuestionFeedbackModal] 다음 질문 없음: 마지막 질문에 도달');
      return false;
    }
    const nextRecordingId = recordingIds[nextIndex];
    const isAvailable = availableFeedbacks[nextRecordingId] || false;
    console.log(`🔍 [QuestionFeedbackModal] 다음 질문 (${nextIndex + 1}) 상태:`, {
      nextRecordingId,
      isAvailable,
      availableFeedbacks: Object.keys(availableFeedbacks)
    });
    return isAvailable;
  };

  const handlePrevious = () => {
    console.log('🔍 [QuestionFeedbackModal] handlePrevious 버튼 클릭됨');
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRetrySet = () => {
    console.log('🔍 [QuestionFeedbackModal] handleRetrySet 버튼 클릭됨');
    console.log(`🔄 세트 ${setIndex + 1} 리트라이 요청`);
    onRetrySet();
  };

  const handleContinue = () => {
    console.log('🔍 [QuestionFeedbackModal] handleContinue 버튼 클릭됨');
    if (isLastSet) {
      // 마지막 세트면 면접 완료
      console.log('🎉 모든 세트 완료 - 면접 종료');
      console.log('🔍 [QuestionFeedbackModal] onClose() 호출 - 면접 완료');
      onClose();
    } else {
      // 다음 세트로 진행
      console.log(`🚀 다음 세트로 진행: 세트 ${setIndex + 2}`);
      console.log('🔍 [QuestionFeedbackModal] onNextSet() 호출');
      onNextSet();
      console.log('🔍 [QuestionFeedbackModal] onClose() 호출 - 다음 세트로');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="full">
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              세트 {setIndex + 1} - {questionTitles[currentQuestionIndex]}
            </h2>
            <p className="text-gray-600 mt-1">
              질문 {currentQuestionIndex + 1} / {recordingIds.length}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-gray-600">피드백을 불러오는 중...</p>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center h-64">
              <p className="text-red-600">피드백을 불러오는데 실패했습니다.</p>
            </div>
          )}

          {feedbackData?.result && (
            <div className="space-y-6">
              {/* 질문 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">질문</h3>
                <p className="text-blue-700">
                  {feedbackData.result.question || feedbackData.result.title || '질문 정보가 없습니다.'}
                </p>
              </div>

              {/* PT 면접인 경우 상황 표시 */}
              {feedbackData.result.feedbackType === 'PT' && feedbackData.result.situation && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">발표 상황</h4>
                  <p className="text-gray-700">{feedbackData.result.situation}</p>
                </div>
              )}

              {/* 동영상 */}
              {feedbackData.result.videoPath && (
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">답변 영상</h4>
                  <video 
                    src={feedbackData.result.videoPath} 
                    controls 
                    className="w-full max-w-2xl rounded-lg"
                  >
                    브라우저가 비디오를 지원하지 않습니다.
                  </video>
                </div>
              )}
              
              {/* 전사 내용 */}
              {feedbackData.result.transcript && (
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">답변 전사</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 font-mono whitespace-pre-wrap">
                      {feedbackData.result.transcript}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 표정 분석 - 타임라인 그래프 */}
              {feedbackData.result.expressions && feedbackData.result.expressions.length > 0 && (
                <div className="bg-white rounded-lg p-4 border">
                  <EmotionTimelineGraph
                    expressions={feedbackData.result.expressions}
                    currentTime={0} // 모달에서는 정적 표시
                    isPlaying={false}
                    animateEmotions={true}
                  />
                </div>
              )}
              
              {/* 세그먼트 분석 */}
              {feedbackData.result.segment && feedbackData.result.segment.length > 0 && (
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">답변 내용 분석</h4>
                  <div className="space-y-3">
                    {feedbackData.result.segment.map((segment, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">
                            {Math.floor(segment.start)}초 - {Math.floor(segment.end)}초
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {segment.intent}
                          </span>
                        </div>
                        <p className="text-gray-700">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 네비게이션 */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            {/* 질문 간 네비게이션 */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                이전 질문
              </Button>
              
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={(() => {
                  const isDisabled = currentQuestionIndex >= recordingIds.length - 1 || !isNextQuestionAvailable();
                  const nextAvailable = isNextQuestionAvailable();
                  console.log('🔍 [QuestionFeedbackModal] 다음 질문 버튼 렌더링:', {
                    currentQuestionIndex,
                    recordingIdsLength: recordingIds.length,
                    nextAvailable,
                    isDisabled
                  });
                  return isDisabled;
                })()}
                className="flex items-center"
              >
                {currentQuestionIndex >= recordingIds.length - 1 
                  ? '📝 마지막 질문'
                  : isNextQuestionAvailable() 
                    ? '▶️ 다음 질문'
                    : '⏳ 피드백 분석 중...'
                }
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* 세트 완료 후 액션 (마지막 질문에서만 표시) */}
            {currentQuestionIndex === recordingIds.length - 1 && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleRetrySet}
                  className="flex items-center"
                >
                  세트 리트라이
                </Button>
                
                <Button
                  onClick={handleContinue}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  {isLastSet ? '📋 전체 결과 보기' : '➡️ 다음 세트로'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
