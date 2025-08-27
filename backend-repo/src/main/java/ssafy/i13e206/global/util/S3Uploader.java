package ssafy.i13e206.global.util;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ssafy.i13e206.files.constant.FileType;
import ssafy.i13e206.global.config.s3.AwsS3Properties;
import ssafy.i13e206.user.entity.LocalLogin;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.LocalLoginRepository;
import ssafy.i13e206.user.repository.UserRepository;

import java.io.IOException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Uploader {

    private final AmazonS3 amazonS3;
    private final AwsS3Properties awsProps;
    private final UserRepository userRepository;

    public URL uploadFile(MultipartFile file,
                                String enterpriseName,
                                String position,
                                FileType fileType,
                                UserDetails userDetails) throws IOException {

        String bucket = awsProps.getS3().getBucket();
        User user = userRepository.findById(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String cleanName = sanitize(enterpriseName) + "_" +
                sanitize(position) + "_" +
                sanitize(fileType.toString()) + "_" +
                user.getUserUuid() + "_" +
                UUID.randomUUID().toString().substring(0, 8) +
                fileExtension;

        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentType(file.getContentType());
        meta.setContentLength(file.getSize());

        amazonS3.putObject(bucket, cleanName, file.getInputStream(), meta);

        return amazonS3.getUrl(bucket, cleanName);
    }

    public void deleteFile(String fileUrl) {
        try {
            String baseUrl = String.format("https://%s.s3.%s.amazonaws.com/",
                    awsProps.getS3().getBucket(), awsProps.getRegion().getStaticRegion());
            String key;

            if (fileUrl.startsWith(baseUrl)) {
                key = fileUrl.substring(baseUrl.length());
            } else {
                key = fileUrl.substring(fileUrl.indexOf(".com/") + 5);
            }
            key = URLDecoder.decode(key, StandardCharsets.UTF_8.toString());

            amazonS3.deleteObject(new DeleteObjectRequest(awsProps.getS3().getBucket(), key));

        } catch (Exception e) {
            throw new RuntimeException("S3 파일 삭제 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }


    private String sanitize(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFC);
        return normalized
                .replaceAll("\\s+", "_")
                .replaceAll("[^\\p{L}\\p{N}_.-]", "");
    }
}
