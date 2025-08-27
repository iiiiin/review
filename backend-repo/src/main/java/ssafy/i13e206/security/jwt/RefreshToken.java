package ssafy.i13e206.security.jwt;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

@Getter
@AllArgsConstructor
@RedisHash(value = "refreshToken", timeToLive = 604800) // timeToLive: 7일
public class RefreshToken {

    @Id
    private String userId; // 사용자의 ID

    private String token;
}
