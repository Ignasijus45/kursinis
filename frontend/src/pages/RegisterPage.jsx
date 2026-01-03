import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/projects');
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-content">
          <h1>📋 Trello Valdymo Sistema</h1>
          <LoginForm onSuccess={handleSuccess} mode="register" showToggle={false} />
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/login')}
          >
            Jau turite paskyrą? Prisijunkite
          </button>
        </div>
      </div>
    </div>
  );
}
