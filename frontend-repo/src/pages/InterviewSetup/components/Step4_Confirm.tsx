// src/pages/InterviewSetup/components/Step4_Confirm.tsx
'use client';

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInterviewSetupStore } from '../InterviewSetupStore';
import Button from '@/shared/components/Button';
import { Clock } from 'lucide-react';
import InfoItem from './InfoItem'; // InfoItem 컴포넌트를 import
import * as DocumentsAPI from '@/shared/api/documents';

export default function Step4_Confirm() {
  const navigate = useNavigate();
  const {
    interviewType,
    company,
    job,
    resume,
    portfolio,
    script,
    questionCount,
    setQuestionCount,
    uploadInterviewFiles,
  } = useInterviewSetupStore();

  // 기존 파일 목록 조회
  const { data: documents } = useQuery({
    queryKey: ['userDocuments'],
    queryFn: DocumentsAPI.getUserDocumentsAPI,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const interviewTypeMap: { [key: string]: string } = {
    'behavioral': '인성 면접',
    'tech': '직무 면접',
    'presentation': 'PT 면접',
  };
  const displayInterviewType = interviewTypeMap[interviewType] || interviewType;

  // PT면접: 질문당 15분, 최대 3개 / 나머지: 4분, 최대 5개
  const isPT = interviewType === 'presentation';
  const timePerQuestion = isPT ? 15 : 4;
  const maxQuestionCount = isPT ? 3 : 5;
  const minQuestionCount = 1

  // 질문 개수 slider가 최대값을 넘지 않게 보정
  const safeQuestionCount = Math.max(minQuestionCount, Math.min(questionCount, maxQuestionCount));

  // 예상 소요 시간 계산
  const estimatedTime = useMemo(() => {
    return safeQuestionCount * timePerQuestion;
  }, [safeQuestionCount, timePerQuestion]);

  const handleStartInterview = async () => {
    try {
      // 1. 새로운 파일이 있다면 업로드하고 UUID를 스토어에 업데이트
      await uploadInterviewFiles();
      
      // 2. 업로드 후의 최신 상태를 스토어에서 다시 가져옴
      const latestState = useInterviewSetupStore.getState();
      
      // 3. URL 쿼리 파라미터 구성
      const params = new URLSearchParams();
      params.set('type', latestState.interviewType);
      // 객체가 아닌, 이름과 uuid를 각각 전달
      params.set('jobName', latestState.job.name);
      params.set('companyName', latestState.company.name);
      params.set('recruitUuid', latestState.job.uuid);
      params.set('count', String(Math.min(latestState.questionCount, maxQuestionCount)));
      
      console.log('Resume state:', latestState.resume);
      if (latestState.resume.uuid) params.set('resumeUuid', latestState.resume.uuid);
      if (latestState.portfolio.uuid) params.set('portfolioUuid', latestState.portfolio.uuid);
      if (latestState.script.uuid) params.set('scriptFileUuid', latestState.script.uuid);

      // 4. 다음 페이지로 이동
      navigate(`/interview/guide?${params.toString()}`);

    } catch (error) {
      console.error('면접 시작 프로세스 중 오류 발생:', error);
      alert('파일 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const getFileName = (docState: { file: File | null, uuid: string | null }): string | null => {
    if (docState.file) return docState.file.name;
    if (docState.uuid) {
      const selectedDoc = documents?.find(d => d.fileUuid === docState.uuid);
      if (selectedDoc) {
        return `${selectedDoc.company} / ${selectedDoc.job}.pdf`;
      }
      return `기존 파일 (${docState.uuid.substring(0, 8)}...)`;
    }
    return '없음';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <h2 className="text-xl font-bold text-gray-800 mb-2">최종 확인</h2>
        <p className="text-gray-600 mb-6">설정하신 내용을 확인하고 면접을 시작하세요.</p>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">선택 정보</h3>
            <div className="p-4 border rounded-lg bg-gray-50/80">
              <dl>
                <InfoItem label="면접 유형" value={displayInterviewType} />
                <InfoItem label="기업" value={company.name || '미선택'} />
                <InfoItem label="직무" value={job.name || '미선택'} />
                <InfoItem label="지원서" value={getFileName(resume)} />
                <InfoItem label="포트폴리오" value={getFileName(portfolio)} />
                <InfoItem label="답변 스크립트" value={getFileName(script)} />
              </dl>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">질문 개수</h3>
            <div className="p-4 border rounded-lg bg-gray-50/80">
              <div className="flex items-center justify-center space-x-4 mb-2">
                <span className="text-2xl font-bold text-blue-600">{safeQuestionCount}개</span>
              </div>
              <input
                type="range"
                min="1"
                max={maxQuestionCount}
                value={safeQuestionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span>1</span>
                <span>{maxQuestionCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end mt-10">
        <Button onClick={handleStartInterview} size="lg" className="mb-2">
          면접 시작하기
        </Button>
        <div className="flex items-center text-sm text-gray-600 font-semibold">
          <Clock className="w-4 h-4 mr-2" />
          <span>예상 소요 시간: 약 {estimatedTime}분</span>
        </div>
      </div>
    </div>
  );
}
