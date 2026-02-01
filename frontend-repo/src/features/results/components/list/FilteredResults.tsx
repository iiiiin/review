// src/components/results/list/FilteredResults.tsx
'use client';

import { useState, useMemo } from 'react';
import Card from '@/shared/components/Card';
import Filters from './Filters';
import ResultsList from './ResultsList';
import type { InterviewResultSummary, InterviewType } from '@/shared/types/result';

const ITEMS_PER_PAGE = 6;

interface FilteredResultsProps {
  results: InterviewResultSummary[];
}

export default function FilteredResults({ results }: FilteredResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<InterviewType[]>([]);

  const filteredResults = useMemo(() => {
    return results
      .filter(result => {
        if (searchTerm === '') return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          (result.title && result.title.toLowerCase().includes(searchLower)) ||
          result.enterpriseName.toLowerCase().includes(searchLower) ||
          result.position.toLowerCase().includes(searchLower)
        );
      })
      .filter(result => 
        selectedTypes.length === 0 || selectedTypes.includes(result.interviewType)
      );
  }, [results, searchTerm, selectedTypes]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const currentResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">면접 결과 검색</h2>
        <Filters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          onFilterChange={() => setCurrentPage(1)} // 필터 변경 시 1페이지로 리셋
        />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">결과 목록 ({filteredResults.length}개)</h2>
        <ResultsList 
          results={currentResults}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>
    </>
  );
}
