// src/components/results/ResultDetailSkeleton.tsx
import Card from '@/shared/components/Card';

const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export default function ResultDetailSkeleton() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <SkeletonBox className="h-8 w-3/4 mb-2" />
      <SkeletonBox className="h-6 w-1/2 mb-8" />
      
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <SkeletonBox className="h-7 w-64 mb-2" />
            <SkeletonBox className="h-5 w-80" />
          </div>
          <div className="text-right">
            <SkeletonBox className="h-5 w-20 mb-1" />
            <SkeletonBox className="h-10 w-24" />
          </div>
        </div>
        <div>
          <SkeletonBox className="h-6 w-32 mb-2" />
          <SkeletonBox className="h-20 w-full" />
        </div>
      </Card>

      <div className="space-y-4 mt-8">
        <SkeletonBox className="h-8 w-1/3 mb-4" />
        {[...Array(2)].map((_, i) => (
          <Card key={i} padding="none" className="overflow-hidden">
            <div className="p-4 flex justify-between items-center">
              <SkeletonBox className="h-6 w-3/5" />
              <SkeletonBox className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
