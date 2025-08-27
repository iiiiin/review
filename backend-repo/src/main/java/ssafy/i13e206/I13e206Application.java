package ssafy.i13e206;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import ssafy.i13e206.global.config.s3.AwsS3Properties;

@SpringBootApplication
@EnableConfigurationProperties(AwsS3Properties.class)
@EnableJpaAuditing
@EnableAsync
public class I13e206Application {
	public static void main(String[] args) {
		SpringApplication.run(I13e206Application.class, args);
	}	
}
