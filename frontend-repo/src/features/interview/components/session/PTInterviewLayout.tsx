'use client';

import { useEffect, useMemo, useReducer, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/shared/components/Button';
import UserVideo from '@/features/interview/components/session/UserVideo';
import { useOpenVidu } from '@/features/interview/hooks/useOpenVidu';
import { Video, Timer, FileText, Mic, PlayCircle, Hourglass, Loader, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useMutation } from '@tanstack/react-query';
import { startRecording, stopRecording } from '@/features/interview/api/interview';
import { useWebSocketStore } from '@/shared/store/websocketStore';
import { getFeedbackAPI, getPTRetryAPI } from '@/shared/api/results';

interface PTLayoutProps {
  sessionId: string; // questionUuid를 받습니다
  initialAttemptIds?: string[]; // 리트라이 모드 감지를 위한 attemptIds
  onComplete?: (answerAttemptIds: string[]) => void; // 완료 시 상위 컴포넌트에 전달
}

interface PTData {
  problemTitle: string;
  problemDescription: string;
  preparationTime: number;
  presentationTime: number;
  resultId: string;
}

// Reducer
interface PTState {
  phase: 'loading' | 'preparing' | 'waiting_presentation' | 'presenting' | 'complete';
  ptData: PTData | null;
  prepTime: number;
  presTime: number;
  recordingId: string | null;
  answerAttemptIds: string[]; // CompletionScreen에 전달할 답변 시도 ID들
}

type PTAction =
  | { type: 'SET_DATA'; payload: PTData }
  | { type: 'START_RECORDING_WAIT' }
  | { type: 'START_PRESENTATION' }
  | { type: 'FINISH_PRESENTATION'; payload?: string[] } // 답변 시도 ID들 전달
  | { type: 'TICK_PREP' }
  | { type: 'TICK_PRES' }
  | { type: 'SET_RECORDING_ID'; payload: string | null };

const initialState: PTState = {
  phase: 'loading',
  ptData: null,
  prepTime: 0,
  presTime: 0,
  recordingId: null,
  answerAttemptIds: [],
};

function ptReducer(state: PTState, action: PTAction): PTState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        ptData: action.payload,
        prepTime: action.payload.preparationTime,
        presTime: action.payload.presentationTime,
        phase: 'preparing',
      };
    case 'START_RECORDING_WAIT':
      return { ...state, phase: 'waiting_presentation' };
    case 'START_PRESENTATION':
      return { ...state, phase: 'presenting' };
    case 'FINISH_PRESENTATION':
      return { ...state, phase: 'complete', answerAttemptIds: action.payload || [] };
    case 'TICK_PREP':
      return { ...state, prepTime: state.prepTime > 0 ? state.prepTime - 1 : 0 };
    case 'TICK_PRES':
      return { ...state, presTime: state.presTime > 0 ? state.presTime - 1 : 0 };
    case 'SET_RECORDING_ID':
      return { ...state, recordingId: action.payload };
    default:
      return state;
  }
}

export default function PTInterviewLayout({ sessionId, initialAttemptIds = [], onComplete }: PTLayoutProps) {
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(ptReducer, initialState);
  const { phase, ptData, prepTime, presTime, recordingId } = state;
  const [isCameraVisible, setIsCameraVisible] = useState(true);

  // 리트라이 모드 감지 (인성/직무와 동일한 패턴)
  const isRetryMode = initialAttemptIds.length > 0;

  // URL/store에서 interviewUuid 복원 (결과 페이지 이동 등 보조용)
  const interviewUuid = useMemo(() => {
    const fromUrl = searchParams.get('interviewUuid');
    if (fromUrl) return fromUrl;
    const storeKey = searchParams.get('storeKey');
    if (!storeKey) return '';
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (!raw) return '';
      const saved = JSON.parse(raw);
      return saved?.interviewUuid || '';
    } catch {
      return '';
    }
  }, [searchParams]);

  // 세션 연결 상태 추적
  const [isSessionConnecting, setIsSessionConnecting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 세션 ID 결정: sessionId를 그대로 사용 (questionUuid)
  const openViduSessionId = useMemo(() => sessionId, [sessionId]);

  const userName = useMemo(() => 'User-' + crypto.randomUUID(), []);

  const { publisher, joinSession, leaveSession, session } = useOpenVidu(openViduSessionId, userName);
  const { startInterview: wsStartInterview, completeQuestion: wsCompleteQuestion } = useWebSocketStore();

  // 리트라이 모드에서 기존 문제 정보 복원 (인성/직무와 동일한 패턴)
  useEffect(() => {
    if (!isRetryMode || !initialAttemptIds.length || hasInitialized) return;
    
    (async () => {
      try {
        setIsSessionConnecting(true);
        
        const attemptId = initialAttemptIds[0];
        
        // 1. 기존 피드백에서 문제 정보 가져오기
        const feedbackRes = await getFeedbackAPI(attemptId);
        const feedback = (feedbackRes as any)?.result || (feedbackRes as any)?.data?.result || feedbackRes;
        
        
        // 2. PT 리트라이 API로 새로운 attemptId 생성
        const retryRes = await getPTRetryAPI(interviewUuid);
        const retryData = (retryRes as any)?.result || (retryRes as any)?.data?.result || retryRes;
        
        
        if (retryData?.ptInterview?.[0]) {
          const newAttempt = retryData.ptInterview[0];
          const data: PTData = {
            problemTitle: feedback?.title || newAttempt.title || '문제 제목',
            problemDescription: feedback?.situation || newAttempt.situation || '문제 설명',
            preparationTime: 60,
            presentationTime: 300,
            resultId: newAttempt.id, // 새로운 attemptId를 resultId로 사용
          };
          
          dispatch({ type: 'SET_DATA', payload: data });
          setHasInitialized(true);
          
          // 새로운 세션에 조인
          if (newAttempt.id) {
            // useOpenVidu 훅에서 sessionId를 attemptId로 사용하도록 수정 필요
          }
        }
      } catch (e) {
        console.error('❌ [PT] 리트라이 모드 데이터 로드 실패:', e);
        // 실패 시 일반 모드로 폴백
        fallbackToNormalMode();
        setHasInitialized(true);
      } finally {
        setIsSessionConnecting(false);
      }
    })();
  }, [isRetryMode, initialAttemptIds, interviewUuid, hasInitialized]);

  // 일반 모드에서 데이터 로드 (interviewGuide에서 이미 API 호출됨)
  useEffect(() => {
    if (isRetryMode || hasInitialized) return;
    
    setIsSessionConnecting(true);
    
    // sessionStorage에서 문제 정보 복원
    fallbackToNormalMode();
    setHasInitialized(true);
    setIsSessionConnecting(false);
  }, [isRetryMode, hasInitialized]);

  // 일반 모드 또는 폴백 시 시작 응답 저장 데이터에서 PT 상세 복원
  const fallbackToNormalMode = () => {
    const storeKey = searchParams.get('storeKey');
    if (!storeKey) return;
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      
      // questions[0] 우선 사용, 없으면 ptInitial
      const title = saved?.questions?.[0]?.title || saved?.ptInitial?.title || '';
      const situation = saved?.questions?.[0]?.situation || saved?.ptInitial?.situation || '';
      const preparationTime = saved?.ptInitial?.preparationTime || saved?.preparationTime || 60;
      const presentationTime = saved?.ptInitial?.presentationTime || saved?.presentationTime || 300;
      const resultId = saved?.resultId || sessionId; // sessionId를 resultId로 사용
      
      const data: PTData = {
        problemTitle: title,
        problemDescription: situation,
        preparationTime,
        presentationTime,
        resultId,
      };
      
      dispatch({ type: 'SET_DATA', payload: data });
    } catch (e) {
      console.error('❌ [PT] 일반 모드 데이터 로드 실패:', e);
    }
  };

  // 세션 조인 (일반 모드와 리트라이 모드 모두)
  useEffect(() => {
    // 이미 세션이 연결되어 있거나 연결 중이면 스킵
    if (session || isSessionConnecting || !hasInitialized || !openViduSessionId) {
      return;
    }

    setIsSessionConnecting(true);
    
    // 실제 세션 조인 호출
    joinSession(openViduSessionId).then(() => {
      setIsSessionConnecting(false);
    }).catch((error) => {
      console.error('❌ [PT] 세션 조인 실패:', error);
      setIsSessionConnecting(false);
    });
  }, [hasInitialized, openViduSessionId]); // 의존성 배열 단순화

  // 컴포넌트 언마운트 시에만 세션 정리
  useEffect(() => {
    return () => {
      if (session) {
        try {
          leaveSession();
        } catch (error) {
          console.error('❌ [PT] 컴포넌트 언마운트 시 세션 정리 실패:', error);
        }
      }
    };
  }, []); // 빈 의존성 배열로 마운트/언마운트 시에만 실행

  const startRecordingMutation = useMutation({
    mutationFn: (interviewId: string) => startRecording(interviewId),
    onSuccess: (data: any) => {
      const newRecordingId = data?.recordingId || data?.id;
      if (newRecordingId) {
        dispatch({ type: 'SET_RECORDING_ID', payload: newRecordingId });
      }
      // 녹화 시작 성공 시 발표 상태로 전환
      dispatch({ type: 'START_PRESENTATION' });
    },
    onError: (e) => {
      console.error('🔥 PT 녹화 시작 실패', e);
      // 녹화 시작 실패 시 준비 상태로 되돌리기
      if (state.phase === 'waiting_presentation') {
        dispatch({ type: 'SET_DATA', payload: ptData! });
      }
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: (recId: string) => stopRecording(recId),
    onError: (e) => console.error('🔥 PT 녹화 중지 실패', e),
  });

  // PT 진행 동안 WebSocket 상태 설정: 발표 시작 시 진행 상태 설정(총 1문항)
  useEffect(() => {
    if (phase === 'presenting') {
      wsStartInterview(1);
    }
  }, [phase, wsStartInterview]);

  const handlePresentationFinish = useCallback(async () => {
    try {
      
      // 녹화 중지
      if (recordingId) {
        await stopRecordingMutation.mutateAsync(recordingId);
      }
      
      // WebSocket 진행 상태: 질문 완료 처리 (서버가 answerAttemptId를 전송하도록 트리거)
      wsCompleteQuestion();
      
      // 세션 나가기 (리트라이 모드에서도 안전하게 처리)
      if (session) {
        await leaveSession();
      } else {
      }
      
      // 상위 컴포넌트에 완료 알림 (InterviewSession에서 WebSocket 처리 및 CompletionScreen 렌더링)
      if (onComplete) {
        onComplete([]);
      }
      
      // 로컬 상태도 complete로 변경
      dispatch({ type: 'FINISH_PRESENTATION', payload: [] });
      
    } catch (error) {
      console.error('❌ [PT] 발표 완료 처리 중 오류 발생:', error);
      
      // 오류가 발생해도 세션은 정리
      try {
        if (session) {
          await leaveSession();
        }
      } catch (leaveError) {
        console.error('❌ [PT] 오류 발생 후 세션 정리 실패:', leaveError);
      }
      
      // 오류가 발생해도 완료 처리
      if (onComplete) {
        onComplete([]);
      }
      dispatch({ type: 'FINISH_PRESENTATION', payload: [] });
    }
  }, [leaveSession, recordingId, stopRecordingMutation, wsCompleteQuestion, onComplete, session]);

  // 타이머 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'preparing') {
      if (prepTime <= 0) {
        dispatch({ type: 'START_PRESENTATION' });
        return;
      }
      timer = setInterval(() => dispatch({ type: 'TICK_PREP' }), 1000);
    } else if (phase === 'presenting') {
      if (presTime <= 0) {
        handlePresentationFinish();
        return;
      }
      timer = setInterval(() => dispatch({ type: 'TICK_PRES' }), 1000);
    }
    return () => clearInterval(timer);
  }, [phase, prepTime, presTime, handlePresentationFinish]);

  const handleStartPresentation = () => {
    dispatch({ type: 'START_RECORDING_WAIT' });
  };

  // waiting_presentation 상태에서 녹화 자동 시작 (직무/인성 면접과 동일한 패턴)
  useEffect(() => {
    // loading 상태에서는 녹화 시작 체크하지 않음
    if (phase === 'loading') return;
    
    
    if (phase === 'waiting_presentation' && session && publisher && !recordingId && !startRecordingMutation.isPending) {
      startRecordingMutation.mutate(session.sessionId);
    } else {
    }
  }, [phase, session, publisher, recordingId, startRecordingMutation.isPending]);

  const remainingTime = phase === 'preparing' ? prepTime : presTime;
  const timerText = phase === 'preparing' ? '준비 시간' : '발표 시간';
  const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
  const seconds = (remainingTime % 60).toString().padStart(2, '0');

  if (phase === 'loading') {
    // PT 데이터가 로드되었는지 확인
    if (ptData) {
      return null; // 데이터가 있으면 다음 단계로 진행
    }
    
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg mb-2">PT 면접 데이터 로딩 중...</p>
          {isSessionConnecting && (
            <p className="text-sm text-gray-500">세션 연결 중...</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    // PT 완료 시 상위 컴포넌트(InterviewSession)에서 CompletionScreen 처리
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg mb-2">발표 완료 처리 중...</p>
        </div>
      </div>
    );
  }
  
  if (!ptData) {
    // 세션이 연결 중이거나 초기화 중인 경우 로딩 화면 표시
    if (isSessionConnecting || !hasInitialized) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg mb-2">PT 면접 준비 중...</p>
            <p className="text-sm text-gray-500">
              {isSessionConnecting ? '세션 연결 중...' : '데이터 로드 중...'}
            </p>
          </div>
        </div>
      );
    }
    
    // 세션 연결 실패 또는 데이터 로드 실패
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-lg mb-2 text-red-600">PT 면접 데이터 로드 실패</p>
          <p className="text-sm text-gray-500">페이지를 새로고침하거나 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }
  
  return (
      <div className="flex-grow flex p-4 lg:p-6 gap-6">
        {/* Left Side: Whiteboard */}
        <main className="flex-grow flex flex-col rounded-2xl bg-white/70 backdrop-blur-lg shadow-2xl border border-white/30 overflow-hidden">
          <div className="flex-grow bg-white">
            <div className="w-full h-full">
              <Tldraw />
            </div>
          </div>
        </main>

        {/* Right Side: Smart Control Deck */}
        <aside className="w-96 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-grow flex flex-col gap-6 p-6 rounded-2xl bg-white/70 backdrop-blur-lg shadow-2xl border border-white/30"
          >
            {/* Camera Toggle Button */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">화상 피드</h3>
              <button
                onClick={() => setIsCameraVisible(!isCameraVisible)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isCameraVisible ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    숨기기
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    보이기
                  </>
                )}
              </button>
            </div>

            {/* User Video */}
            <AnimatePresence>
              {isCameraVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-1"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-900 border-2 border-gray-300">
                    {publisher ? (
                      <UserVideo streamManager={publisher} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-400">카메라 준비 중...</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center mt-2 space-x-4 text-sm font-semibold">
                    <div className="flex items-center text-green-600">
                      <Mic className="w-4 h-4" />
                      <span className="ml-1">마이크 입력 확인됨</span>
                    </div>
                    <AnimatePresence>
                      {phase === 'presenting' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center text-red-600"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-3 h-3 bg-red-600 rounded-full mr-2"
                          />
                          <span>REC</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer */}
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">{timerText}</p>
              <div className="flex items-center justify-center text-2xl font-bold text-gray-800 font-mono tracking-wide mt-1">
                {phase === 'preparing' ? <Hourglass className="w-6 h-6 mr-2 text-yellow-600" /> : <Timer className="w-6 h-6 mr-2 text-red-500" />}
                <span>{minutes}:{seconds}</span>
              </div>
            </div>

            {/* Problem Statement */}
            <div className="flex-grow flex flex-col border-t border-gray-200 pt-4">
              <h3 className="flex items-center text-lg font-semibold mb-2 text-gray-900">
                <FileText className="w-5 h-5 mr-2" />
                문제 설명
              </h3>
              <div className="flex-grow space-y-2 text-gray-600 overflow-y-auto pr-2">
                <p className={`font-bold text-gray-800 ${!isCameraVisible ? 'text-lg' : 'text-base'}`}>
                  {ptData.problemTitle}
                </p>
                <p className={`leading-relaxed ${!isCameraVisible ? 'text-base' : 'text-sm'}`}>
                  {ptData.problemDescription}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div>
              {phase === 'presenting' ? (
                <Button onClick={handlePresentationFinish} size="lg" className="w-full bg-blue-600 hover:bg-blue-700" disabled={stopRecordingMutation.isPending}>
                  <Video className="mr-2" /> 발표 완료 및 제출
                </Button>
              ) : phase === 'waiting_presentation' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-blue-700 font-medium">녹화 시작 중...</span>
                  </div>
                  <p className="text-sm text-blue-600 text-center">
                    녹화가 시작될 때까지 잠시만 기다려주세요
                  </p>
                </motion.div>
              ) : (
                <Button onClick={handleStartPresentation} size="lg" className="w-full bg-green-600 hover:bg-green-700" disabled={startRecordingMutation.isPending}>
                  <PlayCircle className="mr-2" /> 발표 시작
                </Button>
              )}
            </div>
          </motion.div>
        </aside>
      </div>
  );
}
