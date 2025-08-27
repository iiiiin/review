// StepByStepFeedbackPage 새로운 설계
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface FeedbackPageMode {
  type: 'main' | 'followUp' | 'full';
  questionIndexes: number[];
  currentStep: number;
}

interface QuestionFeedback {
  attemptId: string;
  feedback: any;
  questionText: string;
  questionType: 'main' | 'followUp';
  index: number;
}

export default function StepByStepFeedbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL 파라미터 분석
  const resultId = useParams().resultId;
  const isMainOnly = searchParams.get('mainOnly') === 'true';
  const isFollowUpOnly = searchParams.get('followUpOnly') === 'true';
  const step = parseInt(searchParams.get('step') || '0');
  const attemptIdsParam = searchParams.get('attemptIds') || '';
  const attemptIds = attemptIdsParam.split(',').filter(Boolean);

  // 페이지 모드 결정
  const pageMode: FeedbackPageMode = useMemo(() => {
    if (isMainOnly) {
      return {
        type: 'main',
        questionIndexes: [0],
        currentStep: 0
      };
    } else if (isFollowUpOnly) {
      return {
        type: 'followUp',
        questionIndexes: [1, 2], // 꼬리질문 1, 2
        currentStep: step - 1 // step 1 = 꼬리질문 1 (인덱스 0)
      };
    } else {
      return {
        type: 'full',
        questionIndexes: [0, 1, 2], // 전체
        currentStep: step
      };
    }
  }, [isMainOnly, isFollowUpOnly, step]);

  // 피드백 데이터 상태
  const [feedbacks, setFeedbacks] = useState<QuestionFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentViewIndex, setCurrentViewIndex] = useState(pageMode.currentStep);

  // 피드백 데이터 로드
  useEffect(() => {
    loadFeedbackData();
  }, [attemptIds, pageMode]);

  const loadFeedbackData = async () => {
    setIsLoading(true);
    
    try {
      const feedbackPromises = attemptIds.map(async (attemptId, index) => {
        // 실제 API 호출
        const response = await fetch(`/api/interview/feedback/${attemptId}`);
        const feedbackData = await response.json();
        
        return {
          attemptId,
          feedback: feedbackData,
          questionText: feedbackData.questionText || `질문 ${index}`,
          questionType: index === 0 ? 'main' : 'followUp',
          index
        } as QuestionFeedback;
      });
      
      const loadedFeedbacks = await Promise.all(feedbackPromises);
      setFeedbacks(loadedFeedbacks);
      
      console.log('✅ 피드백 데이터 로드 완료:', loadedFeedbacks);
    } catch (error) {
      console.error('❌ 피드백 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 네비게이션 핸들러
  const handlePrevious = () => {
    if (currentViewIndex > 0) {
      setCurrentViewIndex(currentViewIndex - 1);
      updateURL(currentViewIndex - 1);
    }
  };

  const handleNext = () => {
    const maxIndex = pageMode.questionIndexes.length - 1;
    if (currentViewIndex < maxIndex) {
      setCurrentViewIndex(currentViewIndex + 1);
      updateURL(currentViewIndex + 1);
    }
  };

  const updateURL = (newIndex: number) => {
    const newStep = pageMode.type === 'followUp' ? newIndex + 1 : newIndex;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', newStep.toString());
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  // 현재 표시할 피드백
  const currentFeedback = feedbacks[currentViewIndex];
  const isFirstStep = currentViewIndex === 0;
  const isLastStep = currentViewIndex === feedbacks.length - 1;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 헤더 섹션 */}
        <FeedbackHeader 
          mode={pageMode}
          currentIndex={currentViewIndex}
          totalCount={feedbacks.length}
          currentFeedback={currentFeedback}
        />

        {/* 메인 피드백 섹션 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {currentFeedback ? (
            <DetailedFeedbackView feedback={currentFeedback} />
          ) : (
            <EmptyFeedbackView />
          )}
        </div>

        {/* 네비게이션 섹션 */}
        <NavigationControls
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrevious={handlePrevious}
          onNext={handleNext}
          mode={pageMode}
          currentFeedback={currentFeedback}
        />

        {/* 진행 상태 표시 */}
        <ProgressIndicator
          mode={pageMode}
          currentIndex={currentViewIndex}
          feedbacks={feedbacks}
        />
      </div>
    </div>
  );
}

// 헤더 컴포넌트
const FeedbackHeader: React.FC<{
  mode: FeedbackPageMode;
  currentIndex: number;
  totalCount: number;
  currentFeedback: QuestionFeedback | undefined;
}> = ({ mode, currentIndex, totalCount, currentFeedback }) => {
  const getTitle = () => {
    switch (mode.type) {
      case 'main':
        return '본질문 피드백';
      case 'followUp':
        return `꼬리질문 ${currentIndex + 1} 피드백`;
      case 'full':
        return currentIndex === 0 ? '본질문 피드백' : `꼬리질문 ${currentIndex} 피드백`;
      default:
        return '피드백';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600 mt-2">
            {currentFeedback?.questionText || '질문을 불러오는 중...'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {currentIndex + 1} / {totalCount}
        </div>
      </div>
    </div>
  );
};

// 상세 피드백 뷰
const DetailedFeedbackView: React.FC<{ feedback: QuestionFeedback }> = ({ feedback }) => {
  return (
    <div className="space-y-6">
      {/* 점수 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard
          title="종합 점수"
          score={feedback.feedback.overallScore}
          maxScore={100}
          color="blue"
        />
        <ScoreCard
          title="내용 적절성"
          score={feedback.feedback.contentScore}
          maxScore={100}
          color="green"
        />
        <ScoreCard
          title="표현력"
          score={feedback.feedback.deliveryScore}
          maxScore={100}
          color="purple"
        />
      </div>

      {/* 강점 섹션 */}
      <FeedbackSection
        title="🎯 강점"
        content={feedback.feedback.strengths}
        bgColor="bg-green-50"
        borderColor="border-green-200"
      />

      {/* 개선점 섹션 */}
      <FeedbackSection
        title="📈 개선점"
        content={feedback.feedback.improvements}
        bgColor="bg-orange-50"
        borderColor="border-orange-200"
      />

      {/* 상세 분석 섹션 */}
      <FeedbackSection
        title="📊 상세 분석"
        content={feedback.feedback.detailedAnalysis}
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
      />
    </div>
  );
};

// 점수 카드 컴포넌트
const ScoreCard: React.FC<{
  title: string;
  score: number;
  maxScore: number;
  color: string;
}> = ({ title, score, maxScore, color }) => {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold text-${color}-600`}>
          {score}
        </span>
        <span className="text-gray-500">/ {maxScore}</span>
      </div>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div
          className={`bg-${color}-500 rounded-full h-2 transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// 피드백 섹션 컴포넌트
const FeedbackSection: React.FC<{
  title: string;
  content: string;
  bgColor: string;
  borderColor: string;
}> = ({ title, content, bgColor, borderColor }) => (
  <div className={`${bgColor} ${borderColor} border rounded-lg p-6`}>
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
      {content || '분석 중입니다...'}
    </p>
  </div>
);

// 네비게이션 컨트롤
const NavigationControls: React.FC<{
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  mode: FeedbackPageMode;
  currentFeedback: QuestionFeedback | undefined;
}> = ({ isFirstStep, isLastStep, onPrevious, onNext, mode, currentFeedback }) => {
  const navigate = useNavigate();

  const handleReturnToCompletion = () => {
    // CompletionScreen으로 돌아가기
    navigate(-1);
  };

  return (
    <div className="flex justify-between items-center">
      <button
        onClick={onPrevious}
        disabled={isFirstStep}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        이전 질문
      </button>

      <div className="flex gap-3">
        <button
          onClick={handleReturnToCompletion}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          결과 페이지로
        </button>

        {!isLastStep ? (
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            다음 질문
          </button>
        ) : (
          <button
            onClick={() => navigate('/results')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            전체 결과 목록
          </button>
        )}
      </div>
    </div>
  );
};

// 진행 상태 표시
const ProgressIndicator: React.FC<{
  mode: FeedbackPageMode;
  currentIndex: number;
  feedbacks: QuestionFeedback[];
}> = ({ mode, currentIndex, feedbacks }) => (
  <div className="mt-8 flex justify-center">
    <div className="flex items-center gap-2">
      {feedbacks.map((_, index) => (
        <React.Fragment key={index}>
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex
                ? 'bg-blue-600'
                : index < currentIndex
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
          />
          {index < feedbacks.length - 1 && (
            <div className="w-8 h-0.5 bg-gray-300" />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// 로딩 스피너
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">피드백을 불러오는 중...</p>
    </div>
  </div>
);

// 빈 피드백 뷰
const EmptyFeedbackView = () => (
  <div className="text-center py-12">
    <div className="text-gray-400 mb-4">
      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <p className="text-gray-500">피드백 데이터를 준비하고 있습니다.</p>
  </div>
);