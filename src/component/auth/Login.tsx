// src/pages/Login.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, requestOtp, verifyOtp } from '../../store/slices/authSlice';

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error, otpRequested, user } = useAppSelector((s) => s.auth);

  const [pjNumber, setPjNumber] = useState('');
  const [otp, setOtp] = useState('');

  // Where to send the user after successful login.
  // RequireAuth sets `state.from` when it bounces them to /login.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  // Redirect once the user is set (after verifyOtp succeeds).
  useEffect(() => {
    if (!user) return;

    const destination =
      user.role === 'super_admin' ? '/super-admin' : '/admin';

    navigate(from ?? destination, { replace: true });
  }, [user, from, navigate]);

  // Clear any stale error when the user switches between the two steps.
  useEffect(() => {
    dispatch(clearError());
  }, [otpRequested, dispatch]);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pjNumber.trim()) return;
    dispatch(requestOtp(pjNumber.trim()));
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    dispatch(verifyOtp({ pjNumber: pjNumber.trim(), otp: otp.trim() }));
  };

  const handleBackToPj = () => {
    setOtp('');
    dispatch(clearError());
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-semibold text-[#1a1a1a]">Sign in</h1>
        <p className="mb-6 text-sm text-[#5c5144]">
          {otpRequested
            ? 'Enter the 6-digit code sent to your email.'
            : 'Enter your PJ number to receive a login code.'}
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!otpRequested ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#5c5144]">PJ Number</span>
              <input
                type="text"
                value={pjNumber}
                onChange={(e) => setPjNumber(e.target.value)}
                placeholder="e.g. PJ-0001"
                autoComplete="username"
                autoFocus
                className="rounded-md border border-[#d9d1c3] px-3 py-2 text-sm outline-none focus:border-[#2D6A37]"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading || !pjNumber.trim()}
              className="mt-2 rounded-md bg-[#2D6A37] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245a2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : 'Send login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#5c5144]">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoComplete="one-time-code"
                autoFocus
                className="rounded-md border border-[#d9d1c3] px-3 py-2 text-center text-lg tracking-[0.5em] outline-none focus:border-[#2D6A37]"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="mt-2 rounded-md bg-[#2D6A37] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245a2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Verifying…' : 'Verify & sign in'}
            </button>

            <button
              type="button"
              onClick={handleBackToPj}
              className="text-xs text-[#5c5144] underline hover:text-[#2D6A37]"
            >
              Use a different PJ number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;