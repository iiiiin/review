package ssafy.i13e206.feedback.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ssafy.i13e206.feedback.dto.FeedBackResultByAnswerAttemptId;
import ssafy.i13e206.feedback.dto.FeedbackRequestDto;
import ssafy.i13e206.feedback.dto.PtFeedbackResponseDto;
import ssafy.i13e206.feedback.dto.PtQuestionFeedbackDto;
import ssafy.i13e206.feedback.service.FeedbackService;
import ssafy.i13e206.global.dto.ApiResponse;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/pt")
    public ResponseEntity<ApiResponse<PtFeedbackResponseDto>> getPtInterviewFeedbackForQuestion(@RequestBody FeedbackRequestDto request) {
        try {
            PtFeedbackResponseDto ptFeedbackResponseDto = feedbackService.getPtInterviewFeedback(
                    request.getPtAnswerAttemptUuid(),
//                    request.getAnswerAttempts(),
                    request.getAttemptNumber());
            return ResponseEntity.ok(ApiResponse.success("PT 면접 피드백 조회에 성공했습니다.", ptFeedbackResponseDto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "서버 내부 오류가 발생했습니다."));
        }
    }

    /**
     * 답변 시도 ID로 피드백을 조회하는 API
     * @param answerAttemptId 조회할 답변 시도 ID
     * @return 조회된 피드백 정보
     */
    @GetMapping("/{answerAttemptId}")
    public ResponseEntity<ApiResponse<?>> getFeedbackByAnswerAttemptId(@PathVariable String answerAttemptId
            ,@AuthenticationPrincipal UserDetails userDetails) {
        try {
            FeedBackResultByAnswerAttemptId feedbackData = feedbackService.getFeedBackByAnswerAttemptId(answerAttemptId);
            return ResponseEntity.ok(ApiResponse.success("피드백 조회에 성공했습니다.", feedbackData));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), e.getMessage()));
        } catch (Exception e) {
            // 그 외의 모든 서버 오류 처리
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "서버 내부 오류가 발생했습니다."));
        }
    }
}