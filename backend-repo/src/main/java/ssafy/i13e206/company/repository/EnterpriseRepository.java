package ssafy.i13e206.company.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.company.entity.Enterprise;

public interface EnterpriseRepository extends JpaRepository<Enterprise, Integer> {
}
