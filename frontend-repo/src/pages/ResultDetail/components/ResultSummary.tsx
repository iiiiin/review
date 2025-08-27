// src/components/results/detail/ResultSummary.tsx
import { format, differenceInMinutes } from 'date-fns';
import Card from '@/shared/components/Card';
import type { InterviewResultResponse, PTInterviewResult } from '@/shared/types/result';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

const StatCard = ({ label, value, unit }: StatCardProps) => (
  <Card className="shadow-sm" padding="sm">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-lg font-semibold text-gray-900">
      {value}
      {unit && <span className="text-base font-normal ml-1">{unit}</span>}
    </div>
  </Card>
);

interface ResultSummaryProps {
  result: InterviewResultResponse;
}

// 타입 가드 함수: PT 면접 결과인지 확인
function isPtResult(result: InterviewResultResponse): result is PTInterviewResult {
  return result.interviewType === 'PT';
}

export default function ResultSummary({ result }: ResultSummaryProps) {
  const duration = differenceInMinutes(new Date(result.finishedAt), new Date(result.createdAt));
  const firstQuestionFeedback = result.questions[0]?.feedback || '피드백이 없습니다.';

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {result.enterpriseName} / {result.position}
          </h2>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>{result.interviewType} 면접</span>
            <span>•</span>
            <span>{format(new Date(result.createdAt), 'yyyy년 MM월 dd일 HH:mm')}</span>
          </div>
        </div>
      </div>

      {isPtResult(result) && (
        <div className="mb-6 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">PT 주제: {result.title}</h3>
          <p className="text-gray-600">{result.situation}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard label="소요 시간" value={duration} unit="분" />
        <StatCard label="질문 수" value={result.questions.length} unit="개" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">AI 총평 (첫 질문 기준)</h3>
        <p className="text-gray-600 bg-gray-50 p-4 rounded-md">
          {firstQuestionFeedback}
        </p>
      </div>
    </Card>
  );
}