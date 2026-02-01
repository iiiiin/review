import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/authStore";
import LandingPage from "@/features/landing/pages/LandingPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
// 인증 관련 페이지 import
import LoginPage from "@/features/auth/pages/LoginPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import OAuthCallbackPage from "@/features/auth/pages/OAuthCallbackPage";
// 면접 준비 플로우 페이지 import
import InterviewSetupPage from "@/features/interview/pages/InterviewSetupPage";
import InterviewSessionPage from "@/features/interview/pages/InterviewSessionPage";
import InterviewGuidePage from "@/features/interview/pages/InterviewGuidePage";
// 결과 관련 페이지 import
import ResultsListPage from "@/features/results/pages/ResultsListPage"; // 결과 목록 페이지
import ResultDetailPage from "@/features/results/pages/ResultDetailPage"; // 결과 상세 페이지
import StepByStepFeedbackPage from "@/features/results/pages/StepByStepFeedbackPage"; // 단계별 피드백 페이지
import PTFeedbackWaitingPage from "@/features/results/pages/PTFeedbackWaitingPage";
import InterviewCompletionPage from "@/features/interview/pages/InterviewCompletionPage";
import PTFeedbackPage from "@/features/results/pages/PTFeedbackPage";
import PTStepByStepPage from "@/features/results/pages/PTStepByStepPage";
//  404 NotFound 페이지 import
import NotFoundPage from "./NotFoundPage";


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

        {/* 필요시 404 NotFound 등 추가 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
