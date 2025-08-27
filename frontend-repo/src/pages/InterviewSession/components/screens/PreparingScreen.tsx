import React from 'react';
import { motion } from 'framer-motion';
import { Video, Loader } from 'lucide-react';
import Button from '@/shared/components/Button';
import type { ExpandedQ } from '../../types';

export interface PreparingScreenProps {
  currentQuestion: ExpandedQ;
  currentQuestionIndex: number;
  step: 'preparing' | 'waiting_recording';
  session: any;
  publisher: any;
  isRecordingStarting: boolean;
  onStartRecording: () => void;
}

export const PreparingScreen: React.FC<PreparingScreenProps> = ({
  currentQuestion,
  currentQuestionIndex,
  step,
  session,
  publisher,
  isRecordingStarting,
  onStartRecording,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl max-w-3xl w-full"
      >
        <h2 className="text-sm font-semibold text-blue-600 mb-2">
          {currentQuestion.kind === 'main' 
            ? `질문 ${currentQuestionIndex + 1}` 
            : `꼬리 질문 ${currentQuestion.followIndex}`
          }
        </h2>
        <p className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
          {currentQuestion.question}
        </p>
        
        {/* 시작 버튼 또는 녹화 대기 안내 */}
        {step === 'preparing' ? (
          <Button 
            onClick={onStartRecording}
            size="lg"
            disabled={isRecordingStarting}
          >
            <Video className="mr-2" />
            답변 시작
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center justify-center mb-2">
              <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-blue-700 font-medium">녹화 시작 중...</span>
            </div>
            <p className="text-sm text-blue-600">
              녹화가 시작될 때까지 잠시만 기다려주세요
            </p>
            <div className="mt-2 text-xs text-blue-500">
              {session ? '✓ 세션 연결됨' : '○ 세션 연결 중...'} • {publisher ? '✓ 카메라 준비됨' : '○ 카메라 준비 중...'}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};