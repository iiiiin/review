package ssafy.i13e206.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetryQuestionResponseDto {

    private String interviewSetUuid;
    private List<Question> questions;
    private long processingTimeMs;


    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Question {
        private String id;
        private String question;
        private String intent;
        private String rationale;
        private int attemptNumber;
        private List<FollowUp> followUps;


        @Getter
        @Setter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class FollowUp {
            private String id;
            private String question;
            private String intent;
            private String rationale;
            private int attemptNumber;
        }
    }
}