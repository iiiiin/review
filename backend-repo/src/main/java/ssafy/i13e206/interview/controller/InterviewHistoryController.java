package ssafy.i13e206.interview.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ssafy.i13e206.global.dto.ApiResponse;
import ssafy.i13e206.interview.dto.InterviewDetailResponseDto;
import ssafy.i13e206.interview.dto.InterviewHistoryResponseDto;
import ssafy.i13e206.interview.service.InterviewHistoryService;

@RestController
@RequestMapping("/api/interview/history")
@RequiredArgsConstructor
public class InterviewHistoryController {
    private final InterviewHistoryService interviewHistoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<InterviewHistoryResponseDto>> getInterviewHistory(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            InterviewHistoryResponseDto interviewHistoryResponse = interviewHistoryService.getInterviewHistory(userDetails.getUsername());
            return ResponseEntity.ok(ApiResponse.success("면접 이력을 성공적으로 조회했습니다.", interviewHistoryResponse));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(403, "접근 권한이 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @GetMapping("/{interviewUuid}")
    public ResponseEntity<ApiResponse<InterviewDetailResponseDto>> getInterviewDetail(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String interviewUuid) {
        try {
            InterviewDetailResponseDto interviewDetail = interviewHistoryService.getInterviewDetail(userDetails.getUsername(), interviewUuid);
            return ResponseEntity.ok(ApiResponse.success("면접 상세 이력을 성공적으로 조회했습니다.", interviewDetail));
        }
        catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, e.getMessage()));
        }
        catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(403, "접근 권한이 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @DeleteMapping("/{interviewUuid}")
    public ResponseEntity<ApiResponse<Void>> deleteInterview(
            @PathVariable("interviewUuid") String interviewUuid,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (interviewUuid == null || interviewUuid.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "interviewUuid는 필수입니다."));
        }

        try {
            interviewHistoryService.deleteInterview(interviewUuid, userDetails.getUsername());

            return  ResponseEntity.ok(ApiResponse.success("면접 이력이 성공적으로 삭제되었습니다.", null)
            );
        } catch (IllegalArgumentException e) {
            // 유효하지 않은 세션 UUID 또는 존재하지 않는 면접
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, "해당 면접 세션을 찾을 수 없습니다."));
        } catch (SecurityException e) {
            // 권한 없음
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(403, "해당 면접 이력을 삭제할 권한이 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }
}
