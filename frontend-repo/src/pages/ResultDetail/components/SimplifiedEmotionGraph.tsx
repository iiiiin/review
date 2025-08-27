import { useState, useEffect } from 'react';

interface Expression {
  second: number;
  expression: string;
}

interface SimplifiedEmotionGraphProps {
  expressions: Expression[];
  currentTime: number;
  isPlaying: boolean;
  animateEmotions: boolean;
}

export default function SimplifiedEmotionGraph({
  expressions,
  currentTime,
  isPlaying,
  animateEmotions
}: SimplifiedEmotionGraphProps) {
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);

  // 감정을 긍정/중립/부정으로 그룹핑
  const groupEmotions = (expressions: Expression[], currentTime: number) => {
    const emotionGroups = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    // 감정 매핑
    const emotionMapping: { [key: string]: keyof typeof emotionGroups } = {
      'happy': 'positive',
      '기쁨': 'positive',
      '자신감': 'positive',
      'surprise': 'positive',
      '놀람': 'positive',
      'joy': 'positive',
      'confident': 'positive',
      
      'neutral': 'neutral',
      '중립': 'neutral',
      '중성': 'neutral',
      'sad': 'neutral',
      '슬픔': 'neutral',
      'fear': 'neutral',
      '두려움': 'neutral',
      '긴장': 'neutral',
      
      'angry': 'negative',
      '화남': 'negative',
      'disgust': 'negative',
      '혐오': 'negative',
      'worried': 'negative',
      'anxious': 'negative'
    };

    // 현재 시간까지의 모든 감정을 카운트
    expressions.forEach((expression) => {
      const timeValue = expression.second || 0;
      
      if (timeValue <= currentTime) {
        const emotionKey = expression.expression;
        const group = emotionMapping[emotionKey];
        
        if (group) {
          emotionGroups[group]++;
        }
      }
    });

    return [
      { emotion: 'positive', count: emotionGroups.positive, korean: '긍정', color: '#10b981', emoji: '😊' },
      { emotion: 'neutral', count: emotionGroups.neutral, korean: '중립', color: '#9ca3af', emoji: '😐' },
      { emotion: 'negative', count: emotionGroups.negative, korean: '부정', color: '#ef4444', emoji: '😟' }
    ];
  };

  // 현재 시간에 해당하는 감정 이모지 찾기
  const getCurrentEmoji = (expressions: Expression[], currentTime: number) => {
    if (expressions.length === 0) return '😐';

    // 현재 시간과 가장 가까운 감정 찾기
    let closestExpression = expressions[0];
    let minDiff = Math.abs(expressions[0].second - currentTime);

    expressions.forEach((expr) => {
      const diff = Math.abs(expr.second - currentTime);
      if (expr.second <= currentTime && diff <= minDiff) {
        closestExpression = expr;
        minDiff = diff;
      }
    });

    // 실제 감정을 이모지로 매핑
    const emotionEmojis: { [key: string]: string } = {
      'happy': '😊',
      '기쁨': '😊',
      'sad': '😢',
      '슬픔': '😢',
      'angry': '😠',
      '화남': '😠',
      'surprise': '😲',
      '놀람': '😲',
      'fear': '😨',
      '두려움': '😨',
      '긴장': '😰',
      'disgust': '🤢',
      '혐오': '🤢',
      'neutral': '😐',
      '중성': '😐',
      '자신감': '😌'
    };

    return emotionEmojis[closestExpression.expression] || '😐';
  };

  const emotionData = groupEmotions(expressions, currentTime);
  const maxCount = Math.max(...emotionData.map(e => e.count), 1);
  const currentEmoji = getCurrentEmoji(expressions, currentTime);

  // 이모지 변화 애니메이션을 위한 상태 관리
  useEffect(() => {
    setCurrentEmojiIndex(prev => (prev + 1) % 10); // 애니메이션 트리거
  }, [currentEmoji]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-800">감정 분석</h4>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-600 font-mono">
            {Math.floor(currentTime)}s / {expressions.length}개
          </span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg shadow-inner">
        {/* 간단한 감정 그래프 */}
        <div className="h-48 mb-6">
          <div className="text-xs text-gray-600 mb-4 flex justify-between items-center">
            <span>실시간 감정 분석 {isPlaying && '(재생 중)'}</span>
            <span>총 {expressions.filter(e => e.second <= currentTime).length}개 감정</span>
          </div>
          
          <div className="space-y-4">
            {emotionData.map((emotion, index) => {
              const barWidth = emotion.count > 0 ? (emotion.count / maxCount) * 80 + 15 : 0;
              
              return (
                <div
                  key={emotion.emotion}
                  className="flex items-center space-x-4 transition-all duration-700 ease-out"
                  style={{
                    opacity: animateEmotions ? 1 : 0,
                    transform: animateEmotions ? 'translateX(0)' : 'translateX(-20px)',
                    transitionDelay: `${index * 150}ms`
                  }}
                >
                  {/* 감정 라벨 */}
                  <div className="w-12 flex flex-col items-center">
                    <div className="text-2xl mb-1">{emotion.emoji}</div>
                    <div className="text-xs font-medium text-gray-600 text-center">{emotion.korean}</div>
                  </div>
                  
                  {/* 막대 그래프 */}
                  <div className="flex-1 relative">
                    <div className="h-10 bg-white rounded-full shadow-sm overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                        style={{
                          backgroundColor: emotion.color,
                          width: `${barWidth}%`,
                          transform: `scaleX(${emotion.count > 0 ? 1 : 0})`,
                          transformOrigin: 'left center',
                          transitionDelay: `${index * 200}ms`
                        }}
                      >
                        {emotion.count > 0 && (
                          <span className="text-white text-sm font-bold">
                            {emotion.count}
                          </span>
                        )}
                      </div>
                      
                      {/* 성장 애니메이션 효과 */}
                      {isPlaying && emotion.count > 0 && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-pulse"
                          style={{
                            width: '40px',
                            animation: `${barWidth > 40 ? 'pulse 2s infinite' : 'none'}`
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* 순위 표시 */}
                  <div className="w-8 text-center">
                    <div className="text-sm font-bold text-gray-400">
                      {emotion.count > 0 ? `#${index + 1}` : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 현재 감정 이모지 디스플레이 */}
        <div className="pt-4">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-2">현재 감정</div>
            <div 
              className="text-6xl transition-all duration-500 ease-out"
              style={{
                opacity: animateEmotions ? 1 : 0,
                transform: `scale(${animateEmotions ? 1 : 0.8})`,
                transitionDelay: '300ms'
              }}
              key={`${currentEmoji}-${currentEmojiIndex}`}
            >
              {currentEmoji}
            </div>
            <div 
              className="text-xs text-gray-500 mt-2 transition-all duration-300"
              style={{
                opacity: animateEmotions ? 1 : 0,
                transitionDelay: '500ms'
              }}
            >
              {Math.floor(currentTime)}초 시점
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}