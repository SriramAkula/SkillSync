import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import './OtpVerifyPage.scss';

export const OtpVerifyPage = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reg_email');
    if (!storedEmail) {
      navigate('/auth/register');
      return;
    }
    setEmail(storedEmail);

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await authStore.verifyOtp(email, otp);
    if (!authStore.error && authStore.otpVerified) {
      navigate('/auth/register-details');
    }
  };

  const handleResend = async () => {
    if (timer === 0) {
      await authStore.sendOtp(email);
      setTimer(60);
    }
  };

  return (
    <AuthSplitLayout 
      title="Verify your email" 
      subtitle={`We've sent a 6-digit code to ${email}`}
    >
      <form onSubmit={handleVerify} className="auth-form-refined">
        <div className="input-group-refined">
          <label htmlFor="otpCode" className="refined-label">OTP Code</label>
          <div className={`refined-input-wrapper ${otp.length === 6 ? 'focused' : ''}`}>
            <span className="material-icons-outlined input-icon">verified_user</span>
            <input
              id="otpCode"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="tracking-[0.5em] font-bold text-center"
            />
          </div>
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
          disabled={otp.length !== 6 || authStore.loading}
        >
          {authStore.loading ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-bold">Verify Code</span>
              <span className="material-icons">arrow_forward</span>
            </>
          )}
        </button>

        <div className="mt-8 text-center text-sm font-medium">
          <p className="text-slate-500">
            Didn't receive code? 
            {timer > 0 ? (
              <span className="text-slate-400 ml-1">Resend in {timer}s</span>
            ) : (
              <button 
                type="button" 
                onClick={handleResend}
                className="text-indigo-600 font-bold ml-1 hover:underline"
              >
                Resend Code
              </button>
            )}
          </p>
          <Link to="/auth/register" className="text-slate-400 text-xs mt-4 block hover:text-indigo-600">
            Change email address
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
};
