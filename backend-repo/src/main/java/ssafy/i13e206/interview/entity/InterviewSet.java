package ssafy.i13e206.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import ssafy.i13e206.company.entity.Recruit;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.interview.entity.enums.InterviewType;

@Entity
@Table(name = "INTERVIEW_SETS")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InterviewSet {

    @Id
    @Column(name = "interview_sets_uuid", length = 36)
    private String interviewSetsUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_uuid", nullable = false)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_uuid")
    private Portfolio portfolio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_file_uuid")
    private ScriptFile scriptFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruit_uuid", nullable = false)
    private Recruit recruit;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false)
    private InterviewType interviewType;
}