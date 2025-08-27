package ssafy.i13e206.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.user.entity.SocialLogin;

public interface SocialLoginRepository extends JpaRepository<SocialLogin, Long> {
}
