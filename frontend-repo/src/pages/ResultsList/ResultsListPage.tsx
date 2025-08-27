// src/pages/ResultsListPage.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import ResultsMainContent from '@/pages/ResultsList/components/ResultsMainContent';
import { getResultsAPI } from '@/shared/api/results';
import type { InterviewResultSummary } from '@/shared/types/result';

export default function ResultsListPage() {
  const { data: results, isLoading, error } = useQuery<InterviewResultSummary[]>({
    queryKey: ['results'],
    queryFn: getResultsAPI,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <ResultsMainContent 
          results={results}
          isLoading={isLoading}
          error={error}
        />
      </main>
      <Footer />
    </div>
  );
}
