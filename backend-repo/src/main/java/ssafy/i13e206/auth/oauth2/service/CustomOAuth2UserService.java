package ssafy.i13e206.auth.oauth2.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import ssafy.i13e206.auth.oauth2.CustomUserDetails;
import ssafy.i13e206.auth.oauth2.info.GoogleUserInfo;
import ssafy.i13e206.auth.oauth2.info.OAuth2UserInfo;
import ssafy.i13e206.user.constant.LoginType;
import ssafy.i13e206.user.entity.SocialLogin;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        OAuth2UserInfo oAuth2UserInfo = new GoogleUserInfo(oAuth2User.getAttributes());
        String email = oAuth2UserInfo.getEmail();
        String name = oAuth2UserInfo.getName();

        User user = userRepository.findByEmail(email);

        //이미 가입된 사용자라면 기존 정보 사용
        if (user == null) {
            // 가입되지 않은 사용자라면(user가 null이라면), DB에 새로 저장 (자동 회원가입)
            user = User.builder()
                    .email(email)
                    .username(name)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            SocialLogin social = SocialLogin.builder()
                    .provider(LoginType.GOOGLE)
                    .user(user)
                    .build();

            user.getSocials().add(social);
            userRepository.save(user);
        }
        return new CustomUserDetails(user, oAuth2User.getAttributes());
    }

}
