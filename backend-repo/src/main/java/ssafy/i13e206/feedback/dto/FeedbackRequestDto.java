package ssafy.i13e206.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequestDto {
    private String ptAnswerAttemptUuid;
//    private List<AnswerAttemptKeyDto> answerAttempts;
    private int attemptNumber;
}

