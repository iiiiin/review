package ssafy.i13e206.user.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ssafy.i13e206.auth.dto.response.FindPasswordEmailResponseDto;
import ssafy.i13e206.auth.dto.response.PasswordVerifyCodeResponseDto;
import ssafy.i13e206.auth.service.AuthService;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.feedback.repository.FeedbackResultRepository;
import ssafy.i13e206.feedback.repository.FeedbackSourceRepository;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.files.repository.PortfolioRepository;
import ssafy.i13e206.files.repository.ResumeRepository;
import ssafy.i13e206.files.repository.ScriptRepository;
import ssafy.i13e206.global.util.S3Uploader;
import ssafy.i13e206.interview.entity.*;
import ssafy.i13e206.interview.repository.*;
import ssafy.i13e206.security.jwt.JwtTokenProvider;
import ssafy.i13e206.security.jwt.RefreshTokenRepository;
import ssafy.i13e206.user.constant.LoginType;
import ssafy.i13e206.user.dto.request.SignupRequest;
import ssafy.i13e206.user.dto.request.VerifyRequest;
import ssafy.i13e206.user.dto.response.*;
import ssafy.i13e206.user.entity.LocalLogin;
import ssafy.i13e206.user.entity.SocialLogin;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.LocalLoginRepository;
import ssafy.i13e206.user.repository.SocialLoginRepository;
import ssafy.i13e206.user.repository.UserRepository;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;
    private final LocalLoginRepository localLoginRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final PortfolioRepository portfolioRepository;
    private final ResumeRepository resumeRepository;
    private final ScriptRepository scriptRepository;
    private final InterviewSetRepository interviewSetRepository;
    private final InterviewRepository interviewRepository;
    private final FeedbackResultRepository feedbackResultRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final PTInterviewRepository ptInterviewRepository;
    private final FeedbackSourceRepository feedbackSourceRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final QuestionRepository questionRepository;
    private final S3Uploader s3Uploader;

    private static final long CODE_EXPIRATION_SECONDS = 180;

    @Transactional
    public String signup(SignupRequest signupRequest) {

        if (signupRequest.getLoginType() == LoginType.LOCAL) {
            if (localLoginRepository.existsById(signupRequest.getId())) {
                throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
            }
        }

        User user = User.builder()
                .username(signupRequest.getUsername())
                .email(signupRequest.getEmail())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        if (signupRequest.getLoginType() == LoginType.LOCAL) {
            String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());

            LocalLogin localLogin = LocalLogin.builder()
                    .id(signupRequest.getId())
                    .password(encodedPassword)
                    .build();

            user.setLocalLogin(localLogin);

        } else {
            SocialLogin socialLogin = SocialLogin.builder()
                    .provider(signupRequest.getLoginType())
                    .build();

            user.addSocialLogin(socialLogin);
        }

        // 4. 부모 엔티티인 User만 저장합니다. Cascade 설정에 따라 자식들도 함께 저장됩니다.
        userRepository.save(user);

        return user.getUserUuid();
    }

    public EmailSendResponse sendEmailVerification(String email) throws Exception {
        String code = createKey();
        MimeMessage message = createMessage(email, code);
        try{
            String redisKey = "emailVerification:" + email;
            redisTemplate.opsForValue().set(redisKey, code, CODE_EXPIRATION_SECONDS, TimeUnit.SECONDS);

            mailSender.send(message);
            LocalDateTime now = LocalDateTime.now();
            EmailSendResponse emailSendResponse = new EmailSendResponse(email, now);
            return emailSendResponse;
        }catch(MailException e){
            throw new IllegalArgumentException("이메일 발송에 실패했습니다.");
        }
    }


    public MimeMessage createMessage(String to, String code) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();

        message.addRecipients(MimeMessage.RecipientType.TO, to);
        message.setSubject("회원가입 인증번호");

        String msg = "";
        msg += "<div style='margin: 50px; font-family: Arial, sans-serif;'>";
        msg += "    <div style='text-align: center;'>";
        msg += "        <h1 style='color: #4CAF50;'>안녕하세요!</h1>";
        msg += "        <p style='font-size: 18px; color: #333;'>회원가입을 위한 인증 코드를 아래에 입력해주세요.</p>";
        msg += "        <hr style='border: 1px solid #ddd; width: 80%; margin: 30px auto;'>";
        msg += "    </div>";
        msg += "    <div style='background-color: #f9f9f9; border-radius: 8px; padding: 40px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: center;'>";
        msg += "        <h3 style='color: #FF5722; font-size: 24px;'>회원가입 인증 코드</h3>";
        msg += "        <p style='font-size: 22px; font-weight: bold; color: #333;'>CODE: <span style='color: #FF9800;'>" + code + "</span></p>";
        msg += "        <div style='font-size: 16px; color: #555; margin-top: 20px;'>";
        msg += "            <p>위 코드를 회원가입 페이지에 입력해 주세요.</p>";
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

    public String createKey() {
        Random random = new Random();
        int key = 100000 + random.nextInt(900000);
        return String.valueOf(key);
    }

    public boolean verifyEmailCode(String email, String inputCode) {
        String redisKey = "emailVerification:" + email;
        String storedCode = redisTemplate.opsForValue().get(redisKey);

        if (storedCode == null) {
            throw new IllegalArgumentException("인증 코드가 만료되었거나 유효하지 않습니다.");
        }

        if (!storedCode.equals(inputCode)) {
            return false;
        } else {
            redisTemplate.delete(redisKey);
            return true;
        }
    }

    public boolean isIdDuplicate (String id) {
        boolean isDuplicate = localLoginRepository.existsById(id);
        return isDuplicate;
    }

    @Transactional
    public void deleteUser(String username, String accessToken, HttpServletResponse response) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 사용자 관련 데이터 삭제
        deleteUserData(user);

        // 토큰/쿠키 무효화
        invalidateTokenAndCookie(accessToken, response);
    }

    private void deleteUserData(User user) {
        List<Resume>    resumes    = resumeRepository.findByUser(user);
        for (Resume resume : resumes) {
            s3Uploader.deleteFile(resume.getResumeUrl());
        }
        List<Portfolio> portfolios = portfolioRepository.findByUser(user);
        for (Portfolio portfolio : portfolios) {
            s3Uploader.deleteFile(portfolio.getPortfolioUrl());
        }
        List<ScriptFile> scripts    = scriptRepository.findByUser(user);
        for (ScriptFile scriptFile : scripts) {
            s3Uploader.deleteFile(scriptFile.getScriptUrl());
        }

        // 해당 파일들에 연결된 InterviewSet 조회
        List<InterviewSet> sets = new ArrayList<>();
        if (!resumes.isEmpty())    sets.addAll(interviewSetRepository.findByResumeIn(resumes));
        if (!portfolios.isEmpty()) sets.addAll(interviewSetRepository.findByPortfolioIn(portfolios));
        if (!scripts.isEmpty())    sets.addAll(interviewSetRepository.findByScriptFileIn(scripts));

        for (InterviewSet set : sets) {
            List<Interview> interviews = interviewRepository.findByInterviewSet(set);

            for (Interview iv : interviews) {
                // 일반 Q&A 삭제
                deleteQnA(iv);
                // PT 관련 데이터 삭제
                deletePT(iv);
                // 인터뷰 자체 삭제
                interviewRepository.delete(iv);
            }
            interviewSetRepository.delete(set);
        }

        resumeRepository.deleteByUser(user);
        portfolioRepository.deleteByUser(user);
        scriptRepository.deleteByUser(user);

        userRepository.delete(user);
    }

    /** 인터뷰(iv)에 딸린 Question→AnswerAttempt→Feedback 전부 삭제 */
    private void deleteQnA(Interview iv) {
        List<Question> roots = questionRepository.findByInterviewAndParentIsNull(iv);

        for (Question q : roots) {
            deleteQuestionRecursively(q);
        }
    }

    private void deleteQuestionRecursively(Question q) {
        List<Question> children = questionRepository.findByParent(q);
        for (Question child : children) {
            deleteQuestionRecursively(child);
        }

        List<AnswerAttempt> atts = answerAttemptRepository.findByQuestion(q);
        for (AnswerAttempt at : atts) {
            Feedback feedback = at.getFeedback();
            if (feedback != null) {
                feedbackSourceRepository.deleteByFeedback(feedback);
            }
            feedbackResultRepository.deleteByAnswerAttempt(at);
            answerAttemptRepository.delete(at);
        }

        // 3) 질문 자체 삭제 (이제 자식도 모두 지워졌으므로 FK 제약 위반 없음)
        questionRepository.delete(q);
    }

    /** 인터뷰(iv)에 딸린 PTInterview→PTAnswerAttempt→Feedback 전부 삭제 */
    private void deletePT(Interview iv) {
        List<PTInterview> ptInterviews = ptInterviewRepository.findByInterview(iv);

        ptInterviews.forEach(pt -> {
            ptAnswerAttemptRepository.findByPtInterview(pt).forEach(pta -> {
                Feedback feedback = pta.getFeedback();
                if (feedback != null) {
                    feedbackSourceRepository.deleteByFeedback(feedback);
                }
                feedbackResultRepository.deleteByPtAnswerAttempt(pta);
                ptAnswerAttemptRepository.delete(pta);
            });
            ptInterviewRepository.delete(pt);
        });
    }

    private void invalidateTokenAndCookie(String accessToken, HttpServletResponse response) {
        Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
        String userId = authentication.getName();

        // Redis에서 Refresh Token 삭제
        refreshTokenRepository.deleteById(userId);

        // Access Token을 블랙리스트 처리
        Long expiration = jwtTokenProvider.getRemainingExpiration(accessToken);
        if (expiration > 0) {
            redisTemplate.opsForValue()
                    .set(accessToken, "logout", expiration, TimeUnit.MILLISECONDS);
        }

        // refreshToken 쿠키 삭제
        expireCookie(response, "refreshToken");
    }

    private void expireCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
    }

    public void updatePwd(String username, String currentPassword, String newPassword) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        LocalLogin localLogin = user.getLocalLogin();
        if (localLogin == null) {
            throw new IllegalStateException("소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.");
        }

        // 현재 비밀번호 검증
        if (!passwordEncoder.matches(currentPassword, localLogin.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 최소 8자 이상이어야 합니다.");
        }

        String encodedNewPassword = passwordEncoder.encode(newPassword);
        localLogin.changePassword(encodedNewPassword);

        user.updateLastModifiedDate();

        localLoginRepository.save(localLogin);
        userRepository.save(user);
    }

    public MyPageResponseDto getMyPageData(String username) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ProfileDto profileDto;

        // 로컬 사용자
        if (user.getLocalLogin() != null) {
            profileDto = ProfileDto.builder()
                    .id(user.getLocalLogin().getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .loginType(LoginType.LOCAL)
                    .build();
        }
        // 소셜 로그인 사용자
        else {
            profileDto = ProfileDto.builder()
                    .id(null)
                    .email(null)
                    .username(user.getUsername())
                    .loginType(LoginType.GOOGLE)
                    .build();
        }

        List<Portfolio> portfolios = portfolioRepository.findByUser(user);
        List<Resume> resumes = resumeRepository.findByUser(user);
        List<ScriptFile> scriptFiles = scriptRepository.findByUser(user);

        List<FileDto> portfolioDtos = portfolios.stream()
                .map(portfolio -> FileDto.builder()
                        .fileUuid(portfolio.getPortfolioUuid())
                        .fileType("portfolio")
                        .fileName(portfolio.getFileName())
                        .company(portfolio.getEnterpriseName())
                        .job(portfolio.getPosition())
                        .fileUrl(portfolio.getPortfolioUrl())
                        .uploadedAt(portfolio.getPortfolioUploadedAt().toString())
                        .build())
                .toList();

        List<FileDto> resumeDtos = resumes.stream()
                .map(resume -> FileDto.builder()
                        .fileUuid(resume.getResumeUuid())
                        .fileType("resume")
                        .fileName(resume.getFileName())
                        .company(resume.getEnterpriseName())
                        .job(resume.getPosition())
                        .fileUrl(resume.getResumeUrl())
                        .uploadedAt(resume.getResumeUploadedAt().toString())
                        .build())
                .toList();

        List<FileDto> scriptDtos = scriptFiles.stream()
                .map(script -> FileDto.builder()
                        .fileUuid(script.getScriptFileUuid())
                        .fileType("script")
                        .fileName(script.getFileName())
                        .company(script.getEnterpriseName())
                        .job(script.getPosition())
                        .fileUrl(script.getScriptUrl())
                        .uploadedAt(script.getScriptUploadedAt().toString())
                        .build())
                .toList();

        List<FileDto> allFiles = new ArrayList<>();
        allFiles.addAll(portfolioDtos);
        allFiles.addAll(resumeDtos);
        allFiles.addAll(scriptDtos);

        // 최신순으로 정렬
        allFiles.sort(Comparator.comparing(FileDto::getUploadedAt).reversed());

        long interviewCnt = interviewRepository.countByUser(user);
        long praticeCnt = interviewRepository.findTotalPracticeSecondsByUser(user);

        SummaryDto summaryDto = SummaryDto.builder()
                .completedInterviewCount((int) interviewCnt)
                .totalPracticeSeconds((int) praticeCnt)
                .build();

        MyPageResponseDto myPageResponseDto = MyPageResponseDto.builder()
                .profile(profileDto)
                .summary(summaryDto)
                .file(allFiles) // 통합된 파일 리스트를 전달
                .build();

        return myPageResponseDto;

    }
}
