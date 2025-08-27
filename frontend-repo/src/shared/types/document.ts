// src/shared/types/document.ts

export interface Document {
  fileUuid: string;
  fileType: 'resume' | 'portfolio' | 'script';
  company: string;
  job: string;
  fileName?: string; // 원본 파일명 (선택적)
  fileUrl: string;
  uploadedAt: string;
}

export interface UploadFileResponse {
  fileUuid: string;
  fileUrl: string; 
  uploadedAt: string;
  fileType: 'SCRIPT' | 'RESUME' | 'PORTFOLIO' | 'unknown'; // 가능하다면 union 타입 지정
}
