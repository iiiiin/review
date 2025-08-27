// src/components/results/list/ResultsMainContent.tsx
import Statistics from './Statistics';
import FilteredResults from './FilteredResults';
import type { InterviewResultSummary } from '@/shared/types/result';

interface ResultsMainContentProps {
  results: InterviewResultSummary[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export default function ResultsMainContent({ results, isLoading, error }: ResultsMainContentProps) {
  if (isLoading) {
    return (
      <div className="text-center p-10">
        <p className="text-lg text-gray-600">결과 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 bg-red-50 rounded-lg">
        <p className="text-lg text-red-600">오류가 발생했습니다: {error.message}</p>
      </div>
    );
  }
  
  if (!results || results.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-lg text-gray-600">표시할 면접 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">면접 결과</h1>
            <p className="mt-1 text-sm text-gray-600">
              총 {results.length}개의 면접 결과가 있습니다.
            </p>
          </div>
        </div>
        
        <div className="mb-8">
          <Statistics results={results} />
        </div>

        <FilteredResults results={results} />
      </main>
    </div>
  );
};
