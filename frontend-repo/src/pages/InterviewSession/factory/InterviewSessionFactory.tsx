import React from 'react';
import GeneralInterviewSession from '../components/GeneralInterview/GeneralInterviewSession';
import PTInterviewSession from '../components/PTInterview/PTInterviewSession';
import type { 
  InterviewType, 
  InterviewSessionProps,
  GeneralInterviewSessionProps,
  PTInterviewSessionProps 
} from '../interfaces/InterviewInterface';

// 면접 타입 판별 유틸리티
export class InterviewTypeUtils {
  static isGeneralInterview(type: InterviewType): type is 'job' | 'personality' {
    return type === 'job' || type === 'personality';
  }

  static isPTInterview(type: InterviewType): type is 'presentation' {
    return type === 'presentation';
  }

  static normalizeInterviewType(type: string): InterviewType {
    const typeMap: Record<string, InterviewType> = {
      'tech': 'job',
      'behavioral': 'personality', 
      'presentation': 'presentation',
      'pt': 'presentation',
      'PT': 'presentation',
      'job': 'job',
      'personality': 'personality'
    };
    return typeMap[type] || 'job';
  }

  static getInterviewDisplayName(type: InterviewType): string {
    const displayNames: Record<InterviewType, string> = {
      'job': '직무 면접',
      'personality': '인성 면접',
      'presentation': 'PT 면접'
    };
    return displayNames[type];
  }

  static getDefaultQuestionCount(type: InterviewType): number {
    const questionCounts: Record<InterviewType, number> = {
      'job': 9, // 3 sets * 3 questions
      'personality': 9, // 3 sets * 3 questions  
      'presentation': 1 // 1 PT question
    };
    return questionCounts[type];
  }
}

// 면접 세션 팩토리
export class InterviewSessionFactory {
  static create(props: InterviewSessionProps): React.ReactElement {
    const { interviewType, sessionId, initialAttemptIds } = props;
    
    // 면접 타입에 따라 적절한 컴포넌트 반환
    if (InterviewTypeUtils.isGeneralInterview(interviewType)) {
      const generalProps: GeneralInterviewSessionProps = {
        interviewType,
        sessionId,
        initialAttemptIds
      };
      return <GeneralInterviewSession {...generalProps} />;
    }
    
    if (InterviewTypeUtils.isPTInterview(interviewType)) {
      const ptProps: PTInterviewSessionProps = {
        interviewType,
        sessionId, 
        initialAttemptIds
      };
      return <PTInterviewSession {...ptProps} />;
    }

    // 기본값으로 일반 면접 반환 (fallback)
    console.warn(`알 수 없는 면접 타입: ${interviewType}. 기본값으로 job 면접을 사용합니다.`);
    const fallbackProps: GeneralInterviewSessionProps = {
      interviewType: 'job',
      sessionId,
      initialAttemptIds
    };
    return <GeneralInterviewSession {...fallbackProps} />;
  }

  static createByType(
    type: InterviewType,
    sessionId: string,
    initialAttemptIds?: string[]
  ): React.ReactElement {
    return this.create({ 
      interviewType: type,
      sessionId, 
      initialAttemptIds 
    });
  }
}

// 편의 컴포넌트 - 팩토리를 사용하는 래퍼
export interface InterviewSessionFactoryComponentProps extends InterviewSessionProps {
  // 추가 옵션들을 여기에 정의할 수 있음
}

export const InterviewSessionFactoryComponent: React.FC<InterviewSessionFactoryComponentProps> = (props) => {
  return InterviewSessionFactory.create(props);
};