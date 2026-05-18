import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean'],
  ],
};

const formats = [
  'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align',
];

function TextWidget({ widget, isSelected, onUpdate }) {
  const [editing, setEditing] = useState(false);

  // Exit editing when widget is deselected
  useEffect(() => {
    if (!isSelected) setEditing(false);
  }, [isSelected]);

  if (editing) {
    return (
      <div className="text-widget-editing">
        <ReactQuill
          theme="snow"
          value={widget.content.html || ''}
          onChange={(html) => onUpdate({ content: { ...widget.content, html } })}
          modules={modules}
          formats={formats}
          autoFocus
        />
        <button
          className="text-done-btn"
          onClick={(e) => { e.stopPropagation(); setEditing(false); }}
        >
          ✓ Done editing
        </button>
      </div>
    );
  }

  return (
    <div
      className="text-widget-view"
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Double-click to edit"
    >
      {widget.content.html ? (
        <div
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: widget.content.html }}
        />
      ) : (
        <p className="placeholder-text">Double-click to edit text...</p>
      )}
    </div>
  );
}

export default TextWidget;
