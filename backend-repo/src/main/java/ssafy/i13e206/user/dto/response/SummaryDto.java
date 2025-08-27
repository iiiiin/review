package ssafy.i13e206.user.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SummaryDto {
    private int completedInterviewCount;
    private int totalPracticeSeconds;
}