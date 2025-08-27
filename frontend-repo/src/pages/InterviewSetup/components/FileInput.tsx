// src/pages/InterviewSetup/components/FileInput.tsx
'use client';

import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Check } from 'lucide-react';

interface FileInputProps {
  label: string;
  file: File | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  accept: string;
}

const FileInput = ({ label, file, onFileChange, onFileRemove, accept }: FileInputProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 유효성 검사
  const validateFile = (file: File): string | null => {
    // 파일 크기 검사 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return '파일 크기는 10MB를 초과할 수 없습니다.';
    }

    // 파일 형식 검사
    const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        // 확장자 검사
        return fileName.endsWith(type);
      } else {
        // MIME 타입 검사
        return fileType === type || fileType.startsWith(type.replace('/*', ''));
      }
    });

    if (!isValidType) {
      return `지원되지 않는 파일 형식입니다. (지원 형식: ${accept})`;
    }

    return null;
  };

  // 파일 처리 공통 로직
  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 파일 선택 이벤트 시뮬레이션
    const syntheticEvent = {
      target: {
        files: [selectedFile]
      }
    } as unknown as ChangeEvent<HTMLInputElement>;
    
    onFileChange(syntheticEvent);
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // 실제로 영역을 벗어났는지 확인
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  // 클릭 이벤트 핸들러
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    setError(null);
    onFileRemove();
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
      
      <div
        className={`
          relative p-4 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : error 
              ? 'border-red-300 bg-red-50' 
              : file 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!file ? handleClick : undefined}
      >
        {/* 드래그 오버레이 */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
            <div className="text-blue-600 font-medium">
              파일을 여기에 놓으세요
            </div>
          </div>
        )}

        {!file ? (
          // 파일이 선택되지 않은 상태
          <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
            <UploadCloud className={`w-8 h-8 mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <div className="space-y-1">
              <p className={`text-sm font-medium ${error ? 'text-red-600' : 'text-gray-600'}`}>
                파일을 드래그하거나 클릭하여 선택
              </p>
              <p className="text-xs text-gray-500">
                {accept.includes('image') ? '이미지 파일' : 'PDF, DOC, DOCX'} • 최대 10MB
              </p>
            </div>
          </div>
        ) : (
          // 파일이 선택된 상태
          <div className="flex items-center justify-between bg-white bg-opacity-70 p-3 rounded-lg">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex-shrink-0">
                {error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-800 font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
            <button 
              onClick={handleRemove} 
              className="text-gray-500 hover:text-red-600 flex-shrink-0 ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileInput;