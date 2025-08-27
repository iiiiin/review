package ssafy.i13e206.interview.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InterviewStartResponseDto {
    private String interviewUuid;
    private String questionUuid;
    private String title;
    private String situation;
}