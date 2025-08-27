package ssafy.i13e206.global.config.s3;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spring.cloud.aws")
@Getter @Setter
public class AwsS3Properties {

    private Credentials credentials;
    private Region region;
    private Stack stack;
    private S3 s3;

    @Getter @Setter
    public static class Credentials {
        private String accessKey;
        private String secretKey;
    }

    @Getter @Setter
    public static class Region {
        private String staticRegion;
    }

    @Getter @Setter
    public static class Stack {
        private boolean auto;
    }

    @Getter @Setter
    public static class S3 {
        private String bucket;
    }
}
