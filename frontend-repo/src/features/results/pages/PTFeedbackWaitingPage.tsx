'use client';

import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import { useWebSocketStore } from '@/shared/store/websocketStore';

export default function PTFeedbackWaitingPage() {
  const { id: interviewUuid } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connect: connectWebSocket, removeCallback } = useWebSocketStore();

  const handleRealtimeFeedback = useCallback((_attemptId: string) => {
    if (interviewUuid) {
      navigate(`/results/${interviewUuid}`);
    }
  }, [navigate, interviewUuid]);

  useEffect(() => {
    // 전역 WebSocket 연결 유지, 콜백만 추가
    connectWebSocket(handleRealtimeFeedback);
    return () => {
      removeCallback(handleRealtimeFeedback);
    };
  }, [connectWebSocket, removeCallback, handleRealtimeFeedback]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">PT 발표 분석 중...</h1>
          <p className="text-gray-600">AI가 발표 영상을 분석하고 있습니다. 완료되면 결과 페이지로 자동 이동합니다.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}


