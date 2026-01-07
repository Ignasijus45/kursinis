import React, { useState } from 'react';
import { taskService } from '../services';

export default function ImportBoardForm({ projectId, teamId, onImported }) {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (parseErr) {
        setError('Neteisingas JSON formatas');
        setLoading(false);
        return;
      }
      const payload = { data };
      if (projectId) payload.project_id = projectId;
      if (teamId) payload.team_id = teamId;
      const res = await taskService.importBoard(payload);
      if (onImported) onImported(res.data?.board);
      setJsonInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Nepavyko importuoti lentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="import-board-form" onSubmit={handleSubmit}>
      <h4>Importuoti lentą (JSON)</h4>
      {error && <div className="error-message">{error}</div>}
      <textarea
        rows={4}
        placeholder="Įklijuokite eksportuotą JSON"
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Importuojama...' : 'Importuoti'}
      </button>
    </form>
  );
}
