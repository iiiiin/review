import { useEffect, useRef } from 'react';
import type { StreamManager } from 'openvidu-browser';

interface Props {
  streamManager: StreamManager;
  className?: string; 
}

export default function UserVideo({ streamManager, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (streamManager && videoRef.current) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);

  return (
    <div className="relative w-full h-full">
      {/* 2️⃣ className 전달 → Tailwind object-cover 등 적용 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline    // 모바일(iOS, 사파리 대응)
        muted          // 본인 카메라 미리보기는 음소거 처리!
        className={`w-full h-full rounded scale-x-[-1] ${className ?? ''}`}
      />
    </div>
  );
}
