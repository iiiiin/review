package ssafy.i13e206.company.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.company.entity.Recruit;

import java.util.List;

public interface RecruitRepository extends JpaRepository<Recruit, String> {
    List<Recruit> findByEnterprise_EnterpriseUuid(String enterpriseUuid);
}
