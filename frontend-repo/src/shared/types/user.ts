import type { Document } from './document';

export interface LoginResponse {
  status: number;
  message: string;
  result: {
    id: string;
    username: string;
    accessToken: string;
    loginType: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  loginType: 'LOCAL' | 'GOOGLE';
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  loginType: 'LOCAL' | 'GOOGLE';
}

export interface Summary {
  completedInterviewCount: number;
  totalPracticeSeconds: number;
}

export interface MyPageData {
  profile: Profile;
  summary: Summary;
  file: Document[];
}