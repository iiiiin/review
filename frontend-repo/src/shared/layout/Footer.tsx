// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 및 연락처 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Re:View</h3>
            <p className="text-sm">AI 면접, 합격의 지름길</p>
            <div className="text-sm">
              <p>주소: 서울특별시 강남구 테헤란로 212</p>
              <p>전화번호: 02-1234-5678</p>
              <p>이메일: contact@re-view.com</p>
            </div>
          </div>

          {/* 정책 관련 링크 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">정책</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/policy/privacy" className="hover:text-white">개인정보 처리 방침</Link></li>
              <li><Link to="/policy/terms" className="hover:text-white">사이트 이용 약관</Link></li>
              <li><Link to="/policy/cookies" className="hover:text-white">쿠키 정책</Link></li>
            </ul>
          </div>

          {/* 빠른 링크 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">바로가기</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/interview" className="hover:text-white">면접보기</Link></li>
              <li><Link to="/results" className="hover:text-white">결과보기</Link></li>
              <li><Link to="/profile" className="hover:text-white">프로필</Link></li>
            </ul>
          </div>

          {/* 언어 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">언어</h3>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select className="w-full bg-gray-800 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ko">한국어</option>
                <option value="en" disabled>English (준비 중)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 저작권 정보 */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; {currentYear} Re:View Inc. All rights reserved.</p>
          <p className="mt-1">본 웹사이트의 모든 콘텐츠는 저작권법의 보호를 받습니다.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
