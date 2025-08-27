package ssafy.i13e206.feedback.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy.i13e206.feedback.dto.AnalysisResultRequest;
import ssafy.i13e206.feedback.dto.ModelAnswerResult;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.feedback.entity.FeedbackSource;
import ssafy.i13e206.feedback.repository.FeedbackResultRepository;
import ssafy.i13e206.feedback.repository.FeedbackSourceRepository;
import ssafy.i13e206.gpt.service.GmsDirectService;
import ssafy.i13e206.interview.entity.*; // ID 클래스 임포트
import ssafy.i13e206.interview.entity.enums.AttemptStatus;
import ssafy.i13e206.interview.repository.AnswerAttemptRepository;
import ssafy.i13e206.interview.repository.PTAnswerAttemptRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AnalysisResultService {

    private final FeedbackResultRepository feedbackResultRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final ObjectMapper objectMapper;
    private final GmsDirectService gmsDirectService;
    private final FeedbackSourceRepository feedbackSourceRepository;

    @Transactional
    public String saveAnalysisResult(AnalysisResultRequest request) {
        String recordingId = request.recordingId();
        String[] parts = recordingId.split("~");
        String sessionId = parts[0];
        int attemptNumber = (parts.length > 1) ? Integer.parseInt(parts[1]) + 1 : 1;

        log.info("분석 결과 처리 시작: sessionId={}, attemptNumber={}", sessionId, attemptNumber);

        Feedback.FeedbackBuilder feedbackBuilder = Feedback.builder();
        String questionText = null;
        String enterpriseName = null;
        String position = null;
        String modelAnswer = null;
        String ptTitle = null;
        String ptSituation = null;
        ModelAnswerResult modelAnswerResult = null;

        AnswerAttemptId attemptId = new AnswerAttemptId(sessionId, attemptNumber);
        Optional<AnswerAttempt> answerAttemptOptional = answerAttemptRepository.findById(attemptId);

        if (answerAttemptOptional.isPresent()) {
            AnswerAttempt answerAttempt = answerAttemptOptional.get();
            answerAttempt.setStatus(AttemptStatus.COMPLETED);
            feedbackBuilder.answerAttempt(answerAttempt);

            questionText = (answerAttempt.getQuestion() != null) ? answerAttempt.getQuestion().getQuestion() : null;
            enterpriseName =  answerAttempt.getQuestion().getInterview().getEnterpriseName();
            position = answerAttempt.getQuestion().getInterview().getPosition();
            InterviewSet interviewSet = answerAttempt.getQuestion().getInterview().getInterviewSet();


            modelAnswerResult = gmsDirectService.generateModelAnswer(questionText, request.transcript(), enterpriseName, position, interviewSet).block();
        } else {
            PTAnswerAttemptId ptAttemptId = new PTAnswerAttemptId(sessionId, attemptNumber);
            Optional<PTAnswerAttempt> ptAnswerAttemptOptional = ptAnswerAttemptRepository.findById(ptAttemptId);

            if (ptAnswerAttemptOptional.isPresent()) {
                PTAnswerAttempt ptAnswerAttempt = ptAnswerAttemptOptional.get();
                ptAnswerAttempt.setStatus(AttemptStatus.COMPLETED);
                feedbackBuilder.ptAnswerAttempt(ptAnswerAttempt);

                ptTitle = ptAnswerAttempt.getPtInterview().getTitle();
                ptSituation = ptAnswerAttempt.getPtInterview().getSituation();
                enterpriseName = ptAnswerAttempt.getPtInterview().getInterview().getEnterpriseName();
                position = ptAnswerAttempt.getPtInterview().getInterview().getPosition();
                InterviewSet interviewSet = ptAnswerAttempt.getPtInterview().getInterview().getInterviewSet();

                modelAnswerResult = gmsDirectService.generatePtModelAnswer(ptTitle, ptSituation, request.transcript(), enterpriseName, position, interviewSet).block();
            } else {
                throw new IllegalArgumentException("Invalid recordingId: " + recordingId);
            }
        }

        String segmentJson = null;
        String expressionJson = null;
        try {
            if (request.analysisResult() != null) {
                if (request.analysisResult().segments() != null) {
                    segmentJson = objectMapper.writeValueAsString(request.analysisResult().segments());
                }
                if (request.analysisResult().expressions() != null) {
                    expressionJson = objectMapper.writeValueAsString(request.analysisResult().expressions());
                }
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to process analysis result JSON", e);
        }
        final ModelAnswerResult finalModelAnswerResult = modelAnswerResult;


        Feedback feedback = feedbackBuilder
                .transcript(request.transcript())
                .segment(segmentJson)
                .expression(expressionJson)
                .modelAnswer(Objects.requireNonNull(finalModelAnswerResult).getModelAnswer())
                .build();

        List<FeedbackSource> feedbackSourceEntities = Optional
                .ofNullable(finalModelAnswerResult.getFeedbackSources())
                .orElseGet(List::of)
                .stream()
                .peek(sourceDto ->
                        log.debug("변환 중인 FeedbackSource DTO -> Type: [{}], CitedContent: [{}]",
                                sourceDto.getSourceType(), sourceDto.getCitedContent())
                )
                .map(sourceDto -> FeedbackSource.builder()
                        .sourceType(sourceDto.getSourceType())
                        .citedContent(sourceDto.getCitedContent())
                        .feedback(feedback) // 부모 Feedback 엔티티와 연결
                        .build())
                .toList();

        feedback.setFeedbackSources(feedbackSourceEntities);

        feedbackResultRepository.save(feedback);

        return finalModelAnswerResult.getModelAnswer();
    }
}
