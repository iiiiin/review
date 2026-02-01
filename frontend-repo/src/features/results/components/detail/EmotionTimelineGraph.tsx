import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartEvent, ActiveElement } from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface Expression {
  second: number;
  expression: string;
}

interface EmotionTimelineGraphProps {
  expressions: Expression[];
  currentTime: number;
  isPlaying: boolean;
  animateEmotions: boolean;
  onTimeClick?: (time: number) => void;
}

export default function EmotionTimelineGraph({
  expressions,
  currentTime,
  // isPlaying,
  // animateEmotions,
  onTimeClick
}: EmotionTimelineGraphProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [chartData, setChartData] = useState<any>(null);

  // 감정을 점수로 변환하는 함수 - 단순화된 3단계 분류
  const getEmotionScore = (emotion: string): number => {
    const emotionLower = emotion.toLowerCase();
    
    // 긍정 감정
    if (['happy', '기쁨', '자신감', 'surprise', '놀람', 'joy', 'confident'].includes(emotionLower)) {
      return 0.5;
    }
    
    // 부정 감정
    if (['angry', '화남', 'disgust', '혐오', 'worried', 'fear', '두려움'].includes(emotionLower)) {
      return -0.5;
    }
    
    // 중립 감정 (기본값)
    return 0;
  };

  // 데이터 처리 및 차트 데이터 생성
  useEffect(() => {
    try {
      if (!expressions || expressions.length === 0) {
        setChartData(null);
        return;
      }

    // 시간순으로 정렬
    const sortedExpressions = [...expressions].sort((a, b) => a.second - b.second);
    
    // 데이터 포인트 생성 (시작점과 끝점 포함)
    const dataPoints = [{ time: 0, score: 0 }]; // 시작점
    
    sortedExpressions.forEach(expr => {
      if (typeof expr.second === 'number' && expr.expression) {
        dataPoints.push({
          time: expr.second,
          score: getEmotionScore(expr.expression)
        });
      }
    });

    // 끝점 추가 (마지막 감정 유지)
    const maxTime = Math.max(...sortedExpressions.map(e => e.second), currentTime);
    if (dataPoints.length > 1) {
      dataPoints.push({
        time: maxTime,
        score: dataPoints[dataPoints.length - 1].score
      });
    }

    // X축을 실제 시간 값으로 설정
    const chartPoints = dataPoints.map(point => ({
      x: point.time,
      y: point.score
    }));

    setChartData({
      datasets: [
        {
          label: '표정 분석',
          data: chartPoints,
          borderColor: (context: any) => {
            const value = context.parsed?.y ?? 0;
            if (value > 0) return '#4f46e5'; // 긍정 - 인디고
            if (value < 0) return '#ef4444'; // 부정 - 빨강
            return '#9ca3af'; // 중립 - 회색
          },
          backgroundColor: 'transparent',
          pointRadius: 0,
          pointHoverRadius: 0,
          pointBorderWidth: 0,
          pointBackgroundColor: 'transparent',
          borderWidth: 3,
          tension: 0.4,
          fill: false
        }
      ]
    });
    } catch (error) {
      console.error('EmotionTimelineGraph 데이터 처리 오류:', error);
      setChartData(null);
    }
  }, [expressions]);
  
  // currentTime이 변경될 때마다 차트 업데이트
  useEffect(() => {
    if (chartRef.current && chartData) {
      // 애니메이션 없이 즉시 업데이트
      chartRef.current.update('none');
    }
  }, [currentTime, chartData]);

  // 차트 옵션
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // 모든 애니메이션 비활성화
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const score = context.parsed.y;
            let emotionText = '중립';
            if (score > 0) emotionText = '긍정';
            else if (score < 0) emotionText = '부정';
            
            return `${emotionText}`;
          }
        }
      },
      annotation: {
        annotations: {
          currentTimePointer: {
            type: 'line' as const,
            xMin: currentTime,
            xMax: currentTime,
            borderColor: '#4f46e5',
            borderWidth: 3,
            label: {
              display: true,
              content: `${Math.floor(currentTime)}s`,
              position: 'start' as const,
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              font: {
                size: 11,
                weight: 'bold' as const
              },
              borderRadius: 4,
              padding: 6
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        min: 0,
        max: (() => {
          try {
            const times = chartData?.datasets?.[0]?.data?.map((p: any) => p.x) || [1];
            return Math.max(...times.filter((t: any) => typeof t === 'number'), currentTime, 1);
          } catch {
            return Math.max(currentTime, 1);
          }
        })(),
        title: {
          display: true,
          text: '시간',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return `${Math.floor(Number(value))}s`;
          }
        }
      },
      y: {
        min: -1,
        max: 1,
        title: {
          display: false
        },
        grid: {
          color: (context: any) => {
            const value = context.tick.value;
            if (value === 0) return '#9ca3af'; // 중립선 강조
            return '#e5e7eb';
          },
          lineWidth: (context: any) => {
            return context.tick.value === 0 ? 2 : 1;
          }
        },
        ticks: {
          display: true,
          stepSize: 0.5,
          color: (context: any) => {
            const value = Number(context.tick.value);
            if (value === 0.5) return '#3b82f6'; // 긍정 - 파랑
            if (value === 0) return '#000000'; // 중립 - 검정
            if (value === -0.5) return '#ef4444'; // 부정 - 빨강
            return '#6b7280';
          },
          font: {
            size: 11,
            weight: 'bold' as const
          },
          callback: function(value: any) {
            const numValue = Number(value);
            if (numValue === 0.5) return '긍정';
            if (numValue === 0) return '중립';
            if (numValue === -0.5) return '부정';
            return '';
          }
        }
      }
    },
    onClick: (event: ChartEvent, _elements: ActiveElement[]) => {
      if (onTimeClick && chartRef.current && event.native) {
        try {
          const chart = chartRef.current;
          const canvasElement = chart.canvas;
          const rect = canvasElement.getBoundingClientRect();
          const x = (event.native as MouseEvent).clientX - rect.left;
          
          const dataX = chart.scales.x.getValueForPixel(x);
          
          if (typeof dataX === 'number' && dataX >= 0) {
            try {
              const times = chartData?.datasets?.[0]?.data?.map((p: any) => p.x) || [1];
              const maxTime = Math.max(...times.filter((t: any) => typeof t === 'number'), 1);
              const timeValue = Math.max(0, Math.min(dataX, maxTime));
              onTimeClick(timeValue);
            } catch {
              onTimeClick(Math.max(0, dataX));
            }
          }
        } catch (error) {
          console.warn('그래프 클릭 이벤트 처리 중 오류:', error);
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  if (!chartData) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">표정 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 mb-3">표정 분석 그래프</h4>
      
      {/* 차트 컨테이너 */}
      <div className="h-64 bg-gradient-to-b from-indigo-50 via-gray-50 to-red-50 rounded-lg p-4">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      {onTimeClick && (
        <p className="text-xs text-gray-500 text-center mt-6">
          💡 그래프를 클릭하면 해당 시점으로 이동합니다
        </p>
      )}
    </div>
  );
}