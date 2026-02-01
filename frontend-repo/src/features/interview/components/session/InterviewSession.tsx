'use client';

import { useEffect, useReducer, useRef, useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
// stopRecording 임포트 추가
import { startRecording, stopRecording } from '@/features/interview/api/interview';
import ProgressBar from '@/features/interview/components/session/ProgressBar';
import CompletionScreen from '@/features/interview/components/session/CompletionScreen';
import PTInterviewLayout from '@/features/interview/components/session/PTInterviewLayout';
import SetFeedbackModal from '@/features/interview/components/session/SetFeedbackModal';

import { motion } from 'framer-motion';
import { Video, Loader, Timer } from 'lucide-react';
import UserVideo from '@/features/interview/components/session/UserVideo';
import { useOpenVidu } from '@/features/interview/hooks/useOpenVidu';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Button from '@/shared/components/Button';
import { useWebSocketStore } from '@/shared/store/websocketStore';
import apiClient from '@/shared/api/client';
import { getFeedbackAPI } from '@/shared/api/results';

// 질문/꼬리질문 전개 유틸
type BaseQ = { id?: string | number; question: string };
type FullQ = BaseQ & { followUps?: BaseQ[] };

type ExpandedQ = BaseQ & {
  kind: 'main' | 'follow';
  parentId?: string | number;
  followIndex?: number; // 1부터
};

// --- 유틸: 서버/스토리지 raw 질문을 FullQ로 정규화 ---
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

// ① props 타입
interface InterviewSessionProps {
  interviewType: string;
  sessionId: string;
  initialAttemptIds?: string[];
}

// ② 상태/리듀서
interface InterviewState {
  step: 'loading' | 'preparing' | 'waiting_recording' | 'answering' | 'complete';
  questions: ExpandedQ[]; // 전개된 질문 배열
  currentQuestionIndex: number;
  remainingTime: number;
  resultId: string | null;
  currentRecordingId: string | null; // ✅ 현재 녹화 ID 추가
}

type InterviewAction =
  | { type: 'START_INTERVIEW'; payload: ExpandedQ[] }
  | { type: 'START_RECORDING_WAIT' }
  | { type: 'START_ANSWERING' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_INTERVIEW' }
  | { type: 'COMPLETE' }
  | { type: 'TICK' }
  | { type: 'LOAD_QUESTIONS'; payload: ExpandedQ[] }
  | { type: 'ADD_QUESTIONS'; payload: ExpandedQ[] } // ✅ 새로운 질문 추가 액션
  | { type: 'SET_RECORDING_ID'; payload: string | null } // ✅ 액션 타입 추가
  | { type: 'SET_RESULT_ID'; payload: string | null }
  | { type: 'SET_QUESTION_INDEX'; payload: number };

const TOTAL_ANSWER_TIME = 60;

function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case 'START_INTERVIEW':
      return { ...state, questions: action.payload, step: 'preparing', currentQuestionIndex: 0, remainingTime: TOTAL_ANSWER_TIME, currentRecordingId: null };
    case 'START_RECORDING_WAIT':
      return { ...state, step: 'waiting_recording' };
    case 'START_ANSWERING':
      return { ...state, step: 'answering' };
    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1, step: 'preparing', remainingTime: TOTAL_ANSWER_TIME, currentRecordingId: null };
      }
      // 마지막 질문이면 complete로 이동 (세트 피드백은 별도 로직에서 처리)
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'COMPLETE_INTERVIEW':
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'COMPLETE':
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'TICK':
      if (state.remainingTime > 0) {
        return { ...state, remainingTime: state.remainingTime - 1 };
      }
      // 시간이 다 되면 자동으로 다음 질문으로 (녹화 중지 로직은 핸들러에서 처리 필요)
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1, step: 'preparing', remainingTime: TOTAL_ANSWER_TIME, currentRecordingId: null };
      }
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'LOAD_QUESTIONS':
      return { ...state, questions: action.payload, step: 'preparing', currentQuestionIndex: 0, remainingTime: TOTAL_ANSWER_TIME, currentRecordingId: null };
    case 'ADD_QUESTIONS': // ✅ 새로운 질문 추가 케이스
      return { ...state, questions: [...state.questions, ...action.payload] };
    case 'SET_RECORDING_ID': // ✅ 리듀서 로직 추가
      return { ...state, currentRecordingId: action.payload };
    case 'SET_RESULT_ID':
      return { ...state, resultId: action.payload };
    case 'SET_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload, step: 'preparing', remainingTime: TOTAL_ANSWER_TIME, currentRecordingId: null };
    default:
      return state;
  }
}

const initialState: InterviewState = {
  step: 'loading',
  questions: [],
  currentQuestionIndex: 0,
  remainingTime: TOTAL_ANSWER_TIME,
  resultId: null,
  currentRecordingId: null, // ✅ 초기 상태 추가
};

export default function InterviewSession({ interviewType, sessionId, initialAttemptIds }: InterviewSessionProps) {
  // interviewType 정규화: URL 파라미터를 내부 타입으로 변환
  const normalizedInterviewType = useMemo(() => {
    const typeMap: Record<string, string> = {
      'tech': 'job',           // 직무 면접
      'behavioral': 'personality', // 인성 면접  
      'presentation': 'presentation', // PT 면접
      'job': 'job',
      'personality': 'personality'
    };
    return typeMap[interviewType] || interviewType;
  }, [interviewType]);

  const mySessionId = sessionId;
  const myUserName = useRef('User-' + crypto.randomUUID()).current;
  const navigate = useNavigate();
  const location = useLocation();
  const [interviewUuid, setInterviewUuid] = useState<string | null>(null);
  const [answerAttemptIds, setAnswerAttemptIds] = useState<string[]>([]); // WebSocket에서 받은 answerAttemptId들
  const [recordingStarted, setRecordingStarted] = useState<{[key: string]: boolean}>({}); // 각 세션별 녹화 시작 여부 추적
  
  // 세트별 answerAttemptId 관리
  const [setAnswerAttempts, setSetAnswerAttempts] = useState<{[setIndex: number]: string[]}>({});
  const [showSetFeedback, setShowSetFeedback] = useState<number | null>(null); // 피드백을 보여줄 세트 인덱스

  const { session, publisher, subscribers, joinSession, leaveSession } = useOpenVidu(mySessionId, myUserName);
  const { 
    connect: connectWebSocket, 
    startInterview, 
    completeQuestion
    // endInterview
  } = useWebSocketStore();

  const [state, dispatch] = useReducer(interviewReducer, initialState);
  const { step, questions, currentQuestionIndex, remainingTime, resultId, currentRecordingId } = state;


  const [searchParams] = useSearchParams();
  const storeKey = searchParams.get('storeKey') || '';
  const interviewUuidParam = searchParams.get('interviewUuid');
  const shouldGenerateNext = searchParams.get('generateNext') === '1';
  const isRetryMode = Array.isArray(initialAttemptIds) && initialAttemptIds.length > 0;
  const generatedNextRef = useRef(false);
  const generateInFlightRef = useRef(false);
  const [totalSets, setTotalSets] = useState<number>(3);

  // 재시도 진입 시 전달된 attemptIds 로그 (필요 시 추후 로직에 활용)
  useEffect(() => {
    if (initialAttemptIds && initialAttemptIds.length > 0) {
    }
  }, [initialAttemptIds]);

  // 재시도 모드인 경우, attemptIds의 피드백에서 질문 텍스트를 가져와 질문 리스트 생성 후 answering 상태로 진입
  useEffect(() => {
    if (!isRetryMode) return;
    if (questions.length > 0 || step === 'answering') return;
    (async () => {
      try {
        const targetIds = initialAttemptIds!.slice(0, 3);
        
        // 순서를 명확히 보장하기 위해 각 피드백에 인덱스 정보 추가
        const feedbackPromises = targetIds.map((id, index) => 
          getFeedbackAPI(id)
            .then((res: any) => ({
              index,
              id,
              data: res?.result || res
            }))
            .catch(e => {
              console.warn(`피드백 로드 실패 (인덱스 ${index}, ID: ${id}):`, e);
              return { index, id, data: null };
            })
        );
        
        const feedbackResults = await Promise.all(feedbackPromises);
        
        // 인덱스 순서대로 정렬 (혹시 모를 순서 문제 방지)
        feedbackResults.sort((a, b) => a.index - b.index);
        
        const items: ExpandedQ[] = feedbackResults.map((item, idx) => {
          const feedback = item.data;
          
          return {
            id: item.id,
            question: feedback?.question || feedback?.title || (idx === 0 ? '본질문 (재시도)' : `꼬리질문 ${idx} (재시도)`),
            kind: idx === 0 ? 'main' : 'follow',
            parentId: idx === 0 ? undefined : targetIds[0],
            followIndex: idx === 0 ? undefined : idx,
          };
        });
        dispatch({ type: 'LOAD_QUESTIONS', payload: items });
      } catch (e) {
        console.error('재시도 질문 구성 실패:', e);
      }
    })();
  }, [isRetryMode, initialAttemptIds, questions.length, step]);

  // ✅ 녹화 시작 뮤테이션 수정
  const startRecordingMutation = useMutation({
    mutationFn: (variables: { interviewId: string }) => startRecording(variables.interviewId),
    onSuccess: (data) => {
      // 백엔드 응답에서 recordingId 추출 (실제 필드명에 맞게 수정 필요)
      const recordingId = data?.recordingId || data?.id; 
      if (recordingId) {
        dispatch({ type: 'SET_RECORDING_ID', payload: recordingId });
      } else {
        console.error('응답에서 recordingId를 찾을 수 없습니다.');
      }
      // 녹화 시작 응답 후 answering 상태로 전환
      dispatch({ type: 'START_ANSWERING' });
    },
    onError: (error: any) => {
      console.error('🔥 녹화 시작 실패', error);
      // 녹화 시작 실패 시 preparing 상태로 되돌리기
      dispatch({ type: 'START_INTERVIEW', payload: questions });
    },
  });

  // ✅ 녹화 중지 뮤테이션 추가
  const stopRecordingMutation = useMutation({
    mutationFn: (recordingId: string) => stopRecording(recordingId),
    onSuccess: (data: any) => {
      const interviewUuid =
        data?.interviewUuid || data?.result?.interviewUuid || data?.data?.interviewUuid;
      if (interviewUuid) {
        dispatch({ type: 'SET_RESULT_ID', payload: interviewUuid });
      }
      
      // WebSocket 스토어에 질문 완료 알림
      completeQuestion();
    },
    onError: (error: any) => console.error('🔥 녹화 중지 실패', error),
  });

  // 페이지 이탈 시 녹화 중지 처리
  const recordingIdRef = useRef<string | null>(null);
  
  // currentRecordingId 변경 시 ref 업데이트
  useEffect(() => {
    recordingIdRef.current = currentRecordingId;
  }, [currentRecordingId]);
  
  useEffect(() => {
    // 마운트 시점에만 실행, cleanup에서만 녹화 중지
    return () => {
      // 컴포넌트 언마운트 시에만 녹화 중지 (실제 페이지 이탈)
      if (recordingIdRef.current) {
        
        // sendBeacon으로 안전한 전송
        if (navigator.sendBeacon) {
          const data = new Blob([JSON.stringify({ recordingId: recordingIdRef.current })], {
            type: 'application/json'
          });
          navigator.sendBeacon('/api/recordings/stop', data);
        }
      }
    };
  }, []); // 빈 의존성 배열로 마운트/언마운트 시에만 실행

  // 세션스토리지 우선 로딩
  useEffect(() => {
    if (!storeKey) return;
    const raw = sessionStorage.getItem(storeKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved?.interviewUuid) {
          setInterviewUuid(saved.interviewUuid);
          // 결과 화면 버튼 활성화를 위해 미리 resultId에 주입
          dispatch({ type: 'SET_RESULT_ID', payload: saved.interviewUuid });
        }
        // 저장된 총 세트 수가 있으면 countParam 대체용으로 활용
        if (typeof saved?.totalInterviewSets === 'number' && saved.totalInterviewSets > 0) {
          setTotalSets(saved.totalInterviewSets);
        }
        if (Array.isArray(saved?.questions) && saved.questions.length > 0) {
          const expanded = expandQuestions(toFullQs(saved.questions));
          dispatch({ type: 'LOAD_QUESTIONS', payload: expanded });
        }
      } catch (error) {
        console.error('세션스토리지 파싱 에러:', error);
      }
    }
  }, [storeKey, dispatch]);

  // URL 파라미터로 전달된 interviewUuid도 보조적으로 반영
  useEffect(() => {
    if (interviewUuidParam && !interviewUuid) {
      setInterviewUuid(interviewUuidParam);
      dispatch({ type: 'SET_RESULT_ID', payload: interviewUuidParam });
    }
  }, [interviewUuidParam, interviewUuid]);

  // URL에서 count 파라미터 추출 (count = 사용자가 설정한 InterviewSet 수)
  const countParam = searchParams.get('count');
  useEffect(() => {
    const parsed = countParam ? parseInt(countParam) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0) {
      setTotalSets(prev => (prev == null ? parsed : prev));
    }
  }, [countParam]);

  // 유효한 총 세트 수 산출
  const parsedCount = countParam ? parseInt(countParam) : NaN;
  const effectiveTotalSets = !Number.isNaN(parsedCount) && parsedCount > 0 ? parsedCount : totalSets;

  // 세션 진입 시 generateNext=1 이면 다음 질문 세트를 확인 후 로드
  useEffect(() => {
    if (!shouldGenerateNext) return;
    if (!interviewUuidParam) return;
    if (generatedNextRef.current || generateInFlightRef.current) return;
    
    // 약간 지연시켜서 세션스토리지 로드가 먼저 완료되도록 함
    const timer = setTimeout(() => {
      // 세션스토리지에 질문이 이미 있는지 먼저 확인
      if (storeKey) {
        const raw = sessionStorage.getItem(storeKey);
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            if (Array.isArray(saved?.questions) && saved.questions.length > 0) {
              const expanded = expandQuestions(toFullQs(saved.questions));
              dispatch({ type: 'LOAD_QUESTIONS', payload: expanded });
              generatedNextRef.current = true;
              
              // URL에서 generateNext 파라미터 제거
              const params = new URLSearchParams(location.search);
              params.delete('generateNext');
              navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
              return;
            }
          } catch (error) {
            console.error('세션스토리지 파싱 에러:', error);
          }
        }
      }
      
      // 세션스토리지에 질문이 없으면 API 호출
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
          dispatch({ type: 'LOAD_QUESTIONS', payload: expandedNewQuestions });
          generatedNextRef.current = true;

          // URL에서 generateNext 파라미터 제거하여 재실행 방지
          const params = new URLSearchParams(location.search);
          params.delete('generateNext');
          navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
        } catch (error) {
          console.error('>>> [Session] generateNext 처리 실패:', error);
          alert('다음 질문 세트를 불러오는 중 오류가 발생했습니다.');
        } finally {
          generateInFlightRef.current = false;
        }
      })();
    }, 100); // 100ms 지연으로 세션스토리지 로드 우선

    return () => clearTimeout(timer);
  }, [shouldGenerateNext, interviewUuidParam, location.pathname, location.search, navigate, storeKey]);

  // 피드백 페이지로 이동하는 함수
  const navigateToFeedbackPage = (recordingIds: string[], targetSet?: number) => {
    if (!resultId || recordingIds.length === 0) {
      console.warn('⚠️ resultId 또는 recordingIds가 없어서 피드백 페이지로 이동할 수 없습니다.');
      return;
    }

    // 대상 세트 결정 (파라미터로 받거나 현재 세트 계산)
    const setIndex = targetSet !== undefined ? targetSet : Math.floor(currentQuestionIndex / 3);
    
    // 해당 세트의 모든 답변 ID를 가져와서 전달 (이미 수집된 것들)
    const setAnswerIds = setAnswerAttempts[setIndex] || recordingIds;
    
    // 3개 질문 모두를 위한 자리 확보 (빈 자리는 나중에 채워질 예정)
    const paddedAnswerIds = [...setAnswerIds];
    while (paddedAnswerIds.length < 3) {
      paddedAnswerIds.push(''); // 빈 ID로 자리 확보
    }
    
    // 빈 문자열 제거하고 실제 ID만 전달
    const validAnswerIds = paddedAnswerIds.filter(id => id.trim() !== '');

    const attemptIdsParam = validAnswerIds.join(',');
    const setCount = effectiveTotalSets; // 전체 세트 수
    const targetUrl = `/results/${resultId}/feedback?step=2&attemptIds=${attemptIdsParam}&count=${setCount}&setIndex=${setIndex}`;
    
    navigate(targetUrl);
  };

  // WebSocket에서 분석 결과를 받았을 때 answerAttemptId 수집 (useCallback으로 안정적인 참조 보장)
  const handleAnalysisResult = useCallback((answerAttemptId: string) => {
    
    // 전체 answerAttemptIds 업데이트
    setAnswerAttemptIds(prev => {
      const newIds = !prev.includes(answerAttemptId) ? [...prev, answerAttemptId] : prev;
      return newIds;
    });
    
    // 세트별 answerAttemptIds 업데이트 - 실시간으로 세트 번호를 계산하지 않고 순차적으로 처리
    setSetAnswerAttempts(prev => {
      // 현재까지 모든 세트의 answerAttemptId 총 개수 계산
      const totalCollected = Object.values(prev).reduce((sum, arr) => sum + arr.length, 0);
      
      // 새로운 answerAttemptId가 어느 세트에 속하는지 계산
      const targetSet = Math.floor(totalCollected / 3);
      
      
      const currentSetAttempts = prev[targetSet] || [];
      if (!currentSetAttempts.includes(answerAttemptId)) {
        const newSetAttempts = [...currentSetAttempts, answerAttemptId];
        
        // 첫 번째 피드백이 도착하면 기록 (3개 질문 모두 완료 후에만 페이지 이동)
        if (newSetAttempts.length === 1) {
          
          // 현재 세트의 모든 질문이 완료되었는지 확인
          const currentSet = Math.floor(currentQuestionIndex / 3);
          const isCurrentSetComplete = currentQuestionIndex >= (currentSet + 1) * 3 - 1;
          const isQuestionInProgress = step === 'answering';
          
          // 질문 완료 + 세트 완료 상태이거나, 모달 대기 중인 경우 즉시 이동
          if ((!isQuestionInProgress && isCurrentSetComplete) || showSetFeedback === targetSet) {
            if (showSetFeedback === targetSet) {
              setShowSetFeedback(null); // 모달 닫기
            } else {
            }
            navigateToFeedbackPage(newSetAttempts);
          } else {
          }
        }
        // 추가 피드백 도착 로깅 (페이지에서 실시간 업데이트됨)
        else {
          if (newSetAttempts.length === 3) {
          }
        }
        
        return {
          ...prev,
          [targetSet]: newSetAttempts
        };
      }
      return prev;
    });
  }, [totalSets]);

  // WebSocket 연결: 질문이 로드되면 면접 시작 전에 연결하고 전역으로 유지 (PT 포함)
  useEffect(() => {
    // 인성/직무: 질문이 있고 면접이 시작 상태일 때 WebSocket 연결
    // PT: normalizedInterviewType이 presentation일 때 즉시 WebSocket 연결 (분석 결과 수집용)
    const shouldConnectWebSocket = 
      (questions.length > 0 && (step === 'waiting_recording' || step === 'answering')) ||
      (normalizedInterviewType === 'presentation' && step !== 'complete');
      
    if (shouldConnectWebSocket) {
      
      // 총 질문 수 계산
      const totalQuestionsCount = normalizedInterviewType === 'presentation' 
        ? 1 // PT는 1개 질문
        : totalSets * 3; // 인성/직무는 각 InterviewSet당 3개 질문
        
      
      startInterview(totalQuestionsCount);
      connectWebSocket(handleAnalysisResult);
    }

    // 컴포넌트 언마운트 시에는 콜백을 제거하지 않음 (CompletionScreen에서도 분석 결과를 받아야 함)
    return () => {
      // removeCallback은 하지 않음 - CompletionScreen에서도 분석 결과를 받아야 함
    };
  }, [questions.length, step, connectWebSocket, startInterview, totalSets, handleAnalysisResult, normalizedInterviewType]);

  // 질문이 변경될 때마다 새로운 OpenVidu 세션을 생성
  useEffect(() => {
    if (questions.length === 0 || step === 'loading' || step === 'preparing' || step === 'complete' || step === 'answering') return;

    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion?.id?.toString();

    // 재시도 모드면 attemptIds로 세션 참여, 아니면 기존 questionId 사용
    const retrySessionId = isRetryMode ? initialAttemptIds![currentQuestionIndex] : null;
    const newSessionId = (retrySessionId || questionId)?.toString();

    if (!newSessionId) {
      console.error(`[Error] 질문 ${currentQuestionIndex + 1}의 세션ID를 계산할 수 없습니다.`);
      return;
    }
    const sessionManager = async () => {
      try {
        // 세션이 존재하는지 확인 후 종료 (연결 상태 체크는 제거)
        if (session) {
          await leaveSession();
        }
        await joinSession(newSessionId);
      } catch (error) {
        console.error(`[Session] 세션 처리 중 오류가 발생했습니다:`, error);
      }
    };
    sessionManager();
  }, [currentQuestionIndex, questions, step]);

  // waiting_recording 상태에서 세션이 준비되면 녹화 시작
  useEffect(() => {
    
    if (step === 'waiting_recording' && session && publisher && questions.length > 0) {
      const sessionId = session.sessionId;
      const currentQuestion = questions[currentQuestionIndex];
      const questionId = currentQuestion?.id;

      // 이미 이 세션에서 녹화를 시작했거나 현재 녹화 중이면 건너뛰기
      if (questionId && !recordingStarted[sessionId] && !currentRecordingId && !startRecordingMutation.isPending) {
        setRecordingStarted(prev => ({ ...prev, [sessionId]: true }));
        startRecordingMutation.mutate({
          interviewId: sessionId,
        });
      } else {
      }
    }
  }, [step, session, publisher, questions, currentQuestionIndex, recordingStarted, currentRecordingId, startRecordingMutation.isPending]);

  // 타이머: answering 상태에서만 동작
  useEffect(() => {
    if (step !== 'answering') return;
    const timerId = setInterval(() => {
        if (remainingTime <= 1) {
            handleNextQuestion();
        } else {
            dispatch({ type: 'TICK' });
        }
    }, 1000);
    return () => clearInterval(timerId);
  }, [step, remainingTime]);

  // 세트 피드백 모달 핸들러들
  const handleCloseFeedbackModal = () => {
    setShowSetFeedback(null);
  };

  const handleRetrySet = () => {
    if (showSetFeedback === null) return;
    
    const setIndex = showSetFeedback;
    
    // 해당 세트의 answerAttemptIds 초기화
    setSetAnswerAttempts(prev => ({
      ...prev,
      [setIndex]: []
    }));
    
    // 전체 answerAttemptIds에서 해당 세트 부분 제거
    setAnswerAttemptIds(prev => {
      const newIds = [...prev];
      const startIndex = setIndex * 3;
      // 해당 세트의 answerAttemptIds 제거
      newIds.splice(startIndex, 3);
      return newIds;
    });
    
    // 해당 세트의 첫 번째 질문으로 이동
    const targetQuestionIndex = setIndex * 3;
    dispatch({ type: 'SET_QUESTION_INDEX', payload: targetQuestionIndex });
    
    // 모달 닫기
    setShowSetFeedback(null);
    
  };

  // 다음 질문 세트 생성 API 호출 함수
  const generateNextQuestionSet = async () => {
    if (!interviewUuid) {
      throw new Error('interviewUuid가 없습니다.');
    }
    
    try {
      
      const response = await apiClient.post(
        '/api/interview/generateQuestions',
        { interviewUuid },
        { 
          withCredentials: true, 
          timeout: 60000, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
      
      
      // 응답에서 새로운 질문들을 추출하고 ExpandedQ 형태로 변환
      const responseData = response.data || response;
      const newQuestions = responseData?.questions || responseData?.result?.questions || [];
      if (Array.isArray(newQuestions) && newQuestions.length > 0) {
        const expandedNewQuestions = expandQuestions(toFullQs(newQuestions));
        dispatch({ type: 'ADD_QUESTIONS', payload: expandedNewQuestions });
      } else {
        console.warn('>>> [API] 새로운 질문이 응답에 없습니다:', responseData);
      }
      
      return response;
    } catch (error) {
      console.error('>>> [API] 질문 생성 실패:', error);
      throw error;
    }
  };



  const handleNextSetFromModal = async () => {
    const nextSetIndex = (showSetFeedback || 0) + 1;
    
    if (nextSetIndex < totalSets) {
      // 다음 질문 세트 생성 API 호출
      try {
        await generateNextQuestionSet();
        
        
        // 질문 생성 완료 후 모달 닫기
        setShowSetFeedback(null);
        
        // 약간의 딜레이 후 다음 세트로 이동 (DOM 업데이트 보장)
        setTimeout(() => {
          const nextQuestionIndex = nextSetIndex * 3;
          dispatch({ type: 'SET_QUESTION_INDEX', payload: nextQuestionIndex });
        }, 100);
        
      } catch (error) {
        console.error('>>> [Modal] 질문 생성 실패:', error);
        alert('다음 질문 세트 생성에 실패했습니다.');
        // 실패 시에도 모달 닫기
        setShowSetFeedback(null);
      }
    } else {
      // 마지막 세트인 경우 면접 완료
      setShowSetFeedback(null);
      dispatch({ type: 'COMPLETE' });
    }
  };

  // ✅ 면접 종료 핸들러 수정
  // const confirmEndInterview = async () => {
  //   
  //   // 면접 강제 종료 시 WebSocket 연결도 종료
  //   endInterview();
  //   
  //   if (currentRecordingId) {
  //     const stopResult: any = await stopRecordingMutation.mutateAsync(currentRecordingId);
  //     await leaveSession();
  //     // 우선순위: 시작 시 받은 interviewUuid → 정지 응답에서 추출 → state.resultId → 목록
  //     const uuidFromStart = interviewUuid || interviewUuidParam;
  //     const uuidFromStop =
  //       stopResult?.interviewUuid || stopResult?.result?.interviewUuid || stopResult?.data?.interviewUuid;
  //     if (uuidFromStart) {
  //       navigate(`/results/${uuidFromStart}`);
  //       return;
  //     }
  //     if (uuidFromStop) {
  //       navigate(`/results/${uuidFromStop}`);
  //       return;
  //     }
  //   }
  //   await leaveSession();
  //   // resultId가 이미 설정되어 있다면 상세로 이동, 없으면 목록으로 이동
  //   if (state.resultId) {
  //     navigate(`/results/${state.resultId}`);
  //   } else {
  //     navigate('/results');
  //   }
  // };

  const handleNextQuestion = useCallback(() => {
    if (stopRecordingMutation.isPending) {
      return;
    }
    
    // 추가 안전 장치: 이미 처리 중인 경우 방지
    if (step === 'complete') {
      return;
    }

    const processNextQuestion = async () => {
      // 현재 세트 계산
      const isLastQuestionInSet = (currentQuestionIndex + 1) % 3 === 0;
      const isLastQuestionOverall = currentQuestionIndex >= questions.length - 1;

      // 세트 종료 시점에서 세션 종료 (기존 로직 유지하되 로그 개선)
      if (isLastQuestionInSet && session) {
        try {
          await leaveSession(); // ✅ 세트 종료 시점 sessionLeave
        } catch (err) {
          console.error('세션 종료 실패:', err);
          // 세션 종료 실패해도 다음 질문 진행 (면접 연속성 보장)
        }
      }

      // 다음 질문 진행
      if (!isLastQuestionOverall) {
        dispatch({ type: 'NEXT_QUESTION' });
      } else {
        dispatch({ type: 'COMPLETE' });
      }
    };

    if (currentRecordingId) {
      stopRecordingMutation.mutate(currentRecordingId, {
        onSuccess: () => {
          dispatch({ type: 'SET_RECORDING_ID', payload: null });
          processNextQuestion();
        },
        onError: () => {
          dispatch({ type: 'SET_RECORDING_ID', payload: null });
          processNextQuestion();
        }
      });
    } else {
      processNextQuestion();
    }
  }, [stopRecordingMutation.isPending, step, currentRecordingId, currentQuestionIndex]);

  // PT 완료 시 콜백 처리
  const handlePTComplete = useCallback((_ptAnswerAttemptIds: string[]) => {
    
    // PT 완료 시 InterviewSession의 complete 상태로 전환
    // answerAttemptIds는 이미 handleAnalysisResult를 통해 수집되고 있음
    dispatch({ type: 'COMPLETE' });
  }, [answerAttemptIds]);

  // PT 면접이지만 complete 상태가 아닐 때만 PTInterviewLayout 렌더링
  if (normalizedInterviewType === 'presentation' && step !== 'complete') {
    return <PTInterviewLayout 
      sessionId={mySessionId} 
      initialAttemptIds={initialAttemptIds} 
      onComplete={handlePTComplete}
    />;
  }
  
  // 모든 타입의 면접이 완료되면 CompletionScreen 렌더링 (PT 포함)
  if (step === 'complete') {
    return <CompletionScreen 
      resultId={resultId} 
      interviewType={interviewType} 
      answerAttemptIds={answerAttemptIds} 
    />;
  }

  // 세트 피드백 모달 표시
  const currentSetAttempts = showSetFeedback !== null ? setAnswerAttempts[showSetFeedback] : [];
  const isLastSet = showSetFeedback !== null && showSetFeedback >= totalSets - 1;

  const renderContent = () => {
    // generateNext 모드에서는 로딩 화면을 더 짧게 표시
    if (step === 'loading' || (questions.length === 0 && !shouldGenerateNext)) {
      return (
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg mb-2">면접 준비 중...</p>
        </div>
      );
    }
    
    // generateNext 모드에서 질문이 아직 없으면 간단한 메시지만 표시
    if (questions.length === 0 && shouldGenerateNext) {
      return (
        <div className="text-center">
          <p className="text-lg mb-2">질문 로드 중...</p>
        </div>
      );
    }

    const cur = questions[currentQuestionIndex];

    if (step === 'preparing' || step === 'waiting_recording') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl max-w-3xl w-full"
          >
            <h2 className="text-sm font-semibold text-blue-600 mb-2">
              {cur.kind === 'main' ? '질문' : cur.followIndex === 1 ? '꼬리질문 1' : '꼬리질문 2'}
            </h2>
            <p className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
              {cur.question}
            </p>
            
            {/* 시작 버튼 또는 녹화 대기 안내 */}
            {step === 'preparing' ? (
              <Button 
                onClick={() => dispatch({ type: 'START_RECORDING_WAIT' })} 
                size="lg"
                disabled={startRecordingMutation.isPending}
              >
                <Video className="mr-2" />
                답변 시작
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center justify-center mb-2">
                  <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                  <span className="text-blue-700 font-medium">녹화 시작 중...</span>
                </div>
                <p className="text-sm text-blue-600">
                  녹화가 시작될 때까지 잠시만 기다려주세요
                </p>
                <div className="mt-2 text-xs text-blue-500">
                  {session ? '✓ 세션 연결됨' : '○ 세션 연결 중...'} • {publisher ? '✓ 카메라 준비됨' : '○ 카메라 준비 중...'}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      );
    }


    // answering step - 카메라 화면이 메인
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8">
        {/* 상단 질문 바 - 글래스 효과 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mb-6 bg-blue-50/90 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-blue-200/50"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-600">
              {cur.kind === 'main' ? '질문' : cur.followIndex === 1 ? '꼬리질문 1' : '꼬리질문 2'}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-800 leading-relaxed">
            {cur.question}
          </p>
        </motion.div>

        {/* 메인 카메라 화면 - 70% 크기, 뷰파인더 스타일 */}
        <div className="relative w-full max-w-4xl" style={{width: '70%'}}>
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300">
            {publisher ? (
              <>
                <UserVideo streamManager={publisher} className="w-full h-full object-cover" />
                
                {/* 뷰파인더 모서리 프레임 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/80"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/80"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/80"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/80"></div>
                </div>

                {/* REC 표시 - 좌상단 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2 h-2 bg-red-500 rounded-full"
                    />
                    <span className="text-sm font-bold">REC</span>
                  </div>
                </motion.div>

                {/* 타이머 - 우상단 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span className="text-xl font-mono font-bold">
                      {`${Math.floor(remainingTime / 60).toString().padStart(2, '0')}:${(remainingTime % 60).toString().padStart(2, '0')}`}
                    </span>
                  </div>
                </motion.div>

                {/* 다음 버튼 - 우하단 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 right-4"
                >
                  <button
                    onClick={handleNextQuestion}
                    disabled={stopRecordingMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white h-12 px-6 rounded-lg text-base font-semibold transition-colors flex items-center justify-center shadow-lg"
                  >
                    {stopRecordingMutation.isPending ? (
                      <Loader className="animate-spin mr-2 w-4 h-4" />
                    ) : (
                      <Video className="mr-2 w-4 h-4" />
                    )}
                    {currentQuestionIndex < questions.length - 1 ? '다음' : '완료'}
                  </button>
                </motion.div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
                  />
                  <p className="text-base">카메라 초기화 중...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 숨겨진 구독자 비디오 */}
        {subscribers.map((sub) => (
          <div key={sub.stream.streamId} className="hidden">
            <UserVideo streamManager={sub} />
          </div>
        ))}
      </div>
    );
  };

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
              currentQuestion={step === 'loading' || !questions[currentQuestionIndex] ? '다음 질문을 준비하고 있습니다.' : questions[currentQuestionIndex]?.question}
              questionType={
                step === 'loading' || !questions[currentQuestionIndex] 
                  ? '' 
                  : questions[currentQuestionIndex]?.kind === 'main' 
                    ? '질문'
                    : questions[currentQuestionIndex]?.followIndex === 1
                      ? '꼬리질문 1'
                      : '꼬리질문 2'
              }
            />
          </header>
          <main className="flex-grow flex items-center justify-center max-w-7xl mx-auto w-full">{renderContent()}</main>
        </div>
      )}
      
      {/* 세트 피드백 모달 */}
      <SetFeedbackModal
        isOpen={showSetFeedback !== null}
        onClose={handleCloseFeedbackModal}
        setIndex={showSetFeedback || 0}
        answerAttemptIds={currentSetAttempts}
        onNextSet={handleNextSetFromModal}
        onRetrySet={handleRetrySet}
        isLastSet={isLastSet}
      />
    </>
  );
}
