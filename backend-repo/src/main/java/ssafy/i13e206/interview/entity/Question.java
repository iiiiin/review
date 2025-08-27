package ssafy.i13e206.interview.entity;

import jakarta.persistence.*;
import java.util.*;
import lombok.*;

@Entity
@Table(name = "QUESTIONS")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question {
    @Id
    @Column(name = "question_uuid", length = 36)
    private String questionUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_uuid", nullable = false)
    private Interview interview;

    @Column(name = "question_number", nullable = false)
    private int questionNumber;

    @Lob
    @Column(name = "question", nullable = false)
    private String question;

    @Column(name = "purpose", length = 100, nullable = false)
    private String purpose;

    @Lob
    @Column(name = "suggested_answer", nullable = false)
    private String suggestedAnswer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_uuid")
    private Question parent;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnswerAttempt> answerAttempts;
}