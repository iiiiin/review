// src/components/results/list/Statistics.tsx
import { useMemo } from 'react';
import Card from '@/shared/components/Card';
import type { InterviewResultSummary } from '@/shared/types/result';

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className="p-4 bg-gray-50 rounded-lg text-center transition-transform transform hover:scale-105">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

interface StatisticsProps {
  results: InterviewResultSummary[];
}

export default function Statistics({ results }: StatisticsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const total = results.length;
    const thisMonth = results.filter(r => {
      const resultDate = new Date(r.createdAt);
      return resultDate.getFullYear() === currentYear && resultDate.getMonth() === currentMonth;
    }).length;
    
    const averageScore = total > 0 
      ? (results.reduce((acc, r) => acc + r.averageScore, 0) / total).toFixed(1)
      : 'N/A';

    return { total, thisMonth, averageScore };
  }, [results]);

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="총 면접" value={stats.total} />
        <StatCard label="이번 달 면접" value={stats.thisMonth} />
      </div>
    </Card>
  );
}
