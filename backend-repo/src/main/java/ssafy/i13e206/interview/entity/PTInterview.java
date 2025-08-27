package ssafy.i13e206.interview.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "pt_interviews")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PTInterview {
    @Id
    @Column(name = "pt_uuid", length = 36)
    private String ptUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_uuid", nullable = false)
    private Interview interview;

    @Column(name = "title", nullable = false)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String situation;

    @OneToMany(mappedBy = "ptInterview", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PTAnswerAttempt> ptAnswerAttempts;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}