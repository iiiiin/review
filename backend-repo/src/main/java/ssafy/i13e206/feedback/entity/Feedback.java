package ssafy.i13e206.feedback.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GenericGenerator;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.PTAnswerAttempt;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Check(constraints =
        "(answer_attempt_uuid IS NOT NULL AND pt_answer_attempt_uuid IS NULL) OR " +
                "(answer_attempt_uuid IS NULL AND pt_answer_attempt_uuid IS NOT NULL)")
public class Feedback {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "feedback_uuid", length = 36)
    private String feedbackUuid;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "answer_attempt_uuid", referencedColumnName = "answer_attempt_uuid"),
            @JoinColumn(name = "attempt_number", referencedColumnName = "attempt_number")
    })
    private AnswerAttempt answerAttempt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "pt_answer_attempt_uuid", referencedColumnName = "pt_answer_attempt_uuid"),
            @JoinColumn(name = "pt_attempt_number", referencedColumnName = "attempt_number")
    })
    private PTAnswerAttempt ptAnswerAttempt;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "segment", columnDefinition = "TEXT")
    private String segment;

    @Column(name = "expression", columnDefinition = "LONGTEXT")
    private String expression;

    @Column(name = "model_answer", columnDefinition = "LONGTEXT")
    private String modelAnswer;

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FeedbackSource> feedbackSources = new ArrayList<>();

}