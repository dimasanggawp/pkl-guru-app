import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import API from '../services/api';
import { showSuccess, showError, getErrorMessage } from '../services/toastService';
import ThemeToggle from '../components/common/ThemeToggle';

function Login() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/auth/login', credentials);
      localStorage.setItem('guru_token', response.data.data.token);
      localStorage.setItem('guru_user', JSON.stringify(response.data.data.user));
      showSuccess('Login berhasil!');
      navigate('/');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-bg text-ink">
      <div className="relative bg-primary text-white flex flex-col justify-between p-8 sm:w-1/2 sm:p-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={28} />
            <span className="font-display font-bold text-lg">PKL Monitoring</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="py-12 sm:py-0">
          <p className="kicker text-white/70 mb-3">Aplikasi Guru</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
            Pantau perjalanan PKL siswa Anda.
          </h1>
        </div>
        <p className="text-sm text-white/70">
          &copy; {new Date().getFullYear()} PKL Apps - Aplikasi Guru
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <p className="kicker mb-2">Masuk</p>
          <h2 className="text-2xl font-display font-bold mb-6">Login Guru</h2>
          <LoginForm onSubmit={handleLogin} error={error} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default Login;
