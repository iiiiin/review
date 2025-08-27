import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterStore, useAuthStore } from '@/shared/store/authStore';
import { checkIdAPI, sendEmailVerificationAPI, verifyEmailCodeAPI, registerAPI, loginAPI } from '@/shared/api/auth';
import type { LoginResponse } from '@/shared/types/user';
import AuthLayout from '@/shared/layout/AuthLayout';

// API 응답 타입 설정: 아이디 중복 확인 
interface CheckIdResponse {
  result: {
    duplicated: boolean;
  };
  message?: string;
}

// API 응답 타입 설정: 이메일 중복
interface VerifyEmailResponse {
  result?: {
    verified: boolean;
  };
  message?: string;
}

// 디바운스 훅
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RegisterPage = () => {
  const { formData, updateFormData, reset } = useRegisterStore();
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  // All form states in one page
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<{ id?: string; password?: string; passwordConfirm?: string; name?: string; email?: string; verificationCode?: string }>({});
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idCheckMessage, setIdCheckMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  // Email verification states
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(180);
  const [isTermsChecked, setIsTermsChecked] = useState(false);

  // 디바운스된 값들
  const debouncedId = useDebounce(formData.id, 500);
  const debouncedPassword = useDebounce(formData.password, 300);
  const debouncedPasswordConfirm = useDebounce(passwordConfirm, 300);
  const debouncedName = useDebounce(formData.name, 300);
  const debouncedEmail = useDebounce(formData.email, 500);

  // 페이지를 벗어날 때 스토어 상태를 초기화합니다.
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);
  
  // Timer for email verification
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVerificationSent && timer > 0 && !isVerified) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVerificationSent, timer, isVerified]);

  // 디바운스된 값들에 대한 유효성 검사
  useEffect(() => {
    if (debouncedId && debouncedId !== formData.id) return; // 현재 값과 다르면 무시
    if (debouncedId) {
      const error = validateId(debouncedId);
      setErrors(prev => ({ ...prev, id: error || undefined }));
      if (error) {
        setIsIdChecked(false);
        setIdCheckMessage(null);
      }
    }
  }, [debouncedId, formData.id]);

  useEffect(() => {
    if (debouncedPassword && debouncedPassword !== formData.password) return;
    if (debouncedPassword) {
      const error = validatePassword(debouncedPassword);
      setErrors(prev => ({ ...prev, password: error || undefined }));
    }
  }, [debouncedPassword, formData.password]);

  useEffect(() => {
    if (debouncedPasswordConfirm && debouncedPasswordConfirm !== passwordConfirm) return;
    if (debouncedPasswordConfirm && formData.password) {
      const error = formData.password !== debouncedPasswordConfirm ? '비밀번호가 일치하지 않습니다.' : '';
      setErrors(prev => ({ ...prev, passwordConfirm: error || undefined }));
    }
  }, [debouncedPasswordConfirm, formData.password, passwordConfirm]);

  useEffect(() => {
    if (debouncedName && debouncedName !== formData.name) return;
    if (debouncedName) {
      const error = validateName(debouncedName);
      setErrors(prev => ({ ...prev, name: error || undefined }));
    }
  }, [debouncedName, formData.name]);

  useEffect(() => {
    if (debouncedEmail && debouncedEmail !== formData.email) return;
    if (debouncedEmail) {
      const error = validateEmail(debouncedEmail);
      setErrors(prev => ({ ...prev, email: error || undefined }));
    }
  }, [debouncedEmail, formData.email]);

  // Step 1 validation functions
  const validateId = (id: string) => {
    const idRegex = /^[a-zA-Z0-9]{6,20}$/;
    if (!id) return '아이디를 입력해주세요.';
    if (!idRegex.test(id)) return '아이디는 영문, 숫자를 포함한 6~20자여야 합니다.';
    return '';
  };

  const validatePassword = (password: string) => {
    // 최소 8자 이상, 영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const conditionsMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

    if (!password) return '비밀번호를 입력해주세요.';
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (conditionsMet < 3) return '비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 조합해야 합니다.';
    return '';
  };
  
  // Step 2 validation functions
  const validateName = (name: string) => {
    if (!name) return '이름을 입력해주세요.';
    if (name.length > 3) return '이름은 3글자 이하로 입력해주세요.';
    return '';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return '이메일을 입력해주세요.';
    if (!emailRegex.test(email)) return '올바른 이메일 형식을 입력해주세요.';
    return '';
  };

  // Step 1 handlers
  const handleIdCheck = async () => {
    const idError = validateId(formData.id);
    if (idError) {
      setErrors(prev => ({ ...prev, id: idError }));
      setIdCheckMessage(null);
      setIsIdChecked(false);
      return;
    }

    try {
      const response = await checkIdAPI(formData.id) as unknown as CheckIdResponse;
      if (response.result.duplicated) {
        setIdCheckMessage({ message: '이미 사용 중인 아이디입니다.', type: 'error' });
        setIsIdChecked(false);
      } else {
        setIdCheckMessage({ message: '사용 가능한 아이디입니다.', type: 'success' });
        setIsIdChecked(true);
        setErrors(prev => ({ ...prev, id: undefined }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '아이디 중복확인 중 오류가 발생했습니다.';
      setIdCheckMessage({ message: errorMessage, type: 'error' });
      setIsIdChecked(false);
    }
  };

  const validateAllFields = () => {
    const newErrors: { id?: string; password?: string; passwordConfirm?: string; name?: string; email?: string } = {};

    const idError = validateId(formData.id);
    if (idError) {
      newErrors.id = idError;
    } else if (!isIdChecked) {
      newErrors.id = '아이디 중복 확인을 해주세요.';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (formData.password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    const nameError = validateName(formData.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ id: e.target.value });
    setIsIdChecked(false); // Reset ID check status
    setIdCheckMessage(null); // Clear ID check message
    // 에러는 타이핑 중일 때만 제거, 유효성 검사는 디바운스로 처리
    if (errors.id) {
      setErrors(prev => ({ ...prev, id: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ password: e.target.value });
    // 에러는 타이핑 중일 때만 제거, 유효성 검사는 디바운스로 처리
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(e.target.value);
    // 에러는 타이핑 중일 때만 제거, 유효성 검사는 디바운스로 처리
    if (errors.passwordConfirm) {
      setErrors(prev => ({ ...prev, passwordConfirm: undefined }));
    }
  };
  
  // Step 2 handlers
  const handleSendVerification = async () => {
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return;
    }
    
    try {
      await sendEmailVerificationAPI(formData.email);
      setErrors(prev => ({ ...prev, email: undefined }));
      setIsVerificationSent(true);
      setTimer(180);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이메일 인증 요청 중 오류가 발생했습니다.';
      setErrors(prev => ({ ...prev, email: errorMessage }));
    }
  };

  const handleVerifyCode = async () => {    
    try {
      const response = await verifyEmailCodeAPI(formData.email, verificationCode) as unknown as VerifyEmailResponse;      
      if (response.result?.verified) {
        setIsVerified(true);
        setTimer(0); // Stop timer when verification is successful
        setErrors(prev => ({ ...prev, verificationCode: undefined }));
      } else {
        setIsVerified(false);
        setErrors(prev => ({ ...prev, verificationCode: '인증코드가 올바르지 않습니다.' }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '인증코드 확인 중 오류가 발생했습니다.';
      setErrors(prev => ({ ...prev, verificationCode: errorMessage }));
      setIsVerified(false);
    }
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
    setErrors(prev => ({ ...prev, verificationCode: undefined }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    updateFormData({ name: name });
    // 에러는 타이핑 중일 때만 제거, 유효성 검사는 디바운스로 처리
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ email: e.target.value });
    // 에러는 타이핑 중일 때만 제거, 유효성 검사는 디바운스로 처리
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    setIsVerificationSent(false);
    setIsVerified(false);
    setTimer(180);
  };

  const handleRegisterComplete = async () => {
    if (!validateAllFields()) {
      return;
    }
    
    if (!isVerified) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }
    if (!isTermsChecked) {
      alert('약관에 동의해주세요.');
      return;
    }
    
    try {
      await registerAPI(formData);
      
      // 회원가입 성공 후 자동 로그인
      const loginResponse = await loginAPI({ id: formData.id, password: formData.password });
      login(loginResponse as unknown as LoginResponse);
      
      alert('회원가입이 완료되었습니다!');
      navigate('/'); // 랜딩페이지로 이동
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  const renderSingleForm = () => (
    <div className="space-y-4">
      {/* 아이디 */}
      <div>
        <label htmlFor="id" className="block text-sm font-medium text-gray-700">
          아이디
        </label>
        <div className="flex">
          <input
            id="id"
            type="text"
            required
            value={formData.id}
            onChange={handleIdChange}
            placeholder="아이디를 입력해주세요"
            className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleIdCheck}
            className="ml-2 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
          >
            중복확인
          </button>
        </div>
        {errors.id && <p className="text-xs text-red-600 mt-1">{errors.id}</p>}
        {idCheckMessage && (
          <p className={`text-xs mt-1 ${idCheckMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {idCheckMessage.message}
          </p>
        )}
      </div>

      {/* 비밀번호 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handlePasswordChange}
            placeholder="비밀번호를 입력해주세요"
            className="w-full mt-1 px-3 py-2 pr-10 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
          비밀번호 확인
        </label>
        <div className="relative">
          <input
            id="passwordConfirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            required
            value={passwordConfirm}
            onChange={handlePasswordConfirmChange}
            placeholder="비밀번호를 다시 입력해주세요"
            className="w-full mt-1 px-3 py-2 pr-10 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswordConfirm ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.passwordConfirm && <p className="text-xs text-red-600 mt-1">{errors.passwordConfirm}</p>}
      </div>

      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          이름
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={handleNameChange}
          placeholder="이름을 입력해주세요"
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      {/* 이메일 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <div className="flex">
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleEmailChange}
            placeholder="이메일을 입력해주세요"
            className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSendVerification}
            className="ml-2 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
          >
            인증
          </button>
        </div>
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
      </div>

      {/* 인증코드 */}
      {isVerificationSent && (
        <div>
          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
            인증코드
          </label>
          <div className="flex items-center">
            <input
              id="verificationCode"
              type="text"
              required
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              placeholder="인증코드를 입력해주세요"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="ml-2 text-xs text-gray-500 min-w-[40px]">{`${Math.floor(timer / 60)}:${timer % 60 < 10 ? `0${timer % 60}` : timer % 60}`}</span>
            <button
              onClick={handleVerifyCode}
              className="ml-2 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
            >
              확인
            </button>
          </div>
          {isVerified && <p className="text-xs text-green-600 mt-1">인증이 완료되었습니다.</p>}
          {errors.verificationCode && <p className="text-xs text-red-600 mt-1">{errors.verificationCode}</p>}
        </div>
      )}

      {/* 약관 동의 */}
      <div className="flex items-center pt-2">
        <input
          id="terms"
          type="checkbox"
          required
          checked={isTermsChecked}
          onChange={(e) => setIsTermsChecked(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
          약관에 동의합니다.
        </label>
      </div>

      {/* 가입 완료 버튼 */}
      <button
        onClick={handleRegisterComplete}
        disabled={!formData.id || !formData.password || !formData.name || !formData.email || !isVerified || !isTermsChecked}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        회원가입 완료
      </button>
    </div>
  );

  return (
    <AuthLayout title="Re:View" subtitle="회원가입">
      {renderSingleForm()}
    </AuthLayout>
  );
};

export default RegisterPage;
