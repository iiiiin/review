package ssafy.i13e206.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.user.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);

    User findByEmail(String email);
    Optional<User> findById(String id);
}

