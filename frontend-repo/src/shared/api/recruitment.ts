// src/shared/api/recruitment.ts
import apiClient from '@/shared/api/client';

// --- 타입 정의 ---
export interface Company {
  enterpriseUuid: string;
  enterpriseName: string;
}

export interface Job {
  recruitUuid: string;
  position: string;
}

// API 응답 타입 (공통 구조)
interface ApiResponse<T> {
  status: string;
  message: string;
  result: T;
}

/**
 * 모든 기업 목록을 가져오는 API
 * @returns {Promise<Company[]>} - 기업 정보 배열
 */
export const getCompaniesAPI = async (): Promise<Company[]> => {
  try{
  const response = (await apiClient.get<ApiResponse<Company[]>>(
      '/api/company',
    )) as unknown as ApiResponse<Company[]>;
    return response.result || [];
  } catch (error) {
    console.error('[getCompaniesAPI] API 호출 실패:', error);
    return [];
  }
};

/**
 * 특정 기업의 직무 목록을 가져오는 API
 * @param enterpriseUuid - 조회할 기업의 UUID
 * @returns {Promise<Job[]>} - 직무 정보 배열
 */
export const getJobsAPI = async (enterpriseUuid: string): Promise<Job[]> => {
  if (!enterpriseUuid) {
    return [];
  }
  try {
    // GET 메서드를 사용하고, enterpriseUuid를 경로(Path) 파라미터로 전달합니다.
   const response = (await apiClient.get<ApiResponse<Job[]>>(
      `/api/company/job/${enterpriseUuid}`,
    )) as unknown as ApiResponse<Job[]>;
    return response.result || [];
  } catch (error) {
    console.error(
      `[getJobsAPI] API 호출 실패 (enterpriseUuid: ${enterpriseUuid}):`,
      error,
    );
    return [];
  }
};
