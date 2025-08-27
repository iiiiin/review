package ssafy.i13e206.interview.entity.enums;

public enum AttemptStatus {
    PENDING,      // 답변 시도 생성, 녹화 대기
    PROCESSING,   // 녹화 완료, 분석 진행 중
    COMPLETED,    // 분석 완료
    FAILED        // 분석 실패
}