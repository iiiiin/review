package ssafy.i13e206.websocket; // ← 패키지 명은 프로젝트에 맞게

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import ssafy.i13e206.security.jwt.JwtTokenProvider;

import java.util.List;

@Slf4j
@Component
public class AuthChannelInterceptorAdapter implements ChannelInterceptor {

    private final JwtTokenProvider jwtProvider;

    public AuthChannelInterceptorAdapter(JwtTokenProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        String token = accessor.getFirstNativeHeader("Authorization");

        log.info("🔐 WebSocket 연결 요청 - Authorization 헤더: {}", token); // ✅ 토큰 로깅

        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            try {
                String userId = jwtProvider.getUserId(token);
                accessor.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));

                log.info("✅ JWT 인증 성공 - userId: {}", userId); // ✅ 인증 성공 로그
            } catch (Exception e) {
                log.warn("❌ JWT 인증 실패: {}", e.getMessage());
            }
        } else {
            log.warn("⚠️ Authorization 헤더가 없거나 Bearer 형식이 아님");
        }

        return message;
    }
}
