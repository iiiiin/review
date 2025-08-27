'use client';

import Button from '@/shared/components/Button';
import { useSearchParams } from 'react-router-dom';

export default function ResultActions() {
  const [searchParams] = useSearchParams();
  const fromInterview = searchParams.get('fromInterview') === 'true';

  if (fromInterview) {
    return (
      <div className="mt-8 flex justify-center space-x-4">
        <Button variant="outline" onClick={() => {}}>
          재시도하기
        </Button>
        <Button asLink href="/results">
          다음으로 넘어가기
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex justify-center space-x-4">
      <Button asLink href="/results" variant="outline">
        목록으로 돌아가기
      </Button>
    </div>
  );
}

