package ssafy.i13e206.security.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import ssafy.i13e206.auth.oauth2.service.CustomOAuth2UserService;
import ssafy.i13e206.auth.oauth2.handler.OAuth2AuthenticationFailureHandler;
import ssafy.i13e206.auth.oauth2.handler.OAuth2AuthenticationSuccessHandler;
import ssafy.i13e206.security.jwt.JwtAuthenticationFilter;
import ssafy.i13e206.security.jwt.JwtTokenProvider;

import java.util.Arrays;
import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    protected SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 비활성화 (Stateless 서버에서는 불필요)
                .csrf(AbstractHttpConfigurer::disable)

                // CORS 설정 (아래 CorsConfigurationSource Bean 사용)
                .cors(withDefaults())

                // 세션 관리 방식을 STATELESS로 설정
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // HTTP Basic 및 Form Login 비활성화
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)

                // 요청 경로별 권한 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ws-stomp/**").permitAll()
                        .requestMatchers("/api/recordings/**").permitAll()
                        // CORS preflight (OPTIONS)
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        // 회원가입 엔드포인트 허용
                        .requestMatchers(HttpMethod.POST, "/api/user/**").permitAll()
                        // 녹화 조회 등 API 허용
                        .requestMatchers("/api/recordings/**").permitAll()
                        .requestMatchers("/openvidu-webhook/**").permitAll()
                        // RAG API 허용
                        .requestMatchers("/api/rag/**").permitAll()
                        // 테스트 API 허용
                        .requestMatchers("/api/test/**").permitAll()
                        // Swagger UI, OpenAPI 스펙
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**", "/swagger-ui.html").permitAll()
                        // 인가/토큰, 비밀번호 찾기, OAuth2
                        .requestMatchers("/api/user/signup/**", "/api/auth/**", "/api/oauth2/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // OAuth2 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler)
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 출처 (프론트엔드 주소)
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080",
                "https://i13e206.p.ssafy.io:8445",
                "https://i13e206.p.ssafy.io"
        ));
        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList(
                "OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"
        ));
        // 허용할 헤더
        configuration.setAllowedHeaders(List.of("*"));
        // 자격 증명(쿠키 등) 허용 여부
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setSameSite("None");
        serializer.setUseSecureCookie(true); // HTTPS 환경에서는 이 설정을 활성화하는 것이 좋습니다.
        return serializer;
    }
}
