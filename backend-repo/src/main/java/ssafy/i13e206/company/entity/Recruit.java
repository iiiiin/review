package ssafy.i13e206.company.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import ssafy.i13e206.user.entity.User;

@Entity
@Table(name = "recruit")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Recruit {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "recruit_uuid", length = 36)
    private String recruitUuid;

    @Column(length = 30, nullable = false)
    private String categoryMain;

    @Column(length = 50, nullable = false)
    private String categorySub;

    @Column(length = 255, nullable = false)
    private String position;

    @Column(length = 200, nullable = false)
    private String task;

    @ManyToOne
    @JoinColumn(name = "enterprise_uuid", referencedColumnName = "enterprise_uuid", nullable = false)
    private Enterprise enterprise;
}
