package ssafy.i13e206.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;

@Entity
@Table(name = "pt_answer_attempts")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PTAnswerAttempt {
    @EmbeddedId
    private PTAnswerAttemptId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pt_uuid", nullable = false)
    private PTInterview ptInterview;

    @Column(name = "video_path", length = 255)
    private String videoPath;

    @Column(name = "elapsed_time")
    private Float elapsedTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttemptStatus status;

    @Lob
    @Column(nullable = true)
    private String whiteboard;

    @OneToOne(mappedBy = "ptAnswerAttempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Feedback feedback;

    public void setFeedback(Feedback feedback) {
        this.feedback = feedback;
        if (feedback != null) {
            feedback.setPtAnswerAttempt(this);
        }
    }
}
