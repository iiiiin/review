package ssafy.i13e206.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ssafy.i13e206.auth.dto.request.LoginRequestDto;
import ssafy.i13e206.auth.dto.response.*;
import ssafy.i13e206.security.jwt.JwtToken;
import ssafy.i13e206.security.jwt.JwtTokenProvider;
import ssafy.i13e206.security.jwt.RefreshToken;
import ssafy.i13e206.security.jwt.RefreshTokenRepository;
import ssafy.i13e206.user.constant.LoginType;
import ssafy.i13e206.user.entity.LocalLogin;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.LocalLoginRepository;
import ssafy.i13e206.user.repository.UserRepository;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Random;
import java.util.concurrent.TimeUnit;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final LocalLoginRepository localRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService userDetailsService;


    private static final long CODE_EXPIRATION_SECONDS = 180;

    public LoginResponseDto login(LoginRequestDto loginDto) {
        // Authentication 객체 생성
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginDto.getId(), loginDto.getPassword());

        try {
            // AuthenticationManager로 인증
            Authentication authentication = authenticationManager.authenticate(authenticationToken);

            // 인증 성공 -> JWT 생성
            JwtToken jwtToken = jwtTokenProvider.generateToken(authentication);
            log.info("JWT 토큰 생성 완료 : {}", authentication);

            // RefreshToken 저장 (기존 토큰 있으면 덮어씀)
            String userId = authentication.getName();

            RefreshToken refreshToken = new RefreshToken(userId, jwtToken.getRefreshToken());
            refreshTokenRepository.save(refreshToken);
            log.info("Refresh Token 저장 완료 : {})", authentication.getName());


            LocalLogin local = localRepository.findById(loginDto.getId())
                    .orElseThrow(() -> new UsernameNotFoundException("해당 아이디를 찾을 수 없습니다: " + authentication));

            UserInfoResponseDto userInfo = UserInfoResponseDto.builder()
                    .id(loginDto.getId())
                    .username(local.getUser().getUsername())
                    .loginType(LoginType.LOCAL)
                    .build();

            return new LoginResponseDto(
                    jwtToken.getAccessToken(),
                    jwtToken.getRefreshToken(),
                    jwtToken.getGrantType(),
                    userInfo
            );

        } catch (Exception e) {
            log.error("로그인 실패 : id: {}, message: {}", loginDto.getId(), e.getMessage());
            throw e;
        }
    }


    @Transactional
    public void logout(String accessToken) {

        if (!jwtTokenProvider.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        // Access Token에서 사용자 정보 가져오기
        Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
        String userId = authentication.getName(); // 토큰의 subject

        // Redis에 저장된 Refresh Token 삭제
        refreshTokenRepository.deleteById(userId);

        // Access Token을 블랙리스트에 추가 (남은 유효 시간만큼)
        Long expiration = jwtTokenProvider.getRemainingExpiration(accessToken);

        if (expiration > 0) {
            redisTemplate.opsForValue()
                    .set(accessToken, "logout", expiration, TimeUnit.MILLISECONDS);
        }
    }

    public TokenRefreshResponseDto refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 refreshToken 토큰입니다.");
        }
        String userUuid = jwtTokenProvider.getSubjectFromToken(refreshToken);
        RefreshToken storedRefreshToken = refreshTokenRepository.findById(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("로그아웃된 사용자입니다."));
        if (!storedRefreshToken.getToken().equals(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 일치하지 않습니다.");
        }
        User user = userRepository.findById(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다: " + userUuid));

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUserUuid(),
                "",
                Collections.emptyList()
        );

        String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);

        return new TokenRefreshResponseDto(newAccessToken);
    }

    public FindPasswordEmailResponseDto sendFindPasswordEmail(String email) throws Exception {
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }
        User user = userRepository.findByEmail(email);
        if (user.getLocalLogin() == null) {
            throw new IllegalArgumentException("소셜 로그인 사용자는 비밀번호를 찾을 수 없습니다.");
        }

        String code = createKey();
        MimeMessage message = createMessage(email, code);
        try{
            String redisKey = "findPassword:" + email; // 키 충돌을 방지하기 위해 접두사 사용
            redisTemplate.opsForValue().set(redisKey, code, CODE_EXPIRATION_SECONDS, TimeUnit.SECONDS);

            mailSender.send(message);
            LocalDateTime now = LocalDateTime.now();
            return FindPasswordEmailResponseDto.builder()
                    .email(email)
                    .sentAt(now)
                    .build();
        }catch(MailException e){
            throw new IllegalArgumentException("이메일 발송에 실패했습니다.");
        }
    }

    public String createKey() {
        Random random = new Random();
        int key = 100000 + random.nextInt(900000);
        return String.valueOf(key);
    }

    public MimeMessage createMessage(String to, String code) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();

        message.addRecipients(MimeMessage.RecipientType.TO, to);
        message.setSubject("비밀번호 찾기 인증번호 안내");

        String msg = "";
        msg += "<div style='margin: 50px; font-family: Arial, sans-serif;'>";
        msg += "    <div style='text-align: center;'>";
        msg += "        <h1 style='color: #4CAF50;'>안녕하세요!</h1>";
        msg += "        <p style='font-size: 18px; color: #333;'>요청하신 비밀번호 재설정을 위한 인증 코드입니다.</p>";
        msg += "        <hr style='border: 1px solid #ddd; width: 80%; margin: 30px auto;'>";
        msg += "    </div>";
        msg += "    <div style='background-color: #f9f9f9; border-radius: 8px; padding: 40px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: center;'>";
        msg += "        <h3 style='color: #FF5722; font-size: 24px;'>비밀번호 찾기 인증 코드</h3>";
        msg += "        <p style='font-size: 22px; font-weight: bold; color: #333;'>CODE: <span style='color: #FF9800;'>" + code + "</span></p>";
        msg += "        <div style='font-size: 16px; color: #555; margin-top: 20px;'>";
        msg += "            <p>위 코드를 비밀번호 찾기 페이지에 입력해 주세요.</p>";
        msg += "        </div>";
        msg += "    </div>";
        msg += "    <div style='margin-top: 30px; text-align: center; font-size: 14px; color: #888;'>";
        msg += "        <p>본 이메일은 자동으로 발송된 메시지입니다. 답변을 보내지 마십시오.</p>";
        msg += "    </div>";
        msg += "</div>";


        message.setText(msg, "utf-8", "html");
        message.setFrom(new InternetAddress("heesan6615@naver.com", "AI 면접 서비스"));

        return message;
    }
    public PasswordVerifyCodeResponseDto verifyPasswordResetCode(String email, String inputCode) {
        String redisKey = "findPassword:" + email;
        String storedCode = redisTemplate.opsForValue().get(redisKey);

        if (storedCode == null) {
            throw new IllegalArgumentException("인증 코드가 만료되었거나 유효하지 않습니다.");
        }

        PasswordVerifyCodeResponseDto passwordVerifyCodeResponseDto;
        if (!storedCode.equals(inputCode)) {
            passwordVerifyCodeResponseDto = PasswordVerifyCodeResponseDto.builder()
                    .email(email)
                    .isVerified(false)
                    .build();
        } else {
            passwordVerifyCodeResponseDto = PasswordVerifyCodeResponseDto.builder()
                    .email(email)
                    .isVerified(true)
                    .build();
            redisTemplate.delete(redisKey);
        }


        return passwordVerifyCodeResponseDto;
    }

    @Transactional
    public void resetPassword(String email, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호와 확인용 비밀번호가 일치하지 않습니다.");
        }

        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }

        // 3. 로컬 로그인 사용자인지 확인
        LocalLogin localLogin = user.getLocalLogin();
        if (localLogin == null) {
            throw new IllegalStateException("소셜 로그인 사용자는 비밀번호를 재설정할 수 없습니다.");
        }

        String encodedNewPassword = passwordEncoder.encode(newPassword);

        localLogin.changePassword(encodedNewPassword);

        user.updateLastModifiedDate();
    }
}
