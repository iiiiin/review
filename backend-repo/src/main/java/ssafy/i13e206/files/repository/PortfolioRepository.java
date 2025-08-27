package ssafy.i13e206.files.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.user.entity.User;

import java.util.List;
import java.util.Optional;

public interface PortfolioRepository  extends JpaRepository<Portfolio, String> {
    List<Portfolio> findByUser(User user);

    Optional<Portfolio> findByPortfolioUuid(String portfolioUuid);

    void deleteByUser(User user);
}
