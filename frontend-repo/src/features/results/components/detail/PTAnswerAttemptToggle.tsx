import { useState } from 'react';
import EmotionTimelineGraph from './EmotionTimelineGraph';
import { useAuthStore } from '@/shared/store/authStore';
import { FileText, Lightbulb, Award, Info } from 'lucide-react';

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
  feedbackSources?: { [key: string]: { citedContent: string; sourceType: string } };
}

interface PTAnswerAttemptToggleProps {
  feedbacks: PTFeedback[];
  questionIndex?: number; // 질문 번호 추가
  videoStates: {[key: string]: {time: number, playing: boolean}};
  onVideoTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>, videoId: string) => void;
  onVideoPlay: (videoId: string) => void;
  onVideoPause: (videoId: string) => void;
  onTimelineClick: (event: React.MouseEvent<HTMLDivElement>, maxTime: number) => void;
  animateEmotions: boolean;
}

export default function PTAnswerAttemptToggle({
  feedbacks,
  questionIndex,
  videoStates,
  onVideoTimeUpdate,
  onVideoPlay,
  onVideoPause,
  // onTimelineClick,
  animateEmotions
}: PTAnswerAttemptToggleProps) {
  const [selectedAttempt, setSelectedAttempt] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'attitude' | 'content'>('attitude');
  const { username } = useAuthStore();

  if (feedbacks.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        PT 발표 데이터가 없습니다.
      </div>
    );
  }

  const feedback = feedbacks[selectedAttempt];
  const videoId = `pt-q${questionIndex || 0}-f${selectedAttempt}`;
  const videoState = videoStates[videoId] || { time: 0, playing: false };

  return (
    <div className="space-y-6">
      {/* PT 답변 시도 탭 (인성/직무 면접과 동일한 패턴) */}
      {feedbacks.length > 1 && (
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          {feedbacks.map((_, attemptIndex) => (
            <button
              key={attemptIndex}
              onClick={() => setSelectedAttempt(attemptIndex)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedAttempt === attemptIndex
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {attemptIndex + 1}회차
            </button>
          ))}
        </div>
      )}

      {/* 감정 요약 - PT용으로 조정 */}
      {feedback.segments && feedback.segments.length > 0 && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b-2 border-indigo-200">
            {username || '지원자'} 님의 PT 발표는
          </h4>
          {(() => {
            // 감정 분석
            const expressions = feedback.expressions || [];
            const emotionCounts: { [key: string]: number } = {};
            
            expressions.forEach(expr => {
              const emotion = expr.expression.toLowerCase();
              if (['happy', '기쁨', '자신감', 'surprise', '놀람', 'joy', 'confident'].includes(emotion)) {
                emotionCounts['긍정'] = (emotionCounts['긍정'] || 0) + 1;
              } else if (['angry', '화남', 'disgust', '혐오', 'worried', 'anxious'].includes(emotion)) {
                emotionCounts['부정'] = (emotionCounts['부정'] || 0) + 1;
              } else {
                emotionCounts['중립'] = (emotionCounts['중립'] || 0) + 1;
              }
            });

            // 가장 많이 나온 감정
            const mostFrequentEmotion = Object.entries(emotionCounts).reduce((a, b) => 
              emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
            )?.[0] || '중립';

            // intent 분석
            const intentCounts: { [key: string]: number } = {};
            feedback.segments.forEach(segment => {
              const intent = segment.intent;
              intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            });

            // 가장 많이 나온 intent
            const mostFrequentIntent = Object.entries(intentCounts).reduce((a, b) => 
              intentCounts[a[0]] > intentCounts[b[0]] ? a : b
            )?.[0] || '중립';

            return (
              <div className="text-gray-700 space-y-3">
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">•</span>
                  <span>주로 <span className="font-semibold text-indigo-600">{mostFrequentEmotion}적인 태도</span>로 발표했어요</span>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">•</span>
                  <span><span className="font-semibold text-indigo-600">{mostFrequentIntent}</span> 중심으로 설명했어요</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 발표분석/AI답변 탭 */}
      <div className="flex space-x-2 bg-indigo-50 p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('attitude')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'attitude'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-indigo-700 hover:text-indigo-800'
          }`}
        >
          발표 분석
        </button>
        <button
          onClick={() => setSelectedTab('content')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'content'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-indigo-700 hover:text-indigo-800'
          }`}
        >
          AI 답변
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="space-y-6 pb-8">
        {selectedTab === 'attitude' ? (
          // 발표분석 탭 콘텐츠
          <div className="space-y-6">
            {/* 영상과 감정 분석을 나란히 배치 */}
            {(feedback.videoUrl || (feedback.expressions && feedback.expressions.length > 0)) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 동영상 */}
                {feedback.videoUrl && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">PT 발표 영상</h4>
                    <video 
                      src={feedback.videoUrl} 
                      controls 
                      className="w-full rounded-lg shadow-md"
                      onTimeUpdate={(e) => onVideoTimeUpdate(e, videoId)}
                      onPlay={() => onVideoPlay(videoId)}
                      onPause={() => onVideoPause(videoId)}
                      onSeeked={(e) => onVideoTimeUpdate(e, videoId)}
                      onLoadedMetadata={(_e) => {
                      }}
                      onError={(e) => {
                        console.error(`PT 비디오 ${videoId} 로드 오류:`, e);
                      }}
                    >
                      브라우저가 비디오를 지원하지 않습니다.
                    </video>
                  </div>
                )}
              
                {/* 오른쪽: 감정 타임라인 그래프 */}
                {feedback.expressions && feedback.expressions.length > 0 && (
                  <div>
                    <EmotionTimelineGraph
                      expressions={feedback.expressions}
                      currentTime={videoState.time}
                      isPlaying={videoState.playing}
                      animateEmotions={animateEmotions}
                      onTimeClick={(time) => {
                        // 비디오를 특정 시간으로 이동
                        const video = document.querySelector(`video[src="${feedback.videoUrl}"]`) as HTMLVideoElement;
                        if (video) {
                          video.currentTime = time;
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* 지원자 답변 (전사 + 분석) */}
            {feedback.transcript && (
              <div className="bg-blue-50 border border-blue-200 shadow-sm rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-300">
                      <h4 className="text-lg font-semibold text-gray-900">
                        지원자 답변
                      </h4>
                      <div className="relative group">
                        <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center cursor-help">
                          <Info className="w-3 h-3 text-gray-500" />
                        </div>
                        {/* 툴팁 */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          각 문장이 어떤 의도인지 마우스를 대고 확인해보세요.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-700">
                      {/* 분석된 텍스트 (segments가 있으면 사용, 없으면 일반 전사) */}
                      {feedback.segments && feedback.segments.length > 0 ? (
                        <div className="leading-relaxed">
                          {feedback.segments.map((segment, index) => {
                            const intent = segment.intent.toLowerCase();
                            const getIntentColor = () => {
                              switch (intent) {
                                case 'positive': return '#dcfce7';
                                case 'negative': return '#fecaca';
                                case 'neutral': return '#f3f4f6';
                                case 'confident': return '#dbeafe';
                                case 'uncertain': return '#fef3c7';
                                case 'professional': return '#e9d5ff';
                                case 'emotional': return '#fce7f3';
                                case 'technical': return '#e0e7ff';
                                case 'example': return '#fed7aa';
                                case 'question': return '#ccfbf1';
                                default: return '#f9fafb';
                              }
                            };

                            return (
                              <span 
                                key={index}
                                className="relative group inline-block px-1 py-0.5 rounded mr-1 mb-1 cursor-pointer transition-all duration-200 hover:scale-105 hover:!bg-indigo-500 hover:!text-white"
                                style={{
                                  backgroundColor: getIntentColor()
                                }}
                              >
                                {segment.text}
                                {/* 툴팁 */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                                  분석: {segment.intent}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                </div>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="font-mono break-words whitespace-pre-wrap">
                          {feedback.transcript}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            
          </div>
        ) : (
          // AI 답변 탭 콘텐츠
          <div className="space-y-6">
            {/* FeedbackSources - 경험들을 활용할 수 있어요! */}
            {feedback.feedbackSources && Object.keys(feedback.feedbackSources).length > 0 && (
              <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-slate-300">
                      <h4 className="text-lg font-semibold text-gray-900">
                        <span className="text-gray-900 font-bold">{username || '지원자'}</span>님의 경험들을 활용할 수 있어요!
                      </h4>
                      <div className="relative group">
                        <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center cursor-help">
                          <Info className="w-3 h-3 text-gray-500" />
                        </div>
                        {/* 툴팁 */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          지원자의 서류에서 활용할만한 문장을 골라봤어요!
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                      {(() => {
                        const getSourceTypeLabel = (sourceType: string) => {
                          switch (sourceType) {
                            case 'resume':
                              return '지원서';
                            case 'portfolio':
                              return '포트폴리오';
                            case 'scriptFile':
                              return '답변스크립트';
                            default:
                              return sourceType;
                          }
                        };

                        // sourceType별로 그룹화
                        const groupedSources = Object.entries(feedback.feedbackSources).reduce((acc, [, source]) => {
                          const sourceType = source.sourceType;
                          if (!acc[sourceType]) {
                            acc[sourceType] = [];
                          }
                          acc[sourceType].push(source.citedContent);
                          return acc;
                        }, {} as Record<string, string[]>);

                        return Object.entries(groupedSources).map(([sourceType, contents]) => (
                          <div key={sourceType} className="mb-6 last:mb-0">
                            <p className="font-medium text-gray-900 mb-3">• <span className="font-bold">{getSourceTypeLabel(sourceType)}</span>에서 드러나는 경험</p>
                            <div className="pl-3 space-y-2">
                              {contents.map((content, index) => (
                                <div key={index} className="bg-indigo-100 border-l-4 border-indigo-400 p-3 rounded-r-md">
                                  <div className="whitespace-pre-line break-words text-sm leading-relaxed text-indigo-800">
                                    {content.replace(/\\n/g, '\n').replace(/\\/g, '')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* AI 예시 답안 */}
            <div className="bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-indigo-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-indigo-300">
                    AI 예시 답안
                  </h4>
                  <div className="text-gray-700">
                    <p className="break-words whitespace-pre-wrap leading-relaxed">
                      {feedback.modelAnswer || `이 PT 주제에 대한 효과적인 발표 예시입니다.

PT 발표 시에는 다음과 같은 구조로 진행하시면 좋습니다:

1. 명확한 문제 정의
주어진 상황에서의 핵심 문제와 배경을 명확하게 설명합니다.

2. 체계적인 해결 방안
문제 해결을 위한 구체적이고 실현 가능한 방안을 제시합니다.

3. 예상 효과 및 결과
제안한 방안의 기대 효과와 측정 가능한 성과 지표를 제시합니다.

4. 실행 계획
단계별 실행 계획과 필요한 자원, 일정을 구체적으로 설명합니다.

발표 시에는 청중과의 아이컨택을 유지하고, 핵심 포인트를 강조하여 설득력을 높이는 것이 중요합니다.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
