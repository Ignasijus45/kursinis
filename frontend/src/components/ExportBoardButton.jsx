import React, { useState } from 'react';
import { taskService } from '../services';

export default function ExportBoardButton({ boardId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const res = await taskService.exportBoard(boardId);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Nepavyko eksportuoti lentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-board">
      <button type="button" className="outline-button" onClick={handleExport} disabled={loading}>
        {loading ? 'Eksportuojama...' : 'Export JSON'}
      </button>
      {error && <div className="error-message">{error}</div>}
      {downloadUrl && (
        <a href={downloadUrl} download={`board-${boardId}.json`} className="small-link">
          Atsisiųsti JSON
        </a>
      )}
    </div>
  );
}
