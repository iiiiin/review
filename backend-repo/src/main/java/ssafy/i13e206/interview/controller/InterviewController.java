package ssafy.i13e206.interview.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import ssafy.i13e206.global.dto.ApiResponse;
import ssafy.i13e206.interview.dto.*;

import ssafy.i13e206.interview.service.InterviewService;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {
    public final InterviewService interviewService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<InterviewStartResponseDto>> startInterview(
            @RequestBody InterviewCreateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        InterviewStartResponseDto responseDto = interviewService.createInterview(userDetails.getUsername(), requestDto);

        ApiResponse<InterviewStartResponseDto> response = ApiResponse.success(
                "면접이 시작되었습니다.",
                responseDto
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generateQuestions")
    public ResponseEntity<?> generateQuestion(@RequestBody RequestQuestionDto requestQuestionDto, @AuthenticationPrincipal UserDetails userDetails){
        InterviewQuestionResponseDto resultDto = interviewService.generateQuestions(requestQuestionDto);

        ApiResponse<InterviewQuestionResponseDto> response = ApiResponse.success(
                "질문 생성이 완료되었습니다.",
                resultDto
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pt/generateProblem")
    public ResponseEntity<ApiResponse<InterviewStartResponseDto>> generatePtProblem(@RequestBody ssafy.i13e206.interview.dto.PTProblemGenerateRequestDto req,
                                                                                    @AuthenticationPrincipal UserDetails userDetails) {
        InterviewStartResponseDto dto = interviewService.generatePtProblemByPtUuid(req.getPtUuid());
        ApiResponse<InterviewStartResponseDto> response = ApiResponse.success("PT 문제 생성이 완료되었습니다.", dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pt/generateQuestions")
    public ResponseEntity<ApiResponse<InterviewStartResponseDto>> generatePtQuestions(@RequestBody ssafy.i13e206.interview.dto.PTProblemGenerateRequestDto req,
                                                                                      @AuthenticationPrincipal UserDetails userDetails) {
        InterviewStartResponseDto dto = interviewService.generatePtQuestionsByPtUuid(req.getPtUuid());
        ApiResponse<InterviewStartResponseDto> response = ApiResponse.success("PT 문제가 생성/갱신되었습니다.", dto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/competency/retry/{questionUuid}")
    public ResponseEntity<ApiResponse<RetryQuestionResponseDto>> getRetryQuestion(@PathVariable String questionUuid) {
        try {
            if (questionUuid == null || questionUuid.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(400, "질문 UUID가 누락되었습니다."));
            }

            RetryQuestionResponseDto resultDto = interviewService.getRetryQuestion(questionUuid);

            ApiResponse<RetryQuestionResponseDto> response = ApiResponse.success(
                    "질문 조회가 완료되었습니다.",
                    resultDto
            );
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @GetMapping("/pt/retry/{interviewUuid}")
    public ResponseEntity<ApiResponse<RetryPtQuestionResponseDto>> getPTRetryQuestion(@PathVariable String interviewUuid) {
        try {
            if (interviewUuid == null || interviewUuid.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(400, "질문 UUID가 누락되었습니다."));
            }

            RetryPtQuestionResponseDto resultDto = interviewService.getRetryPtQuestions(interviewUuid);

            ApiResponse<RetryPtQuestionResponseDto> response = ApiResponse.success(
                    "질문 조회가 완료되었습니다.",
                    resultDto
            );
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }
}
