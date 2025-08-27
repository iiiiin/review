package ssafy.i13e206.user.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import ssafy.i13e206.user.constant.LoginType;

@Entity
@Table(name = "social")
@Getter @Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialLogin {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "social_uuid", length = 36)
    private String socialUuid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private LoginType provider;

    @ManyToOne
    @JoinColumn(name = "user_uuid", referencedColumnName = "user_uuid", nullable = false)
    private User user;

    public void setUser(User user) {
        this.user = user;
    }

}
