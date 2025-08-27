package ssafy.i13e206.auth.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ssafy.i13e206.auth.dto.request.*;
import ssafy.i13e206.auth.dto.response.*;
import ssafy.i13e206.auth.service.AuthService;
import ssafy.i13e206.global.dto.ApiResponse;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    private static final long ACCESS_TOKEN_COOKIE_EXPIRATION = 24 * 60 * 60 * 1000L; //1일
    private static final long REFRESH_TOKEN_COOKIE_EXPIRATION = 7 * 24 * 60 * 60 * 1000L; //7일

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserInfoResponseDto>> login(@RequestBody LoginRequestDto loginRequestDto,
                                                               HttpServletResponse response) {
        try {
            LoginResponseDto loginResponse = authService.login(loginRequestDto);

            Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getRefreshToken());
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true); //HTTPS 환경에서만
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge((int) REFRESH_TOKEN_COOKIE_EXPIRATION);
            response.addCookie(refreshTokenCookie);

            UserInfoResponseDto userInfoResponseDto = UserInfoResponseDto.builder()
                    .id(loginResponse.getUserInfo().getId())
                    .username(loginResponse.getUserInfo().getUsername())
                    .accessToken(loginResponse.getAccessToken())
                    .loginType(loginResponse.getUserInfo().getLoginType())
                    .build();

            return ResponseEntity.ok(ApiResponse.success("로그인 성공", userInfoResponseDto));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, "비밀번호를 잘못 입력하였습니다."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(HttpServletRequest request, HttpServletResponse response) throws Exception {
        try {
            String accessToken = resolveToken(request);

            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(400, "Access Token이 없습니다."));
            }

            // 서비스의 로그아웃 로직 호출
            authService.logout(accessToken);
//            expireCookie(response, "accessToken");
            expireCookie(response, "refreshToken");

            return ResponseEntity.ok(ApiResponse.success("로그아웃 하셨습니다.", null));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "서버 오류가 발생했습니다."));

        }

    }
    private void expireCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
    }


    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @PostMapping("/password/verify")
    public ResponseEntity<ApiResponse<FindPasswordEmailResponseDto>> findPasswordEmail(@RequestBody FindPasswordEmailRequestDto findPasswordRequestDto) {
        try {
            FindPasswordEmailResponseDto findPasswordEmailResponseDto = authService.sendFindPasswordEmail(findPasswordRequestDto.getEmail());

            return ResponseEntity.ok(ApiResponse.success("인증 코드가 이메일로 전송되었습니다.", findPasswordEmailResponseDto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "서버 오류가 발생했습니다."));

        }
    }

    @PostMapping("/password/code")
    public ResponseEntity<ApiResponse<PasswordVerifyCodeResponseDto>> verifyPasswordCode(@RequestBody PasswordVerifyCodeRequestDto requestDto) {
        try {
            PasswordVerifyCodeResponseDto passwordVerifyCodeResponseDto = authService.verifyPasswordResetCode(requestDto.getEmail(), requestDto.getCode());
            return ResponseEntity.ok(ApiResponse.success("인증 코드가 확인되었습니다.", passwordVerifyCodeResponseDto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<?>> verifyPasswordCode(@RequestBody RenewPasswordRequestDto renewPasswordRequestDto) {
        try {
            authService.resetPassword(renewPasswordRequestDto.getEmail(), renewPasswordRequestDto.getNewPassword(), renewPasswordRequestDto.getConfirmPassword());
            return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 변경되었습니다.", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponseDto>> refreshAccessToken(
            HttpServletRequest request, HttpServletResponse response) {


        try {
            String refreshToken = Arrays.stream(request.getCookies())
                    .filter(cookie -> "refreshToken".equals(cookie.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Refresh Token을 찾을 수 없습니다."));

            TokenRefreshResponseDto tokenRefreshResponseDto = authService.refreshAccessToken(refreshToken);

            return ResponseEntity.ok(ApiResponse.success("Access Token이 성공적으로 재발급되었습니다.", tokenRefreshResponseDto));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }

    }
}
