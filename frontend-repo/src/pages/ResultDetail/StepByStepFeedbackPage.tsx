import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import ResultDetailSkeleton from '@/pages/ResultDetail/components/ResultDetailSkeleton';
import EmotionTimelineGraph from '@/pages/ResultDetail/components/EmotionTimelineGraph';
import { getResultDetailAPI, getFeedbackAPI, getPTFeedbackAPI, generateNextPTProblemAPI } from '@/shared/api/results';
import apiClient from '@/shared/api/client';
import { useWebSocketStore } from '@/shared/store/websocketStore';
import { useAuthStore } from '@/shared/store/authStore';
import type { UnifiedInterviewDetail } from '@/shared/types/result';
import Button from '@/shared/components/Button';
import { ChevronLeft, ChevronRight, RotateCcw, ArrowRight, FileText, Lightbulb, Loader, Award } from 'lucide-react';

// task.md의 API 응답 타입 정의
interface FeedbackResponse {
  status: number;
  message: string;
  modelAnswer?: string; // WebSocket 응답에서 최상위 레벨에 있는 modelAnswer
  result: {
    feedbackType: 'PT' | 'NORMAL';
    videoPath: string;
    segment: Array<{
      start: number;
      end: number;
      text: string;
      intent: string;
    }>;
    transcript: string;
    expressions: Array<{
      second: number;
      expression: string;
    }>;
    question?: string; // 인성/직무 면접에만 있음
    title?: string; // PT 면접에만 있음
    situation?: string; // PT 면접에만 있음
    whiteboard?: string; // PT 면접에만 있음
    modelAnswer?: string; // API 응답에서 result 안에 있는 modelAnswer
    feedbackSources?: { [key: string]: { citedContent: string; sourceType: string } }; // 피드백 소스
  };
}

// PT 면접 타입 정의
interface PTFeedbackResponse {
  interviewUuid: string;
  ptTitle: string;
  ptSituation: string;
  presentationFeedbacks: Array<{
    attemptNumber: number;
    ptAnswerAttemptUuid: string;
    feedbackUuid: string;
    transcript: string;
    videoPath?: string; // PT 비디오 경로
    whiteboard?: string; // PT 화이트보드 이미지
    modelAnswer?: string; // AI 예시 답안
    expression: Array<{
      second: number;
      expression: string;
    }>;
    segment: Array<{
      start: number;
      end: number;
      text: string;
      intent: string;
    }>;
  }>;
}

// PT 피드백 데이터를 일반 피드백 형식으로 변환하는 함수
const convertPTToFeedbackResponse = (
  ptData: PTFeedbackResponse | any,
  attemptIndex: number = 0
): FeedbackResponse => {
  console.log('🔄 [PT] convertPTToFeedbackResponse 호출, ptData:', ptData);
  console.log('🔄 [PT] ptData.feedbackType:', ptData?.feedbackType);
  console.log('🔄 [PT] ptData.modelAnswer:', ptData?.modelAnswer);
  console.log('🔄 [PT] attemptIndex:', attemptIndex);
  
  // WebSocket에서 온 실제 피드백 데이터인 경우 (이미 FeedbackResponse 형식)
  if (ptData && ptData.feedbackType === 'PT' && ptData.modelAnswer) {
    console.log('🔄 [PT] 이미 변환된 피드백 데이터 감지, modelAnswer 포함하여 반환');
    return {
      status: 200,
      message: 'success',
      modelAnswer: ptData.modelAnswer, // 최상위에 modelAnswer 추가
      result: ptData
    };
  }
  
  // 기존 PTFeedbackResponse 형식인 경우
  const presentation = ptData.presentationFeedbacks?.[attemptIndex];
  
  return {
    status: 200,
    message: 'success',
    modelAnswer: presentation?.modelAnswer || (ptData as any)?.modelAnswer || '', // 최상위에 modelAnswer 추가
    result: {
      feedbackType: 'PT',
      videoPath: presentation?.videoPath 
        || (ptData as any)?.videoPath 
        || (ptData as any)?.videoUrl 
        || '',
      segment: presentation?.segment || (ptData as any)?.segment || [],
      transcript: presentation?.transcript || (ptData as any)?.transcript || '',
      expressions: presentation?.expression || (ptData as any)?.expressions || [],
      title: ptData.ptTitle || (ptData as any)?.title,
      situation: ptData.ptSituation || (ptData as any)?.situation,
      whiteboard: presentation?.whiteboard, // PT 화이트보드 이미지
      modelAnswer: presentation?.modelAnswer || (ptData as any)?.modelAnswer || '', // PT modelAnswer 추가
    }
  };
};

export default function StepByStepFeedbackPage() {
  const { id: interviewUuid } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get('step') || '0');
  
  // 실시간 피드백 관리
  const [availableFeedbacks, setAvailableFeedbacks] = useState<{[key: string]: FeedbackResponse}>({});
  const [nextFeedbackReady, setNextFeedbackReady] = useState(false);
  const { connect: connectWebSocket, removeCallback } = useWebSocketStore();
  
  // 탭 상태 및 사용자 정보
  const [selectedTab, setSelectedTab] = useState<'attitude' | 'content'>('attitude');
  const { username } = useAuthStore();
  
  // 비디오 상태 관리 (ResultDetailPage와 동일)
  const [videoStates, setVideoStates] = useState<{[key: string]: {time: number, playing: boolean}}>({});
  const [animateEmotions, setAnimateEmotions] = useState(false);
  
  // PT 면접 관련 상태
  const [ptFeedbackData, setPtFeedbackData] = useState<PTFeedbackResponse | null>(null);
  const [isPTInterview, setIsPTInterview] = useState(false);
  
  // PT 면접 감지: URL 파라미터 또는 면접 타입으로 판단
  const ptUuidParam = searchParams.get('ptUuid') || searchParams.get('attemptUuid');
  const isFromPTRoute = window.location.pathname.includes('/pt-feedback') || 
                       window.location.pathname.includes('/pt-steps') ||
                       !!ptUuidParam;

  // URL 파라미터에서 answerAttemptIds 배열 파싱 - PT 면접은 ptUuid 사용
  const attemptIdsParam = searchParams.get('attemptIds');
  const answerAttemptIds = isFromPTRoute && ptUuidParam 
    ? [ptUuidParam] // PT 면접: ptUuid를 attemptId로 사용
    : (attemptIdsParam ? attemptIdsParam.split(',') : []);

  console.log('🔍 [PT] answerAttemptIds 설정:', {
    isFromPTRoute,
    ptUuidParam,
    attemptIdsParam,
    finalAnswerAttemptIds: answerAttemptIds
  });

  // 면접 기본 정보 로드
  const { 
    data: interviewResult, 
    isLoading: isInterviewLoading, 
    isError: isInterviewError,
    error: interviewError 
  } = useQuery({
    queryKey: ['resultDetail', interviewUuid],
    queryFn: async () => {
      const response = await getResultDetailAPI(interviewUuid!);
      return (response as { result?: UnifiedInterviewDetail })?.result || response;
    },
    enabled: !!interviewUuid,
  });

  const interviewData = (interviewResult as UnifiedInterviewDetail) || {
    questions: [],
    interviewType: 'JOB',
    enterpriseName: '',
    position: '',
    duration: '',
    questionCount: 0
  };

  // PT 면접 피드백 데이터 로드
  const { 
    data: ptApiData, 
    isLoading: isPTLoading,
    isError: isPTError,
    error: ptError 
  } = useQuery({
    queryKey: ['ptFeedback', ptUuidParam, currentStep],
    queryFn: async () => {
      if (!ptUuidParam) return null;
      console.log('🚀 [PT] PT 피드백 로드:', ptUuidParam);
      
      // attemptUuid에서 ptUuid와 attemptNumber 추출
      let ptUuid = ptUuidParam;
      let attemptNumber = 1;
      
      if (ptUuidParam.includes('~')) {
        const parts = ptUuidParam.split('~');
        ptUuid = parts[0];
        const attemptPart = parts[1];
        if (attemptPart) {
          const parsed = parseInt(attemptPart, 10);
          // 리트라이 시도 번호를 그대로 사용 (userId가 붙은 번호)
          attemptNumber = isNaN(parsed) ? 1 : parsed;
        }
      }
      
      const response = await getPTFeedbackAPI(ptUuid, attemptNumber);
      console.log('📥 [PT] PT 피드백 응답:', response);
      
      return (response as any)?.result || response;
    },
    enabled: !!ptUuidParam && (isFromPTRoute || interviewData?.interviewType === 'PT'),
  });

  // PT 면접 상태 업데이트
  useEffect(() => {
    const shouldBePT = isFromPTRoute || interviewData?.interviewType === 'PT' || !!ptApiData;
    setIsPTInterview(shouldBePT);
    
    if (ptApiData) {
      console.log('🔄 [PT] PT 데이터 업데이트:', ptApiData);
      console.log('🔄 [PT] ptApiData.modelAnswer:', ptApiData?.modelAnswer);
      console.log('🔄 [PT] ptApiData.feedbackType:', ptApiData?.feedbackType);
      setPtFeedbackData(ptApiData);
    }
  }, [isFromPTRoute, interviewData?.interviewType, ptApiData]);

  // 애니메이션 트리거 (ResultDetailPage와 동일)
  useEffect(() => {
    setAnimateEmotions(false);
    const timer = setTimeout(() => {
      setAnimateEmotions(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // answerAttemptIds와 URL 파라미터 동기화를 위한 네비게이션 함수들 수정
  const updateSearchParams = (newStep: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', newStep.toString());
    
    // 동적으로 확장된 attemptIds를 URL에 반영
    if (dynamicAnswerAttemptIds.length > 0) {
      const updatedAttemptIds = dynamicAnswerAttemptIds.filter(id => id.trim() !== '').join(',');
      newParams.set('attemptIds', updatedAttemptIds);
      console.log(`🔗 [피드백페이지] URL 업데이트: step=${newStep}, attemptIds=${updatedAttemptIds}`);
    }
    // setIndex와 count를 유지 (세트 인덱스/총 세트 수 보존)
    const existingSetIndex = searchParams.get('setIndex');
    if (existingSetIndex != null && existingSetIndex !== '') {
      newParams.set('setIndex', existingSetIndex);
    }
    const existingCount = searchParams.get('count');
    if (existingCount != null && existingCount !== '') {
      newParams.set('count', existingCount);
    }
    
    setSearchParams(newParams);
  };





  // 면접 타입에 따른 한글 변환
  const getInterviewTypeInKorean = (type: string) => {
    switch (type) {
      case 'TENACITY':
        return '인성';
      case 'JOB':
        return '직무';
      case 'PT':
        return 'PT';
      default:
        return type;
    }
  };

  // 단계별 제목 (PT면접은 Q1, Q2, Q3 형식)
  const getStepTitle = (step: number) => {
    if (isPTInterview) {
      return `Q${step + 1}`;
    }
    
    switch (step) {
      case 0:
        return '본질문';
      case 1:
        return '꼬리질문 1';
      case 2:
        return '꼬리질문 2';
      default:
        return '';
    }
  };

  // 비디오 이벤트 핸들러들 (ResultDetailPage와 동일)
  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>, videoId: string) => {
    const video = event.currentTarget;
    const newTime = video.currentTime;
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], time: newTime }
    }));
  };

  const handleVideoPlay = (videoId: string) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], playing: true }
    }));
  };

  const handleVideoPause = (videoId: string) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], playing: false }
    }));
  };

  // 네비게이션 함수들
  const goToNextStep = async () => {
    console.log(`🔀 [피드백페이지] goToNextStep 호출 - 현재 단계: ${getStepTitle(currentStep)}`);
    console.log(`🔀 [피드백페이지] 세트 정보: 현재 세트=${currentSet}, 세트 마지막 질문=${isLastQuestionInSet}, 마지막 세트=${isLastSet}`);
    console.log(`🔀 [피드백페이지] 버튼 상태: nextFeedbackReady=${nextFeedbackReady}, 다음 질문 가능=${currentStep < Math.min(answerAttemptIds.length - 1, 2)}`);
    
    // 세트 생성은 사용자가 '다음 질문 생성' 버튼을 눌렀을 때만 수행 (중복 방지)
    // 이곳에서는 호출하지 않음
    
    // 다음 단계로 이동 (동적 배열 기준)
    if (currentStep < dynamicAnswerAttemptIds.length - 1) {
      console.log(`🔀 [피드백페이지] 다음 단계로 이동: ${currentStep} → ${currentStep + 1}`);
      updateSearchParams(currentStep + 1);
      
      // 상단으로 부드럽게 스크롤
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (!isAllQuestionsCompleted && currentStep < 2) {
      // 동적 배열이 부족하지만 더 질문이 있는 경우 (최대 3개까지)
      console.log(`>>> [StepByStep] 다음 질문 대기 중... (현재: ${currentStep + 1}/${totalInterviewSets * 3})`);
      console.log(`>>> [StepByStep] 동적 배열 길이: ${dynamicAnswerAttemptIds.length}, 이동 시도: ${currentStep + 1}`);
      updateSearchParams(currentStep + 1);
      
      // 상단으로 부드럽게 스크롤
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      console.log(`⚠️ [피드백페이지] 더 이상 이동할 수 없음: currentStep=${currentStep}, 동적배열길이=${dynamicAnswerAttemptIds.length}`);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      updateSearchParams(currentStep - 1);
      
      // 상단으로 부드럽게 스크롤
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 재시도하기: 현재 URL의 attemptIds, count, 면접 타입을 그대로 들고 세션으로 이동
  const handleRetry = () => {
    if (isPTInterview) {
      // PT 재시도 - 인성/직무와 동일한 패턴으로 attemptIds 전달
      if (!interviewUuid) return;
      const totalSets = parseInt(searchParams.get('count') || '1');
      const currentSet = parseInt(searchParams.get('set') || '1');
      const currentPtUuid = ptUuidParam || searchParams.get('ptUuid');
      
      const params = new URLSearchParams();
      params.set('type', 'presentation');
      params.set('interviewUuid', interviewUuid);
      if (currentPtUuid) params.set('attemptIds', currentPtUuid); // 핵심: 리트라이 감지를 위한 attemptIds 추가
      params.set('count', String(totalSets));
      params.set('storeKey', `REVIEW_SESSION_${interviewUuid}`);
      params.set('set', String(currentSet));
      navigate(`/interview/session?${params.toString()}`);
    } else {
      // 기존 인성/직무 재시도 로직
      const typeParam = interviewData?.interviewType || 'general';
      const attemptIdsRaw = searchParams.get('attemptIds') || '';
      const countRaw = searchParams.get('count') || '';

      const params = new URLSearchParams();
      params.set('type', typeParam);
      if (interviewUuid) params.set('interviewUuid', interviewUuid);
      if (attemptIdsRaw) params.set('attemptIds', attemptIdsRaw);
      if (countRaw) params.set('count', countRaw);

      navigate(`/interview/session?${params.toString()}`);
    }
  };

  // 다음으로 넘어가기 (결과 목록으로 이동)
  const handleNext = () => {
    navigate('/results');
  };

  // PT 다음 질문으로 넘어가기
  const handlePTNextQuestion = async () => {
    if (!interviewUuid || isGeneratingPTNext) return;
    
    const currentPtUuid = ptUuidParam || searchParams.get('ptUuid');
    if (!currentPtUuid) {
      alert('PT UUID를 확인할 수 없습니다.');
      return;
    }
    
    setIsGeneratingPTNext(true);
    
    try {
      console.log('🚀 [PT] 다음 PT 질문 생성 요청:', currentPtUuid);
      const res = await generateNextPTProblemAPI(currentPtUuid);
      const result = (res as any)?.result || {};
      const nextQid = result?.questionUuid || result?.questions?.[0]?.id || result?.questions?.[0]?.questionUuid || '';
      const nextTitle = result?.title || result?.questions?.[0]?.title || '';
      const nextSituation = result?.situation || result?.questions?.[0]?.situation || '';

      // 세션 스토리지 업데이트
      const sessionKey = `REVIEW_SESSION_${interviewUuid}`;
      try {
        const raw = sessionStorage.getItem(sessionKey);
        const saved = raw ? JSON.parse(raw) : {};
        saved.questions = [{ questionUuid: nextQid, title: nextTitle, situation: nextSituation }];
        sessionStorage.setItem(sessionKey, JSON.stringify(saved));
        
        // 세트 인덱스 +1 저장
        const currentSet = parseInt(searchParams.get('set') || '1');
        const nextSet = currentSet + 1;
        sessionStorage.setItem(`REVIEW_PT_SET_INDEX_${interviewUuid}`, String(nextSet));
      } catch {}

      const totalSets = parseInt(searchParams.get('count') || '1');
      const nextSet = parseInt(searchParams.get('set') || '1') + 1;
      
      const params = new URLSearchParams();
      params.set('type', 'presentation');
      params.set('interviewUuid', interviewUuid);
      params.set('count', String(totalSets));
      params.set('storeKey', `REVIEW_SESSION_${interviewUuid}`);
      params.set('set', String(nextSet));
      navigate(`/interview/session?${params.toString()}`);
    } catch (e) {
      console.error('[PT] 다음 질문 생성 실패:', e);
      alert('다음 PT 질문 생성에 실패했습니다.');
      setIsGeneratingPTNext(false);
    }
  };

  // 총 세트 수 계산: 우선순위 (sessionStorage 저장값 > URL count > interviewData.questionCount/3 > 기본값 3)
  const countParam = searchParams.get('count');
  const urlSetCount = countParam ? parseInt(countParam) : 0;
  const questionCount = interviewData?.questionCount as number;

  // sessionStorage에서 사용자가 설정한 총 세트 수 복원 시도
  let savedTotalSets = 0;
  try {
    if (interviewUuid) {
      const storageKey = `REVIEW_SESSION_${interviewUuid}`;
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved?.totalInterviewSets === 'number' && saved.totalInterviewSets > 0) {
          savedTotalSets = saved.totalInterviewSets;
        }
      }
    }
  } catch (e) {
    console.warn('[피드백페이지] sessionStorage 읽기 실패:', e);
  }

  // URL count가 1로 고정되어 들어오는 문제를 회피하기 위해 questionCount/3을 우선 사용
  let totalInterviewSets: number;
  if (savedTotalSets > 0) {
    totalInterviewSets = savedTotalSets;
  } else if (questionCount && questionCount > 0) {
    totalInterviewSets = Math.ceil(questionCount / 3);
  } else if (urlSetCount > 0) {
    totalInterviewSets = urlSetCount;
  } else {
    totalInterviewSets = 3;
  }

  console.log('🔍 [피드백페이지] 세트 수 계산:', {
    urlSetCount,
    questionCount,
    savedTotalSets,
    totalInterviewSets,
    interviewData: interviewData?.questionCount
  });

  // 현재 세트 계산 (0부터 시작)
  const setIndexParam = searchParams.get('setIndex');
  const currentSet = (setIndexParam != null && setIndexParam !== '' && !Number.isNaN(parseInt(setIndexParam)))
    ? parseInt(setIndexParam)
    : (questionCount && questionCount > 0
        ? Math.max(0, Math.ceil(questionCount / 3) - 1)
        : Math.floor(currentStep / 3));
  const isLastQuestionInSet = (currentStep + 1) % 3 === 0; // 세트의 마지막 질문인지 확인
  const isLastSet = currentSet >= totalInterviewSets - 1; // 마지막 세트인지 확인
  
  // 모든 질문이 완료되었는지 확인
  const isAllQuestionsCompleted = currentStep + 1 >= totalInterviewSets * 3;
  
  console.log('🔍 [피드백페이지] 세트 상태:', {
    currentStep,
    currentSet,
    isLastQuestionInSet,
    isLastSet,
    isAllQuestionsCompleted,
    totalInterviewSets
  });

  // generateQuestions API는 세션 페이지에서 처리 (generateNext=1 전달)로 일원화

  // 세트가 남아있을 때 수동으로 다음 질문 세트 생성
  const handleGenerateNextSet = async () => {
    if (isGeneratingNextSet || isLastSet) {
      console.log('🚫 중복 요청 방지:', { isGeneratingNextSet, isLastSet });
      return;
    }
    
    setIsGeneratingNextSet(true);
    
    try {
      if (interviewUuid) {
        // 질문 생성 API 호출 (기존 세션 페이지와 동일한 방식)
        const response = await apiClient.post(
          '/api/interview/generateQuestions',
          { interviewUuid },
          {
            withCredentials: true,
            timeout: 60000,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const responseData = (response as any)?.data || response;
        const newQuestions = responseData?.questions || responseData?.result?.questions || [];
        
        // 생성된 질문을 세션스토리지에 저장
        const storeKey = `REVIEW_SESSION_${interviewUuid}`;
        const savedData = {
          interviewUuid,
          questions: newQuestions,
          totalInterviewSets: totalInterviewSets
        };
        try {
          sessionStorage.setItem(storeKey, JSON.stringify(savedData));
          console.log('✅ 질문 데이터 저장 완료:', storeKey);
        } catch (storageError) {
          console.error('❌ SessionStorage 저장 실패:', storageError);
          // 스토리지 실패해도 진행 (메모리에서 질문 사용 가능)
        }
        
        // 질문 생성 완료 후 세션 페이지로 이동
        const params = new URLSearchParams();
        params.set('type', interviewData?.interviewType || 'JOB');
        params.set('interviewUuid', interviewUuid);
        params.set('count', String(totalInterviewSets));
        params.set('storeKey', storeKey);
        navigate(`/interview/session?${params.toString()}`);
      }
    } catch (error) {
      console.error('질문 생성 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '네트워크 오류';
      alert(`다음 질문 세트 생성에 실패했습니다.\n오류: ${errorMessage}\n잠시 후 다시 시도해주세요.`);
      setIsGeneratingNextSet(false);
    }
  };

  // answerAttemptIds 동적 확장을 위한 상태 (초기값만 설정, 이후 독립적으로 관리)
  const [dynamicAnswerAttemptIds, setDynamicAnswerAttemptIds] = useState<string[]>(() => {
    console.log('🔧 [피드백페이지] 초기 dynamicAnswerAttemptIds 설정:', answerAttemptIds);
    return answerAttemptIds;
  });
  // 다음 세트 생성 중 여부
  const [isGeneratingNextSet, setIsGeneratingNextSet] = useState(false);
  // PT 다음 질문 생성 중 여부
  const [isGeneratingPTNext, setIsGeneratingPTNext] = useState(false);

  // 현재 단계에 해당하는 answerAttemptId (동적 배열 사용)
  const currentAnswerAttemptId = dynamicAnswerAttemptIds[currentStep] || null;
  
  console.log('🔍 [PT] WebSocket 관련 상태:', {
    currentAnswerAttemptId,
    availableFeedbacks: Object.keys(availableFeedbacks),
    currentFeedbackData: currentAnswerAttemptId ? availableFeedbacks[currentAnswerAttemptId] : null,
    hasModelAnswerInWebSocket: currentAnswerAttemptId && availableFeedbacks[currentAnswerAttemptId]?.result?.modelAnswer
  });
  
  // PT 면접에서 WebSocket 데이터가 있으면 그걸 사용
  if (isPTInterview && currentAnswerAttemptId && availableFeedbacks[currentAnswerAttemptId]) {
    console.log('🔍 [PT] WebSocket에서 받은 피드백 데이터:', availableFeedbacks[currentAnswerAttemptId]);
  }

  // 현재 단계의 피드백 데이터 가져오기
  const currentFeedbackData = currentAnswerAttemptId ? availableFeedbacks[currentAnswerAttemptId] : null;
  
  // 현재 단계 피드백이 없으면 API로 로드 (PT가 아닌 경우만)
  const { 
    data: fallbackFeedbackData, 
    isLoading: isFeedbackLoading,
    isError: isFeedbackError,
    error: feedbackError
  } = useQuery({
    queryKey: ['feedback', currentAnswerAttemptId],
    queryFn: async () => {
      if (!currentAnswerAttemptId || isPTInterview) return null;
      const response = await getFeedbackAPI(currentAnswerAttemptId);
      return response as unknown as FeedbackResponse;
    },
    enabled: !!currentAnswerAttemptId && !currentFeedbackData && !isPTInterview,
  });

  // PT면접인 경우에도 WebSocket 데이터(modelAnswer 포함)를 우선 사용, 없으면 PT API 데이터 사용
  console.log('🔄 [PT] feedbackData 구성 시작:', {
    isPTInterview,
    currentFeedbackData: !!currentFeedbackData,
    fallbackFeedbackData: !!fallbackFeedbackData,
    ptFeedbackData: !!ptFeedbackData,
    currentStep
  });
  
  let feedbackData = currentFeedbackData || fallbackFeedbackData || 
    (isPTInterview && ptFeedbackData ? convertPTToFeedbackResponse(ptFeedbackData, currentStep) : null);
    
  console.log('🔄 [PT] feedbackData 구성 완료:', feedbackData);
  
  // PT 면접에서 WebSocket 데이터가 있으면 modelAnswer를 직접 확인하여 수정
  if (isPTInterview && currentFeedbackData && currentFeedbackData.result) {
    console.log('🔍 [PT] WebSocket 데이터 확인:', currentFeedbackData.result);
    feedbackData = currentFeedbackData;
  }
  
  console.log('🔍 [PT] 데이터 우선순위 확인:', {
    currentFeedbackData: !!currentFeedbackData,
    fallbackFeedbackData: !!fallbackFeedbackData,
    ptFeedbackData: !!ptFeedbackData,
    isPTInterview,
    finalFeedbackData: !!feedbackData,
    modelAnswer: feedbackData?.result?.modelAnswer
  });

  // 디버깅: 피드백 데이터 로그
  useEffect(() => {
    if (feedbackData) {
      console.log('🎥 [피드백페이지] 피드백 데이터:', feedbackData);
      console.log('🎥 [피드백페이지] feedbackData.modelAnswer (최상위):', feedbackData.modelAnswer);
      console.log('🎥 [피드백페이지] feedbackData.result?.modelAnswer:', feedbackData.result?.modelAnswer);
      console.log('🎥 [피드백페이지] videoPath:', feedbackData.result?.videoPath);
      console.log('🎥 [피드백페이지] expressions:', feedbackData.result?.expressions?.length || 0, '개');
      console.log('🎥 [피드백페이지] isPTInterview:', isPTInterview);
      console.log('🎥 [피드백페이지] currentFeedbackData:', currentFeedbackData);
      console.log('🎥 [피드백페이지] availableFeedbacks keys:', Object.keys(availableFeedbacks));
      console.log('🎥 [피드백페이지] currentAnswerAttemptId:', currentAnswerAttemptId);
    }
  }, [feedbackData, isPTInterview, currentFeedbackData, availableFeedbacks, currentAnswerAttemptId]);

  // 현재 단계 변경 시 다음 피드백 상태 재계산
  useEffect(() => {
    const nextStepAttemptId = dynamicAnswerAttemptIds[currentStep + 1];
    // 다음 질문의 attemptId가 있고, 피드백도 로드되어 있어야 준비 완료
    const isReady = !!nextStepAttemptId && !!availableFeedbacks[nextStepAttemptId];
    
    // 세트 내에서만 확인 (0, 1, 2 = 첫 세트)
    const currentSetIndex = Math.floor(currentStep / 3);
    const nextStepInSameSet = Math.floor((currentStep + 1) / 3) === currentSetIndex;
    
    // 같은 세트 내에서만 다음 질문 버튼 활성화 체크
    const finalReady = nextStepInSameSet ? isReady : false;
    
    console.log(`🔄 [피드백페이지] 피드백 상태 재계산: currentStep=${currentStep}, nextStepAttemptId=${nextStepAttemptId}, isReady=${isReady}, finalReady=${finalReady}`);
    console.log(`🔄 [피드백페이지] availableFeedbacks 키들:`, Object.keys(availableFeedbacks));
    console.log(`🔄 [피드백페이지] dynamicAnswerAttemptIds:`, dynamicAnswerAttemptIds);
    
    setNextFeedbackReady(finalReady);
  }, [currentStep, availableFeedbacks, dynamicAnswerAttemptIds]); // 모든 관련 의존성 포함

  // WebSocket에서 실시간 피드백 받기
  const handleRealtimeFeedback = async (answerAttemptId: string) => {
    try {
      console.log('🔄 [피드백페이지] 실시간 피드백 요청:', answerAttemptId);
      console.log('🔄 [피드백페이지] 현재 상태:', {
        currentStep,
        originalAnswerAttemptIds: answerAttemptIds,
        dynamicAnswerAttemptIds,
        nextStepAttemptId: dynamicAnswerAttemptIds[currentStep + 1],
        nextFeedbackReady,
        isPTInterview
      });
      
      const response = await getFeedbackAPI(answerAttemptId);
      const feedbackData = response as unknown as FeedbackResponse;
      
      console.log('🔍 [WebSocket] 최종 feedbackData:', feedbackData);
      console.log('🔍 [WebSocket] modelAnswer 최상위:', feedbackData.modelAnswer);
      console.log('🔍 [WebSocket] modelAnswer result 안:', feedbackData.result?.modelAnswer);
      
      // 피드백을 저장
      setAvailableFeedbacks(prev => ({
        ...prev,
        [answerAttemptId]: feedbackData
      }));

      console.log('✅ [피드백페이지] 피드백 저장 완료:', answerAttemptId);

      // 새로운 answerAttemptId가 기존 배열에 없으면 추가 (중복 방지)
      setDynamicAnswerAttemptIds(prev => {
        if (!prev.includes(answerAttemptId)) {
          const newIds = [...prev, answerAttemptId];
          console.log('📝 [피드백페이지] answerAttemptIds 확장:', prev, '→', newIds);
          return newIds;
        }
        console.log('📝 [피드백페이지] answerAttemptId 이미 존재:', answerAttemptId);
        return prev;
      });

      // 피드백 저장 완료 후 다음 단계 버튼 상태 업데이트
      setTimeout(() => { // 상태 업데이트 후 체크하기 위해 약간 지연
        const updatedDynamicIds = dynamicAnswerAttemptIds.includes(answerAttemptId) 
          ? dynamicAnswerAttemptIds 
          : [...dynamicAnswerAttemptIds, answerAttemptId];
          
        const nextStepAttemptId = updatedDynamicIds[currentStep + 1];
        if (answerAttemptId === nextStepAttemptId) {
          console.log('🚀 [피드백페이지] 다음 피드백 준비 완료! 버튼 활성화');
          setNextFeedbackReady(true);
        }
        
        const feedbackStepIndex = updatedDynamicIds.indexOf(answerAttemptId);
        if (feedbackStepIndex !== -1) {
          console.log(`📊 [피드백페이지] ${getStepTitle(feedbackStepIndex)} 피드백 저장됨 (현재: ${getStepTitle(currentStep)})`);
        } else {
          console.log(`📊 [피드백페이지] 새로운 피드백 저장됨: ${answerAttemptId}`);
        }
      }, 10);
    } catch (error) {
      console.error('❌ [피드백페이지] 실시간 피드백 로드 실패:', error);
    }
  };

  // 초기 피드백 로드 - URL에 있는 answerAttemptIds에 대한 피드백을 미리 시도
  useEffect(() => {
    if (isPTInterview || answerAttemptIds.length === 0) return;
    
    console.log('🔄 [피드백페이지] 초기 피드백 로드 시도:', answerAttemptIds);
    
    const loadInitialFeedbacks = async () => {
      for (const attemptId of answerAttemptIds) {
        if (availableFeedbacks[attemptId]) {
          console.log('🔄 [피드백페이지] 이미 로드된 피드백:', attemptId);
          continue;
        }
        
        try {
          console.log('🔄 [피드백페이지] 초기 피드백 로드 요청:', attemptId);
          const response = await getFeedbackAPI(attemptId);
          const feedbackData = response as unknown as FeedbackResponse;
          
          setAvailableFeedbacks(prev => ({
            ...prev,
            [attemptId]: feedbackData
          }));
          
          console.log('✅ [피드백페이지] 초기 피드백 로드 완료:', attemptId);
        } catch (error) {
          console.log('⚠️ [피드백페이지] 초기 피드백 로드 실패 (정상 - 아직 준비되지 않음):', attemptId);
        }
      }
    };
    
    loadInitialFeedbacks();
  }, [answerAttemptIds, isPTInterview]); // availableFeedbacks는 의존성에서 제외 (무한 루프 방지)

  // WebSocket 연결 및 실시간 피드백 수신 (전역 연결 활용)
  useEffect(() => {
    console.log('🔌 피드백 페이지 - WebSocket 연결 상태 확인:');
    console.log('  - answerAttemptIds.length:', answerAttemptIds.length);
    console.log('  - answerAttemptIds:', answerAttemptIds);
    console.log('  - isPTInterview:', isPTInterview);
    console.log('  - ptUuidParam:', ptUuidParam);
    
    // PT 면접의 경우 answerAttemptIds가 비어있을 수 있으므로 다른 조건 사용
    if (isPTInterview || answerAttemptIds.length > 0) {
      console.log('🔌 피드백 페이지 - 전역 WebSocket 연결 및 콜백 추가 (PT 면접 포함)');
      // 이미 연결되어 있다면 콜백만 추가, 없다면 연결 후 콜백 추가
      connectWebSocket(handleRealtimeFeedback);
    } else {
      console.log('⚠️ 피드백 페이지 - 연결 조건을 만족하지 않아 WebSocket 연결하지 않음');
    }

    // 컴포넌트 언마운트 시 콜백만 제거 (연결은 유지)
    return () => {
      console.log('🧹 StepByStepFeedbackPage 정리 시작');
      removeCallback(handleRealtimeFeedback);
      // 진행 중인 API 요청이 있다면 상태 정리
      setIsGeneratingNextSet(false);
      setIsGeneratingPTNext(false);
      console.log('✅ WebSocket 콜백 및 로딩 상태 정리 완료');
    };
  }, [answerAttemptIds.length, isPTInterview, connectWebSocket, removeCallback]);





  // 로딩 및 에러 처리
  if (isInterviewLoading || isFeedbackLoading || isPTLoading) {
    return (
      <>
        <Header />
        <ResultDetailSkeleton />
        <Footer />
      </>
    );
  }

  if (isInterviewError || isFeedbackError || isPTError) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <p className="text-xl text-red-600">
          오류가 발생했습니다: {(interviewError as Error)?.message || (feedbackError as Error)?.message || (ptError as Error)?.message}
        </p>
      </div>
    );
  }

  // PT 면접인 경우 ptFeedbackData 확인, 일반 면접인 경우 feedbackData 확인
  const hasValidData = isPTInterview ? (ptFeedbackData || feedbackData?.result) : feedbackData?.result;
  
  if (!interviewResult || !hasValidData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-xl text-gray-500 mb-4">
          {isPTInterview ? 'PT 면접 결과를 찾을 수 없습니다.' : '해당 면접 결과를 찾을 수 없습니다.'}
        </p>
        <div className="flex space-x-3">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/results')}
          >
            결과 목록으로 이동
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={() => navigate('/')}
          >
            메인으로 이동
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPTInterview ? 'PT 면접 결과 분석' : '면접 결과 분석'}
          </h1>
          <p className="text-gray-600">
            {isPTInterview ? '시도별 상세 피드백을 확인하세요.' : '단계별 상세 피드백을 확인하세요.'}
          </p>
        </div>

        {/* 진행 상황 표시기 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {isPTInterview ? '진행 상황' : '진행 상황'}
            </h2>
            <span className="text-sm text-gray-600">
              {isPTInterview 
                ? `질문 ${(searchParams.get('set') || '1')} / ${searchParams.get('count') || '1'}` 
                : `${currentStep + 1} / ${Math.min(answerAttemptIds.length, 3)}`
              }
            </span>
          </div>
          
          {/* 진행 상황 (질문 단계 기반) - PT와 일반 면접 모두 동일한 형식 */}
          <div className="flex items-center justify-between">
            {answerAttemptIds.slice(0, 3).map((_, step) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => {
                    if (step <= currentStep || (step === currentStep + 1 && availableFeedbacks[answerAttemptIds[step]])) {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('step', step.toString());
                      setSearchParams(newParams);
                    }
                  }}
                  disabled={step > currentStep && !availableFeedbacks[answerAttemptIds[step]]}
                  className={`flex items-center ${
                    step <= currentStep || availableFeedbacks[answerAttemptIds[step]]
                      ? 'cursor-pointer hover:opacity-80' 
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step + 1}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium whitespace-nowrap ${
                      step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {getStepTitle(step)}
                    </p>
                  </div>
                </button>
                {step < Math.min(answerAttemptIds.length - 1, 2) && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 면접 기본 정보 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">회사명</p>
              <p className="text-lg font-semibold">{interviewData.enterpriseName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">직책</p>
              <p className="text-lg font-semibold">{interviewData.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">면접 유형</p>
              <p className="text-lg font-semibold">{getInterviewTypeInKorean(interviewData.interviewType)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">소요 시간</p>
              <p className="text-lg font-semibold">{interviewData.duration}</p>
            </div>
          </div>
        </div>

        {/* 현재 단계의 질문 피드백 */}
        <div className="space-y-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {getStepTitle(currentStep)}
              {!feedbackData && (
                <span className="ml-2 text-sm text-orange-600">(분석 중...)</span>
              )}
            </h3>
            <p className="text-blue-700">
              {isPTInterview ? (
                `PT 면접 ${currentStep + 1}번째 질문에 대한 분석 결과입니다.`
              ) : (
                <>
                  {currentStep === 0 && "면접의 본질문에 대한 분석 결과입니다."}
                  {currentStep === 1 && "본질문에 이어진 첫 번째 꼬리질문 분석 결과입니다."}
                  {currentStep === 2 && "두 번째 꼬리질문에 대한 최종 분석 결과입니다."}
                </>
              )}
            </p>
          </div>

          {/* 질문 표시 - design-sample 스타일 적용 */}
          {feedbackData ? (
            <div className="bg-white rounded-lg shadow-lg mb-4">
              {/* 질문/주제 헤더 */}
              <div className="w-full flex items-center justify-between px-6 py-4 text-left">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isPTInterview 
                      ? feedbackData.result.title || 'PT 발표 주제'
                      : feedbackData.result.question || '면접 질문'
                    }
                  </h3>
                  {isPTInterview && feedbackData.result.situation && (
                    <p className="text-gray-600 text-sm">
                      <strong>상황:</strong> {feedbackData.result.situation}
                    </p>
                  )}
                </div>
              </div>

              {/* 토글 콘텐츠 */}
              <div className="px-6 pb-6">
                <div className="space-y-6">
                  {/* PT: 시도 표시 제거 */}

                  {/* 감정 요약 - 탭 위로 이동 */}
                  {feedbackData.result.segment && feedbackData.result.segment.length > 0 && (
                    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b-2 border-indigo-200">
                        {username || '지원자'} 님은
                      </h4>
                      {(() => {
                        // 감정 분석
                        const expressions = feedbackData.result.expressions || [];
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
                        feedbackData.result.segment.forEach(segment => {
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
                              <span>주로 <span className="font-semibold text-indigo-600">{mostFrequentEmotion}적인 태도</span>로 답변했어요</span>
                            </div>
                            <div className="flex items-start">
                              <span className="text-indigo-600 font-bold mr-2">•</span>
                              <span><span className="font-semibold text-indigo-600">{mostFrequentIntent}</span> 중심으로 답변했어요</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 답변분석/AI답변 탭 */}
                  <div className="flex space-x-2 bg-indigo-50 p-1 rounded-lg">
                    <button
                      onClick={() => setSelectedTab('attitude')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedTab === 'attitude'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-indigo-700 hover:text-indigo-800'
                      }`}
                    >
                      답변 분석
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
                      // 태도분석 탭 콘텐츠
                      <div className="space-y-6">
                        {/* 영상과 감정 분석을 나란히 배치 (모든 면접 타입) */}
                        {(() => {
                          const videoSrc = (feedbackData.result as any).videoPath || (feedbackData.result as any).videoUrl || '';
                          const hasEmotions = !!(feedbackData.result.expressions && feedbackData.result.expressions.length > 0);
                          return (videoSrc || hasEmotions);
                        })() && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 왼쪽: 동영상 */}
                            {(() => {
                              const videoSrc = (feedbackData.result as any).videoPath || (feedbackData.result as any).videoUrl || '';
                              return !!videoSrc;
                            })() && (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3">답변 영상</h4>
                                <video 
                                  key={`step-${currentStep}-${(feedbackData.result as any).videoPath || (feedbackData.result as any).videoUrl}`}
                                  controls 
                                  className="w-full rounded-lg shadow-md"
                                  crossOrigin="anonymous"
                                  preload="metadata"
                                  onTimeUpdate={(e) => handleVideoTimeUpdate(e, `step-${currentStep}`)}
                                  onPlay={() => handleVideoPlay(`step-${currentStep}`)}
                                  onPause={() => handleVideoPause(`step-${currentStep}`)}
                                  onSeeked={(e) => handleVideoTimeUpdate(e, `step-${currentStep}`)}
                                  onLoadedMetadata={(e) => {
                                    console.log(`비디오 step-${currentStep} 메타데이터 로드됨:`, e.currentTarget.duration);
                                  }}
                                  onError={(e) => {
                                    console.error(`비디오 step-${currentStep} 로드 오류:`, e);
                                  }}
                                >
                                  <source src={(() => {
                                    let videoSrc = (feedbackData.result as any).videoPath || (feedbackData.result as any).videoUrl || '';
                                    console.log('🎥 [PT] 비디오 경로 디버깅:', {
                                      isPTInterview,
                                      currentAnswerAttemptId,
                                      originalVideoPath: videoSrc
                                    });
                                    
                                    // PT 면접에서는 API에서 받은 비디오 경로를 그대로 사용
                                    // 리트라이 시에도 서버에서 올바른 비디오 경로를 제공해야 함
                                    return videoSrc;
                                  })()} type="video/mp4" />
                                  브라우저가 비디오를 지원하지 않습니다.
                                </video>
                                {(() => {
                                  const videoSrc = (feedbackData.result as any).videoPath || (feedbackData.result as any).videoUrl || '';
                                  return videoSrc ? (
                                    <div className="mt-2 text-sm text-gray-600">
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          
                            {/* 오른쪽: 감정 타임라인 그래프 (모든 면접 타입) */}
                            {feedbackData.result.expressions && feedbackData.result.expressions.length > 0 && (
                              <div>
                                <EmotionTimelineGraph
                                  expressions={feedbackData.result.expressions}
                                  currentTime={videoStates[`step-${currentStep}`]?.time || 0}
                                  isPlaying={videoStates[`step-${currentStep}`]?.playing || false}
                                  animateEmotions={animateEmotions}
                                  onTimeClick={(time) => {
                                    // 비디오를 특정 시간으로 이동
                                    const vsrc = (feedbackData.result as any).videoPath || (feedbackData.result as any).videoUrl || '';
                                    const video = vsrc ? (document.querySelector(`source[src="${vsrc}"]`)?.parentElement as HTMLVideoElement) : null;
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
                        {feedbackData.result.transcript && (
                          <div className="bg-blue-50 border border-blue-200 shadow-sm rounded-lg p-6">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-blue-300">
                                  지원자 답변
                                </h4>
                                <div className="text-gray-700">
                                  {/* 분석된 텍스트 (segments가 있으면 사용, 없으면 일반 전사) */}
                                  {feedbackData.result.segment && feedbackData.result.segment.length > 0 ? (
                                    <div className="leading-relaxed">
                                      {feedbackData.result.segment.map((segment, index) => {
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
                                      {feedbackData.result.transcript}
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
                        {/* FeedbackSources - Review's PICK! */}
                        {feedbackData.result.feedbackSources && Object.keys(feedbackData.result.feedbackSources).length > 0 && (
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
                                </div>
                                <div className="space-y-4">
                                  {(() => {
                                    // sourceType별 라벨 매핑
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
                                    const groupedSources = Object.entries(feedbackData.result.feedbackSources).reduce((acc, [, source]) => {
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
                                  {/* API에서 제공되는 modelAnswer가 있으면 사용, 없으면 기본 안내 */}
                                  {(() => {
                                    console.log('🔍 [PT] feedbackData 구조:', feedbackData);
                                    console.log('🔍 [PT] modelAnswer 확인:', feedbackData.result.modelAnswer);
                                    console.log('🔍 [PT] modelAnswer 확인:', feedbackData.modelAnswer || feedbackData.result?.modelAnswer);
                                    console.log('🔍 [PT] result 전체:', feedbackData.result);
                                    return feedbackData.modelAnswer || feedbackData.result?.modelAnswer;
                                  })() || (() => {
                                    // modelAnswer가 없는 경우 기본 예시 답안 구성
                                    const questionText = feedbackData.result.question || feedbackData.result.title || '이 질문';
                                    const intent = feedbackData.result.segment?.[0]?.intent || '역량과 경험';
                                    
                                    if (isPTInterview) {
                                      return `${questionText}에 대한 효과적인 PT 답변 예시입니다.

PT 발표 시에는 다음과 같은 구조로 답변하시면 좋습니다:

1. 명확한 문제 정의
주어진 상황에서의 핵심 문제와 배경을 명확하게 설명합니다.

2. 체계적인 해결 방안
문제 해결을 위한 구체적이고 실현 가능한 방안을 제시합니다.

3. 예상 효과 및 결과
제안한 방안의 기대 효과와 측정 가능한 성과 지표를 제시합니다.

4. 실행 계획
단계별 실행 계획과 필요한 자원, 일정을 구체적으로 설명합니다.

발표 시에는 청중과의 아이컨택을 유지하고, 핵심 포인트를 강조하여 설득력을 높이는 것이 중요합니다.`;
                                    } else {
                                      return `${questionText}에 대한 효과적인 답변 예시입니다.

이 질문은 ${intent}을 평가하기 위한 질문으로, 다음과 같은 구조로 답변하시면 좋습니다:

1. 상황 설명 (Situation)
구체적인 상황이나 배경을 명확하게 설명합니다.

2. 과제 설명 (Task)  
그 상황에서 본인이 해결해야 했던 과제나 목표를 제시합니다.

3. 행동 설명 (Action)
문제 해결을 위해 본인이 취한 구체적인 행동과 노력을 상세히 설명합니다.

4. 결과 및 성과 (Result)
본인의 행동으로 인해 얻어진 결과와 배운 점을 제시합니다.

답변 시에는 구체적인 수치나 사례를 포함하여 설득력을 높이고, 해당 경험을 통해 지원하는 직무에 어떻게 기여할 수 있는지 연결지어 마무리하는 것이 효과적입니다.`;
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">AI가 답변을 분석 중입니다...</p>
                <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center">
          {/* 이전 버튼 - PT면접에서는 숨김 */}
          {!isPTInterview && (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              이전
            </Button>
          )}
          
          {isPTInterview && <div></div>}

          {/* 다음/완료 버튼 */}
          <div className="flex space-x-4">
            {isPTInterview ? (
              // PT 면접용 버튼
              <>
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  재시도
                </Button>
                {(() => {
                  const currentSet = parseInt(searchParams.get('set') || '1');
                  const totalSets = parseInt(searchParams.get('count') || '1');
                  const isLastSet = currentSet >= totalSets;
                  
                  if (isLastSet) {
                    return (
                      <Button
                        onClick={handleNext}
                        className="flex items-center"
                      >
                        결과 보러가기
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    );
                  } else {
                    return (
                      <Button
                        onClick={handlePTNextQuestion}
                        disabled={isGeneratingPTNext}
                        className="flex items-center"
                      >
                        {isGeneratingPTNext ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            다음 질문
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    );
                  }
                })()}
              </>
            ) : (
              // 기존 인성/직무 면접용 버튼
              <>
                {(() => {
                  const showNextButton = currentStep < 2;
                  console.log(`🔘 [피드백페이지] 버튼 표시 로직: currentStep=${currentStep}, showNextButton=${showNextButton}, dynamicArrayLength=${dynamicAnswerAttemptIds.length}`);
                  return showNextButton;
                })() ? (
                  <div className="flex space-x-2">
                    {/* 상황별 다음 버튼 */}
                    <Button
                      variant={nextFeedbackReady ? "primary" : "outline"}
                      onClick={goToNextStep}
                      className={`flex items-center ${nextFeedbackReady ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      disabled={isAllQuestionsCompleted || (!nextFeedbackReady && currentStep < 2)}
                    >
                      {isLastQuestionInSet && !isLastSet 
                        ? `다음 질문 세트 생성 (${currentSet + 2}/${totalInterviewSets})`
                        : nextFeedbackReady 
                          ? `🎯 ${getStepTitle(currentStep + 1)} 피드백 보기`
                          : `⏳ ${getStepTitle(currentStep + 1)} 분석 중...`
                      }
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      재시도
                    </Button>
                    {(isLastSet || isAllQuestionsCompleted) ? (
                      <Button
                        onClick={handleNext}
                        className="flex items-center"
                      >
                        목록으로 이동
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGenerateNextSet}
                        disabled={isGeneratingNextSet}
                        className="flex items-center"
                      >
                        {isGeneratingNextSet ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            다음 질문 ({currentSet + 2}/{totalInterviewSets})
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}