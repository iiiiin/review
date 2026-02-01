'use client';

import { useInterviewSetupStore } from '@/features/interview/components/setup/../../InterviewSetupStore'
import Button from '@/shared/components/Button';
import DocumentSection from '@/features/interview/components/setup/DocumentSection'

export default function Step3_Upload() {
  const { goToNextStep, resume } = useInterviewSetupStore();
  const isResumeMissing = !resume.file && !resume.uuid;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <div className="space-y-8">
          <DocumentSection
            docType="resume"
            title="지원서 (Resume)"
            description="모의 면접에 사용될 이력서를 업로드하거나 기존 이력서를 선택하세요."
          />
          <DocumentSection
            docType="portfolio"
            title="포트폴리오 (Portfolio)"
            description="포트폴리오를 업로드하거나 기존 포트폴리오를 선택하세요."
          />
          <DocumentSection
            docType="script"
            title="예상 질문 및 답변 스크립트"
            description="스크립트를 업로드하면, 해당 내용 기반으로 질문이 생성됩니다."
          />
        </div>
      </div>
      <div className="flex justify-end items-center mt-10">
        {isResumeMissing && (
          <p className="text-sm text-red-500 mr-4">지원서를 선택해야 다음 단계로 진행할 수 있습니다.</p>
        )}
        <Button onClick={goToNextStep} disabled={isResumeMissing}>
          다음 단계로
        </Button>
      </div>
    </div>
  );
}
