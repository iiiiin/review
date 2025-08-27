package ssafy.i13e206.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import ssafy.i13e206.interview.entity.enums.InterviewType;
import ssafy.i13e206.user.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "INTERVIEWS")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Interview {
    @Id
    @Column(name = "interview_uuid", length = 36)
    private String interviewUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_sets_uuid", nullable = false)
    private InterviewSet interviewSet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uuid", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false)
    private InterviewType interviewType;

    @Column(name = "enterprise_name", nullable = false)
    private String enterpriseName;

    @Column(name = "position", nullable = false)
    private String position;

    @Column(name = "interview_count", nullable = false)
    private int interviewCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions;

    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PTInterview> ptInterviews;
}