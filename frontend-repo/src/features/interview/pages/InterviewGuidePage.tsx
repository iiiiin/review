'use client';

import InterviewGuideContent from '@/features/interview/components/guide/InterviewGuideContent';
import Header from '@/shared/layout/Header';

export default function InterviewGuidePage() {
  return (
    <div className="min-h-screen w-full animated-gradient-bg">
      <Header />
      <InterviewGuideContent />
    </div>
  );
}
