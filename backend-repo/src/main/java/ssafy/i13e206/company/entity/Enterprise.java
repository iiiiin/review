package ssafy.i13e206.company.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "enterprise")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Enterprise {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "enterprise_uuid", length = 36)
    private String enterpriseUuid;

    @Column(length = 100, nullable = false)
    private String enterpriseName;

    @Column(nullable = true)
    private String businessReport;

    @Column(length = 6, nullable = true)
    private String stockCode;
}
