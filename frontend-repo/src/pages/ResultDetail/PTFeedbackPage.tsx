'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import Button from '@/shared/components/Button';
import ResultDetailSkeleton from '@/pages/ResultDetail/components/ResultDetailSkeleton';
import { getPTFeedbackAPI } from '@/shared/api/results';
import { ChevronLeft, ArrowRight } from 'lucide-react';

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

export default function PTFeedbackPage() {
  const { id: interviewUuid } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const attemptUuid = searchParams.get('attemptUuid') || '';
  const attemptNumber = useMemo(() => {
    // 1) attemptUuid가 'ptUuid~n' 형식이면 (n+1) 사용: 접미사 없는 경우 1회, '~1'은 2회
    if (attemptUuid && attemptUuid.includes('~')) {
      const n = parseInt(attemptUuid.split('~')[1], 10);
      if (!Number.isNaN(n)) return n + 1;
    }
    // 2) URL의 attempt 사용
    const a = searchParams.get('attempt');
    if (a) {
      const parsed = parseInt(a, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    // 3) 세션 저장값 사용
    if (attemptUuid) {
      const key = `REVIEW_PT_ATTEMPT_${attemptUuid.includes('~') ? attemptUuid.split('~')[0] : attemptUuid}`;
      const cur = parseInt(sessionStorage.getItem(key) || '1', 10);
      return Number.isNaN(cur) ? 1 : cur;
    }
    return 1;
  }, [searchParams, attemptUuid]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<PTFeedbackResponse | null>(null);
  const fetchedKeyRef = useRef<string | null>(null);

  // 세트 수/현재 세트 파악 → 마지막 세트 여부 판단
  const totalSets = useMemo(() => {
    const c = searchParams.get('count');
    if (c) {
      const n = parseInt(c, 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    try {
      const targetId = interviewUuid || data?.interviewUuid || '';
      const raw = targetId ? sessionStorage.getItem(`REVIEW_SESSION_${targetId}`) : null;
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved?.totalInterviewSets === 'number' && saved.totalInterviewSets > 0) return saved.totalInterviewSets;
      }
    } catch {}
    return 1;
  }, [searchParams, interviewUuid, data?.interviewUuid]);

  const currentSet = useMemo(() => {
    const setParam = searchParams.get('set') || searchParams.get('setIndex');
    if (setParam) {
      const n = parseInt(setParam, 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    try {
      const targetId = interviewUuid || data?.interviewUuid || '';
      const v = targetId ? sessionStorage.getItem(`REVIEW_PT_SET_INDEX_${targetId}`) : null;
      const n = v ? parseInt(v, 10) : 1;
      return Number.isNaN(n) ? 1 : n;
    } catch {
      return 1;
    }
  }, [searchParams, interviewUuid, data?.interviewUuid]);

  const isLastSet = totalSets > 0 && currentSet >= totalSets;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!interviewUuid) return;
        const fetchKey = `${interviewUuid}::${attemptUuid}::${attemptNumber}`;
        if (fetchedKeyRef.current === fetchKey) return; // StrictMode 중복 호출 방지
        fetchedKeyRef.current = fetchKey;
        setLoading(true);
        setError('');
        // ptUuid 파생: '~' 기준으로 앞부분(uuid) 사용. 없으면 전체 사용
        const ptUuid = attemptUuid && attemptUuid.includes('~') ? attemptUuid.split('~')[0] : (attemptUuid || interviewUuid);
        try {
          sessionStorage.setItem(`REVIEW_PT_LAST_PTUUUID_${interviewUuid}`, ptUuid);
        } catch {}
        const res = await getPTFeedbackAPI(ptUuid, attemptNumber);
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
        if (mounted) setData(payload);
      } catch (e: any) {
        console.error('PT 피드백 조회 실패:', e);
        if (mounted) setError(e?.message || '피드백 조회 중 오류가 발생했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [attemptNumber, interviewUuid, attemptUuid]);

  const handleGoBack = () => {
    const targetId = data?.interviewUuid || interviewUuid;
    if (targetId) navigate(`/results/${targetId}`);
    else navigate('/results');
  };

  // 조건부 렌더링을 Hook 실행 후에 처리
  if (loading) {
    return (
      <>
        <Header />
        <ResultDetailSkeleton />
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <p className="text-xl text-red-600">오류가 발생했습니다: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-xl text-gray-500 mb-4">해당 PT 면접 결과를 찾을 수 없습니다.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PT 면접 결과 상세 분석</h1>
          <p className="text-gray-600">AI가 분석한 PT 발표 상세 결과표입니다.</p>
        </div>

        {/* 면접 기본 정보 */}
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
            <div>
              <p className="text-sm text-gray-600">현재 세트</p>
              <p className="text-lg font-semibold">{currentSet} / {totalSets}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">시도 횟수</p>
              <p className="text-lg font-semibold">{attemptNumber}회</p>
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

        {/* PT 피드백 상세 분석 */}
        {Array.isArray(data.presentationFeedbacks) && data.presentationFeedbacks.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">PT 발표 상세 분석</h2>
              <span className="text-sm text-gray-600">
                총 {data.presentationFeedbacks.length}개 시도
              </span>
            </div>
            
            <div className="space-y-4">
              {data.presentationFeedbacks.map((pf, idx) => (
                <div key={pf.feedbackUuid || idx} className="bg-white rounded-lg shadow-lg p-6">
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
                      {Array.isArray(pf.segment) && pf.segment.length > 0 ? (
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
                      {Array.isArray(pf.expression) && pf.expression.length > 0 ? (
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
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={handleGoBack} className="flex items-center">
            <ChevronLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          
          <div className="flex items-center space-x-2">
            {isLastSet && (
              <Button
                onClick={() => {
                  const targetId = data?.interviewUuid || interviewUuid;
                  if (targetId) navigate(`/results/${targetId}`);
                }}
                className="flex items-center"
              >
                질문 결과 확인
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


