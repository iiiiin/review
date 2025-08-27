import { useState } from 'react';
import EmotionTimelineGraph from './EmotionTimelineGraph';
import Callout from '@/shared/components/Callout';
import VideoSubtitle from '@/shared/components/VideoSubtitle';

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

interface StepByStepFeedbackData {
  videoPath?: string;
  intent?: string;
  expressions?: Expression[];
  transcript?: string;
  segment?: Segment[];
  modelAnswer?: string;
}

interface StepByStepAnswerAnalysisProps {
  feedbackData: StepByStepFeedbackData;
  currentVideoTime: number;
  onVideoTimeUpdate: (time: number) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  className?: string;
}

export default function StepByStepAnswerAnalysis({
  feedbackData,
  currentVideoTime,
  onVideoTimeUpdate,
  onVideoPlay,
  onVideoPause,
  className = ''
}: StepByStepAnswerAnalysisProps) {
  const [selectedTab, setSelectedTab] = useState<'attitude' | 'content'>('attitude');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = event.currentTarget.currentTime;
    onVideoTimeUpdate(time);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    onVideoPlay();
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
    onVideoPause();
  };

  const handleTimelineClick = (time: number) => {
    const video = document.querySelector(`video[src="${feedbackData.videoPath}"]`) as HTMLVideoElement;
    if (video) {
      video.currentTime = time;
    }
  };

  if (!feedbackData) {
    return (
      <div className={`bg-gray-50 p-4 rounded-lg text-center text-gray-500 ${className}`}>
        피드백 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 태도분석/내용분석 탭 */}
      <div className="flex space-x-2 bg-indigo-50 p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('attitude')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'attitude'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-indigo-700 hover:text-indigo-800'
          }`}
        >
          태도분석
        </button>
        <button
          onClick={() => setSelectedTab('content')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'content'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-indigo-700 hover:text-indigo-800'
          }`}
        >
          내용분석
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="space-y-6">
        {selectedTab === 'attitude' ? (
          // 태도분석 탭 콘텐츠
          <div className="space-y-6">
            {/* 영상과 감정 분석을 세로로 배치 (StepByStep 페이지에 맞게) */}
            {feedbackData.videoPath && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">답변 영상</h4>
                <video 
                  src={feedbackData.videoPath} 
                  controls 
                  className="w-full rounded-lg shadow-md"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onSeeked={handleVideoTimeUpdate}
                  onLoadedMetadata={(e) => {
                    console.log(`비디오 메타데이터 로드됨:`, e.currentTarget.duration);
                  }}
                  onError={(e) => {
                    console.error(`비디오 로드 오류:`, e);
                  }}
                >
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              </div>
            )}

            {/* 감정 분석 그래프 */}
            {feedbackData.expressions && feedbackData.expressions.length > 0 && (
              <div>
                <EmotionTimelineGraph
                  expressions={feedbackData.expressions}
                  currentTime={currentVideoTime}
                  isPlaying={isPlaying}
                  animateEmotions={true}
                  onTimeClick={handleTimelineClick}
                />
              </div>
            )}

            {/* 실시간 답변 분석 (자막 형태) */}
            {feedbackData.segment && feedbackData.segment.length > 0 && (
              <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                  실시간 답변 분석
                </h4>
                <VideoSubtitle 
                  segments={feedbackData.segment}
                  currentTime={currentVideoTime}
                />
              </div>
            )}
          </div>
        ) : (
          // 내용분석 탭 콘텐츠
          <div className="space-y-6">
            {/* 지원자 답변 (전사) */}
            {feedbackData.transcript && (
              <Callout type="transcript" title="지원자 답변" className="mb-6">
                <p className="font-mono break-words whitespace-pre-wrap">
                  {feedbackData.transcript}
                </p>
              </Callout>
            )}
            
            {/* AI 예시 답안 */}
            {feedbackData.modelAnswer && (
              <Callout type="modelAnswer" title="AI 예시 답안" className="mb-6">
                <p className="break-words whitespace-pre-wrap leading-relaxed">
                  {feedbackData.modelAnswer}
                </p>
              </Callout>
            )}
          </div>
        )}
      </div>
    </div>
  );
}