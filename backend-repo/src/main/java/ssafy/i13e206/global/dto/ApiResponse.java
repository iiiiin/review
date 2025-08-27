package ssafy.i13e206.global.dto;

import lombok.Getter;

@Getter
public class ApiResponse<T> {

    private final int status;
    private final String message;
    private final T result;

    private ApiResponse(int status, String message, T result) {
        this.status = status;
        this.message = message;
        this.result = result;
    }

    // 성공 응답을 만드는 정적 메서드
    public static <T> ApiResponse<T> success(String message, T result) {
        return new ApiResponse<>(200, message, result);
    }

    // 실패 응답을 만드는 정적 메서드
    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(status, message, null);
    }
}
