import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/authStore";
import LandingPage from "@/pages/Landing/LandingPage";
import ProfilePage from "@/pages/Profile/ProfilePage";
// 인증 관련 페이지 import
import LoginPage from "@/pages/Login/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPassword/ForgotPasswordPage";
import RegisterPage from "@/pages/Register/RegisterPage";
import OAuthCallbackPage from "@/pages/OAuthCallback/OAuthCallbackPage";
// 면접 준비 플로우 페이지 import
import InterviewSetupPage from "@/pages/InterviewSetup/InterviewSetupPage";
import InterviewSessionPage from "@/pages/InterviewSession/InterviewSessionPage";
import InterviewGuidePage from "@/pages/InterviewGuide/InterviewGuidePage";
// 결과 관련 페이지 import
import ResultsListPage from "@/pages/ResultsList/ResultsListPage"; // 결과 목록 페이지
import ResultDetailPage from "@/pages/ResultDetail/ResultDetailPage"; // 결과 상세 페이지
import StepByStepFeedbackPage from "@/pages/ResultDetail/StepByStepFeedbackPage"; // 단계별 피드백 페이지
import PTFeedbackWaitingPage from "@/pages/ResultDetail/PTFeedbackWaitingPage";
import InterviewCompletionPage from "@/pages/InterviewSession/InterviewCompletionPage";
import PTFeedbackPage from "@/pages/ResultDetail/PTFeedbackPage";
import PTStepByStepPage from "@/pages/ResultDetail/PTStepByStepPage";
//  404 NotFound 페이지 import
import NotFoundPage from "@/pages/NotFound/NotFoundPage";

import CompletionScreen from "@/pages/InterviewSession/components/CompletionScreen"; // 개발용 컴포넌트

function App() {
  const { initializeAuth } = useAuthStore();
  
  useEffect(() => {
    // 앱 시작 시 토큰 상태 확인 및 복구
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 및 프로필 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* 인증(회원가입/로그인/비번찾기 등) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/register" element={<RegisterPage />} /> {/* 추후 파일 연결 */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        
        {/* 면접 준비 (면접 유형/서류 업로드 등) */}
        <Route path="/interview" element={<InterviewSetupPage />} />
        <Route path="/interview/guide" element={<InterviewGuidePage />} />
        <Route path="/interview/session" element={<InterviewSessionPage />} />
        
        {/* 결과(Results) 관련 라우트 */}
        <Route path="/results" element={<ResultsListPage />} />
        <Route path="/results/:id" element={<ResultDetailPage />} />
        <Route path="/results/:id/feedback" element={<StepByStepFeedbackPage />} />
        <Route path="/results/:id/pt-feedback" element={<PTFeedbackPage />} />
        <Route path="/results/:id/pt-steps" element={<PTStepByStepPage />} />
        <Route path="/results/:id/pt-wait" element={<PTFeedbackWaitingPage />} />
        <Route path="/interview/completion" element={<InterviewCompletionPage />} />

        <Route
        path="/dev/completion"
        element={<CompletionScreen resultId={'demo-result-id'} interviewType={'behavioral'} answerAttemptIds={['attempt1', 'attempt2', 'attempt3']} />}
      />

        {/* 필요시 404 NotFound 등 추가 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
