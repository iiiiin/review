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
public class InterviewQuestionResponseDto {

    private String interviewSetUuid;
    private List<Question> questions;
    private long processingTimeMs;

    /**
     * 주 질문 및 꼬리 질문을 포함하는 객체
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Question {
        private String id;
        private String type;
        private String question;
        private String intent;
        private String category;
        private String difficulty;
        private String rationale;
        private List<String> relatedSources;
        private List<FollowUp> followUps;

        /**
         * 꼬리 질문 객체
         */
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
            private List<String> relatedSources;
        }
    }
}
