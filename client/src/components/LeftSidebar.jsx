import React, { useState } from 'react';

const TYPE_ICONS = { text: 'T', image: '⬜', chart: '≡' };

function getWidgetLabel(widget) {
  if (widget.type === 'text') {
    const stripped = (widget.content.html || '').replace(/<[^>]+>/g, '').trim();
    return stripped.slice(0, 26) || 'Text';
  }
  if (widget.type === 'chart') return widget.content.title || 'Chart';
  if (widget.type === 'image') return widget.content.alt || 'Image';
  return widget.type;
}

const SECTIONS = [
  {
    title: 'Typography',
    items: [
      { type: 'text', label: 'Heading',   icon: 'H',  desc: 'Rich text heading' },
      { type: 'text', label: 'Paragraph', icon: '¶',  desc: 'Text paragraph block' },
      { type: 'text', label: 'Rich Text', icon: '≡',  desc: 'Full formatting support' },
    ],
  },
  {
    title: 'Media',
    items: [
      { type: 'image', label: 'Image', icon: '🖼', desc: 'Upload and place image' },
    ],
  },
  {
    title: 'Charts',
    items: [
      { type: 'chart', subtype: 'bar',  label: 'Bar Chart',  icon: '📊', desc: 'Bar chart with dynamic data' },
      { type: 'chart', subtype: 'line', label: 'Line Chart', icon: '📈', desc: 'Line chart with dynamic data' },
    ],
  },
];

function LeftSidebar({ onAddWidget, widgets = [], selectedId, onSelect, onWidgetDragStart, onWidgetDragEnd }) {
  const [open, setOpen] = useState({ Layers: true, Typography: true, Media: true, Charts: true });
  const toggle = (title) => setOpen((o) => ({ ...o, [title]: !o[title] }));

  return (
    <aside className="left-sidebar">
      {/* LAYERS PANEL */}
      <div className="sidebar-section">
        <div className="section-title" onClick={() => toggle('Layers')}>
          <span>Layers</span>
          {widgets.length > 0 && (
            <span className="layers-count">{widgets.length}</span>
          )}
          <span className="section-arrow">{open.Layers ? '▾' : '▸'}</span>
        </div>

        {open.Layers && (
          <div className="layers-list">
            {widgets.length === 0 ? (
              <div className="layers-empty">No elements on canvas yet</div>
            ) : (
              [...widgets].reverse().map((widget) => (
                <div
                  key={widget.id}
                  className={`layer-item${widget.id === selectedId ? ' layer-selected' : ''}`}
                  onClick={() => onSelect(widget.id)}
                  title={`${widget.type} — click to select`}
                >
                  <span className="layer-icon">{TYPE_ICONS[widget.type]}</span>
                  <span className="layer-label">{getWidgetLabel(widget)}</span>
                  <span className="layer-type-tag">{widget.type}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ADD ELEMENTS */}
      <div className="sidebar-header">Add Elements</div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="sidebar-section">
          <div className="section-title" onClick={() => toggle(section.title)}>
            <span>{section.title}</span>
            <span className="section-arrow">{open[section.title] ? '▾' : '▸'}</span>
          </div>

          {open[section.title] && (
            <div className="section-items">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="sidebar-item"
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('widgetType', item.type);
                    e.dataTransfer.setData('widgetSubtype', item.subtype || '');
                    e.dataTransfer.effectAllowed = 'copy';
                    onWidgetDragStart?.(item.type);
                  }}
                  onDragEnd={() => onWidgetDragEnd?.()}
                  onClick={() => onAddWidget(item.type, item.subtype)}
                  title={`${item.desc} — drag to canvas or click to add`}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}

export default LeftSidebar;
