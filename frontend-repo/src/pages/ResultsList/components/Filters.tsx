// src/components/results/list/Filters.tsx
import React from 'react';
import type { InterviewType } from '@/shared/types/result';

const interviewTypeOptions: InterviewType[] = ['인성', '직무', 'PT'];

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTypes: InterviewType[];
  setSelectedTypes: (types: InterviewType[]) => void;
  onFilterChange: () => void;
}

export default function Filters({
  searchTerm,
  setSearchTerm,
  selectedTypes,
  setSelectedTypes,
  onFilterChange,
}: FiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onFilterChange();
  };

  const handleTypeToggle = (type: InterviewType) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newSelectedTypes);
    onFilterChange();
  };

  const inputStyles = "w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow duration-200 hover:shadow-md";

  return (
    <div className="my-4 space-y-6">
      <div className="grid grid-cols-1">
        <input
          type="text"
          placeholder="기업명, 직무로 검색"
          value={searchTerm}
          onChange={handleSearchChange}
          className={inputStyles}
        />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-600 mr-3">면접 유형:</span>
          {interviewTypeOptions.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                selectedTypes.includes(type)
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {type} 면접
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
