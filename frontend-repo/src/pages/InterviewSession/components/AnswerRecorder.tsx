import { memo } from 'react';
import { motion } from 'framer-motion';
import { Video, Loader, Timer } from 'lucide-react';
import UserVideo from './UserVideo';

interface AnswerRecorderProps {
  publisher: any; // OpenVidu StreamManager type
  subscribers: any[]; // OpenVidu Subscriber type array
  remainingTime: number;
  onNextQuestion: () => void;
  isProcessing: boolean;
}

const AnswerRecorder = memo(function AnswerRecorder({
  publisher,
  subscribers,
  remainingTime,
  onNextQuestion,
  isProcessing
}: AnswerRecorderProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
        {publisher ? (
          <>
            <UserVideo streamManager={publisher} className="w-full h-full" />
            <div className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-lg shadow-lg flex items-center gap-2">
              <Timer className="w-6 h-6" />
              <p className="text-2xl font-mono font-bold">
                {formatTime(remainingTime)}
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 right-4"
            >
              <button
                onClick={onNextQuestion}
                disabled={isProcessing}
                className="bg-blue-600 text-white h-14 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-gray-500 shadow-lg"
              >
                {isProcessing ? (
                  <Loader className="animate-spin mr-2" />
                ) : (
                  <Video className="mr-2" />
                )}
                다음으로
              </button>
            </motion.div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>카메라 초기화 중...</p>
            </div>
          </div>
        )}
        {subscribers.map((sub) => (
          <div key={sub.stream.streamId} className="hidden">
            <UserVideo streamManager={sub} />
          </div>
        ))}
      </div>
    </div>
  );
});

export default AnswerRecorder;