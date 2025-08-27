package ssafy.i13e206.global.config.s3;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AwsS3Properties.class)
public class S3Config {

    private final AwsS3Properties awsProps;

    @Bean
    public AmazonS3 amazonS3() {
        BasicAWSCredentials creds = new BasicAWSCredentials(
                awsProps.getCredentials().getAccessKey(),
                awsProps.getCredentials().getSecretKey());

        return AmazonS3ClientBuilder.standard()
                .withRegion(awsProps.getRegion().getStaticRegion())
                .withCredentials(new AWSStaticCredentialsProvider(creds))
                .build();
    }
}
