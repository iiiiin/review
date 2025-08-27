package ssafy.i13e206.interview.dto;
import ssafy.i13e206.feedback.dto.FeedbackSourceDto;

import java.util.List;

public record RetryDto(
        String videoUrl,
        String intent, // 출제 의도
        List<ExpressionDto> expressions, // 표정 분석 결과
        String transcript, // 전체 전사 내용
        List<SegmentDto> segments, // 문장별 분석 결과
        String modelAnswer,

        List<FeedbackSourceDto> feedbackSources,
        int attemptNumber
) {
}