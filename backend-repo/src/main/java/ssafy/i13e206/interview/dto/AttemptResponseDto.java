package ssafy.i13e206.interview.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttemptResponseDto {
    private String sessionId; // OpenVidu 세션 ID (answerAttemptUuid와 동일)
}