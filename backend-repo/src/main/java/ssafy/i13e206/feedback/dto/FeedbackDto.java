package ssafy.i13e206.feedback.dto;

import lombok.Builder;
import lombok.Getter;
import ssafy.i13e206.feedback.entity.Feedback;

@Getter
@Builder
public class FeedbackDto {
    private String feedbackUuid;
    private String transcript;
    private String segment;
    private String expression;
    public static FeedbackDto of(Feedback feedback) {
        if (feedback == null) return null;
        return FeedbackDto.builder()
                .feedbackUuid(feedback.getFeedbackUuid())
                .transcript(feedback.getTranscript())
                .segment(feedback.getSegment())
                .expression(feedback.getExpression())
                .build();
    }
}