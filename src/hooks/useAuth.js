import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('guru_user') || 'null');
  const token = localStorage.getItem('guru_token');

  const logout = () => {
    localStorage.removeItem('guru_token');
    localStorage.removeItem('guru_user');
    navigate('/login');
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    logout,
  };
}
