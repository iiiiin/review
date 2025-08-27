package ssafy.i13e206.user.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "user_uuid", length = 36)
    private String userUuid;

    @Column(length = 100, nullable = false)
    private String username;

    @Column(length = 255, nullable = false, unique = true)
    private String email;

    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private LocalLogin localLogin;

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SocialLogin> socials = new ArrayList<>();

    /**
     * LocalLogin과의 연관관계를 설정하는 편의 메서드
     */
    public void setLocalLogin(LocalLogin localLogin) {
        this.localLogin = localLogin;
        localLogin.setUser(this);
    }

    /**
     * SocialLogin과의 연관관계를 설정하는 편의 메서드
     */
    public void addSocialLogin(SocialLogin socialLogin) {
        this.socials.add(socialLogin);
        socialLogin.setUser(this);
    }

    public void updateLastModifiedDate() {
        this.updatedAt = LocalDateTime.now();
    }
}
