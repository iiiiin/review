import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Button from '@/shared/components/Button';
import { motion } from 'framer-motion';
import { PartyPopper, BarChart3 } from 'lucide-react';
import { useWebSocketStore } from '@/shared/store/websocketStore';

interface CompletionScreenProps {
  resultId: string | null;
  interviewType: string;
  answerAttemptIds: string[]; // WebSocket으로 받은 answerAttemptId 배열
}

export default function CompletionScreen({ resultId, interviewType, answerAttemptIds }: CompletionScreenProps) {
  const navigate = useNavigate();
  const { interviewInProgress, totalQuestions, completedQuestions } = useWebSocketStore();

  // 디버그: 프롭스 확인


  // WebSocket 연결 상태 모니터링
  useEffect(() => {
    
    // 모든 질문이 완료되고 면접이 종료되면 알림
    if (!interviewInProgress && completedQuestions >= totalQuestions && totalQuestions > 0) {
    }
  }, [interviewInProgress, completedQuestions, totalQuestions, answerAttemptIds.length]);

  // PT: PTInterviewLayout에서 이미 WebSocket 처리를 완료하고 answerAttemptIds로 전달했으므로
  // CompletionScreen에서는 별도의 WebSocket 처리 불필요

  const interviewTypeMap: Record<string, string> = {
    behavioral: '인성',
    tech: '직무', 
    presentation: 'PT',
    TENACITY: '인성',
    JOB: '직무',
    PT: 'PT',
  };
  const koreanInterviewType = interviewTypeMap[interviewType] || interviewType;

  const handleNavigateToResult = () => {
    
    
    if (resultId && answerAttemptIds && answerAttemptIds.length > 0) {
      // answerAttemptIds를 URL 파라미터로 전달
      const attemptIdsParam = answerAttemptIds.join(',');
      if (interviewType === 'presentation') {
        const attemptUuid = answerAttemptIds[0];
        const attemptNumber = (() => {
          if (typeof attemptUuid === 'string' && attemptUuid.includes('~')) {
            const part = attemptUuid.split('~')[1];
            const n = parseInt(part, 10);
            return Number.isNaN(n) ? 1 : n + 1; // 빈 접미사: 1회, '~1': 2회
          }
          return 1;
        })();
        let totalSets = 0;
        try {
          const raw = sessionStorage.getItem(`REVIEW_SESSION_${resultId}`);
          if (raw) {
            const saved = JSON.parse(raw);
            if (typeof saved?.totalInterviewSets === 'number' && saved.totalInterviewSets > 0) {
              totalSets = saved.totalInterviewSets;
            }
          }
        } catch {}
        // 현재 세트 인덱스(세션 저장), 기본 1
        let currentSet = 1;
        try {
          const v = sessionStorage.getItem(`REVIEW_PT_SET_INDEX_${resultId}`);
          const n = v ? parseInt(v, 10) : 1;
          currentSet = Number.isNaN(n) ? 1 : n;
        } catch {}

        // PT 면접도 StepByStepFeedbackPage로 이동하도록 수정
        const targetUrl = `/results/${resultId}/feedback?step=0&ptUuid=${attemptUuid}&attemptUuid=${attemptUuid}&attempt=${attemptNumber}`;
        if (totalSets > 0) {
          navigate(`${targetUrl}&count=${totalSets}&set=${currentSet}`);
        } else {
          navigate(targetUrl);
        }
      } else {
        // 질문 세트 수는 세션에서 저장한 totalInterviewSets를 우선 사용 (없으면 추정)
        let totalSets = 0;
        try {
          const storageKey = `REVIEW_SESSION_${resultId}`;
          const raw = sessionStorage.getItem(storageKey);
          if (raw) {
            const saved = JSON.parse(raw);
            if (typeof saved?.totalInterviewSets === 'number' && saved.totalInterviewSets > 0) {
              totalSets = saved.totalInterviewSets;
            }
          }
        } catch (e) {}
        const setCount = totalSets > 0 ? totalSets : Math.ceil(answerAttemptIds.length / 3);
        
        // PT 면접인 경우 pt 관련 파라미터 추가
        if (interviewType === 'presentation' && answerAttemptIds.length > 0) {
          const attemptUuid = answerAttemptIds[0];
          const targetUrl = `/results/${resultId}/feedback?step=0&attemptIds=${attemptIdsParam}&count=${setCount}&ptUuid=${attemptUuid}&attemptUuid=${attemptUuid}`;
          navigate(targetUrl);
        } else {
          const targetUrl = `/results/${resultId}/feedback?step=0&attemptIds=${attemptIdsParam}&count=${setCount}`;
          navigate(targetUrl);
        }
      }
    } else if (resultId) {
      navigate(`/results/${resultId}`);
    } else {
      navigate('/results');
    }
  };

  const canNavigate = !!resultId && answerAttemptIds && answerAttemptIds.length > 0;

  return (
    <div className="min-h-screen w-full animated-gradient-bg">
      {/* ✅ 세로/가로 모두 중앙 + 넉넉한 공간 */}
      <main className="px-4 py-16 md:py-24 min-h-[75vh] flex items-center justify-center">
        <div className="w-full max-w-5xl md:max-w-6xl mx-auto">
          <div className="relative rounded-2xl shadow-2xl border border-white/30 p-1 bg-gradient-to-br from-white/50 to-white/20">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              /* ✅ 카드 상하 패딩 크게 */
              className="bg-white/60 backdrop-blur-xl rounded-xl py-16 px-8 md:py-20 md:px-14 text-center"
            >
              {/* 유형 배지 */}
              <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-blue-50 text-blue-700 border border-blue-200 mb-10">
                {koreanInterviewType} 질문 답변 완료
              </div>

              {/* 아이콘 */}
              <PartyPopper className="w-20 h-20 md:w-24 md:h-24 mx-auto text-yellow-500 mb-10" />

              {/* 타이틀 */}
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                수고하셨습니다!
              </h1>

              {/* 설명 */}
              <p className="text-lg md:text-xl text-gray-600 mb-14 max-w-3xl mx-auto leading-relaxed">
                AI가 답변을 분석 중입니다. 잠시 후{' '}
                <span className="font-semibold">AI의 답변 내용 분석</span>, 맞춤형 피드백,
                실시간 표정 분석 결과를 확인하실 수 있어요.
              </p>

              {/* 버튼 */}
              <Button 
                onClick={handleNavigateToResult} 
                size="lg" 
                disabled={!canNavigate}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                {!resultId
                  ? '결과 분석 중...'
                  : canNavigate
                    ? '상세 결과 보기'
                    : 'AI 피드백 분석 중...'}
              </Button>
              
              {/* 피드백 수집 상태 표시 (PT는 WS로 수신된 개수 사용) */}
              {resultId && (
                <div className="mt-4 text-sm text-gray-600">
                  {(() => {
                    const collectedCount = answerAttemptIds?.length || 0;
                    return (
                      <>
                        <p>AI 피드백 수집: {collectedCount}개 완료</p>
                        {collectedCount > 0 && (
                          <p className="text-green-600 mt-1">
                            ✅ {interviewType === 'presentation' ? 'PT 상세 피드백' : '각 질문별 상세 피드백'}을 확인할 수 있습니다!
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
