package ssafy.i13e206.interview.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ssafy.i13e206.company.entity.Recruit;
import ssafy.i13e206.feedback.dto.FeedbackSourceDto;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.feedback.entity.FeedbackSource;
import ssafy.i13e206.files.constant.FileType;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.interview.dto.*;
import ssafy.i13e206.interview.entity.*;
import ssafy.i13e206.interview.entity.enums.InterviewType;
import ssafy.i13e206.interview.repository.*;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.UserRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class InterviewHistoryService {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;
    private final QuestionRepository questionRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final PTInterviewRepository ptInterviewRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final InterviewSetRepository interviewSetRepository;
    private final ObjectMapper objectMapper;

    public InterviewDetailResponseDto getInterviewDetail(String username, String interviewUuid) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));

        Interview interview = interviewRepository.findByUserAndInterviewUuid(user, interviewUuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 면접 정보를 조회할 권한이 없습니다."));

        String time = calculateDuration(interview.getCreatedAt(), interview.getFinishedAt());
        List<QuestionDto> questionDtos = getQuestionDtos(interviewUuid);

        InterviewDetailResponseDto.InterviewDetailResponseDtoBuilder responseBuilder = InterviewDetailResponseDto.builder()
                .interviewUuid(interview.getInterviewUuid())
                .enterpriseName(interview.getEnterpriseName())
                .position(interview.getPosition())
                .interviewType(interview.getInterviewType())
                .createdAt(interview.getCreatedAt())
                .duration(time)
                .questions(questionDtos)
                .questionCount(questionDtos.size());

        if (interview.getInterviewType() == InterviewType.PT) {
            List<PTInterview> ptList = ptInterviewRepository.findAllByInterview_InterviewUuidOrderByCreatedAtAsc(interview.getInterviewUuid());

            List<PTInterviewDetailResponseDto> ptDetails = ptList.stream().map(pt -> {
                List<RetryDto> ptRetries = ptAnswerAttemptRepository
                        .findByPtInterviewOrderById_AttemptNumber(pt)
                        .stream()
                        .map(this::mapToRetryDtoForPT)
                        .collect(Collectors.toList());

                List<QuestionDto> ptQuestions = questionRepository.findByInterview_InterviewUuidOrderByQuestionNumber(
                                interview.getInterviewUuid())
                        .stream()
                        .map(q -> new QuestionDto(q.getQuestionNumber(), q.getQuestion(), Collections.emptyList()))
                        .sorted((q1, q2) -> Integer.compare(q1.questionNumber(), q2.questionNumber()))
                        .collect(Collectors.toList());

                return PTInterviewDetailResponseDto.builder()
                        .title(pt.getTitle())
                        .situation(pt.getSituation())
                        .enterpriseName(interview.getEnterpriseName())
                        .position(interview.getPosition())
                        .interviewType(interview.getInterviewType())
                        .createdAt(pt.getCreatedAt())
                        .time(calculateDuration(interview.getCreatedAt(), interview.getFinishedAt()))
                        .questionCount(ptQuestions.size())
                        .retryCount(ptRetries.size())
                        .retry(ptRetries)
                        .questions(ptQuestions)
                        .build();
            }).collect(Collectors.toList());

            responseBuilder.ptInterviews(ptDetails);
        }

        return responseBuilder.build();
    }

    public InterviewHistoryResponseDto getInterviewHistory(String username) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<Interview> interviews = interviewRepository.findInterviewsWithDetailsByUser(user);

        List<InterviewHistorySummaryDto> interviewSummaries = interviews.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        int totalCount = interviewSummaries.size();

        YearMonth currentMonth = YearMonth.now();
        long thisMonthCount = interviewSummaries.stream()
                .filter(summary -> {
                    LocalDateTime createdAt = summary.getCreatedAt();
                    return createdAt != null && YearMonth.from(createdAt).equals(currentMonth);
                })
                .count();

        return InterviewHistoryResponseDto.builder()
                .totalCount(totalCount)
                .thisMonthCount((int) thisMonthCount)
                .interviews(interviewSummaries)
                .build();
    }

    public void deleteInterview(String interviewUuid, String username) {
        Interview interview = interviewRepository.findById(interviewUuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 면접 세션을 찾을 수 없습니다."));

        User user = userRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!interview.getUser().getUserUuid().equals(user.getUserUuid())) {
            throw new SecurityException("해당 면접 이력을 삭제할 권한이 없습니다.");
        }

        InterviewSet interviewSet = interview.getInterviewSet();
        String interviewSetUuid = interviewSet.getInterviewSetsUuid();
        Recruit recruit = interviewSet.getRecruit();

        long interviewCount = interviewSetRepository.countByInterviewSetsUuidAndRecruit(interviewSetUuid, recruit);

        interviewRepository.delete(interview);

        if (interviewCount == 1) {
            interviewSetRepository.delete(interviewSet);
        }
    }

    private List<QuestionDto> getQuestionDtos(String interviewUuid) {
        return questionRepository
                .findByInterview_InterviewUuidOrderByQuestionNumber(interviewUuid)
                .stream()
                .map(q -> {
                    List<RetryDto> retries = answerAttemptRepository
                            .findByQuestion_QuestionUuidOrderById_AttemptNumber(q.getQuestionUuid())
                            .stream()
                            .map(a -> mapToRetryDtoForQuestion(a, q))
                            .collect(Collectors.toList());
                    return new QuestionDto(q.getQuestionNumber(), q.getQuestion(), retries);
                }).collect(Collectors.toList());
    }

    private RetryDto mapToRetryDtoForQuestion(AnswerAttempt attempt, Question question) {
        Feedback feedback = attempt.getFeedback();
        if (feedback == null) {
            return new RetryDto(attempt.getVideoPath(), question.getPurpose(),
                    Collections.emptyList(),
                    "",
                    Collections.emptyList(),
                    "",
                    Collections.emptyList(),
                    attempt.getId().getAttemptNumber()
            );
        }

        return new RetryDto(
                attempt.getVideoPath(),
                question.getPurpose(),
                parseJsonList(feedback.getExpression(), new TypeReference<List<ExpressionDto>>() {}),
                feedback.getTranscript(),
                parseJsonList(feedback.getSegment(), new TypeReference<List<SegmentDto>>() {}),
                feedback.getModelAnswer(),                       // String
                mapFeedbackSources(feedback.getFeedbackSources()),
                attempt.getId().getAttemptNumber()
        );
    }

    private RetryDto mapToRetryDtoForPT(PTAnswerAttempt attempt) {
        Feedback feedback = attempt.getFeedback();
        // PTAnswerAttempt와 연결된 PTInterview 엔티티를 가져옵니다.
        PTInterview ptInterview = attempt.getPtInterview();

        if (feedback == null) {
            return new RetryDto(attempt.getVideoPath(), ptInterview.getTitle(),
                    Collections.emptyList(), "", Collections.emptyList(),"", Collections.emptyList(),
                    attempt.getId().getAttemptNumber());
        }

        return new RetryDto(
                attempt.getVideoPath(),
                ptInterview.getTitle(),
                parseJsonList(feedback.getExpression(), new TypeReference<List<ExpressionDto>>() {}),
                feedback.getTranscript(),
                parseJsonList(feedback.getSegment(), new TypeReference<List<SegmentDto>>() {}),
                feedback.getModelAnswer(),
                mapFeedbackSources(feedback.getFeedbackSources()),
                attempt.getId().getAttemptNumber()
        );
    }


    private List<FeedbackSourceDto> mapFeedbackSources(List<FeedbackSource> list) {
        if (list == null) return Collections.emptyList();
        return list.stream()
                .map(fs -> new FeedbackSourceDto(fs.getSourceType(), fs.getCitedContent()))
                .toList();
    }


    private <T> List<T> parseJsonList(String json, TypeReference<List<T>> typeReference) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    private InterviewHistorySummaryDto convertToDto(Interview interview) {
        InterviewSet interviewSet = interview.getInterviewSet();
        Recruit recruit = interviewSet.getRecruit();

        List<InterviewHistoryDocumentDto> files = new ArrayList<>();

        Resume resume = interviewSet.getResume();
        files.add(InterviewHistoryDocumentDto.builder()
                .fileUuid(resume.getResumeUuid())
                .fileType(FileType.RESUME)
                .fileUrl(resume.getResumeUrl())
                .build());

        if (interviewSet.getPortfolio() != null) {
            files.add(InterviewHistoryDocumentDto.builder()
                    .fileUuid(interviewSet.getPortfolio().getPortfolioUuid())
                    .fileType(FileType.PORTFOLIO)
                    .fileUrl(interviewSet.getPortfolio().getPortfolioUrl())
                    .build());
        }

        if (interviewSet.getScriptFile() != null) {
            files.add(InterviewHistoryDocumentDto.builder()
                    .fileUuid(interviewSet.getScriptFile().getScriptFileUuid())
                    .fileType(FileType.SCRIPT)
                    .fileUrl(interviewSet.getScriptFile().getScriptUrl())
                    .build());
        }

        return InterviewHistorySummaryDto.builder()
                .interviewUuid(interview.getInterviewUuid())
                .InterviewType(interview.getInterviewType())
                .createdAt(interview.getCreatedAt())
                .finishedAt(interview.getFinishedAt())
                .enterpriseName(recruit.getEnterprise().getEnterpriseName())
                .position(recruit.getPosition())
                .questionCount(interview.getQuestions() != null ? interview.getQuestions().size() : 0)
                .files(files)
                .build();
    }

    private String calculateDuration(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return "00:00:00";
        Duration duration = Duration.between(start, end);
        long seconds = duration.getSeconds();
        return String.format("%02d:%02d:%02d", seconds / 3600, (seconds % 3600) / 60, seconds % 60);
    }
}
