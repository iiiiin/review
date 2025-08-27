'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Play, Clock, Target, Loader } from 'lucide-react';

import { guideSections } from '@/pages/InterviewGuide/interviewGuideSections';
import DeviceTestSection from './DeviceTestSection';
import apiClient from '@/shared/api/client';

// ---------- 공통 유틸 ----------
function unwrap<T = any>(res: any): T {
  return 'data' in res ? res.data : res;
}

const SESSION_STORE_PREFIX = 'REVIEW_SESSION_';

// 질문 생성(직무/인성) 타임아웃 확장 + 1회 재시도
async function generateQuestionsWithRetry(interviewUuid: string) {
  try {
    const r1 = await apiClient.post(
      '/api/interview/generateQuestions',
      { interviewUuid },
      { withCredentials: true, timeout: 60000, headers: { 'Content-Type': 'application/json' } }
    );
    return unwrap(r1);
  } catch (err: any) {
    if (err?.code === 'ECONNABORTED') {
      console.warn('[Question] 1차 타임아웃 → 재시도(90s)…');
      const r2 = await apiClient.post(
        '/api/interview/generateQuestions',
        { interviewUuid },
        { withCredentials: true, timeout: 90000, headers: { 'Content-Type': 'application/json' } }
      );
      return unwrap(r2);
    }
    throw err;
  }
}

// ---------- 세션에 저장할 타입 ----------
interface StoredSessionData {
  // 공통
  interviewUuid: string;
  interviewType: 'JOB' | 'TENACITY' | 'PT';
  recruitUuid?: string;
  resumeUuid?: string;
  portfolioUuid?: string;
  scriptFileUuid?: string;

  // 직무/인성
  interviewSetUuid?: string;
  questions?: any[]; // 서버 응답 원본 보존(세션 페이지에서 가공)

  // PT
  ptInitial: {
    questionUuid?: string;
    title?: string | null;
    situation?: string | null;
  };

  // 부가
  processingTimeMs?: number;
  createdAt: number;
  totalInterviewSets?: number; // 사용자가 설정한 전체 세트 수
}

// ---------- 뷰 ----------
const GuideItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start">
    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
    <span className="text-gray-700">{children}</span>
  </li>
);

const Section = ({ 
  title, 
  children, 
  stepNumber, 
  completed = false, 
  active = false 
}: { 
  title: string; 
  children: React.ReactNode;
  stepNumber?: number;
  completed?: boolean;
  active?: boolean;
}) => (
  <motion.div
    className={`bg-white p-8 rounded-2xl shadow-lg border-2 transition-all duration-300 ${
      active 
        ? 'border-blue-500 shadow-blue-100' 
        : completed 
        ? 'border-blue-600 shadow-blue-100' 
        : 'border-gray-200 hover:border-gray-300'
    }`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center mb-6">
      {stepNumber && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
          completed 
            ? 'bg-blue-600' 
            : active 
            ? 'bg-blue-500' 
            : 'bg-gray-400'
        }`}>
          {stepNumber}
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    </div>
    {children}
  </motion.div>
);

export default function InterviewGuideContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lastInterviewUuid, setLastInterviewUuid] = useState<string | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastStorageKey, setLastStorageKey] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // --- URL 파라미터 수집 ---
  const typeParam = searchParams.get('type') || 'tech';        // 'tech' | 'behavioral' | 'presentation'
  const job = searchParams.get('jobName') || 'N/A';
  const company = searchParams.get('companyName') || 'N/A';
  const count = searchParams.get('count') || '5';

  const recruitUuid = searchParams.get('recruitUuid') || '';
  const resumeUuid = searchParams.get('resumeUuid') || '';
  const portfolioUuid = searchParams.get('portfolioUuid') || '';
  const scriptFileUuid = searchParams.get('scriptFileUuid') || '';

  // 프론트 → 백 타입 매핑
  const map: Record<string, 'JOB' | 'TENACITY' | 'PT'> = {
    tech: 'JOB',
    behavioral: 'TENACITY',
    presentation: 'PT',
    PT: 'PT',
  };
  const backendInterviewType = map[typeParam] || 'JOB';
  const isPT = backendInterviewType === 'PT';
  
  // 화면 표시용 매핑
  const displayMap: Record<string, string> = {
    tech: '직무',
    behavioral: '인성',
    presentation: 'PT',
    PT: 'PT',
  };
  const displayInterviewType = displayMap[typeParam] || typeParam;

  // 초기 유입 파라미터 콘솔 확인
  useEffect(() => {
    console.log('[Guide] Params:', {
      typeParam,
      backendInterviewType,
      job,
      company,
      count,
      recruitUuid,
      resumeUuid,
      portfolioUuid,
      scriptFileUuid,
    });
  }, [typeParam, backendInterviewType, job, company, count, recruitUuid, resumeUuid, portfolioUuid, scriptFileUuid]);

  const handleReadyChange = (ready: boolean) => {
    console.log('[DeviceTest] ready:', ready);
    setIsReady(ready);
  };

  // --- 면접 시작 전체 플로우 ---
  const handleStartInterview = async () => {
    console.log('>>> [Start] 클릭');
    if (!isReady) {
      console.warn('>>> [Start] 장비 미준비 → 중단');
      return;
    }

    setIsStarting(true);

    // payload 구성(있는 값만 포함)
    const payload: Record<string, any> = { interviewType: backendInterviewType };
    if (recruitUuid) payload.recruitUuid = recruitUuid;
    if (resumeUuid) payload.resumeUuid = resumeUuid;
    if (portfolioUuid) payload.portfolioUuid = portfolioUuid;
    if (scriptFileUuid) payload.scriptFileUuid = scriptFileUuid;

    console.log('>>> [Start] payload:', payload);

    try {
      // 1) 시작 호출
      console.log(resumeUuid)
      const startRaw = await apiClient.post('/api/interview/start', payload, { withCredentials: true });
      const start = unwrap(startRaw);
      console.log('>>> [Start] 응답:', start);

      const interviewUuid: string | undefined = start?.result?.interviewUuid;
      if (!interviewUuid) throw new Error('interviewUuid 없음');

      setLastInterviewUuid(interviewUuid);

      // 공통 저장 객체
      const baseSession: StoredSessionData = {
        interviewUuid,
        interviewType: backendInterviewType,
        recruitUuid: recruitUuid || undefined,
        resumeUuid: resumeUuid || undefined,
        portfolioUuid: portfolioUuid || undefined,
        scriptFileUuid: scriptFileUuid || undefined,
        ptInitial: {},
        createdAt: Date.now(),
      };

      if (isPT) {
        // 2-A) PT: start 응답을 questions 배열 형식으로 변환하여 저장
        const ptQuestion = {
          questionUuid: start?.result?.questionUuid,
          title: start?.result?.title,
          situation: start?.result?.situation,
        };
        baseSession.questions = [ptQuestion]; // 배열 형식으로 통일
        // PT도 전체 세트 수(count) 저장
        baseSession.totalInterviewSets = parseInt(count as string, 10) || 1;

        console.log('>>> [PT] 저장 데이터 (배열 형식으로 변환):', baseSession);

        // sessionStorage 저장
        const storageKey = `${SESSION_STORE_PREFIX}${interviewUuid}`;
        sessionStorage.setItem(storageKey, JSON.stringify(baseSession));
        setLastStorageKey(storageKey);
        console.log('>>> [PT] 저장 완료: key =', storageKey);
        
        // 모든 정보 저장 후 카운트다운 시작
        setCountdown(3);

      } else {
        // 2-B) 직무/인성: 첫 번째 질문 세트만 생성 (리트라이 기능을 위해)
        console.log('>>> [Q] generateQuestions 첫 번째 세트 호출:', { interviewUuid });
        const qRes = await generateQuestionsWithRetry(interviewUuid);
        console.log('>>> [Q] 첫 번째 세트 응답:', qRes);

        const interviewSetUuid: string | undefined = qRes?.result?.interviewSetUuid;
        const questions: any[] = qRes?.result?.questions ?? [];
        const processingTimeMs: number | undefined = qRes?.result?.processingTimeMs;

        // 저장 객체 보강
        baseSession.interviewSetUuid = interviewSetUuid;
        baseSession.questions = Array.isArray(questions) ? questions : [questions];
        baseSession.processingTimeMs = processingTimeMs;
        baseSession.totalInterviewSets = parseInt(count as string, 10) || 1;

        // 첫 질문/후속 질문 콘솔 출력
        const first = baseSession.questions[0];
        const firstId = first?.id ?? first?.questionUuid;
        const f1 = first?.followUps?.[0]?.id ?? first?.followUps?.[0]?.questionUuid;
        const f2 = first?.followUps?.[1]?.id ?? first?.followUps?.[1]?.questionUuid;

        console.log('>>> [Q] 첫 번째 세트 정보:');
        console.log('>>> [Q] interviewSetUuid:', interviewSetUuid);
        console.log('>>> [Q] 질문 수:', baseSession.questions.length);
        console.log('>>> [Q] 첫 질문 ID:', firstId);
        console.log('>>> [Q] 후속1:', f1, ' / 후속2:', f2);
        console.log(`>>> [Q] count=${count} - 추가 세트는 StepByStep에서 생성됨`);

        // sessionStorage 저장
        const storageKey = `${SESSION_STORE_PREFIX}${interviewUuid}`;
        sessionStorage.setItem(storageKey, JSON.stringify(baseSession));
        setLastStorageKey(storageKey);

        console.log('>>> [Q] 저장 완료: key =', storageKey);
        
        // 모든 정보 저장 후 카운트다운 시작
        setCountdown(3);
      }
    } catch (e) {
      console.error('XXX [Error] 시작/질문 생성 실패:', e);
      alert('면접 세션 생성에 실패했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  // 카운트다운 종료 → 세션 페이지로 이동
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      // 세션 페이지에서는 storageKey로 sessionStorage에서 로드하여 사용
      const qs =
        `/interview/session?type=${encodeURIComponent(typeParam)}&job=${encodeURIComponent(job)}&company=${encodeURIComponent(company)}&count=${encodeURIComponent(
          count
        )}` + (lastStorageKey ? `&storeKey=${encodeURIComponent(lastStorageKey)}` : '')  + (lastInterviewUuid ? `&interviewUuid=${encodeURIComponent(lastInterviewUuid)}` : '');
      console.log('>>> [Navigate] 이동:', qs);
      navigate(qs);
      return;
    }
    const id = setTimeout(() => setCountdown((v) => (v == null ? null : v - 1)), 1000);
    return () => clearTimeout(id);
  }, [countdown, navigate, typeParam, job, company, count, lastStorageKey, lastInterviewUuid]);

  return (
    <main className="px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">면접 준비</h1>
          <p className="text-lg text-gray-600">최상의 결과를 위해, 시작 전 안내사항을 꼼꼼히 확인해주세요.</p>
        </div>

        {/* Step 1: Guide */}
        <Section 
          title="면접 안내사항" 
          stepNumber={1} 
          completed={true}
        >
          <div className="space-y-6">
            {guideSections.map((section, sectionIndex) => (
              <motion.div 
                key={section.title}
                className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              >
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <section.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  {section.title}
                </h3>
                <ul className="space-y-3 pl-2">
                  {section.items.map((item, index) => (
                    <GuideItem key={index}>{item}</GuideItem>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Step 2: Device Test */}
        <Section 
          title="장비 확인" 
          stepNumber={2} 
          completed={isReady}
          active={!isReady}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">카메라와 마이크 권한을 허용해주세요</span>
              </div>
              {isReady && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  <span className="font-medium">확인 완료</span>
                </div>
              )}
            </div>
            <DeviceTestSection onReadyChange={handleReadyChange} />
          </div>
        </Section>

        {/* Step 3: Start */}
        <Section 
          title="면접 시작" 
          stepNumber={3} 
          completed={false}
          active={isReady}
        >
          <div className="space-y-8">
            {/* 면접 정보 카드 */}
            <motion.div 
              className="bg-gradient-to-br from-white/50 to-white/20 p-1 rounded-2xl shadow-2xl border border-white/30"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">회사</div>
                    <div className="text-lg font-bold text-gray-800">{company}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">직무</div>
                    <div className="text-lg font-bold text-gray-800">{job}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">면접 유형</div>
                    <div className="text-lg font-bold text-blue-600">{displayInterviewType}</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">총 {count}개 질문 • 예상 소요시간: {parseInt(count) * 2}분</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 시작 버튼 영역 */}
            <motion.div 
              className="text-center space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {isReady ? (
                <div className="space-y-4">
                  <motion.button
                    onClick={handleStartInterview}
                    disabled={isStarting}
                    className={`group relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                      isStarting 
                        ? 'bg-blue-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                    }`}
                    whileHover={!isStarting ? { scale: 1.02 } : {}}
                    whileTap={!isStarting ? { scale: 0.98 } : {}}
                  >
                    {isStarting ? (
                      <>
                        <Loader className="mr-3 w-6 h-6 animate-spin" />
                        세션 생성 중...
                      </>
                    ) : (
                      <>
                        <Play className="mr-3 w-6 h-6" />
                        면접 시작하기
                      </>
                    )}
                  </motion.button>
                  
                  {!isStarting && (
                    <motion.div 
                      className="flex items-center justify-center text-blue-600 text-sm font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      모든 준비가 완료되었습니다
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    disabled
                    className="inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-gray-500 bg-gray-200 rounded-lg cursor-not-allowed opacity-75"
                  >
                    <AlertTriangle className="mr-3 w-6 h-6" />
                    장비 확인을 완료해주세요
                  </button>
                  
                  <motion.div 
                    className="flex items-center justify-center text-gray-600 text-sm font-medium bg-gray-50 px-6 py-3 rounded-lg border border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                    위의 장비 확인 단계를 먼저 완료해주세요
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </Section>
      </div>

      {/* Countdown Modal */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center text-white">
            <p className="text-3xl font-semibold mb-4">잠시 후 면접이 시작됩니다.</p>
            <motion.p
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-9xl font-bold"
            >
              {countdown}
            </motion.p>
          </motion.div>
        </div>
      )}
    </main>
  );
}
