package ssafy.i13e206.interview.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ssafy.i13e206.interview.entity.InterviewSet;
import ssafy.i13e206.interview.repository.InterviewSetRepository;

@Service
@RequiredArgsConstructor
public class InterviewSetService {

    private final InterviewSetRepository repo;

    public InterviewSet getById(String interviewSetId) {
        return repo.findById(interviewSetId)
                   .orElseThrow(() -> new IllegalArgumentException("Invalid InterviewSet ID: " + interviewSetId));
    }
}
