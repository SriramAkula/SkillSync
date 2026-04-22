import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../store/authStore';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import './RegisterPage.scss';

const registerSchema = z.object({
  email: z.string().email('Invalid email address').nonempty('Email is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authStore = useAuthStore();
  const [emailFocused, setEmailFocused] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      email: searchParams.get('email') || '',
    }
  });

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setValue('email', email);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    await authStore.sendOtp(data.email);
    if (!authStore.error && authStore.otpSent) {
      sessionStorage.setItem('reg_email', data.email);
      navigate('/auth/verify-otp');
    }
  };

  return (
    <AuthSplitLayout 
      title="Join SkillSync" 
      subtitle="Enter your email to receive a verification code"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form-refined">
        <div className="input-group-refined">
          <label htmlFor="regEmail" className="refined-label">Email address</label>
          <div className={`refined-input-wrapper ${emailFocused ? 'focused' : ''} ${errors.email ? 'error' : ''}`}>
            <span className="material-icons-outlined input-icon">mail</span>
            <input
              id="regEmail"
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </div>
          {errors.email && <span className="refined-field-error">{errors.email.message}</span>}
        </div>

        {authStore.error && (
          <div className="refined-error-banner mt-4">
            <span className="material-icons">error_outline</span>
            {authStore.error}
          </div>
        )}

        <button 
          type="submit" 
          className="refined-submit-btn mt-8" 
          disabled={!isValid || authStore.loading}
        >
          {authStore.loading ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-bold">Send OTP</span>
              <span className="material-icons">arrow_forward</span>
            </>
          )}
        </button>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
           Already have an account? 
           <Link to="/auth/login" className="text-indigo-600 font-bold ml-1 hover:underline">Sign in</Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
};
