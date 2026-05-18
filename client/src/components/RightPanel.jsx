import React from 'react';
import { generateDefaultData } from '../utils/chartData';

function RightPanel({ selectedWidget, onUpdateWidget }) {
  if (!selectedWidget) {
    return (
      <aside className="right-panel">
        <div className="right-panel-empty">
          <div className="empty-panel-icon">◻</div>
          <p>Select an element on the canvas to edit its properties</p>
        </div>
      </aside>
    );
  }

  const { id, type, x, y, w, h, content } = selectedWidget;

  const updateContent = (key, value) => {
    onUpdateWidget(id, { content: { ...content, [key]: value } });
  };

  // Resolve chart data: use customData or generate defaults from widget id
  const resolvedChartData = type === 'chart'
    ? (content.customData || generateDefaultData(id))
    : null;

  const updateDataPoint = (index, field, value) => {
    const next = {
      labels: [...resolvedChartData.labels],
      values: [...resolvedChartData.values],
    };
    if (field === 'label') next.labels[index] = value;
    else next.values[index] = value === '' ? '' : Number(value);
    updateContent('customData', next);
  };

  const addDataPoint = () => {
    if (resolvedChartData.labels.length >= 20) return;
    updateContent('customData', {
      labels: [...resolvedChartData.labels, 'New'],
      values: [...resolvedChartData.values, 0],
    });
  };

  const removeDataPoint = (index) => {
    if (resolvedChartData.labels.length <= 1) return;
    updateContent('customData', {
      labels: resolvedChartData.labels.filter((_, i) => i !== index),
      values: resolvedChartData.values.filter((_, i) => i !== index),
    });
  };

  return (
    <aside className="right-panel">
      <div className="right-panel-header">
        <span className="panel-badge">{type}</span>
        <span>Properties</span>
      </div>

      {/* Layout */}
      <section className="prop-section">
        <div className="prop-section-title">Layout</div>
        <div className="prop-grid-2">
          <div className="prop-field">
            <label>X (col)</label>
            <input type="number" readOnly value={x} className="prop-input" />
          </div>
          <div className="prop-field">
            <label>Y (row)</label>
            <input type="number" readOnly value={y} className="prop-input" />
          </div>
          <div className="prop-field">
            <label>Width</label>
            <input type="number" readOnly value={w} className="prop-input" />
          </div>
          <div className="prop-field">
            <label>Height</label>
            <input type="number" readOnly value={h} className="prop-input" />
          </div>
        </div>
      </section>

      {/* Text properties */}
      {type === 'text' && (
        <section className="prop-section">
          <div className="prop-section-title">Text</div>
          <p className="prop-hint">
            Double-click the widget on the canvas to open the rich text editor with bold,
            italic, font size, and color tools.
          </p>
        </section>
      )}

      {/* Image properties */}
      {type === 'image' && (
        <section className="prop-section">
          <div className="prop-section-title">Image</div>
          <div className="prop-field">
            <label>Image URL</label>
            <input
              type="url"
              className="prop-input"
              value={content.url || ''}
              onChange={(e) => updateContent('url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="prop-field" style={{ marginTop: 8 }}>
            <label>Alt Text</label>
            <input
              type="text"
              className="prop-input"
              value={content.alt || ''}
              onChange={(e) => updateContent('alt', e.target.value)}
              placeholder="Describe the image"
            />
          </div>
          <div className="prop-field" style={{ marginTop: 8 }}>
            <label>Object Fit</label>
            <select
              className="prop-input"
              value={content.objectFit || 'cover'}
              onChange={(e) => updateContent('objectFit', e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
            </select>
          </div>
        </section>
      )}

      {/* Chart properties */}
      {type === 'chart' && (
        <section className="prop-section">
          <div className="prop-section-title">Chart</div>

          <div className="prop-field">
            <label>Chart Type</label>
            <div className="toggle-group">
              {['bar', 'line'].map((ct) => (
                <button
                  key={ct}
                  className={`toggle-btn${content.chartType === ct ? ' active' : ''}`}
                  onClick={() => updateContent('chartType', ct)}
                >
                  {ct === 'bar' ? '📊 Bar' : '📈 Line'}
                </button>
              ))}
            </div>
          </div>

          <div className="prop-field" style={{ marginTop: 10 }}>
            <label>Chart Title</label>
            <input
              type="text"
              className="prop-input"
              value={content.title || ''}
              onChange={(e) => updateContent('title', e.target.value)}
              placeholder="e.g. Monthly Sales"
            />
          </div>

          <div className="prop-field" style={{ marginTop: 10 }}>
            <label>Y-Axis Label</label>
            <input
              type="text"
              className="prop-input"
              value={content.yAxisLabel || ''}
              onChange={(e) => updateContent('yAxisLabel', e.target.value)}
              placeholder="e.g. Revenue ($)"
            />
          </div>

          <div className="prop-field" style={{ marginTop: 10 }}>
            <label>Show Legend</label>
            <div className="toggle-group">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  className={`toggle-btn${Boolean(content.showLegend) === val ? ' active' : ''}`}
                  onClick={() => updateContent('showLegend', val)}
                >
                  {val ? 'On' : 'Off'}
                </button>
              ))}
            </div>
          </div>

          <div className="prop-field" style={{ marginTop: 10 }}>
            <label>Color Theme</label>
            <div className="color-theme-grid">
              {['blue', 'purple', 'green', 'orange', 'red'].map((theme) => (
                <div
                  key={theme}
                  className={`color-dot color-${theme}${content.theme === theme ? ' active' : ''}`}
                  onClick={() => updateContent('theme', theme)}
                  title={theme}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Chart data editor */}
      {type === 'chart' && resolvedChartData && (
        <section className="prop-section">
          <div className="prop-section-title" style={{ marginBottom: 8 }}>Data Points</div>
          <div className="data-editor">
            <div className="data-editor-header">
              <span>Label</span>
              <span>Value</span>
              <span></span>
            </div>
            {resolvedChartData.labels.map((label, i) => (
              <div className="data-editor-row" key={i}>
                <input
                  className="data-input"
                  value={label}
                  onChange={(e) => updateDataPoint(i, 'label', e.target.value)}
                  placeholder="Label"
                />
                <input
                  className="data-input data-input-num"
                  type="number"
                  value={resolvedChartData.values[i]}
                  onChange={(e) => updateDataPoint(i, 'value', e.target.value)}
                  placeholder="0"
                />
                <button
                  className="data-row-delete"
                  onClick={() => removeDataPoint(i)}
                  title="Remove"
                  disabled={resolvedChartData.labels.length <= 1}
                >×</button>
              </div>
            ))}
          </div>
          <button
            className="add-data-btn"
            onClick={addDataPoint}
            disabled={resolvedChartData.labels.length >= 20}
          >+ Add Data Point</button>
        </section>
      )}
    </aside>
  );
}

export default RightPanel;
