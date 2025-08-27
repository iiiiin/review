package ssafy.i13e206.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ANSWER_ATTEMPTS")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnswerAttempt {
    @EmbeddedId
    private AnswerAttemptId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_uuid", nullable = false)
    private Question question;

    @Column(name = "video_path", length = 255)
    private String videoPath;

    @Column(name = "elapsed_time")
    private Float elapsedTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttemptStatus status;

    @OneToOne(mappedBy = "answerAttempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Feedback feedback;

    public void setFeedback(Feedback feedback) {
        this.feedback = feedback;
        if (feedback != null) {
            feedback.setAnswerAttempt(this);
        }
    }
}
