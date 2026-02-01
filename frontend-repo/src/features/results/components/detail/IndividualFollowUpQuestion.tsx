import { useState } from 'react';
import AnswerAttemptToggle from './AnswerAttemptToggle';

interface Question {
  questionNumber: number;
  question: string;
  feedback: Array<{
    videoUrl?: string;
    intent?: string;
    expressions?: Array<{
      second: number;
      expression: string;
    }>;
    transcript?: string;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      intent: string;
    }>;
    modelAnswer?: string;
    feedbackSources?: { [key: string]: { citedContent: string; sourceType: string } };
  }>;
}

interface IndividualFollowUpQuestionProps {
  question: Question;
  videoStates: {[key: string]: {time: number, playing: boolean}};
  onVideoTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>, videoId: string) => void;
  onVideoPlay: (videoId: string) => void;
  onVideoPause: (videoId: string) => void;
  onTimelineClick: (event: React.MouseEvent<HTMLDivElement>, maxTime: number) => void;
  animateEmotions: boolean;
}

export default function IndividualFollowUpQuestion({
  question,
  videoStates,
  onVideoTimeUpdate,
  onVideoPlay,
  onVideoPause,
  onTimelineClick,
  animateEmotions
}: IndividualFollowUpQuestionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {question.question}
          </h3>
          {/* 평가의도를 질문 바로 아래에 작은 글씨로 표시 */}
          {question.feedback && question.feedback[0]?.intent && (
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 whitespace-nowrap">
                꼬리질문
              </span>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                {question.feedback[0].intent}
              </p>
            </div>
          )}
        </div>
        <svg 
          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 토글 콘텐츠 */}
      {isOpen && (
        <div className="px-6 pb-6">
          {/* 답변 시도 토글 */}
          <AnswerAttemptToggle
            feedbacks={question.feedback}
            currentQuestionIndex={question.questionNumber} // 꼬리질문 번호를 사용
            videoStates={videoStates}
            onVideoTimeUpdate={onVideoTimeUpdate}
            onVideoPlay={onVideoPlay}
            onVideoPause={onVideoPause}
            onTimelineClick={onTimelineClick}
            animateEmotions={animateEmotions}
          />
        </div>
      )}
    </div>
  );
}