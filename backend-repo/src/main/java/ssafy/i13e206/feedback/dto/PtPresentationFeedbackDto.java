package ssafy.i13e206.feedback.dto;

import lombok.Builder;
import lombok.Getter;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.interview.dto.ExpressionDto;
import ssafy.i13e206.interview.dto.SegmentDto;
import ssafy.i13e206.interview.entity.PTAnswerAttempt;

import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Getter
@Builder
public class PtPresentationFeedbackDto {
    private String ptAnswerAttemptUuid;
    private Integer attemptNumber;
    private String feedbackUuid;
    private String transcript;
    private List<SegmentDto> segment; // ← 문자열이 아닌 List로 수정
    private List<ExpressionDto> expression;

    public static PtPresentationFeedbackDto of(
            PTAnswerAttempt attempt,
            Feedback feedback,
            Function<String, List<SegmentDto>> segmentParser,
            Function<String, List<ExpressionDto>> expressionParser
    ) {
        if (attempt == null) return null;

        return PtPresentationFeedbackDto.builder()
                .ptAnswerAttemptUuid(attempt.getId().getPtAnswerAttemptUuid())
                .attemptNumber(attempt.getId().getAttemptNumber())
                .feedbackUuid(feedback != null ? feedback.getFeedbackUuid() : null)
                .transcript(feedback != null ? feedback.getTranscript() : null)
                .segment(feedback != null ? segmentParser.apply(feedback.getSegment()) : Collections.emptyList())
                .expression(feedback != null ? expressionParser.apply(feedback.getExpression()) : Collections.emptyList())
                .build();
    }
}
