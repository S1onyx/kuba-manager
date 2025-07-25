import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';

export default function LoginPage() {
  const [username, setUser] = useState('');
  const [password, setPass] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const token = await login(username, password);
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } catch (err) {
      setError('Login fehlgeschlagen');
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <input placeholder="Benutzername" value={username} onChange={e => setUser(e.target.value)} />
      <input placeholder="Passwort" type="password" value={password} onChange={e => setPass(e.target.value)} />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}