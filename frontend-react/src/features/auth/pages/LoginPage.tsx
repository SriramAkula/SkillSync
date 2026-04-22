import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/apiClient';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import './LoginPage.scss';

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth, setUser } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { token, roles, user } = response.data;
      setAuth(token, roles || []);
      
      if (user) {
        setUser(user);
      } else {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const profileResp = await apiClient.get('/user/profile', {
            headers: { 'roles': roles?.join(',') }
        });
        setUser({ ...profileResp.data, email: data.email });
      }

      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorBanner('Invalid email or password');
      } else {
        setErrorBanner('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout 
      title="Welcome back" 
      subtitle="Sign in to continue your learning journey"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form-refined">
        {/* Email Field */}
        <div className="input-group-refined">
          <label htmlFor="loginEmail" className="refined-label">Email address</label>
          <div className={`refined-input-wrapper ${emailFocused ? 'focused' : ''} ${errors.email ? 'error' : ''}`}>
            <span className="material-icons-outlined input-icon">mail</span>
            <input
              id="loginEmail"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </div>
          {errors.email && <span className="refined-field-error">{errors.email.message}</span>}
        </div>

        {/* Password Field */}
        <div className="input-group-refined mt-6">
          <div className="label-row justify-between mb-2">
            <label htmlFor="loginPwd" className="refined-label">Password</label>
            <Link to="/auth/forgot-password" className="forgot-password-link">Forgot password?</Link>
          </div>
          <div className={`refined-input-wrapper ${pwdFocused ? 'focused' : ''} ${errors.password ? 'error' : ''}`}>
            <span className="material-icons-outlined input-icon">lock</span>
            <input
              id="loginPwd"
              type={showPwd ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              onFocus={() => setPwdFocused(true)}
              onBlur={() => setPwdFocused(false)}
            />
            <button 
              type="button" 
              className="password-toggle-btn" 
              onClick={() => setShowPwd(!showPwd)}
            >
              <span className="material-icons-outlined">
                {showPwd ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && <span className="refined-field-error">{errors.password.message}</span>}
        </div>

        {errorBanner && (
          <div className="refined-error-banner mt-4">
            <span className="material-icons">error_outline</span>
            {errorBanner}
          </div>
        )}

        {/* Action Button */}
        <button 
          type="submit" 
          className="refined-submit-btn mt-8" 
          disabled={!isValid || loading}
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-bold">Sign In</span>
              <span className="material-icons">arrow_forward</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="refined-divider my-8">
          <span>or continue with</span>
        </div>

        {/* Google Auth Button */}
        <button type="button" className="google-signin-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <div className="flex flex-col items-start leading-tight">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sign in as kalyan</span>
             <span className="text-xs text-slate-700 font-medium">apparikalyan3@gmail.com</span>
          </div>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4 ml-auto" alt="" />
        </button>

        {/* Redirect Link */}
        <div className="mt-8 text-center text-sm font-medium text-slate-500">
           Don't have an account? 
           <Link to="/auth/register" className="text-indigo-600 font-bold ml-1 hover:underline">Create one free</Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
};
