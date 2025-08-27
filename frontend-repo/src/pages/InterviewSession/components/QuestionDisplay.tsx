import { memo } from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import Button from '@/shared/components/Button';

interface Question {
  id?: string | number;
  question: string;
  kind: 'main' | 'follow';
  parentId?: string | number;
  followIndex?: number;
}

interface QuestionDisplayProps {
  question: Question;
  currentQuestionIndex: number;
  onStartAnswering: () => void;
}

const QuestionDisplay = memo(function QuestionDisplay({ 
  question, 
  currentQuestionIndex, 
  onStartAnswering 
}: QuestionDisplayProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
      <motion.div
        key={`${currentQuestionIndex}-${question.id}`} // 질문 ID도 포함하여 고유성 보장
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl max-w-3xl w-full"
      >
        <h2 className="text-sm font-semibold text-blue-600 mb-2">
          {question.kind === 'main' 
            ? `질문 ${currentQuestionIndex + 1}` 
            : `꼬리 질문 ${question.followIndex}`
          }
        </h2>
        <p className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
          {question.question}
        </p>
        <Button onClick={onStartAnswering} size="lg">
          <Video className="mr-2" />
          답변 시작
        </Button>
      </motion.div>
    </div>
  );
});

export default QuestionDisplay;