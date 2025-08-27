package ssafy.i13e206.files.dto.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class FileRequestDto {
    private String enterpriseName;
    private String position;
    private List<MultipartFile> file;
    private List<String> fileType;
}
