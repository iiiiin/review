package ssafy.i13e206.user.entity;

import jakarta.persistence.*;
import lombok.*;
// import org.hibernate.annotations.GenericGenerator; // 더 이상 필요 없음

@Entity
@Table(name = "local")
@Getter @Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LocalLogin {

    @Id // 이 필드가 기본 키인 것은 동일합니다.
    @Column(name = "local_uuid", length = 36)
    private String localUuid;

    @Column(nullable = false, length = 20)
    private String id;

    @Column(nullable = false, length = 255)
    private String password;

    @OneToOne
    // ▼▼▼ @JoinColumn을 @MapsId로 변경합니다. ▼▼▼
    @MapsId
    @JoinColumn(name = "local_uuid")
    private User user;

    public void setUser(User user) {
        this.user = user;
    }

    public void changePassword(String newPassword) {
        this.password = newPassword;
    }
}