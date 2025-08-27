package ssafy.i13e206.interview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * PTAnswerAttempt 엔티티의 복합 기본 키를 정의하는 클래스입니다.
 */
@Embeddable
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class PTAnswerAttemptId implements Serializable {

    @Column(name = "pt_answer_attempt_uuid", length = 36)
    private String ptAnswerAttemptUuid;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;
}
