import { useState, useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { db } from '../../db/db';

export function DataSettings() {
  const [resetText, setResetText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data: Record<string, unknown[]> = {};
      await db.transaction('r', db.tables, async () => {
        for (const table of db.tables) {
          data[table.name] = await table.toArray();
        }
      });

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timebox-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportConfirm(true);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data = JSON.parse(text) as Record<string, unknown[]>;

      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          if (data[table.name]) {
            await table.clear();
            await table.bulkAdd(data[table.name] as Record<string, unknown>[]);
          }
        }
      });

      window.location.reload();
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setShowImportConfirm(false);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (resetText !== 'reset') return;

    try {
      await db.delete();
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <div className="settings-body">
      <div className="data-actions">
        <button className="btn-export" onClick={handleExport}>
          <Download size={16} />
          Export All Data
        </button>

        <button className="btn-import" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
          Import Data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFileSelect}
          style={{ display: 'none' }}
        />

        <div className="data-divider" />

        <button className="btn-danger" onClick={() => setShowResetConfirm(true)}>
          <Trash2 size={16} />
          Reset Application
        </button>
      </div>

      {showImportConfirm && (
        <div className="confirm-dialog">
          <p>Importing data will replace all existing data. Continue?</p>
          <div className="confirm-actions">
            <button className="btn-secondary" onClick={() => { setShowImportConfirm(false); setImportFile(null); }}>
              Cancel
            </button>
            <button className="btn-danger" onClick={handleImportConfirm}>
              Import
            </button>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="confirm-dialog">
          <p>This will permanently delete all data. Type <strong>reset</strong> to confirm.</p>
          <input
            className="confirm-input"
            type="text"
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            placeholder="Type 'reset' to confirm"
            autoFocus
          />
          <div className="confirm-actions">
            <button className="btn-secondary" onClick={() => { setShowResetConfirm(false); setResetText(''); }}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={handleReset}
              disabled={resetText !== 'reset'}
            >
              Delete Everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
