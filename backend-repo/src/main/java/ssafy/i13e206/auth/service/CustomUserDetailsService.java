package ssafy.i13e206.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ssafy.i13e206.user.entity.LocalLogin;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.LocalLoginRepository;
import ssafy.i13e206.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final LocalLoginRepository localRepository;

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        LocalLogin local = localRepository.findById(loginId)
                .orElseThrow(() -> new UsernameNotFoundException("해당 아이디를 찾을 수 없습니다: " + loginId));

        return org.springframework.security.core.userdetails.User.builder()
                .username(local.getUser().getUserUuid())
                .password(local.getPassword())
                .build();
    }
}