package ssafy.i13e206.files.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import ssafy.i13e206.user.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name="portfolio")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Portfolio {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "portfolio_uuid", length = 36)
    private String portfolioUuid;

    @Column(length = 100, nullable = false)
    private String enterpriseName;

    @Column(length = 100, nullable = false)
    private String position;

    @Column(length = 255, nullable = false)
    private String fileName;

    @Column(name= "portfolio_url", length = 500, nullable = false)
    private String portfolioUrl;

    @Lob
    @Column(name = "ocr", columnDefinition = "LONGTEXT", nullable = false)
    private String ocrText;

    @CreatedDate
    @Column(name = "portfolio_uploaded_at", nullable = false)
    private LocalDateTime portfolioUploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uuid", nullable = false)
    private User user;
}