package ssafy.i13e206.feedback.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "feedback_source")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class FeedbackSource {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "feedback_source_id", length = 36)
    private String feedbackSourceUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_uuid", nullable = false)
    private Feedback feedback;

    @Column(name = "source_type", length = 50) // "resume", "portfolio", "transcript"
    private String sourceType;

    @Lob // 긴 텍스트 저장을 위해
    @Column(name = "cited_content", columnDefinition = "TEXT")
    private String citedContent;
}