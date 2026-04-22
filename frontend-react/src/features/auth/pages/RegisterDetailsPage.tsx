import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../store/authStore';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import './RegisterDetailsPage.scss';

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type DetailsFormData = z.infer<typeof detailsSchema>;

export const RegisterDetailsPage = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    mode: 'onTouched'
  });

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reg_email');
    if (!storedEmail || !authStore.otpVerified) {
      navigate('/auth/register');
      return;
    }
    setEmail(storedEmail);
  }, [navigate, authStore.otpVerified]);

  const onSubmit = async (data: DetailsFormData) => {
    await authStore.register({
      email,
      fullName: data.fullName,
      password: data.password
    });
    if (!authStore.error) {
      navigate('/auth/login?registered=true');
    }
  };

  return (
    <AuthSplitLayout 
      title="Complete your profile" 
      subtitle="Set your name and password to get started"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form-refined">
        {/* Full Name */}
        <div className="input-group-refined">
          <label htmlFor="fullName" className="refined-label">Full Name</label>
          <div className={`refined-input-wrapper ${focusedField === 'fullName' ? 'focused' : ''} ${errors.fullName ? 'error' : ''}`}>
            <span className="material-icons-outlined input-icon">person</span>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              {...register('fullName')}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          {errors.fullName && <span className="refined-field-error">{errors.fullName.message}</span>}
        </div>

        {/* Password */}
        <div className="input-group-refined mt-6">
          <label htmlFor="regPwd" className="refined-label">Create Password</label>
          <div className={`refined-input-wrapper ${focusedField === 'password' ? 'focused' : ''} ${errors.password ? 'error' : ''}`}>
            <span className="material-icons-outlined input-icon">lock</span>
            <input
              id="regPwd"
              type={showPwd ? 'text' : 'password'}
              placeholder="At least 8 characters"
              {...register('password')}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPwd(!showPwd)}>
              <span className="material-icons-outlined">{showPwd ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {errors.password && <span className="refined-field-error">{errors.password.message}</span>}
        </div>

        {/* Confirm Password */}
        <div className="input-group-refined mt-6">
          <label htmlFor="confirmPwd" className="refined-label">Confirm Password</label>
          <div className={`refined-input-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''} ${errors.confirmPassword ? 'error' : ''}`}>
            <span className="material-icons-outlined input-icon">lock_reset</span>
            <input
              id="confirmPwd"
              type={showPwd ? 'text' : 'password'}
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          {errors.confirmPassword && <span className="refined-field-error">{errors.confirmPassword.message}</span>}
        </div>

        {authStore.error && (
          <div className="refined-error-banner mt-4">
            <span className="material-icons">error_outline</span>
            {authStore.error}
          </div>
        )}

        <button 
          type="submit" 
          className="refined-submit-btn mt-10" 
          disabled={!isValid || authStore.loading}
        >
          {authStore.loading ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-bold">Create Account</span>
              <span className="material-icons">check_circle</span>
            </>
          )}
        </button>
      </form>
    </AuthSplitLayout>
  );
};
