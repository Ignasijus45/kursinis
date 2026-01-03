import React, { useMemo, useState } from 'react';
import { userService } from '../services';

export default function LoginForm({ onSuccess, mode = 'login', showToggle = true }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const heading = useMemo(() => (isRegister ? 'Registracija' : 'Prisijungimas'), [isRegister]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(formData.email)) {
      setLoading(false);
      return setError('Neteisingas el. pašto formatas');
    }
    if (formData.password.length < 8) {
      setLoading(false);
      return setError('Slaptažodis turi būti bent 8 simbolių');
    }
    if (isRegister) {
      if (!formData.username.trim() || !formData.full_name.trim()) {
        setLoading(false);
        return setError('Užpildykite visus laukus');
      }
    }

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
      <h2>{heading}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="email"
        name="email"
        placeholder="El. paštas"
        value={formData.email}
        onChange={handleChange}
        required
      />

      {isRegister && (
        <>
          <input
            type="text"
            name="username"
            placeholder="Vartotojo vardas"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="full_name"
            placeholder="Vardas ir pavardė"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </>
      )}

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

      {showToggle && (
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Grįžti prie prisijungimo' : 'Nėra paskyros? Registruokis'}
        </button>
      )}
    </form>
  );
}
