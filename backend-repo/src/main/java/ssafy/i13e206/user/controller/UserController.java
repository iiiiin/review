package ssafy.i13e206.user.controller;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import ssafy.i13e206.global.dto.ApiResponse;
import ssafy.i13e206.user.dto.request.*;
import ssafy.i13e206.user.dto.response.EmailSendResponse;
import ssafy.i13e206.user.dto.response.EmailVerificationResponse;
import ssafy.i13e206.user.dto.response.IdDuplicateResponse;
import ssafy.i13e206.user.dto.response.MyPageResponseDto;
import ssafy.i13e206.user.service.UserService;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;


    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<?>> signup(@RequestBody @Valid SignupRequest signupRequest) {
        try {
            userService.signup(signupRequest);
            return ResponseEntity.ok(ApiResponse.success("회원가입에 성공하였습니다.", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<ApiResponse<EmailSendResponse>> verifyEmail(@Valid @RequestBody VerifyRequest verifyRequest) throws Exception {
        try {
            EmailSendResponse emailVerificationResponse = userService.sendEmailVerification(verifyRequest.getEmail());
            return ResponseEntity.ok(ApiResponse.success("인증 코드가 이메일로 전송되었습니다.", emailVerificationResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @PostMapping("/signup/code")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> codeEmail(@RequestBody EmailVerificationRequest emailVerificationRequest) throws Exception {
        try {
            boolean isVerified = userService.verifyEmailCode(emailVerificationRequest.getEmail(), emailVerificationRequest.getCode()); // 인증 코드 확인
            EmailVerificationResponse emailVerificationResponse = new EmailVerificationResponse(emailVerificationRequest.getEmail(), isVerified);
            return ResponseEntity.ok(ApiResponse.success("인증 코드가 확인되었습니다.", emailVerificationResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @GetMapping("/signup/checkId")
    public ResponseEntity<ApiResponse<IdDuplicateResponse>> codeEmail(@RequestParam String id) throws Exception {
        try {
            boolean isDuplicated = userService.isIdDuplicate(id); // 인증 코드 확인
            IdDuplicateResponse idDuplicateResponse = new IdDuplicateResponse(isDuplicated);
            return ResponseEntity.ok(ApiResponse.success("아이디 중복 여부를 확인했습니다.", idDuplicateResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @DeleteMapping("/mypage")
    public ResponseEntity<ApiResponse<?>> deleteUser(@AuthenticationPrincipal UserDetails userDetails, HttpServletRequest request, HttpServletResponse response) {
        String accessToken = resolveToken(request);
        if (accessToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "인증 토큰이 존재하지 않습니다."));
        }

        try {
            userService.deleteUser(userDetails.getUsername(), accessToken, response);
            return ResponseEntity.ok(ApiResponse.success("회원 탈퇴가 정상적으로 처리되었습니다.", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, e.getMessage()));
        } catch (Exception e) {
            log.error("▶▶▶ 회원 탈퇴 중 예외 발생:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "서버 내부 오류"));
        }
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @GetMapping("/mypage")
    public ResponseEntity<ApiResponse<?>> getMyPage(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            MyPageResponseDto myPageResponseDto = userService.getMyPageData(userDetails.getUsername()
            );
            return ResponseEntity.ok(ApiResponse.success("성공적으로 프로필 및 파일 목록을 조회했습니다.", myPageResponseDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @PutMapping("/mypage")
    public ResponseEntity<ApiResponse<?>> updatePassword(@AuthenticationPrincipal UserDetails userDetails, @RequestBody PwdUpdateRequestDto pwdUpdateRequestDto) {
        try {
            userService.updatePwd(userDetails.getUsername(), pwdUpdateRequestDto.getCurrentPassword(), pwdUpdateRequestDto.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 수정되었습니다.", null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }
}

