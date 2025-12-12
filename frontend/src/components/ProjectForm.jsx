import React, { useState } from 'react';
import { projectService } from '../services';

export default function ProjectForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3498db'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await projectService.create(formData);
      setFormData({ title: '', description: '', color: '#3498db' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Klaida sukuriant projektą');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <h2>Sukurti naują projektą</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="text"
        name="title"
        placeholder="Projekto pavadinimas"
        value={formData.title}
        onChange={handleChange}
        required
      />
      
      <textarea
        name="description"
        placeholder="Aprašymas"
        value={formData.description}
        onChange={handleChange}
      />
      
      <input
        type="color"
        name="color"
        value={formData.color}
        onChange={handleChange}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Kuriamas...' : 'Sukurti projektą'}
      </button>
    </form>
  );
}
