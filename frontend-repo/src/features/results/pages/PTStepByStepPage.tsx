'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import Button from '@/shared/components/Button';
import ResultDetailSkeleton from '@/features/results/components/detail/ResultDetailSkeleton';
import { useWebSocketStore } from '@/shared/store/websocketStore';
import { generateNextPTProblemAPI, getPTFeedbackAPI } from '@/shared/api/results';
import { ChevronLeft, RotateCcw, ArrowRight, Loader } from 'lucide-react';

type PTExpressionPoint = { second: number; expression: string };
type PTSegment = { start: number; end: number; text: string; intent: string };

type PTPresentationFeedback = {
  attemptNumber: number;
  ptAnswerAttemptUuid: string;
  feedbackUuid: string;
  transcript: string;
  expression: PTExpressionPoint[];
  segment: PTSegment[];
};

type PTFeedbackResponse = {
  interviewUuid: string;
  ptTitle: string;
  ptSituation: string;
  presentationFeedbacks: PTPresentationFeedback[];
};

export default function PTStepByStepPage() {
  const { id: interviewUuid } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { connect: connectWebSocket, removeCallback } = useWebSocketStore();

  // URL 파라미터: attemptUuid는 'ptUuid~attemptNumber' 형식일 수 있음
  const attemptUuidParam = searchParams.get('attemptUuid') || '';
  const attemptNumber = useMemo(() => {
    if (attemptUuidParam.includes('~')) {
      const part = attemptUuidParam.split('~')[1];
      const n = parseInt(part, 10);
      if (!Number.isNaN(n)) return n + 1; // 빈 접미사: 1회, '~1': 2회
    }
    const a = searchParams.get('attempt');
    if (a) {
      const parsed = parseInt(a, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 1;
  }, [attemptUuidParam, searchParams]);

  const ptUuid = useMemo(() => {
    return attemptUuidParam.includes('~') ? attemptUuidParam.split('~')[0] : attemptUuidParam;
  }, [attemptUuidParam]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<PTFeedbackResponse | null>(null);
  const [isGeneratingNext, setIsGeneratingNext] = useState<boolean>(false);
  const fetchedKeyRef = useRef<string | null>(null);
  // 마지막 세트 자동 이동은 사용하지 않음 (리트라이 허용을 위해 버튼으로 제어)

  // 피드백 로드 (중간 피드백 실시간/수동 모두 지원)
  const fetchFeedback = useCallback(async (attemptUuidLike: string) => {
    if (!interviewUuid) return;
    const currentPtUuid = attemptUuidLike.includes('~') ? attemptUuidLike.split('~')[0] : attemptUuidLike;
    const currentAttempt = attemptUuidLike.includes('~')
      ? parseInt(attemptUuidLike.split('~')[1], 10)
      : attemptNumber;
    const key = `${interviewUuid}::${currentPtUuid}::${currentAttempt}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;
    try {
      setLoading(true);
      setError('');
      // 세션 보관 (다음 PT 생성 시 사용)
      try {
        sessionStorage.setItem(`REVIEW_PT_LAST_PTUUUID_${interviewUuid}`, currentPtUuid);
      } catch {}
      const res = await getPTFeedbackAPI(currentPtUuid, currentAttempt || 1);
      const raw = (res as any)?.result;
      let payload: PTFeedbackResponse | null = null;
      if (raw) {
        if (Array.isArray(raw?.presentationFeedbacks)) {
          payload = raw as PTFeedbackResponse;
        } else if (Array.isArray(raw?.ptInterviews) && raw.ptInterviews.length > 0) {
          const chosen = raw.ptInterviews[raw.ptInterviews.length - 1];
          const mapped = Array.isArray(chosen?.retry)
            ? chosen.retry.map((r: any, idx: number) => ({
                attemptNumber: idx + 1,
                ptAnswerAttemptUuid: '',
                feedbackUuid: r.feedbackUuid || '',
                transcript: r.transcript || '',
                expression: Array.isArray(r.expressions)
                  ? r.expressions.map((e: any) => ({ second: e.second, expression: e.expression }))
                  : [],
                segment: Array.isArray(r.segments)
                  ? r.segments.map((s: any) => ({ start: s.start, end: s.end, text: s.text, intent: s.intent }))
                  : [],
              }))
            : [];
          payload = {
            interviewUuid: raw.interviewUuid,
            ptTitle: chosen.title || '',
            ptSituation: chosen.situation || '',
            presentationFeedbacks: mapped,
          };
        }
      }
      setData(payload || null);
    } catch (e: any) {
      setError(e?.message || '피드백 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [interviewUuid, attemptNumber]);

  useEffect(() => {
    if (!interviewUuid) return;
    if (ptUuid) fetchFeedback(attemptUuidParam || ptUuid);
  }, [interviewUuid, ptUuid, attemptUuidParam, fetchFeedback]);

  // WebSocket 실시간 수신 → 최신 attempt로 갱신
  useEffect(() => {
    const onRealtime = (answerAttemptId: string) => {
      if (!answerAttemptId) return;
      fetchFeedback(answerAttemptId);
    };
    connectWebSocket(onRealtime);
    return () => removeCallback(onRealtime);
  }, [connectWebSocket, removeCallback, fetchFeedback]);

  // 자동 리다이렉트는 수행하지 않음 (리트라이 허용을 위해 버튼으로 제어)

  // 버튼 핸들러들
  const totalSets = useMemo(() => {
    const c = searchParams.get('count');
    return c ? parseInt(c, 10) : (() => {
      try {
        if (!interviewUuid) return 1;
        const raw = sessionStorage.getItem(`REVIEW_SESSION_${interviewUuid}`);
        if (!raw) return 1;
        const saved = JSON.parse(raw);
        return typeof saved?.totalInterviewSets === 'number' ? saved.totalInterviewSets : 1;
      } catch {
        return 1;
      }
    })();
  }, [searchParams, interviewUuid]);

  // 현재 PT 세트 인덱스(1-based)
  const currentSet = useMemo(() => {
    const urlSet = searchParams.get('set') || searchParams.get('setIndex');
    if (urlSet) {
      const n = parseInt(urlSet, 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    try {
      if (!interviewUuid) return 1;
      const key = `REVIEW_PT_SET_INDEX_${interviewUuid}`;
      const cur = parseInt(sessionStorage.getItem(key) || '1', 10);
      if (Number.isNaN(cur) || cur <= 0) {
        sessionStorage.setItem(key, '1');
        return 1;
      }
      return cur;
    } catch {
      return 1;
    }
  }, [searchParams, interviewUuid]);

  const handleRetry = () => {
    if (!interviewUuid) return;
    const params = new URLSearchParams();
    params.set('type', 'presentation');
    params.set('interviewUuid', interviewUuid);
    params.set('count', String(totalSets));
    params.set('storeKey', `REVIEW_SESSION_${interviewUuid}`);
    // 리트라이는 동일 세트 유지
    params.set('set', String(currentSet));
    navigate(`/interview/session?${params.toString()}`);
  };

  // isLastSet은 UI에서 버튼 분기 용도로만 사용

  const handleNextPT = async () => {
    if (!interviewUuid || isGeneratingNext) {
      return;
    }
    const basePtUuid = ptUuid || (sessionStorage.getItem(`REVIEW_PT_LAST_PTUUUID_${interviewUuid}`) || '');
    if (!basePtUuid) {
      alert('ptUuid를 확인할 수 없습니다.');
      return;
    }
    
    setIsGeneratingNext(true);
    
    try {
      const res = await generateNextPTProblemAPI(basePtUuid);
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
        // 다음 PT는 attempt 초기화(1)
        sessionStorage.setItem(`REVIEW_PT_ATTEMPT_${nextQid}`, '1');
        sessionStorage.setItem(sessionKey, JSON.stringify(saved));
        sessionStorage.setItem(`REVIEW_PT_LAST_PTUUUID_${interviewUuid}`, nextQid);
        // 세트 인덱스 +1 저장
        const setKey = `REVIEW_PT_SET_INDEX_${interviewUuid}`;
        const cur = parseInt(sessionStorage.getItem(setKey) || `${currentSet}`, 10);
        const nextSet = Number.isNaN(cur) ? currentSet + 1 : cur + 1;
        sessionStorage.setItem(setKey, String(nextSet));
      } catch {}

      const params = new URLSearchParams();
      params.set('type', 'presentation');
      params.set('interviewUuid', interviewUuid);
      params.set('count', String(totalSets));
      params.set('storeKey', `REVIEW_SESSION_${interviewUuid}`);
      params.set('set', String(currentSet + 1));
      navigate(`/interview/session?${params.toString()}`);
    } catch (e) {
      console.error('[PT] 다음 문제 생성 실패:', e);
      const errorMessage = e instanceof Error ? e.message : '네트워크 오류';
      alert(`다음 PT 문제 생성에 실패했습니다.\n오류: ${errorMessage}\n잠시 후 다시 시도해주세요.`);
      setIsGeneratingNext(false);
    }
  };

  // UI
  if (loading) {
    return (
      <>
        <Header />
        <ResultDetailSkeleton />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PT 면접 중간 피드백</h1>
          <p className="text-gray-600">시도별 상세 피드백을 확인하세요.</p>
        </div>

        {/* 진행 상황 표시기 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">진행 상황</h2>
            <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center">
              <ChevronLeft className="w-4 h-4 mr-2" />
              뒤로
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">현재 세트</p>
              <p className="text-lg font-semibold">{currentSet} / {totalSets}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">리트라이 횟수</p>
              <p className="text-lg font-semibold">{attemptNumber}회</p>
            </div>
          </div>
        </div>

        {/* 면접 기본 정보 */}
        {data && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">면접 ID</p>
                <p className="text-lg font-semibold">{data.interviewUuid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">면접 유형</p>
                <p className="text-lg font-semibold">PT 발표</p>
              </div>
            </div>
            
            {/* PT 주제 정보 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">PT 제목</p>
                  <p className="text-lg font-semibold">{data.ptTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PT 상황</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{data.ptSituation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">PT 발표 상세 분석</h2>
              <span className="text-sm text-gray-600">
                총 {data.presentationFeedbacks.length}개 시도
              </span>
            </div>

            {Array.isArray(data.presentationFeedbacks) && data.presentationFeedbacks.length > 0 && (
              <div className="space-y-4">
                {data.presentationFeedbacks.map((pf) => (
                  <div key={pf.feedbackUuid} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        시도 {pf.attemptNumber}
                      </h3>
                      {pf.ptAnswerAttemptUuid && (
                        <div className="text-sm text-gray-500">
                          답변 ID: {pf.ptAnswerAttemptUuid}
                        </div>
                      )}
                    </div>

                    {/* 전사 내용 */}
                    {pf.transcript && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">발표 전사</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{pf.transcript}</p>
                        </div>
                      </div>
                    )}

                    {/* 세그먼트 분석 */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">발표 구간 분석</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        {pf.segment?.length ? (
                          <div className="space-y-2">
                            {pf.segment.map((s, i) => (
                              <div key={`${s.start}-${s.end}-${i}`} className="flex items-start space-x-3 p-3 bg-white rounded border">
                                <div className="flex-shrink-0">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {s.start.toFixed(1)}s - {s.end.toFixed(1)}s
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800 mb-1">{s.text}</p>
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                    {s.intent}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">구간 분석 데이터가 없습니다.</p>
                        )}
                      </div>
                    </div>

                    {/* 감정 타임라인 */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">감정 타임라인</h4>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        {pf.expression?.length ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {pf.expression.map((ex, i) => (
                              <div key={`${ex.second}-${i}`} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                <span className="text-xs font-medium text-amber-700 min-w-[40px]">
                                  {ex.second}s
                                </span>
                                <span className="text-sm text-gray-800 flex-1">
                                  {ex.expression}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">감정 분석 데이터가 없습니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={handleRetry} className="flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            리트라이
          </Button>
          
          <div className="flex items-center space-x-2">
            {(() => {
              const isLastSet = totalSets > 0 && currentSet >= totalSets;
              if (isLastSet) {
                return (
                  <Button onClick={() => {
                    const targetId = data?.interviewUuid || interviewUuid;
                    if (targetId) navigate(`/results/${targetId}`);
                  }} className="flex items-center">
                    결과 확인
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                );
              }
              return (
                <Button onClick={handleNextPT} disabled={isGeneratingNext} className="flex items-center">
                  {isGeneratingNext ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      다음 PT 진행
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              );
            })()}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


