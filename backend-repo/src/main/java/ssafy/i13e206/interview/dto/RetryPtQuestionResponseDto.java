package ssafy.i13e206.interview.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetryPtQuestionResponseDto {
    private String interviewSetUuid;
    private List<PtInterviewDto> ptInterview;
    private long processingTimeMs;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PtInterviewDto {
        private String id;
        private String title;
        private String situation;
        private int attemptNumber;
    }
}