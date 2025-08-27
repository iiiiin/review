'use client';

import { useState, useRef, useEffect } from 'react';

interface DeviceTestSectionProps {
  onReadyChange: (isReady: boolean) => void;
}

export default function DeviceTestSection({ onReadyChange }: DeviceTestSectionProps) {
  const [camError, setCamError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const setupDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCamError(null);

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;
        analyser.fftSize = 32;
        source.connect(analyser);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          animationFrameIdRef.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = dataArray[i];
              
              const r = barHeight + 25 * (i/bufferLength);
              const g = 250 * (i/bufferLength);
              const b = 50;

              canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
              canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

              x += barWidth + 1;
            }
          }
        };
        
        draw();
        setMicError(null);
        onReadyChange(true);

      } catch (err) {
        let camMessage = "카메라 접근이 차단되었거나 장치를 찾을 수 없습니다.";
        let micMessage = "마이크 접근이 차단되었거나 장치를 찾을 수 없습니다.";

        if (err instanceof Error) {
            if (err.name === 'NotFoundError') {
                camMessage = "카메라를 찾을 수 없습니다. 연결을 확인해주세요.";
                micMessage = "마이크를 찾을 수 없습니다. 연결을 확인해주세요.";
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                camMessage = "카메라 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.";
                micMessage = "마이크 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.";
            }
        }
        setCamError(camMessage);
        setMicError(micMessage);
        onReadyChange(false);
      }
    };

    setupDevices();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onReadyChange]);

  return (
    <div className="w-full bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              camError ? 'bg-red-500 animate-pulse' : 'bg-green-500'
            }`}></div>
            <h3 className="text-xl font-bold text-gray-800">카메라 확인</h3>
          </div>
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border-4 border-white">
            {camError 
              ? <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-6 text-center">
                  <div className="text-4xl mb-3">📹</div>
                  <div className="text-sm leading-relaxed">{camError}</div>
                </div>
              : <video ref={videoRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1]"></video>
            }
          </div>
          {!camError && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              카메라 연결 완료
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              micError ? 'bg-red-500 animate-pulse' : 'bg-green-500'
            }`}></div>
            <h3 className="text-xl font-bold text-gray-800">마이크 확인</h3>
          </div>
          <div className="w-full aspect-video bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-lg border-4 border-white flex items-center justify-center relative">
            {micError 
              ? <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-6 text-center">
                  <div className="text-4xl mb-3">🎤</div>
                  <div className="text-sm leading-relaxed">{micError}</div>
                </div>
              : <>
                  <canvas ref={canvasRef} className="w-full h-32"></canvas>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">소리 입력 감지 중</span>
                    </div>
                  </div>
                </>
            }
          </div>
          {!micError ? (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              마이크 연결 완료
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center max-w-xs">
              마이크에 소리가 입력되면 상단 그래프가 움직입니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}