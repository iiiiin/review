// src/pages/InterviewLoading/InterviewLoadingPage.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, MessageSquare, Target, TrendingUp, Users, CheckCircle } from 'lucide-react';

type RouteState = {
  storeKey?: string;          // REVIEW_SESSION_<uuid>
  nextPath?: string;          // 우선 사용
  countdownSec?: number;      // 기본 5
  skipWait?: boolean;         // (사용 안함) 최소 5초 프리대기 보장
};

// --- 세션스토리지에 저장될(권장) 구조 ---
type FollowUp = { id?: string | number; questionUuid?: string };
type Question = {
  id?: string | number;
  questionUuid?: string;
  question?: string;
  followUps?: FollowUp[];
};
type StoredPayload = {
  ready: boolean;                                     // ✅ 폴링 기준
  interviewType?: 'PERSONAL' | 'JOB' | 'PT';          // 백엔드 타입 (매핑 대상)
  frontType?: 'tech' | 'behavioral' | 'presentation' | 'general'; // 프론트용 타입(있으면 우선)
  interviewUuid?: string;                             // 네비용
  interviewSetUuid?: string;                          // (직무/인성)
  questions?: Question[];                             // (직무/인성)
  ptInitial?: { questionUuid?: string; title?: string | null; situation?: string | null }; // (PT)
  nextQuery?: string;                                 // "?storeKey=...&interviewUuid=..."
};

const SESSION_PATH = '/interview/session';

// === 간단 로거 (기본 info, URL에 ?debug=1이면 debug) ===
type LogLevel = 'none' | 'info' | 'debug';
const createLogger = (level: LogLevel) => ({
  info: (...args: any[]) => { if (level !== 'none') console.log(...args); },
  debug: (...args: any[]) => { if (level === 'debug') console.debug(...args); },
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
});

// 백엔드 타입 → 프론트 type 매핑
const toFrontType = (v?: string) => {
  switch (v) {
    case 'PT': return 'presentation';
    case 'JOB': return 'tech';
    case 'TENACITY': return 'behavioral';
    default: return 'general';
  }
};

// nextQuery에서 type이 빠져있으면 보강
const ensureTypeInQuery = (q: string, frontType: string) => {
  const qs = new URLSearchParams(q?.startsWith('?') ? q.slice(1) : q);
  if (!qs.get('type')) qs.set('type', frontType);
  return `?${qs.toString()}`;
};

// storeKey/interviewUuid/type 으로 query 생성
const buildQuery = (p?: StoredPayload | null, storeKey?: string) => {
  const qs = new URLSearchParams();
  if (storeKey) qs.set('storeKey', storeKey);
  if (p?.interviewUuid) qs.set('interviewUuid', p.interviewUuid);
  const frontType = (p as any)?.frontType ?? toFrontType(p?.interviewType);
  if (frontType) qs.set('type', frontType);
  return `?${qs.toString()}`;
};

/**
 * NOTE: 호환용 헬퍼. 내부적으로 buildQuery를 호출.
 * - 유지 여부는 추후 결정(지금은 실제 사용 연결)
 */
const buildQueryFrom = (p?: StoredPayload | null, storeKey?: string, frontTypeOverride?: string) => {
  const base = buildQuery(p, storeKey);
  const ft = frontTypeOverride ?? (p as any)?.frontType ?? toFrontType(p?.interviewType);
  return ensureTypeInQuery(base, ft);
};

// --- 요약 문자열 (한 줄) ---
const summarize = (payload: StoredPayload | null | undefined) => {
  if (!payload) return '(empty payload)';
  const ft = payload.frontType ?? toFrontType(payload.interviewType);
  const n = Array.isArray(payload.questions) ? payload.questions.length : 0;
  const firstId = n > 0 ? (payload.questions![0]?.id ?? payload.questions![0]?.questionUuid) : undefined;
  const ptQ = payload.ptInitial?.questionUuid;
  return `{type:${ft}, uuid:${payload.interviewUuid ?? '-'}, qLen:${n}${firstId ? `, first:${firstId}` : ''}${ptQ ? `, ptQ:${ptQ}` : ''}, ready:${payload.ready ?? false}}`;
};

const MIN_PREWAIT_MS = 5_000;

const InterviewLoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: RouteState };

  const storeKey = state?.storeKey ?? '';
  const nextPathFromState = state?.nextPath;
  const countdownDefault = state?.countdownSec ?? 5;

  // 로그 레벨 결정: 기본 info, ?debug=1 이면 debug
  const logLevel: LogLevel = useMemo(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('debug');
      if (v === '1' || v === 'true') return 'debug';
    } catch {}
    return 'info';
  }, []);
  const log = useMemo(() => createLogger(logLevel), [logLevel]);

  // 단계: prewait(5s) → polling(ready) → countdown(5..0) → done(navigate)
  const [phase, setPhase] = useState<'prewait' | 'polling' | 'countdown' | 'done'>('prewait');
  const [count, setCount] = useState<number>(countdownDefault);

  // 세션스토리지 payload 저장
  const payloadRef = useRef<StoredPayload | null>(null);
  const firstSeenRef = useRef<boolean>(false); // 최초 감지 로그용

  // === UI 상태(그대로 유지) ===
  const [currentTip, setCurrentTip] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  const interviewTips = useMemo(
    () => [
      { icon: <Brain className="w-5 h-5" />, title: '💡 면접 꿀팁', message: 'STAR 기법으로 경험을 구체적으로 설명해보세요' },
      { icon: <MessageSquare className="w-5 h-5" />, title: '🎯 답변 전략', message: '질문 뒤 3초 생각 정리도 충분히 괜찮습니다' },
      { icon: <Target className="w-5 h-5" />, title: '🔥 자신감 UP', message: '자연스러운 아이컨택으로 대화하듯 답변하세요' },
      { icon: <TrendingUp className="w-5 h-5" />, title: '📈 성장 마인드', message: '실패도 배움으로 연결해 성장 포인트를 강조하세요' },
      { icon: <Users className="w-5 h-5" />, title: '🤝 소통 능력', message: '팀워크 경험을 구체적 사례와 함께 어필하세요' },
      { icon: <CheckCircle className="w-5 h-5" />, title: '✨ 마무리 인사', message: '마지막 역질문으로 관심과 의지를 보여주세요' },
    ],
    []
  );

  useEffect(() => {
    const a = setInterval(() => setCurrentTip((p) => (p + 1) % interviewTips.length), 2500);
    return () => clearInterval(a);
  }, [interviewTips.length]);

  useEffect(() => {
    const id = setInterval(() => setScanProgress((p) => (p >= 100 ? 0 : p + 2)), 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAnimationPhase((p) => (p + 1) % 4), 800);
    return () => clearInterval(id);
  }, []);

  // ① 최소 5초 프리대기
  useEffect(() => {
    if (phase !== 'prewait') return;
    log.debug('[Loading] prewait start (5s)');
    const t = setTimeout(() => {
      log.info('[Loading] → polling');
      setPhase('polling');
    }, MIN_PREWAIT_MS);
    return () => clearTimeout(t);
  }, [phase, log]);

  // ② 폴링(최대 2분)
  useEffect(() => {
    if (phase !== 'polling') return;

    if (!storeKey) {
      log.warn('[Loading] storeKey missing → fallback countdown');
      setPhase('countdown');
      return;
    }

    const INTERVAL = 600;
    const MAX_WAIT_MS = 120_000;
    const started = Date.now();

    log.info('[Loading] polling start (≤120s), key =', storeKey);
    const poll = setInterval(() => {
      try {
        const raw = sessionStorage.getItem(storeKey);
        if (raw) {
          const data: StoredPayload = JSON.parse(raw);
          payloadRef.current = data;

          if (!firstSeenRef.current) {
            firstSeenRef.current = true;
            log.info('[Loading] payload seen', summarize(data));
          }

          if (data?.ready === true) {
            log.info('[Loading] ready detected', summarize(data));
            clearInterval(poll);
            setPhase('countdown');
            return;
          }
        }

        if (Date.now() - started > MAX_WAIT_MS) {
          log.warn('[Loading] polling timeout → countdown');
          clearInterval(poll);
          setPhase('countdown');
        }
      } catch (e) {
        log.warn('[Loading] polling JSON parse ignored');
      }
    }, INTERVAL);

    return () => clearInterval(poll);
  }, [phase, storeKey, log]);

  // ✅ 항상 /interview/session 으로 이동하되, type 쿼리를 반드시 보장
  const resolveNextPath = (): string => {
    const p = payloadRef.current;
    const frontType = (p as any)?.frontType ?? toFrontType(p?.interviewType);

    if (nextPathFromState) {
      try {
        const url = new URL(nextPathFromState, window.location.origin);
        if (!url.searchParams.get('type')) url.searchParams.set('type', frontType);
        const final = `${url.pathname}?${url.searchParams.toString()}`;
        log.info('[Loading] nextPath(state) →', final);
        return final;
      } catch {
        const fixed = ensureTypeInQuery(nextPathFromState, frontType);
        const final = `${SESSION_PATH}${fixed}`;
        log.info('[Loading] nextPath(state) (fixed) →', final);
        return final;
      }
    }

    if (p?.nextQuery) {
      const final = `${SESSION_PATH}${ensureTypeInQuery(p.nextQuery, frontType)}`;
      log.info('[Loading] payload.nextQuery →', final);
      return final;
    }

    const final = `${SESSION_PATH}${buildQueryFrom(p, storeKey, frontType)}`;
    log.info('[Loading] buildQueryFrom →', final);
    return final;
  };

  // ③ 카운트다운 → 이동
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (count === countdownDefault) {
      // 카운트다운 처음 진입 시에만 한 번
      log.info(`[Loading] countdown start (${countdownDefault}s)`, summarize(payloadRef.current));
    }

    if (count <= 0) {
      setPhase('done');
      const target = resolveNextPath();
      log.info('[Loading] navigate →', target);
      navigate(target, { replace: true });
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, count, countdownDefault, navigate, log]);

  const statusText =
    phase === 'prewait'
      ? '준비를 시작합니다...'
      : phase === 'polling'
      ? '질문을 생성하고 있습니다...'
      : `곧 세션이 시작됩니다 (${count}s)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* 배경/애니메이션 기존 유지 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* 카드 + 진행 텍스트 */}
        <div className="mb-8">
          <div className="relative mx-auto w-48 h-32 mb-6">
            <div className="absolute inset-0 bg-white border-2 border-indigo-200 rounded-lg shadow-lg rotate-2 opacity-30" />
            <div className="absolute inset-0 bg-white border-2 border-indigo-200 rounded-lg shadow-lg -rotate-1 opacity-50 translate-x-1 translate-y-1" />
            <div className="relative bg-white border-2 border-indigo-300 rounded-lg shadow-xl overflow-hidden">
              <div className="bg-indigo-50 p-3 border-b border-indigo-100">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <div className="text-xs text-indigo-700 font-medium">
                    {phase === 'countdown' ? '세션 준비 완료' : '질문 생성/분석 중'}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-2 bg-gray-200 rounded w-full" />
                <div className="h-2 bg-gray-200 rounded w-4/5" />
                <div className="h-2 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-5/6" />
                <div className="h-2 bg-gray-200 rounded w-2/3" />
              </div>
              <div
                className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70 transition-all duration-100"
                style={{ top: `${(scanProgress / 100) * 100 + 10}%`, boxShadow: '0 0 10px rgba(99,102,241,.8)' }}
              />
              <div
                className="absolute left-0 top-0 w-full bg-indigo-100/30 transition-all duration-100"
                style={{ height: `${(scanProgress / 100) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Interview Coach</h1>
          <p className="text-indigo-600 text-lg">{statusText}</p>
        </div>

        {/* 점프 점 + 팁 카드 (유지) */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500 ${
                  animationPhase === i % 4 ? 'animate-bounce scale-125' : 'opacity-50'
                }`}
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-indigo-500 mt-4">AI가 당신의 데이터를 꼼꼼히 분석하고 있습니다</p>
        </div>

        <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start space-x-4 min-h-[80px]">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              {interviewTips[currentTip].icon}
            </div>
            <div className="flex-1 text-left flex flex-col justify-center">
              <h3 className="text-indigo-600 font-semibold text-base mb-2">{interviewTips[currentTip].title}</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{interviewTips[currentTip].message}</p>
            </div>
          </div>
          <div className="flex justify-center space-x-2 mt-6">
            {interviewTips.map((_, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentTip ? 'bg-indigo-500 scale-125' : 'bg-indigo-200'}`} />
            ))}
          </div>
        </div>

        <p className="text-indigo-400 text-sm mt-6">잠시만 기다려주세요. 곧 면접이 시작됩니다.</p>
      </div>
    </div>
  );
};

export default InterviewLoadingPage;
