import React, { useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/projects');
    }
  }, [navigate]);

  const handleSuccess = () => {
    navigate('/projects');
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-content">
          <h1>📋 Trello Valdymo Sistema</h1>
          <LoginForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
