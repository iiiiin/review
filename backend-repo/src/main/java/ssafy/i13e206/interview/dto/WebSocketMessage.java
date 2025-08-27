package ssafy.i13e206.interview.dto;

import lombok.Builder;
import lombok.Getter;

// 웹소켓으로 보낼 메시지 DTO
@Getter
@Builder
public class WebSocketMessage<T> {
    private String type; // "NEXT_QUESTION_READY", "INTERVIEW_COMPLETED" 등
    private T data;
}