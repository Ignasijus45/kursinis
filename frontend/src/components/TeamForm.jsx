import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../services';

export default function TeamForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Pavadinimas privalomas');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await teamService.create({ name: name.trim() });
      const createdTeam = response?.data?.team;
      setName('');
      if (onSuccess) onSuccess(createdTeam);
      if (createdTeam?.id) {
        navigate(`/teams/${createdTeam.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Klaida sukuriant komandą');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <h2>Sukurti komandą</h2>

      {error && <div className="error-message">{error}</div>}

      <input
        type="text"
        name="name"
        placeholder="Komandos pavadinimas"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Kuriama...' : 'Sukurti komandą'}
      </button>
    </form>
  );
}
