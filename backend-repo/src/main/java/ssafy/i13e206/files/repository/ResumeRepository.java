package ssafy.i13e206.files.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.user.entity.User;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, String> {
    List<Resume> findByUser(User user);

    Optional<Resume> findByResumeUuid(String resumeUuid);

    void deleteByUser(User user);

}
