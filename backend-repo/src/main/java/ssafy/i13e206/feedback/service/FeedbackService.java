package ssafy.i13e206.feedback.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy.i13e206.feedback.dto.*;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.feedback.entity.FeedbackSource;
import ssafy.i13e206.feedback.repository.FeedbackResultRepository; // 통합 Repository 사용
import ssafy.i13e206.interview.dto.ExpressionDto;
import ssafy.i13e206.interview.dto.SegmentDto;
import ssafy.i13e206.interview.entity.*;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;
import ssafy.i13e206.interview.repository.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final InterviewRepository interviewRepository;
    private final PTInterviewRepository ptInterviewRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final QuestionRepository questionRepository;
    private final FeedbackResultRepository feedbackRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PtFeedbackResponseDto getPtInterviewFeedback(String ptAnswerAttemptUuid, int attemptNumber) {

        PTAnswerAttemptId ptAnswerAttemptId = new PTAnswerAttemptId(ptAnswerAttemptUuid, attemptNumber);
        PTAnswerAttempt ptAttempt = ptAnswerAttemptRepository.findById(ptAnswerAttemptId)
                .orElseThrow(() -> new IllegalArgumentException("해당 인터뷰를 찾을 수 없습니다."));

        Feedback ptFeedback = Optional.ofNullable(ptAttempt.getFeedback()).orElse(new Feedback());

        PtPresentationFeedbackDto presentationDto = PtPresentationFeedbackDto.of(
                ptAttempt,
                ptFeedback,
                json -> parseJsonList(json, new TypeReference<List<SegmentDto>>() {}),
                json -> parseJsonList(json, new TypeReference<List<ExpressionDto>>() {})
        );
        Interview interview = ptAttempt.getPtInterview().getInterview();

        return PtFeedbackResponseDto.builder()
                .interviewUuid(interview.getInterviewUuid())
                .ptTitle(ptAttempt.getPtInterview().getTitle())
                .ptSituation(ptAttempt.getPtInterview().getSituation())
                .presentationFeedbacks(List.of(presentationDto))
                .build();
    }

    /**
     * 답변 시도 ID 기반으로 피드백 결과 조회(단일 피드백 결과 조회)
     * @param recordingId 녹화 ID
     * @return
     */
    @Transactional(readOnly = true)
    public FeedBackResultByAnswerAttemptId getFeedBackByAnswerAttemptId(String recordingId) {
        ParsedId parsedId = parseRecordingId(recordingId);

        Optional<FeedBackResultByAnswerAttemptId> feedbackFromNormalAttempt = answerAttemptRepository
                .findById(new AnswerAttemptId(parsedId.sessionId(), parsedId.attemptNumber()))
                .map(this::buildDtoFromAnswerAttempt);

        return feedbackFromNormalAttempt.or(() ->
                ptAnswerAttemptRepository
                        .findById(new PTAnswerAttemptId(parsedId.sessionId(), parsedId.attemptNumber()))
                        .map(this::buildDtoFromPtAnswerAttempt)
        ).orElseThrow(() -> new IllegalArgumentException("유효하지 않은 recordingId 입니다: " + recordingId));
    }

    private record ParsedId(String sessionId, int attemptNumber) {}

    private ParsedId parseRecordingId(String recordingId) {
        String[] parts = recordingId.split("~");
        if (parts.length == 0) {
            throw new IllegalArgumentException("잘못된 형식의 recordingId 입니다: " + recordingId);
        }
        String sessionId = parts[0];
        int attemptNumber = (parts.length > 1) ? Integer.parseInt(parts[1]) + 1 : 1;
        return new ParsedId(sessionId, attemptNumber);
    }

    private FeedBackResultByAnswerAttemptId buildDtoFromAnswerAttempt(AnswerAttempt attempt) {
        Feedback feedback = Optional.ofNullable(attempt.getFeedback()).orElse(new Feedback());
        List<FeedbackSourceDto> feedbackSourceDtos = feedback.getFeedbackSources().stream()
                .map(source -> FeedbackSourceDto.builder()
                        .sourceType(source.getSourceType())
                        .citedContent(source.getCitedContent())
                        .build())
                .toList();
        return FeedBackResultByAnswerAttemptId.builder()
                .feedbackType("NORMAL")
                .question(attempt.getQuestion().getQuestion())
                .videoPath(attempt.getVideoPath())
                .segment(parseJsonList(feedback.getSegment(), new TypeReference<>() {}))
                .transcript(feedback.getTranscript())
                .modelAnswer(feedback.getModelAnswer())
                .expressions(parseJsonList(feedback.getExpression(), new TypeReference<>() {}))
                .feedbackSourceDtos(feedbackSourceDtos)
                .build();
    }

    private FeedBackResultByAnswerAttemptId buildDtoFromPtAnswerAttempt(PTAnswerAttempt ptAttempt) {
        Feedback feedback = Optional.ofNullable(ptAttempt.getFeedback()).orElse(new Feedback());
        List<FeedbackSourceDto> feedbackSourceDtos = feedback.getFeedbackSources().stream()
                .map(source -> FeedbackSourceDto.builder()
                        .sourceType(source.getSourceType())
                        .citedContent(source.getCitedContent())
                        .build())
                .toList();
        return FeedBackResultByAnswerAttemptId.builder()
                .feedbackType("PT")
                .title(ptAttempt.getPtInterview().getTitle())
                .situation(ptAttempt.getPtInterview().getSituation())
                .whiteboard(ptAttempt.getWhiteboard())
                .videoPath(ptAttempt.getVideoPath())
                .segment(parseJsonList(feedback.getSegment(), new TypeReference<>() {}))
                .transcript(feedback.getTranscript())
                .modelAnswer(feedback.getModelAnswer())
                .expressions(parseJsonList(feedback.getExpression(), new TypeReference<>() {}))
                .feedbackSourceDtos(feedbackSourceDtos)
                .build();
    }

    private <T> List<T> parseJsonList(String json, TypeReference<List<T>> typeReference) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            log.error("JSON 파싱에 실패했습니다. JSON: {}", json, e);
            return Collections.emptyList();
        }
    }
}
