package ssafy.i13e206.interview.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InterviewCreateRequestDto {
    private String recruitUuid;
    private String resumeUuid;
    private String portfolioUuid;
    private String scriptFileUuid;
    private String interviewType;
}