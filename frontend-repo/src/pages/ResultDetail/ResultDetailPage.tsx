'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
// import Callout from '@/shared/components/Callout';
// import VideoSubtitle from '@/shared/components/VideoSubtitle';
import ResultActions from '@/pages/ResultDetail/components/ResultActions';
import ResultDetailSkeleton from '@/pages/ResultDetail/components/ResultDetailSkeleton';
import MainQuestionToggle from '@/pages/ResultDetail/components/MainQuestionToggle';
import IndividualFollowUpQuestion from '@/pages/ResultDetail/components/IndividualFollowUpQuestion';
// import EmotionTimelineGraph from '@/pages/ResultDetail/components/EmotionTimelineGraph';
import PTQuestionToggle from '@/pages/ResultDetail/components/PTQuestionToggle';
import { getResultDetailAPI } from '@/shared/api/results';
import { useNavigate } from 'react-router-dom';
import type { UnifiedInterviewDetail } from '@/shared/types/result';

export default function ResultDetailPage() {
  const { id: interviewUuid } = useParams<{ id:string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [animateEmotions, setAnimateEmotions] = useState(false);
  const [videoStates, setVideoStates] = useState<{[key: string]: {time: number, playing: boolean}}>({});

  const { 
    data: currentResult, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['resultDetail', interviewUuid],
    queryFn: async () => {
      const response = await getResultDetailAPI(interviewUuid!);
      return (response as { result?: UnifiedInterviewDetail })?.result || response;
    },
    enabled: !!interviewUuid,
  });

  // API 응답 데이터 처리 및 변환
  const interviewData = useMemo(() => {
    if (!currentResult) {
      return {
        questions: [],
        interviewType: 'JOB' as const,
        enterpriseName: '',
        position: '',
        duration: '',
        questionCount: 0
      };
    }

    // PT 면접인 경우 - 다중 질문 지원을 위해 원본 데이터 유지
    if ((currentResult as any).interviewType === 'PT' && (currentResult as any).ptInterviews) {
      return {
        ...currentResult,
        // 원본 ptInterviews 데이터 유지 (다중 질문 처리용)
        ptInterviews: (currentResult as any).ptInterviews
      };
    }

    // 일반 면접인 경우 그대로 반환
    return currentResult as UnifiedInterviewDetail;
  }, [currentResult]);

  // 질문을 3개씩 그룹핑하여 본질문과 꼬리질문으로 분류
  const questionGroups = useMemo(() => {
    const groups = [];
    if (interviewData?.questions) {
      for (let i = 0; i < interviewData.questions.length; i += 3) {
        const mainQuestion = interviewData.questions[i];
        const followUpQuestions = interviewData.questions.slice(i + 1, i + 3);
        groups.push({
          mainQuestion,
          followUpQuestions
        });
      }
    }
    return groups;
  }, [interviewData?.questions]);
  
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

  // 캐러셀 네비게이션 함수들 (본질문 그룹 기준으로 수정)
  const goToPreviousQuestion = useCallback(() => {
    if (questionGroups && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [questionGroups, currentQuestionIndex]);

  const goToNextQuestion = useCallback(() => {
    if (questionGroups && currentQuestionIndex < questionGroups.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [questionGroups, currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    // 모든 비디오 상태 초기화
    setVideoStates({});
  }, []);

  // PT UUID(직전 문제의 uuid) 파생: URL → 세션 → 상세 데이터 (함수 선언: 호이스팅으로 선사용 허용)
  // function derivePtUuidFn(): string {
  //   if (!interviewUuid) return '';
  //   // 1) URL 쿼리
  //   const params = new URLSearchParams(window.location.search);
  //   const attemptUuidParam = params.get('attemptUuid') || '';
  //   const attemptIdsParam = params.get('attemptIds') || '';
  //   const rawFromUrl = attemptUuidParam || attemptIdsParam || '';
  //   // 구분자는 '~' 기준으로 자름. 없으면 전체 사용
  //   const fromUrl = rawFromUrl.includes('~') ? rawFromUrl.split('~')[0] : rawFromUrl;
  //   if (fromUrl) {
  //     console.log('[PT] derivePtUuid from URL:', fromUrl);
  //     return fromUrl;
  //   }

  //   // 2) 세션 저장값
  //   const saved = sessionStorage.getItem(`REVIEW_PT_LAST_PTUUUID_${interviewUuid}`) || '';
  //   if (saved) {
  //     console.log('[PT] derivePtUuid from session key REVIEW_PT_LAST_PTUUUID:', saved);
  //     return saved;
  //   }

  //   // 2-b) 세션 저장의 시작 payload에서 questions[0].questionUuid 사용
  //   try {
  //     const sessionKey = `REVIEW_SESSION_${interviewUuid}`;
  //     const rawSaved = sessionStorage.getItem(sessionKey);
  //     if (rawSaved) {
  //       const payload = JSON.parse(rawSaved);
  //       const q = Array.isArray(payload?.questions) ? payload.questions[0] : null;
  //       const qid = q?.questionUuid || q?.id || q?.uuid;
  //       if (typeof qid === 'string' && qid) {
  //         console.log('[PT] derivePtUuid from session payload questions:', qid);
  //         return qid;
  //       }
  //     }
  //   } catch {}

  //   // 3) 상세 데이터에서 추정
  //   try {
  //     // ptFeedBack에 answerAttemptUuid가 있으면 그 앞부분 사용
  //     const fb = (currentResult as any)?.result?.ptFeedBack || (interviewData as any)?.ptFeedBack;
  //     if (Array.isArray(fb) && fb.length > 0) {
  //       const cand = fb[fb.length - 1]?.answerAttemptUuid || fb[0]?.answerAttemptUuid;
  //       if (typeof cand === 'string' && cand) {
  //         const parsed = cand.includes('~') ? cand.split('~')[0] : cand;
  //         console.log('[PT] derivePtUuid from result ptFeedBack:', parsed);
  //         return parsed;
  //       }
  //     }
  //     // questions 배열에서 questionUuid 시도
  //     const qs = (currentResult as any)?.result?.questions || (interviewData as any)?.questions;
  //     if (Array.isArray(qs) && qs.length > 0) {
  //       const q = qs[qs.length - 1] || qs[0];
  //       const cand = q?.questionUuid || q?.id || q?.uuid;
  //       if (typeof cand === 'string') {
  //         console.log('[PT] derivePtUuid from result questions:', cand);
  //         return cand;
  //       }
  //     }
  //   } catch {}
  //   console.warn('[PT] derivePtUuid failed: no source found');
  //   return '';
  // }

  // PT 진행 세트 잔여 여부 체크 및 네비게이션 핸들러
  // const getPtProgress = useCallback(() => {
  //   if (!interviewUuid) return { total: 0, attempt: 0 };
  //   try {
  //     const sessionKey = `REVIEW_SESSION_${interviewUuid}`;
  //     const raw = sessionStorage.getItem(sessionKey);
  //     const saved = raw ? JSON.parse(raw) : null;
  //     // 총 세트 수는 사용자가 설정한 count (없으면 1)
  //     const totalSetsParam = new URLSearchParams(window.location.search).get('count');
  //     const totalSets = totalSetsParam ? parseInt(totalSetsParam, 10) : (
  //       typeof saved?.totalInterviewSets === 'number' ? saved.totalInterviewSets : 1
  //     );
  //     // 현재 문제의 ptUuid를 파생하여 해당 문제의 attemptNumber를 사용
  //     const curPtUuid = derivePtUuidFn();
  //     const attemptKey = `REVIEW_PT_ATTEMPT_${curPtUuid}`;
  //     const curAttempt = parseInt(sessionStorage.getItem(attemptKey) || '1', 10);
  //     const attempt = Number.isNaN(curAttempt) ? 1 : curAttempt;
  //     return { total: totalSets, attempt };
  //   } catch {
  //     return { total: 1, attempt: 1 };
  //   }
  // }, [interviewUuid]);

  // 기존 derivePtUuid는 함수 선언(derivePtUuidFn)으로 대체

  // const handleProceedNextPT = useCallback(() => {
  //   if (!interviewUuid) return;
  //   // attempt가 total에 도달했다면 이동하지 않음(가드)
  //   const { total, attempt } = getPtProgress();
  //   if (attempt >= total) return;
  //   try {
  //     // PT UUID 파생(쿼리 → 세션 → 상세 데이터)
  //     const ptUuid = derivePtUuidFn();
  //     if (!ptUuid) {
  //       console.warn('[PT] 다음 문제 생성 실패: ptUuid를 확인할 수 없습니다.');
  //       return;
  //     }
  //     console.log('[PT] 다음 문제 생성 요청 ptUuid:', ptUuid);
  //     generateNextPTProblemAPI(ptUuid).then((res: any) => {
  //       const r = res?.result || res?.data?.result || res;
  //       const nextQuestionUuid = r?.questionUuid;
  //       const title = r?.title;
  //       const situation = r?.situation;
  //       if (!nextQuestionUuid) {
  //         console.warn('[PT] 다음 문제 응답에 questionUuid 없음');
  //         return;
  //       }
  //       // sessionStorage 갱신 (다음 세션 진입 시 사용)
  //       const sessionKey = `REVIEW_SESSION_${interviewUuid}`;
  //       try {
  //         const rawSaved = sessionStorage.getItem(sessionKey);
  //         const saved = rawSaved ? JSON.parse(rawSaved) : {};
  //         saved.questions = [{ questionUuid: nextQuestionUuid, title, situation }];
  //         sessionStorage.setItem(sessionKey, JSON.stringify(saved));
  //       } catch {}
  //       // PT 세션 진입
  //       const qs = new URLSearchParams();
  //       qs.set('type', 'presentation');
  //       qs.set('storeKey', sessionKey);
  //       qs.set('interviewUuid', interviewUuid);
  //       navigate(`/interview/session?${qs.toString()}`);
  //     });
  //   } catch (e) {
  //     console.error('[PT] 다음 문제 생성 중 오류:', e);
  //   }
  // }, [navigate, interviewUuid, getPtProgress]);

  // 비디오 이벤트 핸들러들 (비디오별 분리)
  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>, videoId: string) => {
    const video = event.currentTarget;
    const newTime = video.currentTime;
    console.log(`비디오 ${videoId} 시간 업데이트:`, newTime);
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], time: newTime }
    }));
  };

  const handleVideoPlay = (videoId: string) => {
    console.log(`비디오 ${videoId} 재생 시작`);
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], playing: true }
    }));
  };

  const handleVideoPause = (videoId: string) => {
    console.log(`비디오 ${videoId} 일시정지`);
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], playing: false }
    }));
  };


  // 타임라인 클릭으로 비디오 시간 이동
  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>, maxTime: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const targetTime = clickRatio * maxTime;
    
    // 현재 활성화된 모든 비디오 요소를 찾아서 시간 설정
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.currentTime !== undefined) {
        video.currentTime = targetTime;
      }
    });
    
    // 더 이상 전역 currentVideoTime은 사용하지 않음 - 각 비디오별 개별 관리
  };

  // 애니메이션 트리거
  useEffect(() => {
    setAnimateEmotions(false);
    const timer = setTimeout(() => {
      setAnimateEmotions(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  // 비디오 상태 변경 감지
  useEffect(() => {
    console.log('비디오 상태 변경됨:', videoStates);
  }, [videoStates]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (questionGroups) {
        if (event.key === 'ArrowLeft') {
          goToPreviousQuestion();
        } else if (event.key === 'ArrowRight') {
          goToNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousQuestion, goToNextQuestion, questionGroups]);

  // 조건부 렌더링을 Hook 실행 후에 처리
  if (isLoading) {
    return (
      <>
        <Header />
        <ResultDetailSkeleton />
        <Footer />
      </>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <p className="text-xl text-red-600">오류가 발생했습니다: {(error as Error)?.message}</p>
      </div>
    );
  }

  if (!currentResult) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-xl text-gray-500 mb-4">해당 면접 결과를 찾을 수 없습니다.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">면접 결과 상세 분석</h1>
        <p className="text-gray-600 mb-8">AI가 분석한 상세 결과표입니다.</p>
   
        
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
              <p className="text-lg font-semibold">{getInterviewTypeInKorean(interviewData.interviewType || '')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">소요 시간</p>
              <p className="text-lg font-semibold">{interviewData.duration}</p>
            </div>
          </div>
          
          {/* PT 면접인 경우 추가 정보 */}
          {interviewData.interviewType === 'PT' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                {interviewData.ptTitle && (
                  <div>
                    <p className="text-sm text-gray-600">PT 제목</p>
                    <p className="text-lg font-semibold">{interviewData.ptTitle}</p>
                  </div>
                )}
                {interviewData.ptSituation && (
                  <div>
                    <p className="text-sm text-gray-600">PT 상황</p>
                    <p className="text-gray-700">{interviewData.ptSituation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PT 면접 상세 분석 (캐러셀 구조) - 다중 질문 지원 */}
        {interviewData.interviewType === 'PT' && (interviewData as any)?.ptInterviews?.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">질문별 상세 분석</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} / {(interviewData as any).ptInterviews.length}
                </span>
              </div>
            </div>
            
            {/* 질문 네비게이션 인디케이터 */}
            <div className="flex justify-center space-x-3 mb-6">
              {(interviewData as any).ptInterviews.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    index === currentQuestionIndex 
                      ? 'bg-blue-600 text-white shadow-md scale-105' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  aria-label={`질문 ${index + 1}로 이동`}
                >
                  Q{index + 1}
                </button>
              ))}
            </div>
            
            {/* 캐러셀 컨테이너 */}
            <div className="relative">
              {/* 이전 버튼 */}
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 z-10 bg-white rounded-full shadow-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="이전 질문"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 다음 버튼 */}
              <button
                onClick={() => setCurrentQuestionIndex(Math.min((interviewData as any).ptInterviews.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === (interviewData as any).ptInterviews.length - 1}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 z-10 bg-white rounded-full shadow-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="다음 질문"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* 현재 슬라이드의 PT 질문 */}
              {(interviewData as any).ptInterviews[currentQuestionIndex] && (
                <PTQuestionToggle
                  title={(interviewData as any).ptInterviews[currentQuestionIndex].title || `PT 발표 주제 ${currentQuestionIndex + 1}`}
                  situation={(interviewData as any).ptInterviews[currentQuestionIndex].situation}
                  questionIndex={currentQuestionIndex}
                  feedbacks={(interviewData as any).ptInterviews[currentQuestionIndex].retry?.map((retry: any) => ({
                    videoUrl: retry.videoUrl,
                    intent: retry.intent,
                    expressions: retry.expressions || [],
                    transcript: retry.transcript || '',
                    segments: retry.segments || [],
                    modelAnswer: retry.modelAnswer || '',
                    feedbackSources: retry.feedbackSources || {}
                  })) || []}
                  isInitiallyOpen={true} // 항상 열려있음
                  videoStates={videoStates}
                  onVideoTimeUpdate={handleVideoTimeUpdate}
                  onVideoPlay={handleVideoPlay}
                  onVideoPause={handleVideoPause}
                  onTimelineClick={handleTimelineClick}
                  animateEmotions={animateEmotions}
                />
              )}
            </div>
          </div>
        )}

        {/* 질문별 상세 분석 캐러셀 (인성/직무 면접인 경우) */}
        {questionGroups && questionGroups.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">질문별 상세 분석</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} / {questionGroups.length}
                </span>
              </div>
            </div>
            
            {/* 질문 네비게이션 인디케이터 */}
            <div className="flex justify-center space-x-3 mb-6">
              {questionGroups.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    index === currentQuestionIndex 
                      ? 'bg-blue-600 text-white shadow-md scale-105' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  aria-label={`질문 ${index + 1}로 이동`}
                >
                  Q{index + 1}
                </button>
              ))}
            </div>
            
            {/* 캐러셀 컨테이너 */}
            <div className="relative">
              {/* 이전 버튼 */}
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 z-10 bg-white rounded-full shadow-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="이전 질문"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 다음 버튼 */}
              <button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questionGroups.length - 1}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 z-10 bg-white rounded-full shadow-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="다음 질문"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* 현재 슬라이드의 모든 토글 */}
              <div className="space-y-4">
                {questionGroups[currentQuestionIndex] && (
                  <>
                    {/* 본질문 토글 (처음에 열려있음) */}
                    <MainQuestionToggle
                      question={questionGroups[currentQuestionIndex].mainQuestion}
                      isInitiallyOpen={true}
                      videoStates={videoStates}
                      onVideoTimeUpdate={handleVideoTimeUpdate}
                      onVideoPlay={handleVideoPlay}
                      onVideoPause={handleVideoPause}
                      onTimelineClick={handleTimelineClick}
                      animateEmotions={animateEmotions}
                    />
                    
                    {/* 꼬리질문 토글들 */}
                    {questionGroups[currentQuestionIndex].followUpQuestions.map((followUpQuestion) => (
                      <IndividualFollowUpQuestion
                        key={followUpQuestion.questionNumber}
                        question={followUpQuestion}
                        videoStates={videoStates}
                        onVideoTimeUpdate={handleVideoTimeUpdate}
                        onVideoPlay={handleVideoPlay}
                        onVideoPause={handleVideoPause}
                        onTimelineClick={handleTimelineClick}
                        animateEmotions={animateEmotions}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}


        <ResultActions />
      </main>
      <Footer />
    </>
  );
}
