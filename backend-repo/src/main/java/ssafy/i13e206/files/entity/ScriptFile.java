package ssafy.i13e206.files.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import ssafy.i13e206.user.entity.User;

import java.time.LocalDateTime; // Import LocalDateTime

@Entity
@Table(name="script_file")
@Getter @Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ScriptFile {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "script_file_uuid", length = 36)
    private String scriptFileUuid;

    @Column(length = 100, nullable = false)
    private String enterpriseName;

    @Column(length = 100, nullable = false)
    private String position;

    @Column(length = 255, nullable = false)
    private String fileName;

    @Column(name= "script_url", length = 500, nullable = false)
    private String scriptUrl;

    @Lob
    @Column(name = "ocr", columnDefinition = "LONGTEXT", nullable = false)
    private String ocrText;

    @CreatedDate
    @Column(name = "script_uploaded_at", nullable = false)
    private LocalDateTime scriptUploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uuid", nullable = false)
    private User user;
}
