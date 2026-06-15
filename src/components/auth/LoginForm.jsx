import { useState } from 'react';

function LoginForm({ onSubmit, error, loading }) {
  const [nisnNiy, setNisnNiy] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({ nisn_niy: nisnNiy, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div>
        <label className="field-label" htmlFor="nisn_niy">
          NIY
        </label>
        <input
          id="nisn_niy"
          type="text"
          value={nisnNiy}
          onChange={(e) => setNisnNiy(e.target.value)}
          className="field-input"
          placeholder="Masukkan NIY"
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          required
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;
