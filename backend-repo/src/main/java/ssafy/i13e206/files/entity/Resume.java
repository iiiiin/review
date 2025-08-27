package ssafy.i13e206.files.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import ssafy.i13e206.user.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name="resume")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Resume {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "resume_uuid", length = 36)
    private String resumeUuid;

    @Column(length = 100, nullable = false)
    private String enterpriseName;

    @Column(length = 100, nullable = false)
    private String position;

    @Column(length = 255, nullable = false)
    private String fileName;

    @Column(name= "resume_url", length = 500, nullable = false)
    private String resumeUrl;

    @Lob
    @Column(name = "ocr", columnDefinition = "LONGTEXT", nullable = false)
    private String ocrText;

    @CreatedDate
    @Column(name = "resume_uploaded_at", nullable = false)
    private LocalDateTime resumeUploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uuid", nullable = false)
    private User user;
}
