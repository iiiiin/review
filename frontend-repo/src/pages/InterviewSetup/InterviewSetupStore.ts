// src/store/interviewSetupStore.ts
import { create } from 'zustand';
import * as DocumentsAPI from '@/shared/api/documents';

// 각 문서의 상태 타입
interface DocumentState {
  file: File | null;
  uuid: string | null;
}

// 면접 설정에 사용될 상태의 타입 정의
interface InterviewSetupState {
  currentStep: number;
  interviewType: string;
  company: { uuid: string; name: string };
  job: { uuid: string; name: string };
  resume: DocumentState;
  portfolio: DocumentState;
  script: DocumentState;
  questionCount: number;
}

// 상태를 변경하는 액션의 타입 정의
interface InterviewSetupActions {
  setInterviewType: (type: string) => void;
  setCompany: (company: { uuid: string; name: string }) => void;
  setJob: (job: { uuid: string; name: string }) => void;
  setResume: (data: Partial<DocumentState>) => void;
  setPortfolio: (data: Partial<DocumentState>) => void;
  setScript: (data: Partial<DocumentState>) => void;
  setQuestionCount: (count: number) => void;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  reset: () => void;
  uploadInterviewFiles: () => Promise<void>;
}

// 초기 상태
const initialDocumentState: DocumentState = { file: null, uuid: null };

const initialState: InterviewSetupState = {
  currentStep: 1,
  interviewType: '',
  company: { uuid: '', name: '' },
  job: { uuid: '', name: '' },
  resume: initialDocumentState,
  portfolio: initialDocumentState,
  script: initialDocumentState,
  questionCount: 1,
};

// Zustand 스토어 생성
export const useInterviewSetupStore = create<InterviewSetupState & InterviewSetupActions>((set, get) => ({
  ...initialState,

  // --- 액션 구현 ---
  setInterviewType: (type) => set({ interviewType: type }),
  setCompany: (company) => set({ company, job: { uuid: '', name: '' } }), // 회사가 바뀌면 직무는 초기화
  setJob: (job) => set({ job }),
  
  setResume: (data) => set(state => ({ resume: { ...state.resume, ...data } })),
  setPortfolio: (data) => set(state => ({ portfolio: { ...state.portfolio, ...data } })),
  setScript: (data) => set(state => ({ script: { ...state.script, ...data } })),

  setQuestionCount: (count) => set({ questionCount: count }),
  setCurrentStep: (step) => set({ currentStep: step }),
  
  goToNextStep: () => set(state => ({ currentStep: state.currentStep + 1 })),
  goToPrevStep: () => set(state => ({ currentStep: state.currentStep - 1 })),

  reset: () => set(initialState),

  uploadInterviewFiles: async () => {
    const { company, job, resume, portfolio, script, setResume, setPortfolio, setScript } = get();
    
    // 1. 업로드할 파일 목록 생성
    const filesToUpload: { file: File; type: 'resume' | 'portfolio' | 'script' }[] = [];
    if (resume.file) filesToUpload.push({ file: resume.file, type: 'resume' });
    if (portfolio.file) filesToUpload.push({ file: portfolio.file, type: 'portfolio' });
    if (script.file) filesToUpload.push({ file: script.file, type: 'script' });

    if (filesToUpload.length === 0) {
      console.log('새로 업로드할 파일이 없습니다.');
      return;
    }

    // 2. API 호출을 위한 데이터 준비
    const fileObjects = filesToUpload.map(item => item.file);
    const fileTypes = filesToUpload.map(item => item.type);

    try {
      console.log('파일 업로드 시도:', fileObjects.map(f => f.name));
      // 3. API 호출
      const uploadedResponses = await DocumentsAPI.uploadFilesAPI(
        fileObjects,
        company.name, // 이제 name을 사용
        job.name,     // 이제 name을 사용
        fileTypes
      );
      console.log('파일 업로드 성공:', uploadedResponses);
      console.log('응답 개수:', uploadedResponses.length);
      console.log('첫 번째 응답의 fileType:', uploadedResponses[0]?.fileType);

      // 4. 반환된 UUID를 상태에 저장 (핵심 수정 사항)
      console.log('UUID 설정 시작:', uploadedResponses);
      uploadedResponses.forEach(res => {
        console.log('Processing response:', res);
        if (res.fileType === 'RESUME') {
          console.log('Resume UUID 설정:', res.fileUuid);
          setResume({ uuid: res.fileUuid });
        } else if (res.fileType === 'PORTFOLIO') {
          console.log('Portfolio UUID 설정:', res.fileUuid);
          setPortfolio({ uuid: res.fileUuid });
        } else if (res.fileType === 'SCRIPT') {
          console.log('Script UUID 설정:', res.fileUuid);
          setScript({ uuid: res.fileUuid });
        }
      });
      console.log('UUID 설정 완료, 현재 상태:', get().resume);

    } catch (error) {
      console.error('파일 업로드 실패:', error);
      // 에러를 다시 던져서 UI단에서 처리할 수 있게 함
      throw error;
    }
  },
}));
