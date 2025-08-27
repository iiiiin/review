// CompletionScreen 새로운 설계
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketStore } from '@/shared/store/websocketStore';

interface CompletionScreenProps {
  resultId: string | null;
  interviewType: string;
  answerAttemptIds: string[];
}

interface FeedbackState {
  mainQuestion: {
    attemptId: string | null;
    feedback: any | null;
    isLoaded: boolean;
  };
  followUpQuestions: {
    attemptIds: string[];
    count: number;
    hasAny: boolean;
  };
}

export default function CompletionScreen({ 
  resultId, 
  interviewType, 
  answerAttemptIds 
}: CompletionScreenProps) {
  const navigate = useNavigate();
  const { interviewInProgress, totalQuestions, completedQuestions } = useWebSocketStore();
  
  // 피드백 상태 관리
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    mainQuestion: {
      attemptId: null,
      feedback: null,
      isLoaded: false
    },
    followUpQuestions: {
      attemptIds: [],
      count: 0,
      hasAny: false
    }
  });

  // answerAttemptIds 분석 및 분류
  useEffect(() => {
    if (answerAttemptIds.length > 0) {
      const mainAttemptId = answerAttemptIds[0]; // 질문 0
      const followUpAttemptIds = answerAttemptIds.slice(1); // 꼬리질문 1,2
      
      setFeedbackState(prev => ({
        ...prev,
        mainQuestion: {
          ...prev.mainQuestion,
          attemptId: mainAttemptId
        },
        followUpQuestions: {
          attemptIds: followUpAttemptIds,
          count: followUpAttemptIds.length,
          hasAny: followUpAttemptIds.length > 0
        }
      }));
      
      // 질문 0 피드백 로드
      loadMainQuestionFeedback(mainAttemptId);
    }
  }, [answerAttemptIds]);

  // 질문 0 피드백 로드
  const loadMainQuestionFeedback = async (attemptId: string) => {
    try {
      console.log('📋 질문 0 피드백 로드 시작:', attemptId);
      
      // API 호출 (실제 구현에서는 import된 함수 사용)
      const response = await fetch(`/api/interview/feedback/${attemptId}`);
      const feedbackData = await response.json();
      
      setFeedbackState(prev => ({
        ...prev,
        mainQuestion: {
          ...prev.mainQuestion,
          feedback: feedbackData,
          isLoaded: true
        }
      }));
      
      console.log('✅ 질문 0 피드백 로드 완료');
    } catch (error) {
      console.error('❌ 질문 0 피드백 로드 실패:', error);
    }
  };

  // 꼬리질문 피드백 페이지로 이동
  const navigateToFollowUpQuestions = () => {
    if (!feedbackState.followUpQuestions.hasAny) {
      console.warn('⚠️ 꼬리질문이 없습니다');
      return;
    }
    
    const followUpIds = feedbackState.followUpQuestions.attemptIds;
    const targetUrl = `/results/${resultId}/feedback?step=1&attemptIds=${followUpIds.join(',')}&count=${followUpIds.length}&followUpOnly=true`;
    
    console.log('🔗 꼬리질문 페이지로 이동:', targetUrl);
    navigate(targetUrl);
  };

  // 전체 결과 페이지로 이동 (기존)
  const navigateToFullResults = () => {
    const allIds = answerAttemptIds.join(',');
    const targetUrl = `/results/${resultId}/feedback?step=0&attemptIds=${allIds}&count=${answerAttemptIds.length}`;
    
    console.log('🔗 전체 결과 페이지로 이동:', targetUrl);
    navigate(targetUrl);
  };

  // 네비게이션 가능 여부 판단
  const canNavigate = !!resultId && answerAttemptIds.length > 0;
  const mainFeedbackReady = feedbackState.mainQuestion.isLoaded;
  const hasFollowUp = feedbackState.followUpQuestions.hasAny;

  return (
    <div className="min-h-screen w-full animated-gradient-bg">
      <main className="px-4 py-16 md:py-24 min-h-[75vh] flex items-center justify-center">
        <div className="w-full max-w-5xl md:max-w-6xl mx-auto">
          <div className="relative rounded-2xl shadow-2xl border border-white/30 p-1 bg-gradient-to-br from-white/50 to-white/20">
            <div className="bg-white/60 backdrop-blur-xl rounded-xl py-16 px-8 md:py-20 md:px-14 text-center">
              
              {/* 기본 완료 메시지 */}
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                  수고하셨습니다!
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  AI가 답변을 분석했습니다. 피드백을 확인해보세요.
                </p>
              </div>

              {/* 질문 0 피드백 섹션 */}
              {mainFeedbackReady && (
                <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">본질문 피드백</h3>
                  <div className="text-left">
                    {/* 피드백 요약 표시 */}
                    <FeedbackSummary feedback={feedbackState.mainQuestion.feedback} />
                  </div>
                </div>
              )}

              {/* 네비게이션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                
                {/* 꼬리질문 피드백 보기 버튼 */}
                {hasFollowUp && (
                  <button
                    onClick={navigateToFollowUpQuestions}
                    disabled={!canNavigate}
                    className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    꼬리질문 피드백 보기 ({feedbackState.followUpQuestions.count}개)
                  </button>
                )}

                {/* 전체 결과 보기 버튼 */}
                <button
                  onClick={navigateToFullResults}
                  disabled={!canNavigate}
                  className="px-8 py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  전체 상세 결과 보기
                </button>
              </div>

              {/* 진행 상태 표시 */}
              <div className="mt-8 text-sm text-gray-600">
                <div className="flex justify-center items-center gap-4">
                  <StatusIndicator 
                    label="본질문" 
                    completed={mainFeedbackReady} 
                  />
                  {hasFollowUp && (
                    <>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <StatusIndicator 
                        label={`꼬리질문 ${feedbackState.followUpQuestions.count}개`} 
                        completed={false} 
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 피드백 요약 컴포넌트
const FeedbackSummary: React.FC<{ feedback: any }> = ({ feedback }) => {
  if (!feedback) return <div>피드백을 불러오는 중...</div>;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">종합 점수:</span>
        <span className="text-xl font-bold text-blue-600">
          {feedback.overallScore || 'N/A'}점
        </span>
      </div>
      <div>
        <span className="font-medium text-gray-700">핵심 피드백:</span>
        <p className="text-gray-600 mt-1">
          {feedback.summary || '상세한 피드백을 준비하고 있습니다.'}
        </p>
      </div>
    </div>
  );
};

// 상태 표시 컴포넌트
const StatusIndicator: React.FC<{ label: string; completed: boolean }> = ({ 
  label, 
  completed 
}) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${
      completed ? 'bg-green-500' : 'bg-gray-300'
    }`}></div>
    <span className={completed ? 'text-green-600' : 'text-gray-500'}>
      {label}
    </span>
  </div>
);