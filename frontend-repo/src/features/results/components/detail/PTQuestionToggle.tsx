import { useState } from 'react';
import PTAnswerAttemptToggle from './PTAnswerAttemptToggle';

interface Expression {
  second: number;
  expression: string;
}

interface Segment {
  start: number;
  end: number;
  text: string;
  intent: string;
}

interface PTFeedback {
  videoUrl?: string;
  intent?: string;
  expressions?: Expression[];
  transcript?: string;
  segments?: Segment[];
  modelAnswer?: string;
}

interface PTQuestionToggleProps {
  title: string;
  situation?: string;
  feedbacks: PTFeedback[];
  isInitiallyOpen?: boolean;
  questionIndex?: number; // 질문 번호 추가
  videoStates: {[key: string]: {time: number, playing: boolean}};
  onVideoTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>, videoId: string) => void;
  onVideoPlay: (videoId: string) => void;
  onVideoPause: (videoId: string) => void;
  onTimelineClick: (event: React.MouseEvent<HTMLDivElement>, maxTime: number) => void;
  animateEmotions: boolean;
}

export default function PTQuestionToggle({
  title,
  situation,
  feedbacks,
  isInitiallyOpen = true,
  questionIndex,
  videoStates,
  onVideoTimeUpdate,
  onVideoPlay,
  onVideoPause,
  onTimelineClick,
  animateEmotions
}: PTQuestionToggleProps) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <div className="bg-white rounded-lg shadow-lg mb-4">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {questionIndex !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                Q{questionIndex + 1}
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900">
              {title}
            </h3>
          </div>
          {/* PT 상황 설명 */}
          {situation && (
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>상황:</strong> {situation}
            </p>
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
          {/* PT 답변 시도 토글 */}
          <PTAnswerAttemptToggle
            feedbacks={feedbacks}
            questionIndex={questionIndex}
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