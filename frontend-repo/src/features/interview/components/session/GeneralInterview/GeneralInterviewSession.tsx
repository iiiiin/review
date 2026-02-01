'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { InterviewProvider, useInterview } from '@/features/interview/context/InterviewContext';
import { PreparingScreen, AnsweringScreen, LoadingScreen } from '@/features/interview/components/session/screens';
import ProgressBar from '@/features/interview/components/session/ProgressBar';
import CompletionScreen from '@/features/interview/components/session/CompletionScreen';
import SetFeedbackModal from '@/features/interview/components/session/SetFeedbackModal';
import { getFeedbackAPI } from '@/shared/api/results';
import apiClient from '@/shared/api/client';
import type { ExpandedQ, FullQ } from '@/features/interview/types';

// 유틸리티 함수들
function toFullQs(raw: any[]): FullQ[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q: any) => {
    const id = q?.id ?? q?.questionUuid ?? q?.uuid ?? undefined;
    const question = q?.question ?? q?.title ?? q?.content ?? '';
    const followUps = Array.isArray(q?.followUps)
      ? q.followUps.map((f: any) => ({
          id: f?.id ?? f?.questionUuid ?? f?.uuid ?? undefined,
          question: f?.question ?? f?.title ?? f?.content ?? '',
        }))
      : [];
    return { id, question, followUps };
  });
}

function expandQuestions(qs: FullQ[]): ExpandedQ[] {
  return qs.flatMap((q) => {
    const main: ExpandedQ = { id: q.id, question: q.question, kind: 'main' };
    const tails: ExpandedQ[] = (q.followUps ?? []).map((f, idx) => ({
      id: f.id,
      question: f.question,
      kind: 'follow',
      parentId: q.id,
      followIndex: idx + 1,
    }));
    return [main, ...tails];
  });
}

// 인성/직무면접 Props 타입
export interface GeneralInterviewSessionProps {
  interviewType: 'job' | 'personality';
  sessionId: string;
  initialAttemptIds?: string[];
}

// 메인 컴포넌트 로직
const GeneralInterviewContent: React.FC<{
  interviewType: 'job' | 'personality';
  initialAttemptIds?: string[];
}> = ({ interviewType, initialAttemptIds }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const { interviewState, recording, websocket, session } = useInterview();
  const { state, actions, currentQuestion, isLastQuestion } = interviewState;
  const { step, questions, currentQuestionIndex, remainingTime, resultId } = state;

  // 컴포넌트 상태
  const [interviewUuid, setInterviewUuid] = useState<string | null>(null);
  const [answerAttemptIds, setAnswerAttemptIds] = useState<string[]>([]);
  const [setAnswerAttempts, setSetAnswerAttempts] = useState<{[setIndex: number]: string[]}>({});
  const [showSetFeedback, setShowSetFeedback] = useState<number | null>(null);
  const [totalSets, setTotalSets] = useState<number>(3);

  // URL 파라미터들
  const storeKey = searchParams.get('storeKey') || '';
  const interviewUuidParam = searchParams.get('interviewUuid');
  const shouldGenerateNext = searchParams.get('generateNext') === '1';
  const countParam = searchParams.get('count');
  
  const isRetryMode = Array.isArray(initialAttemptIds) && initialAttemptIds.length > 0;
  const generatedNextRef = useRef(false);
  const generateInFlightRef = useRef(false);

  // 유효한 총 세트 수
  const parsedCount = countParam ? parseInt(countParam) : NaN;
  const effectiveTotalSets = !Number.isNaN(parsedCount) && parsedCount > 0 ? parsedCount : totalSets;

  // 세션스토리지 로딩
  useEffect(() => {
    if (!storeKey) return;
    const raw = sessionStorage.getItem(storeKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved?.interviewUuid) {
          setInterviewUuid(saved.interviewUuid);
          actions.setResultId(saved.interviewUuid);
        }
        if (typeof saved?.totalInterviewSets === 'number' && saved.totalInterviewSets > 0) {
          setTotalSets(saved.totalInterviewSets);
        }
        if (Array.isArray(saved?.questions) && saved.questions.length > 0) {
          const expanded = expandQuestions(toFullQs(saved.questions));
          actions.loadQuestions(expanded);
        }
      } catch (error) {
        console.error('세션스토리지 파싱 에러:', error);
      }
    }
  }, [storeKey]);

  // URL 파라미터 interviewUuid 처리
  useEffect(() => {
    if (interviewUuidParam && !interviewUuid) {
      setInterviewUuid(interviewUuidParam);
      actions.setResultId(interviewUuidParam);
    }
  }, [interviewUuidParam, interviewUuid]);

  // count 파라미터 처리
  useEffect(() => {
    const parsed = countParam ? parseInt(countParam) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0) {
      setTotalSets(prev => (prev == null ? parsed : prev));
    }
  }, [countParam]);

  // 재시도 모드 질문 로딩
  useEffect(() => {
    if (!isRetryMode) return;
    if (questions.length > 0 || step === 'answering') return;
    
    (async () => {
      try {
        
        // 리트라이 모드에서는 기존 세션을 정리
        if (session.session) {
          await session.endSession();
        }
        
        const targetIds = initialAttemptIds!.slice(0, 3);
        const feedbacks = await Promise.all(
          targetIds.map(async (id) => {
            try {
              const res: any = await getFeedbackAPI(id);
              return res?.result || res;
            } catch (e) {
              console.warn('피드백 로드 실패, placeholder 사용:', id, e);
              return null;
            }
          })
        );

        const items: ExpandedQ[] = targetIds.map((id, idx) => ({
          id,
          question: feedbacks[idx]?.question || feedbacks[idx]?.title || (idx === 0 ? '본질문 (재시도)' : `꼬리질문 ${idx} (재시도)`),
          kind: idx === 0 ? 'main' : 'follow',
          parentId: idx === 0 ? undefined : targetIds[0],
          followIndex: idx === 0 ? undefined : idx,
        }));
        actions.loadQuestions(items);
        
        // 새로운 세션 시작을 위한 지연 (더 짧게 조정)
        setTimeout(() => {
          if (targetIds.length > 0) {
            // sessionId에서 ~숫자 부분 제거
            const cleanSessionId = targetIds[0].includes('~') ? targetIds[0].split('~')[0] : targetIds[0];
            session.changeSession(cleanSessionId);
          }
        }, 200); // 500ms에서 200ms로 단축
      } catch (e) {
        console.error('재시도 질문 구성 실패:', e);
      }
    })();
  }, [isRetryMode, initialAttemptIds, step, session]);

  // generateNext 처리
  useEffect(() => {
    if (!shouldGenerateNext) return;
    if (!interviewUuidParam) return;
    if (generatedNextRef.current || generateInFlightRef.current) return;
    
    (async () => {
      try {
        generateInFlightRef.current = true;
        const response = await apiClient.post(
          '/api/interview/generateQuestions',
          { interviewUuid: interviewUuidParam },
          {
            withCredentials: true,
            timeout: 60000,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const responseData = (response as any)?.data || response;
        const newQuestions = responseData?.questions || responseData?.result?.questions || [];
        const expandedNewQuestions = expandQuestions(toFullQs(newQuestions));
        actions.loadQuestions(expandedNewQuestions);
        generatedNextRef.current = true;

        // URL에서 generateNext 파라미터 제거하여 재실행 방지
        const params = new URLSearchParams(location.search);
        params.delete('generateNext');
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
      } catch (error) {
        console.error('>>> [GeneralInterview] generateNext 처리 실패:', error);
        alert('다음 질문 세트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        generateInFlightRef.current = false;
      }
    })();
  }, [shouldGenerateNext, interviewUuidParam, location.pathname, location.search, navigate]);

  // WebSocket 분석 결과 핸들러 (Context 연결 예정)
  const handleAnalysisResult = useCallback((answerAttemptId: string) => {
    
    setAnswerAttemptIds(prev => {
      const newIds = !prev.includes(answerAttemptId) ? [...prev, answerAttemptId] : prev;
      return newIds;
    });
    
    // 세트별 answerAttemptIds 업데이트
    setSetAnswerAttempts(prev => {
      // 🔧 수정: 현재 질문 인덱스 기반으로 올바른 세트 계산
      const currentSetIndex = Math.floor(currentQuestionIndex / 3);
      const targetSet = currentSetIndex;
      
      const currentSetAttempts = prev[targetSet] || [];
      if (!currentSetAttempts.includes(answerAttemptId)) {
        const newSetAttempts = [...currentSetAttempts, answerAttemptId];
        
        if (newSetAttempts.length === 1) {
          // currentSetIndex는 이미 위에서 계산됨
          const isCurrentSetComplete = currentQuestionIndex >= (currentSetIndex + 1) * 3 - 1;
          const isQuestionInProgress = step === 'answering';
          
          if ((!isQuestionInProgress && isCurrentSetComplete) || showSetFeedback === targetSet) {
            if (showSetFeedback === targetSet) {
              setShowSetFeedback(null);
            }
            navigateToFeedbackPage(newSetAttempts);
          }
        }
        
        return { ...prev, [targetSet]: newSetAttempts };
      }
      return prev;
    });
  }, [currentQuestionIndex, step, showSetFeedback, effectiveTotalSets]);

  // 피드백 페이지 이동 함수
  const navigateToFeedbackPage = (recordingIds: string[], targetSet?: number) => {
    if (!resultId || recordingIds.length === 0) {
      console.warn('⚠️ resultId 또는 recordingIds가 없어서 피드백 페이지로 이동할 수 없습니다.');
      return;
    }

    const setIndex = targetSet !== undefined ? targetSet : Math.floor(currentQuestionIndex / 3);
    const setAnswerIds = setAnswerAttempts[setIndex] || recordingIds;
    const validAnswerIds = setAnswerIds.filter(id => id.trim() !== '');
    const attemptIdsParam = validAnswerIds.join(',');
    const setCount = effectiveTotalSets;
    const targetUrl = `/results/${resultId}/feedback?step=2&attemptIds=${attemptIdsParam}&count=${setCount}&setIndex=${setIndex}`;
    
    navigate(targetUrl);
  };

  // SetFeedbackModal 다음 세트 핸들러
  const handleNextSet = useCallback(() => {
    const currentSetIndex = showSetFeedback || 0;
    const nextSetIndex = currentSetIndex + 1;
    
    // 다음 세트가 있는지 확인
    if (nextSetIndex < effectiveTotalSets) {
      // 다음 세트의 첫 번째 질문으로 이동
      const nextQuestionIndex = nextSetIndex * 3;
      actions.setQuestionIndex(nextQuestionIndex);
      setShowSetFeedback(null); // 모달 닫기
    } else {
      // 마지막 세트인 경우 면접 완료
      actions.complete();
      setShowSetFeedback(null);
    }
  }, [showSetFeedback, effectiveTotalSets, actions]);

  // SetFeedbackModal 재시도 핸들러  
  const handleRetrySet = useCallback(() => {
    const currentSetIndex = showSetFeedback || 0;
    const firstQuestionOfSet = currentSetIndex * 3;
    
    // 현재 세트의 첫 번째 질문으로 이동
    actions.setQuestionIndex(firstQuestionOfSet);
    setShowSetFeedback(null); // 모달 닫기
    
  }, [showSetFeedback, actions]);

  // 다음 질문 핸들러
  const handleNextQuestion = async () => {
    if (recording.isStopping) return;

    const processNextQuestion = async () => {
      const isLastQuestionInCurrentSet = (currentQuestionIndex + 1) % 3 === 0;
      const isLastQuestionOverall = currentQuestionIndex >= questions.length - 1;

      if (isLastQuestionInCurrentSet) {
        if (session.session) {
          try {
            await session.endSession();
          } catch (err) {
            console.error('세션 종료 실패:', err);
          }
        }
      }

      if (!isLastQuestionOverall) {
        actions.nextQuestion();
      } else {
        actions.complete();
      }
    };

    if (recording.currentRecordingId) {
      try {
        await recording.stopRecordingSession();
        // 🔧 수정: 녹화 중지 후 WebSocket 질문 완료 알림
        websocket.notifyQuestionComplete();
        await processNextQuestion();
      } catch (error) {
        console.error('녹화 중지 실패:', error);
        // 녹화 실패해도 WebSocket 알림은 전송
        websocket.notifyQuestionComplete();
        await processNextQuestion();
      }
    } else {
      await processNextQuestion();
    }
  };

  // WebSocket 분석 결과 처리 ✅
  useEffect(() => {
    // Context를 통해 WebSocket이 연결되어 있고,
    // 분석 결과는 Provider에서 전달된 onAnalysisResult로 처리됨
    
    // websocket Context에서 이미 연결 관리를 하므로 추가 설정 불필요
    return () => {
    };
  }, [handleAnalysisResult]);

  // 질문 변경 시 세션 관리
  useEffect(() => {
    if (questions.length === 0 || step === 'loading' || step === 'preparing' || step === 'complete' || step === 'answering') return;

    const currentQ = questions[currentQuestionIndex];
    const questionId = currentQ?.id?.toString();
    const retrySessionId = isRetryMode ? initialAttemptIds![currentQuestionIndex] : null;
    const newSessionId = (retrySessionId || questionId)?.toString();

    if (!newSessionId) {
      console.error(`[Error] 질문 ${currentQuestionIndex + 1}의 세션ID를 계산할 수 없습니다.`);
      return;
    }

    // 리트라이 모드에서는 세션 변경을 더 안전하게 처리
    if (isRetryMode) {
      // 기존 세션과 다른 경우에만 변경
      if (session.currentSessionId !== newSessionId) {
        // sessionId에서 ~숫자 부분 제거
        const cleanSessionId = newSessionId.includes('~') ? newSessionId.split('~')[0] : newSessionId;
        session.changeSession(cleanSessionId);
      }
    } else {
      // sessionId에서 ~숫자 부분 제거
      const cleanSessionId = newSessionId.includes('~') ? newSessionId.split('~')[0] : newSessionId;
      session.changeSession(cleanSessionId);
    }
  }, [currentQuestionIndex, questions, step, isRetryMode, initialAttemptIds, session]);

  // 녹화 시작 처리
  useEffect(() => {
    if (step === 'waiting_recording' && session.isSessionReady && questions.length > 0) {
      const currentQ = questions[currentQuestionIndex];
      const questionId = currentQ?.id;

      if (questionId && !recording.isRecording && !recording.isStarting) {
        recording.startRecordingSession(session.currentSessionId || '');
      }
    }
  }, [step, session.isSessionReady, questions, currentQuestionIndex, recording, session.currentSessionId]);

  // WebSocket 연결
  useEffect(() => {
    const shouldConnect = questions.length > 0 && (step === 'waiting_recording' || step === 'answering');
      
    if (shouldConnect) {
      websocket.connect();
    }
  }, [questions.length, step, websocket, interviewType, totalSets]);
  
  // 완료 화면 렌더링
  if (step === 'complete') {
    return <CompletionScreen 
      resultId={resultId} 
      interviewType={interviewType} 
      answerAttemptIds={answerAttemptIds} 
    />;
  }

  // 메인 렌더링 함수
  const renderContent = () => {
    if (step === 'loading' || questions.length === 0) {
      return <LoadingScreen message="면접 준비 중..." />;
    }

    if (step === 'preparing' || step === 'waiting_recording') {
      return (
        <PreparingScreen
          currentQuestion={currentQuestion!}
          currentQuestionIndex={currentQuestionIndex}
          step={step}
          session={session.session}
          publisher={session.publisher}
          isRecordingStarting={recording.isStarting}
          onStartRecording={actions.startRecordingWait}
        />
      );
    }

    return (
      <AnsweringScreen
        currentQuestion={currentQuestion!}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        remainingTime={remainingTime}
        publisher={session.publisher}
        subscribers={session.subscribers}
        isLastQuestion={isLastQuestion}
        isStoppingRecording={recording.isStopping}
        onNextQuestion={handleNextQuestion}
      />
    );
  };

  const currentSetAttempts = showSetFeedback !== null ? setAnswerAttempts[showSetFeedback] : [];
  const isLastSet = showSetFeedback !== null && showSetFeedback >= totalSets - 1;

  return (
    <>
      {step === 'answering' ? (
        <div className="w-full h-screen">
          {renderContent()}
        </div>
      ) : (
        <div className="w-full h-screen text-white p-8 flex flex-col">
          <header className="w-full max-w-7xl mx-auto">
            <ProgressBar 
              currentStep={currentQuestionIndex + 1} 
              totalSteps={questions.length || 1}
              currentQuestion={undefined}
              questionType={currentQuestion?.kind === 'main' ? `질문 ${currentQuestionIndex + 1}` : `꼬리 질문 ${currentQuestion?.followIndex}`}
            />
          </header>
          <main className="flex-grow flex items-center justify-center max-w-7xl mx-auto w-full">
            {renderContent()}
          </main>
        </div>
      )}
      
      <SetFeedbackModal
        isOpen={showSetFeedback !== null}
        onClose={() => setShowSetFeedback(null)}
        setIndex={showSetFeedback || 0}
        answerAttemptIds={currentSetAttempts}
        onNextSet={handleNextSet}
        onRetrySet={handleRetrySet}
        isLastSet={isLastSet}
      />
    </>
  );
};

// 메인 컴포넌트
export default function GeneralInterviewSession({ interviewType, sessionId, initialAttemptIds }: GeneralInterviewSessionProps) {
  const myUserName = useRef('User-' + crypto.randomUUID()).current;
  
  // WebSocket 분석 결과 핸들러 ✅
  const handleAnalysisResult = useCallback((_answerAttemptId: string) => {
    
    // 실제 분석 결과 처리는 GeneralInterviewContent에서 구현됨
    // Provider에서는 WebSocket Context로 전달하는 역할만 수행
  }, []);

  return (
    <InterviewProvider
      sessionId={sessionId}
      userName={myUserName}
      websocketOptions={{
        totalQuestions: 9, // 3 sets * 3 questions (인성/직무 전용)
        onAnalysisResult: handleAnalysisResult,
      }}
    >
      <GeneralInterviewContent 
        interviewType={interviewType}
        initialAttemptIds={initialAttemptIds}
      />
    </InterviewProvider>
  );
}
