import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiUser, FiCalendar, FiClock, FiSettings, FiLock, FiUserX, FiFileText } from 'react-icons/fi';

import { getMyPageDataAPI } from '@/features/profile/api/profile';
import type { Profile, Summary } from '@/shared/types/user';

import DocumentsList from '@/features/profile/components/DocumentsList';
import WithdrawalModal from './modal/WithdrawalModal';
import ChangePasswordModal from './modal/ChangePasswordModal';

// =================================================================
// 1. ProfileHeader: API에서 받은 profile, summary 데이터를 props로 받음
// =================================================================
interface ProfileHeaderProps {
  profile?: Profile;
  summary?: Summary;
}

const ProfileHeaderContent = ({ profile, summary }: ProfileHeaderProps) => {
  const totalPracticeMinutes = summary ? Math.floor(summary.totalPracticeSeconds / 60) : 0;
  
  // 시간 표시 형식 계산
  const getTimeDisplay = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}시간`;
      } else {
        return `${hours}시간 ${remainingMinutes}분`;
      }
    }
  };
  
  
  return (
    <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-2xl p-8 mb-8 text-white">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <FiUser className="text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile?.username || '사용자'}</h1>
          <p className="text-gray-100 text-lg">AI 면접 코칭과 함께 성장하세요</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FiCalendar className="text-2xl text-gray-300" />
            <div>
              <div className="text-2xl font-bold">{summary?.completedInterviewCount ?? 0}회</div>
              <div className="text-sm text-gray-100">완료한 면접</div>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FiClock className="text-2xl text-gray-300" />
            <div>
              <div className="text-2xl font-bold">{getTimeDisplay(totalPracticeMinutes)}</div>
              <div className="text-sm text-gray-100">총 연습 시간</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// 2. ProfileInfo: API에서 받은 profile 데이터를 props로 받음
// =================================================================
interface ProfileInfoProps {
  profile?: Profile;
}

const ProfileInfoContent = ({ profile }: ProfileInfoProps) => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // 소셜 로그인 사용자 여부 확인
  const isSocialLogin = profile?.loginType !== 'LOCAL';

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">회원 정보</h2>
            <p className="text-gray-600 mt-1">면접에 필요한 기본 정보를 관리하세요</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiSettings className="w-5 h-5 mr-2 text-gray-600" />
            계정 정보
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">이름</label>
              <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-lg">{profile?.username || '정보 없음'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {isSocialLogin ? '로그인 타입' : '이메일'}
              </label>
              <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-lg">
                {isSocialLogin 
                  ? `${profile?.loginType === 'GOOGLE' ? 'Google' : 'Kakao' } 계정으로 로그인`
                  : (profile?.email || '정보 없음')
                }
              </p>
            </div>
            {profile && !isSocialLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">아이디</label>
                <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-lg">{profile?.id || '정보 없음'}</p>
              </div>
            )}
            {profile && !isSocialLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <div className="flex items-center space-x-3">
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg flex-1">••••••••••••</p>
                  <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 flex items-center whitespace-nowrap cursor-pointer"
                  >
                    <FiLock className="w-4 h-4 mr-2" />
                    변경
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiSettings className="w-5 h-5 mr-2 text-gray-600" />
            계정 관리
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">회원 탈퇴</h4>
                <p className="text-sm text-gray-600 mt-1">회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
              </div>
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center whitespace-nowrap cursor-pointer"
              >
                <FiUserX className="w-4 h-4 mr-2" />
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>
      <WithdrawalModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
      {!isSocialLogin && (
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </>
  );
};

// =================================================================
// 3. ProfileTabs (UI-only, no changes needed)
// =================================================================
interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ProfileTabsContent = ({ activeTab, setActiveTab }: ProfileTabsProps) => {
  const tabs = [
    { id: 'profile', name: '프로필 정보', icon: FiUser },
    { id: 'documents', name: '지원서 관리', icon: FiFileText },
  ];

  return (
    <div className="border-b border-gray-100">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-6 py-4 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-gray-600 border-b-2 border-gray-600 bg-gray-50'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="mr-2" />
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// =================================================================
// 4. 최종 통합 컴포넌트: ProfileView
//    - useQuery로 API 호출하여 모든 데이터를 관리
//    - 로딩/에러 상태 처리
//    - 하위 컴포넌트에 데이터 props로 전달
// =================================================================
export default function ProfileView() {
  const [activeTab, setActiveTab] = useState('profile');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['myPageData'],
    queryFn: getMyPageDataAPI,
  });

  if (isLoading) {
    return <div className="text-center p-12">로딩 중...</div>;
  }

  if (isError) {
    return <div className="text-center p-12 text-red-500">오류가 발생했습니다: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ProfileHeaderContent profile={data?.profile} summary={data?.summary} />
      <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
        <ProfileTabsContent activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="p-8">
          {activeTab === 'profile' && <ProfileInfoContent profile={data?.profile} />}
          {activeTab === 'documents' && <DocumentsList documents={data?.file || []} />}
        </div>
      </div>
    </div>
  );
}
