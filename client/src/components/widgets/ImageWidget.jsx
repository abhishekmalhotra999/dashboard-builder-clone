import React, { useRef, useState } from 'react';
import { uploadImage } from '../../api/dashboardApi.js';

function ImageWidget({ widget, onUpdate }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadImage(file);
      onUpdate({ content: { ...widget.content, url: data.url } });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      // Reset so same file can be re-selected
      e.target.value = '';
    }
  }

  const url = widget.content.url;

  return (
    <div className="image-widget">
      {url ? (
        <div className="image-display">
          <img
            src={url}
            alt={widget.content.alt || ''}
            style={{ objectFit: widget.content.objectFit || 'cover' }}
          />
          <button
            className="image-replace-btn no-drag"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '↺ Replace'}
          </button>
        </div>
      ) : (
        <div
          className="image-placeholder"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <span className="placeholder-icon">⏳</span>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span className="placeholder-icon">🖼</span>
              <span className="placeholder-title">Click to upload image</span>
              <span className="placeholder-sub">PNG, JPG, GIF, WebP — max 10 MB</span>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="no-drag"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImageWidget;
