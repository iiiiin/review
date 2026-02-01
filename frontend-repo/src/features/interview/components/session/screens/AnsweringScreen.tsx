import React from 'react';
import { motion } from 'framer-motion';
import { Timer, Video, Loader } from 'lucide-react';
import UserVideo from '@/features/interview/components/session/UserVideo';
import type { ExpandedQ } from '@/features/interview/types';

export interface AnsweringScreenProps {
  currentQuestion: ExpandedQ;
  currentQuestionIndex: number;
  totalQuestions: number;
  remainingTime: number;
  publisher: any;
  subscribers: any[];
  isLastQuestion: boolean;
  isStoppingRecording: boolean;
  onNextQuestion: () => void;
}

export const AnsweringScreen: React.FC<AnsweringScreenProps> = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  remainingTime,
  publisher,
  subscribers,
  isLastQuestion,
  isStoppingRecording,
  onNextQuestion,
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8">
      {/* 상단 질문 바 - 글래스 효과 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mb-6 bg-blue-50/90 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-blue-200/50"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-blue-600">
            {currentQuestion.kind === 'main' 
              ? `질문 ${currentQuestionIndex + 1}` 
              : `꼬리 질문 ${currentQuestion.followIndex}`
            }
          </span>
          <span className="text-sm font-medium text-blue-600">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <p className="text-lg font-bold text-gray-800 leading-relaxed">
          {currentQuestion.question}
        </p>
      </motion.div>

      {/* 메인 카메라 화면 - 70% 크기, 뷰파인더 스타일 */}
      <div className="relative w-full max-w-4xl" style={{width: '70%'}}>
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300">
          {publisher ? (
            <>
              <UserVideo streamManager={publisher} className="w-full h-full object-cover" />
              
              {/* 뷰파인더 모서리 프레임 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/80"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/80"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/80"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/80"></div>
              </div>

              {/* REC 표시 - 좌상단 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-2 h-2 bg-red-500 rounded-full"
                  />
                  <span className="text-sm font-bold">REC</span>
                </div>
              </motion.div>

              {/* 타이머 - 우상단 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span className="text-xl font-mono font-bold">
                    {formatTime(remainingTime)}
                  </span>
                </div>
              </motion.div>

              {/* 다음 버튼 - 우하단 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 right-4"
              >
                <button
                  onClick={onNextQuestion}
                  disabled={isStoppingRecording}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white h-12 px-6 rounded-lg text-base font-semibold transition-colors flex items-center justify-center shadow-lg"
                >
                  {isStoppingRecording ? (
                    <Loader className="animate-spin mr-2 w-4 h-4" />
                  ) : (
                    <Video className="mr-2 w-4 h-4" />
                  )}
                  {isLastQuestion ? '완료' : '다음'}
                </button>
              </motion.div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
                />
                <p className="text-base">카메라 초기화 중...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 숨겨진 구독자 비디오 */}
      {subscribers.map((sub: any) => (
        <div key={sub.stream.streamId} className="hidden">
          <UserVideo streamManager={sub} />
        </div>
      ))}
    </div>
  );
};
