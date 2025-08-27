// src/components/results/detail/QuestionAnalysis.tsx
import { useState, useMemo } from 'react';
import Card from '@/shared/components/Card';
import type { Question } from '@/shared/types/result'; // Question 타입 임포트

interface QuestionAnalysisProps {
  questionData: Question;
  mainIndex: number;
}

// 재귀적인 질문 구조를 평탄화하는 헬퍼 함수
const flattenQuestions = (question: Question, mainIndex: number): (Question & { displayQuestionNumber: string })[] => {
  const result: (Question & { displayQuestionNumber: string })[] = [];
  result.push({ ...question, displayQuestionNumber: `${mainIndex + 1}` });

  question.children.forEach((child, childIndex) => {
    result.push({ ...child, displayQuestionNumber: `${mainIndex + 1}-${childIndex + 1}` });
    // 꼬리질문의 꼬리질문이 있다면 재귀적으로 추가 (현재 API 명세는 1단계까지만 있음)
  });
  return result;
};

export default function QuestionAnalysis({ questionData, mainIndex }: QuestionAnalysisProps) {
  const [isOpen, setIsOpen] = useState(mainIndex === 0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 메인 질문과 꼬리 질문을 하나의 배열로 만듭니다.
  const allQuestions = useMemo(() => flattenQuestions(questionData, mainIndex), [questionData, mainIndex]);
  
  const currentQuestion = allQuestions[currentIndex];
  const videoUrl = currentQuestion.answerAttempts?.[0]?.videoUrl;

  const handleQuestionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < allQuestions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center"
      >
        <h3 className="text-md font-semibold text-gray-800">
          {questionData.question}
        </h3>
        {/* 점수 필드가 없으므로 제거 */}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-200 relative group">
          {allQuestions.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleQuestionChange('prev'); }}
                disabled={currentIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              >
                &lt;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleQuestionChange('next'); }}
                disabled={currentIndex === allQuestions.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              >
                &gt;
              </button>
            </>
          )}

          <div key={currentIndex} className="animate-fade-in">
            <div className="text-center pt-4 mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                {currentQuestion.question}
              </h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t">
              <div className="space-y-6">
                <Card padding="sm">
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">답변 영상</h5>
                  {videoUrl ? (
                     <video controls src={videoUrl} className="w-full aspect-video rounded-lg bg-black" />
                  ) : (
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center"><p>영상을 찾을 수 없습니다.</p></div>
                  )}
                </Card>
              </div>
              <div className="space-y-6">
                <Card padding="sm"><h5 className="text-lg font-semibold text-gray-900 mb-2">AI 피드백</h5><p>{currentQuestion.feedback}</p></Card>
                {currentQuestion.improvementSuggestions && (
                  <Card padding="sm"><h5 className="text-lg font-semibold text-gray-900 mb-2">개선할 점</h5><p>{currentQuestion.improvementSuggestions}</p></Card>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <Card padding="sm"><h5 className="text-lg font-semibold text-gray-900 mb-2">출제 의도</h5><p>{currentQuestion.purpose}</p></Card>
              <Card padding="sm"><h5 className="text-lg font-semibold text-gray-900 mb-2">모범 답안</h5><p>{currentQuestion.suggestedAnswer}</p></Card>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}