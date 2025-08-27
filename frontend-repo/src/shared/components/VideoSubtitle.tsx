// import React from 'react'; // Not needed in this component
import { useState, useEffect } from 'react';

interface Segment {
  start: number;
  end: number;
  text: string;
  intent: string;
}

interface VideoSubtitleProps {
  segments: Segment[];
  currentTime: number;
  className?: string;
}

export default function VideoSubtitle({ segments, currentTime, className = '' }: VideoSubtitleProps) {
  const [previousSegment, setPreviousSegment] = useState<Segment | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 현재 시간에 해당하는 세그먼트 찾기
  const currentSegment = segments.find(segment => 
    currentTime >= segment.start && currentTime <= segment.end
  );
  
  // 다음 세그먼트 찾기 (미리보기용)
  const nextSegment = segments.find(segment => 
    segment.start > currentTime
  );
  
  // 세그먼트 변경 시 애니메이션 트리거
  useEffect(() => {
    if (currentSegment && previousSegment && currentSegment !== previousSegment) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    setPreviousSegment(currentSegment || null);
  }, [currentSegment, previousSegment]);

  if (!currentSegment) {
    return (
      <div className={`bg-gray-100 text-gray-500 p-6 rounded-lg text-center min-h-[80px] flex items-center justify-center shadow-md ${className}`}>
        <p className="text-base">재생 중인 구간에 해당하는 분석이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg shadow-md overflow-hidden ${className}`} style={{ height: '120px' }}>
      {/* 현재 세그먼트 */}
      {currentSegment && (
        <div 
          className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
            isTransitioning ? 'transform -translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 mr-4">
              <p className="text-gray-800 text-lg leading-relaxed font-medium">
                {currentSegment.text}
              </p>
            </div>
            <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg text-base font-semibold whitespace-nowrap shadow-sm border border-indigo-200">
              {currentSegment.intent}
            </span>
          </div>
        </div>
      )}
      
      {/* 다음 세그먼트 (미리보기) */}
      {nextSegment && (
        <div 
          className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
            isTransitioning ? 'transform translate-y-0 opacity-100' : 'transform translate-y-full opacity-30'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 mr-4">
              <p className="text-gray-600 text-lg leading-relaxed font-medium">
                {nextSegment.text}
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-base font-semibold whitespace-nowrap shadow-sm border border-indigo-100">
              {nextSegment.intent}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}