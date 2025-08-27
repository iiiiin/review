package ssafy.i13e206.files.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.user.entity.User;

import java.util.List;
import java.util.Optional;

public interface ScriptRepository extends JpaRepository<ScriptFile, String> {
    List<ScriptFile> findByUser(User user);

    Optional<ScriptFile> findByScriptFileUuid(String scriptFileUuid);

    void deleteByUser(User user);

}
