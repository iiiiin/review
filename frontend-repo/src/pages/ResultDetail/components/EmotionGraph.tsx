import { FiBarChart2 } from 'react-icons/fi';

// Chart.js와 같은 라이브러리를 사용하면 더 동적인 그래프를 만들 수 있습니다.
// 여기서는 간단한 SVG로 구현합니다.

interface EmotionData {
  labels: string[];
  data: number[];
}

interface EmotionGraphProps {
  emotionAnalysis: EmotionData;
}

export default function EmotionGraph({ emotionAnalysis }: EmotionGraphProps) {
  // emotionAnalysis가 undefined일 경우를 대비하여 기본값 설정
  const { labels = [], data = [] } = emotionAnalysis || {};
  const width = 300;
  const height = 150;
  const padding = 20;

  const toPathString = (points: number[]) => {
    if (!points || points.length === 0) return "";
    const step = (width - padding * 2) / (points.length - 1 || 1);
    return points
      .map((p, i) => {
        const x = padding + i * step;
        const y = height - padding - (p / 100) * (height - padding * 2);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  // 데이터가 단 하나일 경우 점으로 표시하기 위한 처리
  const toCircleProps = (points: number[]) => {
    if (!points || points.length !== 1) return null;
    const x = padding;
    const y = height - padding - (points[0] / 100) * (height - padding * 2);
    return { cx: x, cy: y, r: 2 };
  };

  const pathData = data.length > 1 ? toPathString(data) : '';
  const circleProps = toCircleProps(data);

  return (
    <div>
      <h5 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
        <FiBarChart2 className="mr-2 text-gray-600" />
        답변 중 감정 변화
      </h5>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="relative h-48 bg-white rounded border">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Y축 그리드 라인 */}
            {[0, 25, 50, 75, 100].map(val => (
              <g key={val}>
                <text x="5" y={height - padding - (val / 100) * (height - padding * 2) + 3} fontSize="8" fill="#9ca3af">{val}%</text>
                <line x1={padding} y1={height - padding - (val / 100) * (height - padding * 2)} x2={width - padding} y2={height - padding - (val / 100) * (height - padding * 2)} stroke="#e5e7eb" strokeWidth="0.5" />
              </g>
            ))}
            {/* X축 레이블 */}
            {labels.map((label: string, i: number) => (
               <text key={i} x={padding + i * ((width - padding*2) / (labels.length - 1 || 1))} y={height - 5} fontSize="8" fill="#9ca3af" textAnchor="middle">{label}</text>
            ))}
            
            {/* 데이터 라인 또는 점 */}
            {pathData && <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="1.5" />}
            {circleProps && <circle {...circleProps} fill="#3b82f6" />}
          </svg>
        </div>
        <div className="flex justify-center space-x-4 text-xs mt-2">
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1.5"></div><span>긍정 감정</span></div>
        </div>
      </div>
    </div>
  );
}