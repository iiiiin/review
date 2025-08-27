package ssafy.i13e206.interview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * AnswerAttempt 엔티티의 복합 기본 키를 정의하는 클래스입니다.
 */
@Embeddable
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class AnswerAttemptId implements Serializable {

    @Column(name = "answer_attempt_uuid", length = 36)
    private String answerAttemptUuid;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;
}
