import React, { useState } from 'react';
import { userService } from '../services';

export default function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? 'register' : 'login';
      const response = await userService[endpoint === 'register' ? 'register' : 'login'](
        formData.email,
        formData.password,
        isRegister ? formData.username : undefined,
        isRegister ? formData.full_name : undefined
      );

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Klaida autentifikuojant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{isRegister ? 'Registracija' : 'Prisijungimas'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="email"
        name="email"
        placeholder="El. paštas"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <input
        type="password"
        name="password"
        placeholder="Slaptažodis"
        value={formData.password}
        onChange={handleChange}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Kraunama...' : (isRegister ? 'Registruotis' : 'Prisijungti')}
      </button>
      
      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister ? 'Grįžti prie prisijungimo' : 'Nėra paskyros? Registruokis'}
      </button>
    </form>
  );
}
