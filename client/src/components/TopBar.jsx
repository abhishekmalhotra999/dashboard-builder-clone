import React, { useState, useRef, useEffect } from 'react';

function TopBar({
  dashboards,
  currentDashboard,
  dashboardName,
  onNameChange,
  onSelectDashboard,
  onNewDashboard,
  onDeleteDashboard,
  onSave,
  saving,
  savedRecently,
  unsaved,
  canvasBg,
  onCanvasBgChange,
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const bgInputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">DashBuilder</span>
        </div>
      </div>

      <div className="topbar-center">
        {editing ? (
          <input
            ref={inputRef}
            className="topbar-name-input"
            value={dashboardName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          />
        ) : (
          <span
            className="topbar-name"
            onClick={() => setEditing(true)}
            title="Click to rename dashboard"
          >
            {dashboardName || 'Untitled Dashboard'}
            <span className="edit-hint">✎</span>
          </span>
        )}

        {dashboards.length > 1 && (
          <select
            className="dashboard-select"
            value={currentDashboard?.id || ''}
            onChange={(e) => onSelectDashboard(Number(e.target.value))}
          >
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        <button
          className="btn btn-danger-ghost"
          onClick={onDeleteDashboard}
          title="Delete this dashboard"
        >
          🗑 Delete
        </button>
      </div>

      <div className="topbar-right">
        {/* Canvas background color picker */}
        <div className="canvas-bg-picker">
          <button
            className="canvas-bg-btn"
            onClick={() => bgInputRef.current?.click()}
            title="Canvas background color"
          >
            <span className="canvas-bg-swatch" style={{ background: canvasBg }} />
            <span>Canvas</span>
          </button>
          <input
            ref={bgInputRef}
            type="color"
            value={canvasBg}
            onChange={(e) => onCanvasBgChange(e.target.value)}
            style={{ display: 'none' }}
          />
        </div>

        <button className="btn btn-secondary" onClick={onNewDashboard}>
          + New
        </button>

        {/* Autosave status indicator */}
        <span className={`autosave-status${saving ? ' autosave-saving' : savedRecently ? ' autosave-saved' : unsaved ? ' autosave-pending' : ''}`}>
          {saving ? '⟳ Saving…' : savedRecently ? '✓ Saved' : unsaved ? '● Unsaved' : '✓ Saved'}
        </span>

        {/* Keyboard shortcut hint */}
        <div className="shortcut-hint" title="Keyboard shortcut: Ctrl+S (or ⌘+S on Mac) to save — changes also auto-save after 2 seconds">ⓘ</div>

        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <span className="btn-spinner" /> Saving...
            </>
          ) : (
            '✓ Save'
          )}
        </button>
      </div>
    </header>
  );
}

export default TopBar;
