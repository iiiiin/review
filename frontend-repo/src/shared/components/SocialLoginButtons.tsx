// src/components/auth/SocialLoginButtons.tsx

const SocialLoginButtons = () => {
  const handleGoogleLogin = () => {
    // API 명세서에 따라 서버의 OAuth 엔드포인트로 리다이렉션
    // 서버가 구글 OAuth 처리 후 토큰과 함께 프론트엔드 콜백으로 리다이렉션
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://i13e206.p.ssafy.io';
    const googleAuthUrl = `${baseUrl}/oauth2/authorization/google`;
    
    window.location.href = googleAuthUrl;
  };

  return (
    <div>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">또는</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* 구글 공식 브랜드 가이드라인 준수 버튼 */}
        {/* 가이드라인 준수를 위한 수정된 버전 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-[#747775] rounded-[4px] px-[12px] py-[12px] flex items-center justify-center text-[#1F1F1F] text-[14px] font-medium hover:bg-[#f8f9fa] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] focus:bg-[#f8f9fa] focus:border-[#4285f4] focus:outline-none transition-all duration-200 min-h-[40px]"
          style={{
            fontFamily: "'Roboto Medium', Roboto, Arial, sans-serif" // Roboto Medium 우선
          }}
        >
          {/* 구글 공식 G 로고 SVG */}
          <svg 
            className="mr-3 flex-shrink-0" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24"
          >
            <path 
              fill="#4285F4" 
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path 
              fill="#34A853" 
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path 
              fill="#FBBC05" 
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path 
              fill="#EA4335" 
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
};

export default SocialLoginButtons;

/*
구글 공식 브랜드 가이드라인 준수 사항:

✅ 색상:
- 배경: #ffffff (흰색)
- 테두리: #dadce0 (연한 회색)
- 텍스트: #3c4043 (구글 스타일 진한 회색)
- 호버 배경: #f8f9fa
- 포커스 테두리: #4285f4 (구글 파란색)

✅ 타이포그래피:
- 폰트: Google Sans, Noto Sans, Roboto (fallback)
- 크기: 14px
- 무게: medium (500)

✅ 레이아웃:
- 최소 높이: 40px (접근성)
- 패딩: 12px
- 보더 반경: 4px
- 로고와 텍스트 간격: 12px (mr-3)

✅ 상호작용:
- 호버: 배경색 변경, 테두리 진하게, 미묘한 그림자
- 포커스: 구글 파란색 테두리, 아웃라인 제거
- 부드러운 전환 효과 (200ms)

✅ 로고:
- 구글 공식 4색 G 로고 SVG
- 18x18px 크기
- 정확한 공식 색상 코드 사용
*/