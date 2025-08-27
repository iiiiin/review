package ssafy.i13e206.feedback.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import ssafy.i13e206.interview.dto.ExpressionDto;
import ssafy.i13e206.interview.dto.SegmentDto;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FeedBackResultByAnswerAttemptId(
        String feedbackType,
        String videoPath,
        List<SegmentDto> segment,
        String transcript,
        String modelAnswer,
        List<ExpressionDto> expressions,
        String question,
        String whiteboard,
        String title,
        String situation,
        List<FeedbackSourceDto> feedbackSources
) {


    public static class Builder {
        private String feedbackType;
        private String videoPath;
        private List<SegmentDto> segment;
        private String transcript;
        private String modelAnswer;
        private List<ExpressionDto> expressions;
        private String question;
        private String whiteboard;
        private String title;
        private String situation;
        private List<FeedbackSourceDto> feedbackSources;

        public Builder feedbackType(String feedbackType) {
            this.feedbackType = feedbackType;
            return this;
        }

        public Builder videoPath(String videoPath) {
            this.videoPath = videoPath;
            return this;
        }

        public Builder segment(List<SegmentDto> segment) {
            this.segment = segment;
            return this;
        }

        public Builder transcript(String transcript) {
            this.transcript = transcript;
            return this;
        }

        public Builder modelAnswer(String modelAnswer) {
            this.modelAnswer = modelAnswer;
            return this;
        }

        public Builder expressions(List<ExpressionDto> expressions) {
            this.expressions = expressions;
            return this;
        }

        public Builder question(String question) {
            this.question = question;
            return this;
        }

        public Builder whiteboard(String whiteboard) {
            this.whiteboard = whiteboard;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder situation(String situation) {
            this.situation = situation;
            return this;
        }

        public Builder feedbackSourceDtos(List<FeedbackSourceDto> feedbackSourceDtos) {
            this.feedbackSources = feedbackSourceDtos;
            return this;
        }

        public FeedBackResultByAnswerAttemptId build() {
            return new FeedBackResultByAnswerAttemptId(
                    feedbackType, videoPath, segment, transcript, modelAnswer,
                    expressions, question, whiteboard, title, situation, feedbackSources
            );
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}