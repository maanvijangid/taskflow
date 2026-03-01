import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { useLoginMutation, useRegisterMutation, useGoogleLoginMutation } from '../store/api/authApi';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData extends LoginFormData {
  name: string;
  confirmPassword: string;
}

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>();

  const isLoading = isLoggingIn || isRegistering || isGoogleLoading;

  // The corrected handler for Google
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // credentialResponse.credential is the ID Token (JWT) your backend expects
      const result = await googleLogin({
        credential: credentialResponse.credential,
      }).unwrap();

      if (result.success && result.data?.user) {
        dispatch(setCredentials(result.data.user));
        toast.success('Welcome back!');
        navigate('/dashboard'); 
      }
    } catch (error: any) {
      const errMsg = error?.data?.error || 'Google login failed';
      toast.error(errMsg);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (isRegister) {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        const result = await register({
          email: data.email,
          name: data.name,
          password: data.password,
        }).unwrap();

        if (result.success && result.data?.user) {
          dispatch(setCredentials(result.data.user));
          toast.success('Account created successfully!');
          navigate('/dashboard');
        }
      } else {
        const result = await login({
          email: data.email,
          password: data.password,
        }).unwrap();

        if (result.success && result.data?.user) {
          dispatch(setCredentials(result.data.user));
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.error || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    reset();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 lg:block">
        <div className="flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">TaskFlow</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Collaborate in real-time.
              <br />
              Get more done together.
            </h1>
            <p className="text-lg text-white/80">
              The modern task manager that keeps your team in sync. Assign tasks,
              track progress, and achieve your goals faster.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-primary-700 bg-gradient-to-br from-white/20 to-white/5" />
              ))}
            </div>
            <p className="text-sm text-white/70">Join 10,000+ teams already using TaskFlow</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-slate-950 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isRegister ? 'Start managing tasks with your team' : 'Sign in to continue to TaskFlow'}
            </p>
          </div>

          {/* Corrected Google Login Integration */}
          <div className="w-full mb-6 flex flex-col items-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              useOneTap
              theme="outline"
              size="large"
              width="384" // This matches max-w-md (approx 24rem)
            />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-500 dark:bg-slate-950">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  {...registerField('name', {
                    required: isRegister && 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  className={cn('input', errors.name && 'input-error')}
                  placeholder="John Doe"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                {...registerField('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
                })}
                className={cn('input', errors.email && 'input-error')}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...registerField('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  className={cn('input pr-10', errors.password && 'input-error')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...registerField('confirmPassword', { required: isRegister && 'Please confirm password' })}
                  className={cn('input', errors.confirmPassword && 'input-error')}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex justify-center py-2.5">
              {isLoading ? (
                <span className="flex items-center gap-2">
                   <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={toggleMode} className="font-medium text-primary-600 hover:text-primary-700">
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}