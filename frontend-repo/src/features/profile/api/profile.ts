// src/api/profile.ts
import apiClient from '@/shared/api/client';
import type { MyPageData } from '@/shared/types/user';

// 마이페이지 데이터를 가져오는 API
export const getMyPageDataAPI = async (): Promise<MyPageData> => {

  // 실제 API 호출
  const response: { result: MyPageData } = await apiClient.get('/api/user/mypage');
  return response.result;
};

