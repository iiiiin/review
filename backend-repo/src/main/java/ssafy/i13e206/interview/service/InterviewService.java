package ssafy.i13e206.interview.service;

import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ssafy.i13e206.company.entity.Recruit;
import ssafy.i13e206.company.repository.RecruitRepository;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.files.repository.PortfolioRepository;
import ssafy.i13e206.files.repository.ResumeRepository;
import ssafy.i13e206.files.repository.ScriptRepository;
import ssafy.i13e206.gpt.service.GmsDirectService;
import ssafy.i13e206.interview.dto.*;
import ssafy.i13e206.interview.entity.*;
import ssafy.i13e206.interview.entity.enums.InterviewType;
import ssafy.i13e206.interview.repository.*;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.UserRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewService {
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final ResumeRepository resumeRepository;
    private final ScriptRepository scriptFileRepository;
    private final RecruitRepository recruitRepository;
    private final InterviewSetRepository interviewSetRepository;
    private final InterviewRepository interviewRepository;
    private final QuestionRepository questionRepository;
    private final GmsDirectService gmsDirectService;
    private final PTInterviewRepository ptInterviewRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final AnswerAttemptRepository answerAttemptRepository;

    @Transactional
    public InterviewStartResponseDto createInterview(String userUuid, InterviewCreateRequestDto requestDto) {
        User user = userRepository.findById(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Resume resume = resumeRepository.findById(requestDto.getResumeUuid())
                .orElseThrow(() -> new IllegalArgumentException("이력서를 찾을 수 없습니다."));

        Recruit recruit = recruitRepository.findById(requestDto.getRecruitUuid())
                .orElseThrow(() -> new IllegalArgumentException("채용 공고를 찾을 수 없습니다."));

        Portfolio portfolio = null;
        if (requestDto.getPortfolioUuid() != null) {
            portfolio = portfolioRepository.findById(requestDto.getPortfolioUuid()).orElse(null);
        }

        ScriptFile scriptFile = null;
        if (requestDto.getScriptFileUuid() != null) {
            scriptFile = scriptFileRepository.findById(requestDto.getScriptFileUuid()).orElse(null);
        }

        if (requestDto.getInterviewType() == null || requestDto.getInterviewType().isBlank()) {
            throw new IllegalArgumentException("인터뷰 타입이 필요합니다.");
        }

        InterviewType interviewTypeEnum;
        try {
            interviewTypeEnum = InterviewType.valueOf(requestDto.getInterviewType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 interviewType 입니다: " + requestDto.getInterviewType());
        }

        InterviewSet interviewSet = InterviewSet.builder()
                .interviewSetsUuid(UUID.randomUUID().toString())
                .resume(resume)
                .recruit(recruit)
                .portfolio(portfolio)
                .scriptFile(scriptFile)
                .interviewType(interviewTypeEnum)
                .build();
        interviewSetRepository.save(interviewSet);

        Interview interview = Interview.builder()
                .interviewUuid(UUID.randomUUID().toString())
                .interviewSet(interviewSet)
                .user(user)
                .enterpriseName(recruit.getEnterprise().getEnterpriseName())
                .position(recruit.getPosition())
                .interviewType(interviewTypeEnum)
                .interviewCount(1)
                .createdAt(LocalDateTime.now())
                .build();
        interviewRepository.save(interview);

        InterviewStartResponseDto.InterviewStartResponseDtoBuilder interviewStartResponseDtoBuilder = InterviewStartResponseDto.builder()
                .interviewUuid(interview.getInterviewUuid());

        if (interviewTypeEnum == InterviewType.PT) {
            PTProblemDto ptProblem = gmsDirectService.generatePtProblem(interviewSet).block();

            if (ptProblem == null) {
                throw new RuntimeException("AI로부터 PT 문제를 생성하는 데 실패했습니다.");
            }

            PTInterview ptInterview = PTInterview.builder()
                    .ptUuid(UUID.randomUUID().toString())
                    .interview(interview)
                    .title(ptProblem.getTitle())
                    .situation(ptProblem.getSituation())
                    .createdAt(LocalDateTime.now())
                    .build();
            ptInterviewRepository.save(ptInterview);

            interviewStartResponseDtoBuilder.questionUuid(ptInterview.getPtUuid());
            interviewStartResponseDtoBuilder.title(ptInterview.getTitle());
            interviewStartResponseDtoBuilder.situation(ptInterview.getSituation());
        }

        return interviewStartResponseDtoBuilder.build();
    }

    @Transactional
    public InterviewQuestionResponseDto generateQuestions(RequestQuestionDto requestQuestionDto) {
        long startTime = System.currentTimeMillis();

        Interview interview = interviewRepository.findById(requestQuestionDto.getInterviewUuid())
                .orElseThrow(() -> new IllegalArgumentException("생성된 인터뷰가 없습니다."));
        List<Question> previousQuestions = questionRepository.findByInterview_InterviewUuidOrderByQuestionNumber(requestQuestionDto.getInterviewUuid());

        InterviewType interviewType = interview.getInterviewType();
        InterviewQuestionResponseDto aiResponseDto = null;
        if(interviewType == InterviewType.PT){
            PTInterview latestPt = ptInterviewRepository
                    .findTopByInterviewOrderByCreatedAtDesc(interview)
                    .orElseThrow(() -> new IllegalArgumentException("PT 면접을 찾을 수 없습니다."));
            aiResponseDto = gmsDirectService.generatePTQuestions(latestPt).block();
        }else{
            aiResponseDto = gmsDirectService.generateGeneralQuestions(interview.getInterviewSet(), previousQuestions).block();
        }

        if (aiResponseDto == null || aiResponseDto.getQuestions() == null || aiResponseDto.getQuestions().isEmpty()) {
            throw new RuntimeException("AI로부터 유효한 질문을 생성하지 못했습니다.");
        }

        InterviewQuestionResponseDto finalResponse = saveAndMapAiResponse(interview, previousQuestions, aiResponseDto);

        long processingTime = System.currentTimeMillis() - startTime;
        finalResponse.setProcessingTimeMs(processingTime);

        return finalResponse;
    }


    @Transactional
    public InterviewStartResponseDto generatePtQuestionsByPtUuid(String ptUuid) {

        PTInterview ptInterview = ptInterviewRepository.findById(ptUuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 PT 면접을 찾을 수 없습니다."));

        Interview interview = ptInterview.getInterview();
        if (interview.getInterviewType() != InterviewType.PT) {
            throw new IllegalArgumentException("PT 면접이 아닙니다.");
        }

        // 기존 PTInterview를 재사용하여 질문을 생성/재시작하는 용도.
        // 새로운 PTInterview를 생성하지 않고 동일 PT 시나리오에 리트라이가 묶이도록 유지
        return InterviewStartResponseDto.builder()
                .interviewUuid(interview.getInterviewUuid())
                .questionUuid(ptInterview.getPtUuid())
                .title(ptInterview.getTitle())
                .situation(ptInterview.getSituation())
                .build();
    }

    private InterviewQuestionResponseDto saveAndMapAiResponse(Interview interview, List<Question> previousQuestions, InterviewQuestionResponseDto dtoFromAI) {
        int currentMaxQuestionNumber = previousQuestions.stream()
                .mapToInt(Question::getQuestionNumber)
                .max()
                .orElse(0);

        List<Question> newQuestionsToSave = new ArrayList<>();
        InterviewQuestionResponseDto.Question mainQuestionDtoFromAI = dtoFromAI.getQuestions().get(0);

        Question mainQuestionEntity = Question.builder()
                .questionUuid(UUID.randomUUID().toString())
                .interview(interview)
                .parent(null)
                .questionNumber(currentMaxQuestionNumber + 1)
                .question(mainQuestionDtoFromAI.getQuestion())
                .purpose(mainQuestionDtoFromAI.getIntent())
                .suggestedAnswer(mainQuestionDtoFromAI.getRationale())
                .build();
        newQuestionsToSave.add(mainQuestionEntity);

        List<InterviewQuestionResponseDto.Question.FollowUp> followUpsForResponse = new ArrayList<>();
        if (mainQuestionDtoFromAI.getFollowUps() != null) {
            int followUpIndex = 1;
            for (InterviewQuestionResponseDto.Question.FollowUp followUpDtoFromAI : mainQuestionDtoFromAI.getFollowUps()) {
                Question followUpEntity = Question.builder()
                        .questionUuid(UUID.randomUUID().toString())
                        .interview(interview)
                        .parent(mainQuestionEntity)
                        .questionNumber(currentMaxQuestionNumber + 1 + followUpIndex)
                        .question(followUpDtoFromAI.getQuestion())
                        .purpose(followUpDtoFromAI.getIntent())
                        .suggestedAnswer(followUpDtoFromAI.getRationale())
                        .build();
                newQuestionsToSave.add(followUpEntity);

                followUpsForResponse.add(InterviewQuestionResponseDto.Question.FollowUp.builder()
                        .id(followUpEntity.getQuestionUuid())
                        .question(followUpEntity.getQuestion())
                        .intent(followUpEntity.getPurpose())
                        .rationale(followUpEntity.getSuggestedAnswer())
                        .relatedSources(followUpDtoFromAI.getRelatedSources())
                        .build());
                followUpIndex++;
            }
        }

        questionRepository.saveAll(newQuestionsToSave);
        log.info("{}개의 새로운 질문이 인터뷰[{}]에 저장되었습니다.", newQuestionsToSave.size(), interview.getInterviewUuid());

        InterviewQuestionResponseDto.Question mainQuestionForResponse = InterviewQuestionResponseDto.Question.builder()
                .id(mainQuestionEntity.getQuestionUuid())
                .type(mainQuestionDtoFromAI.getType())
                .question(mainQuestionEntity.getQuestion())
                .intent(mainQuestionEntity.getPurpose())
                .category(mainQuestionDtoFromAI.getCategory())
                .difficulty(mainQuestionDtoFromAI.getDifficulty())
                .rationale(mainQuestionEntity.getSuggestedAnswer())
                .relatedSources(mainQuestionDtoFromAI.getRelatedSources())
                .followUps(followUpsForResponse)
                .build();

        return InterviewQuestionResponseDto.builder()
                .interviewSetUuid(dtoFromAI.getInterviewSetUuid())
                .questions(List.of(mainQuestionForResponse))
                .build();
    }

    public RetryQuestionResponseDto getRetryQuestion(String questionUuid) {
        long startTime = System.currentTimeMillis();

        Question mainQuestion = questionRepository.findById(questionUuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 질문을 찾을 수 없습니다."));

        Optional<Integer> maxAttemptNumber = answerAttemptRepository
                .findTopByQuestion_QuestionUuidOrderById_AttemptNumberDesc(questionUuid)
                .map(attempt -> attempt.getId().getAttemptNumber());

        int nextAttemptNumber = maxAttemptNumber.orElse(0) + 1;

        List<Question> followUpEntities = questionRepository.findByParent_QuestionUuidOrderByQuestionNumberAsc(questionUuid);

        List<RetryQuestionResponseDto.Question.FollowUp> followUpsForResponse = followUpEntities.stream()
                .map(followUpEntity -> RetryQuestionResponseDto.Question.FollowUp.builder()
                        .id(followUpEntity.getQuestionUuid())
                        .question(followUpEntity.getQuestion())
                        .intent(followUpEntity.getPurpose())
                        .rationale(followUpEntity.getSuggestedAnswer())
                        .attemptNumber(nextAttemptNumber)
                        .build())
                .collect(Collectors.toList());

        RetryQuestionResponseDto.Question mainQuestionForResponse = RetryQuestionResponseDto.Question.builder()
                .id(mainQuestion.getQuestionUuid())
                .question(mainQuestion.getQuestion())
                .intent(mainQuestion.getPurpose())
                .rationale(mainQuestion.getSuggestedAnswer())
                .attemptNumber(nextAttemptNumber)
                .followUps(followUpsForResponse)
                .build();

        RetryQuestionResponseDto responseDto = RetryQuestionResponseDto.builder()
                .questions(List.of(mainQuestionForResponse))
                .interviewSetUuid(mainQuestion.getInterview().getInterviewSet().getInterviewSetsUuid())
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();

        log.info("질문 UUID [{}]에 대한 조회(1단계 꼬리 질문 포함)가 완료되었습니다. 소요 시간: {}ms", questionUuid, responseDto.getProcessingTimeMs());

        return responseDto;
    }

    public RetryPtQuestionResponseDto getRetryPtQuestions(String interviewUuid) {
        long startTime = System.currentTimeMillis();

        PTInterview ptInterview = ptInterviewRepository.findTopByInterviewOrderByCreatedAtDesc(
                        interviewRepository.findById(interviewUuid).orElseThrow(() -> new IllegalArgumentException("생성된 인터뷰가 없습니다.")))
                .orElseThrow(() -> new IllegalArgumentException("해당 PT 면접을 찾을 수 없습니다."));

        Optional<Integer> maxPtAttemptNumber = ptAnswerAttemptRepository.findTopByPtInterview_PtUuidOrderById_AttemptNumberDesc(ptInterview.getPtUuid())
                .map(attempt -> attempt.getId().getAttemptNumber());

        int nextPtAttemptNumber = maxPtAttemptNumber.orElse(0) + 1;

        RetryPtQuestionResponseDto.PtInterviewDto ptInterviewDto = RetryPtQuestionResponseDto.PtInterviewDto.builder()
                .id(ptInterview.getPtUuid())
                .title(ptInterview.getTitle())
                .situation(ptInterview.getSituation())
                .attemptNumber(nextPtAttemptNumber)
                .build();

        RetryPtQuestionResponseDto responseDto = RetryPtQuestionResponseDto.builder()
                .interviewSetUuid(ptInterview.getInterview().getInterviewSet().getInterviewSetsUuid())
                .ptInterview(List.of(ptInterviewDto))
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();

        log.info("PT 면접 UUID [{}]에 대한 질문 조회가 완료되었습니다. 소요 시간: {}ms", interviewUuid, responseDto.getProcessingTimeMs());

        return responseDto;
    }

    @Transactional
    public InterviewStartResponseDto generatePtProblemByPtUuid(String ptUuid) {
        PTInterview ptInterview = ptInterviewRepository.findById(ptUuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 PT 면접을 찾을 수 없습니다."));

        Interview interview = ptInterview.getInterview();
        if (interview.getInterviewType() != InterviewType.PT) {
            throw new IllegalArgumentException("PT 면접이 아닙니다.");
        }

        // recruit/company 기반으로 새로운 PT 문제 생성 → 새로운 PTInterview 엔티티 발급 (새 ptUuid)
        PTProblemDto ptProblem = gmsDirectService.generatePtProblem(interview.getInterviewSet()).block();
        if (ptProblem == null) {
            throw new RuntimeException("AI로부터 PT 문제를 생성하는 데 실패했습니다.");
        }

        PTInterview newPtInterview = PTInterview.builder()
                .ptUuid(UUID.randomUUID().toString())
                .interview(interview)
                .title(ptProblem.getTitle())
                .situation(ptProblem.getSituation())
                .createdAt(LocalDateTime.now())
                .build();
        ptInterviewRepository.save(newPtInterview);

        return InterviewStartResponseDto.builder()
                .interviewUuid(interview.getInterviewUuid())
                .questionUuid(newPtInterview.getPtUuid())
                .title(newPtInterview.getTitle())
                .situation(newPtInterview.getSituation())
                .build();
    }
}
