package ssafy.i13e206.auth.oauth2.handler;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import ssafy.i13e206.auth.oauth2.CustomUserDetails;
import ssafy.i13e206.security.jwt.JwtToken;
import ssafy.i13e206.security.jwt.JwtTokenProvider;
import ssafy.i13e206.security.jwt.RefreshToken;
import ssafy.i13e206.security.jwt.RefreshTokenRepository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    private static final long ACCESS_TOKEN_COOKIE_EXPIRATION = 60 * 60 * 24 * 1000L; // 1일
    private static final long REFRESH_TOKEN_COOKIE_EXPIRATION = 60 * 60 * 24 * 7* 1000L; // 7일

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        // 인증된 사용자 정보 가져오기
        CustomUserDetails oAuth2User = (CustomUserDetails) authentication.getPrincipal();

        // JWT 토큰 생성
        JwtToken jwtToken = jwtTokenProvider.generateToken(authentication);
        log.info("JWT 토큰 생성 완료: {}", oAuth2User.getName());

        // Refresh Token을 데이터베이스에 저장
        RefreshToken refreshToken = new RefreshToken(oAuth2User.getName(), jwtToken.getRefreshToken());
        refreshTokenRepository.save(refreshToken);
        log.info("Refresh Token 저장 완료: {}", oAuth2User.getName());

        setTokenCookies(response, jwtToken);

        // 리다이렉트할 URL 생성
        String targetUrl = "https://i13e206.p.ssafy.io/auth/callback";
        getRedirectStrategy().sendRedirect(request, response, createRedirectUrl(jwtToken));
    }

    private void setTokenCookies(HttpServletResponse response, JwtToken jwtToken) {

        // Refresh Token 쿠키 설정
        Cookie refreshTokenCookie = new Cookie("refreshToken", jwtToken.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true); // HTTPS 환경에서만 사용
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge((int) REFRESH_TOKEN_COOKIE_EXPIRATION);
        response.addCookie(refreshTokenCookie);
    }

    private String createRedirectUrl(JwtToken jwtToken) {
        // 리액트 앱의 콜백 URL
        String redirectUrl = "https://i13e206.p.ssafy.io/auth/callback";

        return UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("accessToken", jwtToken.getAccessToken())
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }
}
