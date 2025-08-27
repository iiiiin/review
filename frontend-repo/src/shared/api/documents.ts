// src/api/documents.ts
import apiClient from '@/shared/api/client';
import type { UploadFileResponse, Document as UserFile } from '@/shared/types/document';

const API_MOCKING_ENABLED = import.meta.env.VITE_API_MOCKING === 'enabled';

/**
 * 파일을 업로드하는 API
 * @param files - 업로드할 File 객체 배열
 * @param company - 지원한 회사명
 * @param job - 지원 직무
 * @param fileTypes - 각 파일에 해당하는 타입 배열 (script, resume, portfolio)
 * @returns {Promise<UploadFileResponse[]>} - 업로드된 파일 정보 배열
 */
export const uploadFilesAPI = async (
  files: File[],
  company: string,
  job: string,
  fileTypes: ('script' | 'resume' | 'portfolio')[]
): Promise<UploadFileResponse[]> => {

  // 파일을 Base64로 인코딩하는 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // data:image/png;base64,iVBORw0KGgoA... 형태에서 base64 부분만 추출
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 모든 파일을 Base64로 변환
  const base64Files = await Promise.all(files.map(file => fileToBase64(file)));
  
  // JSON 형태로 데이터 구성 (task.md 요구사항에 맞춤)
  const requestData = {
    enterpriseName: company,
    position: job,
    file: base64Files,
    fileType: fileTypes
  };
  
  console.log('Request data:', requestData);
  
  // 현재 인증 상태 확인
  const authStore = (await import('@/shared/store/authStore')).useAuthStore;
  const { accessToken, isLoggedIn } = authStore.getState();
  console.log('Auth status:', { isLoggedIn, hasToken: !!accessToken });
  
  try {
    // FormData로 전송 (multipart/form-data)
    const formData = new FormData();
    formData.append('enterpriseName', company);
    formData.append('position', job);
    
    // 파일들을 하나씩 추가
    files.forEach((file) => {
      formData.append('file', file);
    });
    
    // fileType을 각각의 파라미터로 추가
    fileTypes.forEach(type => {
      formData.append('fileType', type);
    });
    
    console.log('Sending FormData:', {
      enterpriseName: company,
      position: job,
      files: files.map(f => f.name),
      fileType: fileTypes
    });
    
    const response = await apiClient.post('/api/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const { result } = response as unknown as { result: UploadFileResponse[] };
    return result;
    
  } catch (error) {
    console.error('Upload error details:', {
      error,
      authStatus: { isLoggedIn, hasToken: !!accessToken },
      requestData: { ...requestData, file: 'Base64 files (hidden for brevity)' }
    });
    throw error;
  }
};

// --- getUserDocumentsAPI 함수 내에서만 사용할 로컬 타입 정의 ---
interface MyPageData {
  file: UserFile[];
}
interface ApiResponse<T> {
  status: string;
  message: string;
  result: T;
}
// ---

/**
 * 사용자의 모든 문서 목록을 가져오는 API
 * @returns {Promise<UserFile[]>} - 사용자 문서 정보 배열
 */
export const getUserDocumentsAPI = async (): Promise<UserFile[]> => {
  if (API_MOCKING_ENABLED) {
    console.log('✅ Mocking enabled: getUserDocumentsAPI');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            fileUuid: 'mock-uuid-resume-1',
            fileType: 'resume',
            company: 'Mock Company A',
            job: 'Frontend Developer',
            fileName: 'my_resume.pdf',
            fileUrl: 'https://example.com/mock-resume.pdf',
            uploadedAt: new Date('2023-08-01T10:00:00Z').toISOString(),
          },
          {
            fileUuid: 'mock-uuid-portfolio-1',
            fileType: 'portfolio',
            company: 'Mock Company B',
            job: 'Backend Developer',
            fileName: 'my_portfolio.pdf',
            fileUrl: 'https://example.com/mock-portfolio.pdf',
            uploadedAt: new Date('2023-08-02T11:30:00Z').toISOString(),
          },
          {
            fileUuid: 'mock-uuid-resume-2',
            fileType: 'resume',
            company: 'Mock Company C',
            job: 'Fullstack Developer',
            fileName: 'final_resume.pdf',
            fileUrl: 'https://example.com/mock-resume-2.pdf',
            uploadedAt: new Date('2023-08-03T15:00:00Z').toISOString(),
          },
        ]);
      }, 400);
    });
  }

  // 실제 API 호출. 프로젝트의 다른 API들과 동일한 타입 단언 패턴을 사용
  const response = (await apiClient.get<ApiResponse<MyPageData>>(
    '/api/user/mypage',
  )) as unknown as ApiResponse<MyPageData>;

  if (response && response.result && Array.isArray(response.result.file)) {
    return response.result.file;
  }
  
  return []; // 데이터가 없거나 구조가 다르면 빈 배열 반환
};
