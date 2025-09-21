import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await register({ email, password, full_name: fullName || undefined });

      // Success toast and redirect
      toast.success(
        t('auth.accountCreated'),
        t('auth.accountCreatedMessage')
      );

      // Immediate redirect to login
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || t('auth.registrationFailed');
      setError(errorMessage);

      // Show toast based on error type
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        toast.error(
          t('auth.emailAlreadyRegistered'),
          t('auth.emailAlreadyRegisteredMessage')
        );
      } else if (errorMessage.includes('email') && errorMessage.includes('valid')) {
        toast.error(
          t('auth.invalidEmail'),
          t('auth.invalidEmailMessage')
        );
      } else {
        toast.error(
          t('auth.registrationFailed'),
          errorMessage
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Language Switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <Clock className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.registerTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.registerSubtitle')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth.signInExisting')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="sr-only">
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input pl-10"
                  placeholder={t('auth.fullNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder={t('auth.email')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder={t('auth.password')}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                t('auth.createAccount')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}