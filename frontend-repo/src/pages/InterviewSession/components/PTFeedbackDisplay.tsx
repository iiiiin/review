// src/components/interview/session/PTFeedbackDisplay.tsx
import { useNavigate } from 'react-router-dom';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { FiAward, FiMessageSquare } from 'react-icons/fi';

// PT 면접 결과 목업 데이터 (추후 API로부터 받아옴)
const mockPTFeedback = {
  overallScore: 88,
  feedback: "문제의 핵심 요구사항을 정확히 파악하고, MSA의 장단점을 명확하게 설명한 점이 돋보입니다. 다만, 비용 측면에서의 고려사항을 조금 더 구체적으로 제시했다면 더 완벽한 답변이 되었을 것입니다.",
  whiteboardSnapshotUrl: "https://via.placeholder.com/800x450.png?text=Whiteboard+Snapshot",
};

export default function PTFeedbackDisplay() {
  const navigate = useNavigate();

  const handleFinish = () => {
    // 실제로는 결과 ID 등을 함께 전달해야 할 수 있습니다.
    navigate('/results');
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-gray-800 text-white">
      <h1 className="text-2xl font-bold text-center mb-4">PT 면접 결과 분석</h1>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Whiteboard Snapshot */}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold mb-2">화이트보드 기록</h2>
          <Card className="flex-grow bg-gray-700 border-gray-600">
            <img 
              src={mockPTFeedback.whiteboardSnapshotUrl} 
              alt="Whiteboard Snapshot"
              className="w-full h-full object-contain rounded"
            />
          </Card>
        </div>

        {/* Right: Feedback */}
        <div className="flex flex-col space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center"><FiAward className="mr-2"/>종합 평가</h2>
            <Card className="bg-gray-700 border-gray-600">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-5xl font-bold text-blue-400">{mockPTFeedback.overallScore}</span>
                <span className="text-gray-300">/ 100점</span>
              </div>
            </Card>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center"><FiMessageSquare className="mr-2"/>AI 총평</h2>
            <Card className="bg-gray-700 border-gray-600">
              <p className="text-gray-300">{mockPTFeedback.feedback}</p>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex justify-center space-x-4 pt-4">
        <Button variant="outline" onClick={() => window.location.reload()}>다시하기</Button>
        <Button onClick={handleFinish}>결과 목록으로 이동</Button>
      </div>
    </div>
  );
}
