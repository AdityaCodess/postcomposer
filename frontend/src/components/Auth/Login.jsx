import { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const Login = ({ setIsAuthenticated }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1); 
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    
    // Frontend validation: Stop immediately if passwords don't match
    if (isSignup && password !== confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match.' });
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (!isSignup) {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
        if (response.data.success) {
          localStorage.setItem('token', response.data.data.token);
          setIsAuthenticated(true);
          navigate('/');
        }
      } else {
        // Send both username and email so backend can verify they are unique before emailing
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/send-otp`, { username, email });
        if (response.data.success) {
          setStatus({ type: 'success', message: 'OTP sent to your email.' });
          setStep(2);
        }
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Authentication failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/signup`, { username, email, password, otp });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        setIsAuthenticated(true);
        navigate('/');
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Invalid OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google`, {
        tokenId: credentialResponse.credential
      });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        setIsAuthenticated(true);
        navigate('/');
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Google authentication failed.' });
    }
  };

  // Helper to completely reset the form when switching modes
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setStatus({ type: '', message: '' });
    setStep(1);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white border border-zinc-200 shadow-sm rounded-xl transition-all">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-zinc-500 mt-2 text-sm">
          {isSignup ? 'Enter your details to get started.' : 'Sign in to manage your deployments.'}
        </p>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.message}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleAuth} className="space-y-5">
          
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
              required
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-zinc-900 text-white font-medium py-3 rounded-lg disabled:bg-zinc-400 hover:bg-zinc-800 transition-colors shadow-sm text-sm mt-2"
          >
            {isLoading ? 'Processing...' : isSignup ? 'Send OTP' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifySignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Verification Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-center tracking-widest text-lg font-mono"
              maxLength="6"
              required
            />
            <p className="text-xs text-zinc-500 mt-2 text-center">Code sent to {email}</p>
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-zinc-900 text-white font-medium py-3 rounded-lg disabled:bg-zinc-400 hover:bg-zinc-800 transition-colors shadow-sm text-sm"
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors"
          >
            Back
          </button>
        </form>
      )}

      {step === 1 && (
        <>
          <div className="relative flex items-center justify-center my-6">
            <span className="absolute bg-white px-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">Or</span>
            <div className="w-full h-px bg-zinc-200"></div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setStatus({ type: 'error', message: 'Google Sign-In failed.' })}
              theme="outline"
              size="large"
            />
          </div>

          <p className="text-center text-sm text-zinc-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={toggleMode}
              className="font-medium text-zinc-900 hover:underline focus:outline-none"
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </>
      )}
    </div>
  );
};

export default Login;