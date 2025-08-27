// src/pages/interview/InterviewSetupPage.tsx
'use client';

import { useEffect } from 'react';
import Header from '@/shared/layout/Header';
import InterviewSetup from './components/InterviewSetup';
import { useInterviewSetupStore } from './InterviewSetupStore';

export default function InterviewSetupPage() {
  const reset = useInterviewSetupStore((state) => state.reset);

  // 페이지를 벗어날 때 스토어의 상태를 초기화합니다.
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <div className="min-h-screen w-full animated-gradient-bg">
      <Header />
      <main className="px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">AI 면접 설정</h1>
            <p className="text-md text-gray-600 mt-2">
              AI와 함께할 면접을 준비하고, 실전처럼 연습해보세요.
            </p>
          </div>
          <InterviewSetup />
        </div>
      </main>
    </div>
  );
}
