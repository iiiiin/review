// 피드백 페이지 라우팅 설계
export interface FeedbackRouteParams {
  // 기본 파라미터
  resultId: string;
  step?: number;
  attemptIds?: string;
  count?: number;
  
  // 모드 구분 파라미터
  mainOnly?: boolean;        // 질문 0만 표시
  followUpOnly?: boolean;    // 꼬리질문 1,2만 표시
  
  // PT 전용 파라미터
  ptUuid?: string;
  attemptUuid?: string;
  attempt?: number;
  set?: number;
}

// 라우팅 패턴 정의
export class FeedbackRoutes {
  
  // CompletionScreen에서 본질문 피드백으로 이동
  static getMainQuestionRoute(resultId: string, mainAttemptId: string): string {
    const params = new URLSearchParams({
      step: '0',
      attemptIds: mainAttemptId,
      count: '1',
      mainOnly: 'true'
    });
    
    return `/results/${resultId}/feedback?${params.toString()}`;
  }
  
  // CompletionScreen에서 꼬리질문 피드백으로 이동
  static getFollowUpQuestionsRoute(
    resultId: string, 
    followUpAttemptIds: string[]
  ): string {
    const params = new URLSearchParams({
      step: '1',
      attemptIds: followUpAttemptIds.join(','),
      count: followUpAttemptIds.length.toString(),
      followUpOnly: 'true'
    });
    
    return `/results/${resultId}/feedback?${params.toString()}`;
  }
  
  // 전체 피드백 페이지로 이동 (기존 방식)
  static getFullFeedbackRoute(
    resultId: string, 
    allAttemptIds: string[]
  ): string {
    const params = new URLSearchParams({
      step: '0',
      attemptIds: allAttemptIds.join(','),
      count: allAttemptIds.length.toString()
    });
    
    return `/results/${resultId}/feedback?${params.toString()}`;
  }
  
  // PT 피드백 라우트
  static getPTFeedbackRoute(
    resultId: string,
    attemptUuid: string,
    attempt?: number,
    set?: number
  ): string {
    const params = new URLSearchParams({
      step: '0',
      ptUuid: attemptUuid,
      attemptUuid: attemptUuid
    });
    
    if (attempt) params.set('attempt', attempt.toString());
    if (set) params.set('set', set.toString());
    
    return `/results/${resultId}/feedback?${params.toString()}`;
  }
  
  // 스텝 간 이동
  static getStepNavigationRoute(
    currentUrl: string,
    newStep: number
  ): string {
    const url = new URL(currentUrl, window.location.origin);
    const params = new URLSearchParams(url.search);
    params.set('step', newStep.toString());
    
    return `${url.pathname}?${params.toString()}`;
  }
}

// URL 파라미터 파싱 유틸리티
export class FeedbackURLParser {
  
  static parseRouteParams(searchParams: URLSearchParams): FeedbackRouteParams {
    return {
      step: parseInt(searchParams.get('step') || '0'),
      attemptIds: searchParams.get('attemptIds') || '',
      count: parseInt(searchParams.get('count') || '0'),
      mainOnly: searchParams.get('mainOnly') === 'true',
      followUpOnly: searchParams.get('followUpOnly') === 'true',
      ptUuid: searchParams.get('ptUuid') || undefined,
      attemptUuid: searchParams.get('attemptUuid') || undefined,
      attempt: parseInt(searchParams.get('attempt') || '0') || undefined,
      set: parseInt(searchParams.get('set') || '0') || undefined
    };
  }
  
  static getPageMode(params: FeedbackRouteParams): 'main' | 'followUp' | 'full' | 'pt' {
    if (params.ptUuid || params.attemptUuid) {
      return 'pt';
    } else if (params.mainOnly) {
      return 'main';
    } else if (params.followUpOnly) {
      return 'followUp';
    } else {
      return 'full';
    }
  }
  
  static getAttemptIds(params: FeedbackRouteParams): string[] {
    if (!params.attemptIds) return [];
    return params.attemptIds.split(',').filter(Boolean);
  }
  
  static getQuestionIndexes(
    mode: 'main' | 'followUp' | 'full' | 'pt',
    totalQuestions: number = 3
  ): number[] {
    switch (mode) {
      case 'main':
        return [0];
      case 'followUp':
        return [1, 2];
      case 'full':
        return Array.from({ length: totalQuestions }, (_, i) => i);
      case 'pt':
        return [0]; // PT는 단일 질문
      default:
        return [0];
    }
  }
}

// 네비게이션 가드 시스템
export class FeedbackNavigationGuard {
  
  // 접근 가능 여부 검사
  static canAccessStep(
    targetStep: number,
    loadedSteps: number[],
    mode: 'main' | 'followUp' | 'full'
  ): boolean {
    switch (mode) {
      case 'main':
        // 본질문 모드: step 0만 접근 가능
        return targetStep === 0 && loadedSteps.includes(0);
        
      case 'followUp':
        // 꼬리질문 모드: step 1,2만 접근 가능
        return targetStep >= 1 && targetStep <= 2 && loadedSteps.includes(targetStep);
        
      case 'full':
        // 전체 모드: 순차 접근 (0부터 현재까지 모두 로드되어야 함)
        for (let i = 0; i <= targetStep; i++) {
          if (!loadedSteps.includes(i)) {
            return false;
          }
        }
        return true;
        
      default:
        return false;
    }
  }
  
  // 다음 단계로 이동 가능 여부
  static canNavigateNext(
    currentStep: number,
    mode: 'main' | 'followUp' | 'full',
    totalSteps: number
  ): boolean {
    const maxStep = this.getMaxStepForMode(mode, totalSteps);
    return currentStep < maxStep;
  }
  
  // 이전 단계로 이동 가능 여부
  static canNavigatePrevious(
    currentStep: number,
    mode: 'main' | 'followUp' | 'full'
  ): boolean {
    const minStep = this.getMinStepForMode(mode);
    return currentStep > minStep;
  }
  
  private static getMaxStepForMode(
    mode: 'main' | 'followUp' | 'full',
    totalSteps: number
  ): number {
    switch (mode) {
      case 'main':
        return 0;
      case 'followUp':
        return Math.min(2, totalSteps - 1);
      case 'full':
        return totalSteps - 1;
      default:
        return 0;
    }
  }
  
  private static getMinStepForMode(mode: 'main' | 'followUp' | 'full'): number {
    switch (mode) {
      case 'main':
        return 0;
      case 'followUp':
        return 1;
      case 'full':
        return 0;
      default:
        return 0;
    }
  }
}

// 사용 예시
export const ExampleUsage = {
  
  // CompletionScreen에서 사용
  navigateToMainQuestion: (resultId: string, mainAttemptId: string) => {
    const route = FeedbackRoutes.getMainQuestionRoute(resultId, mainAttemptId);
    console.log('본질문 피드백 라우트:', route);
    // /results/uuid/feedback?step=0&attemptIds=uuid-q0&count=1&mainOnly=true
  },
  
  navigateToFollowUp: (resultId: string, followUpIds: string[]) => {
    const route = FeedbackRoutes.getFollowUpQuestionsRoute(resultId, followUpIds);
    console.log('꼬리질문 피드백 라우트:', route);
    // /results/uuid/feedback?step=1&attemptIds=uuid-q1,uuid-q2&count=2&followUpOnly=true
  },
  
  // StepByStepFeedbackPage에서 사용
  parseCurrentRoute: (searchParams: URLSearchParams) => {
    const params = FeedbackURLParser.parseRouteParams(searchParams);
    const mode = FeedbackURLParser.getPageMode(params);
    const attemptIds = FeedbackURLParser.getAttemptIds(params);
    const questionIndexes = FeedbackURLParser.getQuestionIndexes(mode);
    
    console.log('현재 라우트 분석:', { params, mode, attemptIds, questionIndexes });
  },
  
  // 네비게이션 가드 사용
  checkNavigation: (targetStep: number, loadedSteps: number[]) => {
    const canAccess = FeedbackNavigationGuard.canAccessStep(
      targetStep,
      loadedSteps,
      'followUp'
    );
    console.log(`스텝 ${targetStep} 접근 가능:`, canAccess);
  }
};