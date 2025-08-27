package ssafy.i13e206.interview.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ssafy.i13e206.global.dto.ApiResponse;
import ssafy.i13e206.interview.dto.AttemptResponseDto;
import ssafy.i13e206.interview.service.AnswerAttemptService;

@RestController
@RequestMapping("/api/questions/")
@RequiredArgsConstructor
public class AnswerAttemptController {

    private final AnswerAttemptService answerAttemptService;

    @PostMapping("{questionUuid}/attempts")
    public ResponseEntity<ApiResponse<AttemptResponseDto>> createAnswerAttempt(
            @PathVariable String questionUuid,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userUuid = userDetails.getUsername();
        AttemptResponseDto responseDto = answerAttemptService.createAttempt(questionUuid);
        ApiResponse<AttemptResponseDto> response = ApiResponse.success(
                "답변 시도 및 세션이 생성되었습니다.",
                responseDto
        );
        return ResponseEntity.ok(response);
    }
}