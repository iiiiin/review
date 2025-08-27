package ssafy.i13e206.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.user.entity.LocalLogin;

import java.util.Optional;

public interface LocalLoginRepository extends JpaRepository<LocalLogin, Long> {
    boolean existsById(String id);
    Optional<LocalLogin> findById(String id);
}
