package ssafy.i13e206.interview.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.company.entity.Recruit;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.interview.entity.InterviewSet;
import ssafy.i13e206.user.entity.User;

import java.util.List;

public interface InterviewSetRepository extends JpaRepository<InterviewSet, String> {
    long countByInterviewSetsUuidAndRecruit(String interviewSetsUuid, Recruit recruit);

    // 사용자 이력서(resume)에 속한 세트 전체 조회
    List<InterviewSet> findByResumeIn(List<Resume> resumes);
    // 사용자 포트폴리오(portfolio)에 속한 세트 전체 조회
    List<InterviewSet> findByPortfolioIn(List<Portfolio> portfolios);
    // 사용자 스크립트(scriptFile)에 속한 세트 전체 조회
    List<InterviewSet> findByScriptFileIn(List<ScriptFile> scriptFiles);
}
