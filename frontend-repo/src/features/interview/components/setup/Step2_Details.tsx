'use client';

import { useQuery } from '@tanstack/react-query';
import { useInterviewSetupStore } from '@/features/interview/components/setup/../../InterviewSetupStore'
import Button from '@/shared/components/Button';
import SearchableDropdown from '@/shared/components/SearchableDropdown';
import { getCompaniesAPI, getJobsByCompanyAPI } from '@/shared/api/companies';

export default function Step2_Details() {
  const company = useInterviewSetupStore((state) => state.company);
  const job = useInterviewSetupStore((state) => state.job);
  const setCompany = useInterviewSetupStore((state) => state.setCompany);
  const setJob = useInterviewSetupStore((state) => state.setJob);
  const goToNextStep = useInterviewSetupStore((state) => state.goToNextStep);

  // 회사 목록을 가져오는 쿼리
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompaniesAPI,
  });

  // 선택된 회사의 ID 찾기
  const selectedCompany = companies.find(c => c.name === company.name);
  const selectedCompanyId = selectedCompany?.id;

  // 선택된 회사의 직무 목록을 가져오는 쿼리
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['jobs', selectedCompanyId],
    queryFn: () => getJobsByCompanyAPI(selectedCompanyId!),
    enabled: !!selectedCompanyId, // 회사가 선택되었을 때만 실행
  });

  const isReadyForNext = !!(company.uuid && job.uuid);
  const isLoading = companiesLoading || (selectedCompanyId && jobsLoading);
  const hasError = companiesError || jobsError;

  // 회사 이름만 추출하여 드롭다운에 전달
  const companyNames = companies.map(c => c.name);
  // 직무 이름만 추출하여 드롭다운에 전달
  const jobNames = jobs.map(j => j.name);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-800 mb-2">상세 정보</h2>
          <p className="text-gray-600 mb-6">지원하시는 기업과 직무를 선택해주세요.</p>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-800 mb-2">상세 정보</h2>
          <p className="text-gray-600 mb-6">지원하시는 기업과 직무를 선택해주세요.</p>
          <div className="text-center p-8">
            <p className="text-red-500 mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <h2 className="text-xl font-bold text-gray-800 mb-2">상세 정보</h2>
        <p className="text-gray-600 mb-6">지원하시는 기업과 직무를 선택해주세요.</p>
        <div className="space-y-6">
          <SearchableDropdown
            label="기업"
            placeholder="지원하는 기업을 선택하세요"
            options={companyNames}
            value={company.name}
            onChange={(selectedCompanyName) => {
              const selectedCompany = companies.find(c => c.name === selectedCompanyName);
              if (selectedCompany) {
                setCompany({ uuid: selectedCompany.id, name: selectedCompany.name });
              } else {
                setCompany({ uuid: '', name: '' });
              }
            }}
            required
          />
          <SearchableDropdown
            label="직무"
            placeholder={company.uuid ? "지원하는 직무를 선택하세요" : "먼저 기업을 선택해주세요"}
            options={jobNames}
            value={job.name}
            onChange={(selectedJobName) => {
              const selectedJob = jobs.find(j => j.name === selectedJobName);
              if (selectedJob) {
                setJob({ uuid: selectedJob.id, name: selectedJob.name });
              } else {
                setJob({ uuid: '', name: '' });
              }
            }}
            required
            disabled={!company.uuid}
          />
        </div>
      </div>
      <div className="flex justify-end mt-10">
        <Button onClick={goToNextStep} disabled={!isReadyForNext}>
          다음 단계로
        </Button>
      </div>
    </div>
  );
}
