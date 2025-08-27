// src/shared/api/companies.ts
import apiClient from './client';

const API_MOCKING_ENABLED = import.meta.env.VITE_API_MOCKING === 'enabled';

// 회사 정보 타입
export interface Company {
  id: string;
  name: string;
}

// 직무 정보 타입
export interface Job {
  id: string;
  name: string;
}

// 회사 목록을 가져오는 API
export const getCompaniesAPI = async (): Promise<Company[]> => {
  if (API_MOCKING_ENABLED) {
    console.log('✅ Mocking enabled: getCompaniesAPI');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: '1', name: '네이버' },
          { id: '2', name: '카카오' },
          { id: '3', name: '라인' },
          { id: '4', name: '쿠팡' },
          { id: '5', name: '토스' },
          { id: '6', name: '현대자동차' },
          { id: '7', name: '현대오토에버' },
          { id: '8', name: '현대건설' },
          { id: '9', name: '현대해상화재보험' },
          { id: '10', name: '현대종합금속' },
          { id: '11', name: '현대하이라이프손해사정' },
          { id: '12', name: '삼성전자' },
          { id: '13', name: '삼성SDS' },
          { id: '14', name: 'LG전자' },
          { id: '15', name: 'LG CNS' },
          { id: '16', name: 'SK하이닉스' },
          { id: '17', name: 'SK C&C' },
          { id: '18', name: '구글' },
          { id: '19', name: '애플' },
          { id: '20', name: '마이크로소프트' },
          { id: '21', name: '아마존' },
          { id: '22', name: '메타' },
          { id: '23', name: '테슬라' }
        ]);
      }, 300);
    });
  }

  try {
    const response = await apiClient.get('/api/company') as any;
    console.log(response.result);
    // API 응답 구조에 따라 처리
    if (response.result && Array.isArray(response.result)) {
      // result 배열인 경우 (실제 API 응답 구조)
      return response.result.map((item: any) => ({
        id: item.enterpriseUuid,
        name: item.enterpriseName
      }));
    } else if (Array.isArray(response.data)) {
      // 단순 배열인 경우 (기존 구조)
      return response.data.map((name: string, index: number) => ({
        id: `mock-${index}`,
        name
      }));
    } else {
      // 기타 구조
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    throw error;
  }
};

// 특정 회사의 직무 목록을 가져오는 API
export const getJobsByCompanyAPI = async (companyId: string): Promise<Job[]> => {
  if (API_MOCKING_ENABLED) {
    console.log('✅ Mocking enabled: getJobsByCompanyAPI');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: 'job-1', name: '프론트엔드 개발자' },
          { id: 'job-2', name: '백엔드 개발자' },
          { id: 'job-3', name: '풀스택 개발자' },
          { id: 'job-4', name: '데브옵스 엔지니어' },
          { id: 'job-5', name: '데이터 분석가' },
          { id: 'job-6', name: '데이터 엔지니어' },
          { id: 'job-7', name: 'iOS 개발자' },
          { id: 'job-8', name: '안드로이드 개발자' },
          { id: 'job-9', name: 'AI/ML 엔지니어' },
          { id: 'job-10', name: '시스템 엔지니어' },
          { id: 'job-11', name: '네트워크 엔지니어' },
          { id: 'job-12', name: '보안 엔지니어' },
          { id: 'job-13', name: 'QA 엔지니어' },
          { id: 'job-14', name: 'UI/UX 디자이너' },
          { id: 'job-15', name: '프로덕트 매니저' },
          { id: 'job-16', name: '기술 지원 엔지니어' },
          { id: 'job-17', name: '클라우드 엔지니어' },
          { id: 'job-18', name: '블록체인 개발자' },
          { id: 'job-19', name: '게임 개발자' },
          { id: 'job-20', name: '임베디드 개발자' }
        ]);
      }, 300);
    });
  }

  try {
    const response = await apiClient.get(`/api/company/job/${companyId}`) as any;
    // API 응답 구조에 맞게 result 배열에서 recruitUuid와 position 추출
    const jobs = response.result?.map((item: { recruitUuid: string; position: string }) => ({
      id: item.recruitUuid,
      name: item.position
    })) || [];
    return jobs;
  } catch (error) {
    console.error('Failed to fetch jobs by company:', error);
    throw error;
  }
};

// 기존 직무 목록 API (하위 호환성을 위해 유지)
export const getJobsAPI = async (): Promise<string[]> => {
  if (API_MOCKING_ENABLED) {
    console.log('✅ Mocking enabled: getJobsAPI');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          '프론트엔드 개발자',
          '백엔드 개발자',
          '풀스택 개발자',
          '데브옵스 엔지니어',
          '데이터 분석가',
          '데이터 엔지니어',
          'iOS 개발자',
          '안드로이드 개발자',
          'AI/ML 엔지니어',
          '시스템 엔지니어',
          '네트워크 엔지니어',
          '보안 엔지니어',
          'QA 엔지니어',
          'UI/UX 디자이너',
          '프로덕트 매니저',
          '기술 지원 엔지니어',
          '클라우드 엔지니어',
          '블록체인 개발자',
          '게임 개발자',
          '임베디드 개발자'
        ]);
      }, 300);
    });
  }

  try {
    const response = await apiClient.get('/api/job') as any;
    // API 응답 구조에 맞게 result 배열에서 position 필드 추출
    const jobs = response.result?.map((item: { position: string }) => item.position) || [];
    return jobs;
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    throw error;
  }
};
