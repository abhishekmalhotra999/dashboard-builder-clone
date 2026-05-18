import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopBar from './components/TopBar.jsx';
import LeftSidebar from './components/LeftSidebar.jsx';
import Canvas from './components/Canvas.jsx';
import RightPanel from './components/RightPanel.jsx';
import {
  listDashboards,
  createDashboard,
  getDashboard,
  saveLayout,
  deleteDashboard,
} from './api/dashboardApi.js';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard');
  const [widgets, setWidgets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const autosaveTimerRef = useRef(null);
  const savedRecentlyTimerRef = useRef(null);
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [draggingWidgetType, setDraggingWidgetType] = useState(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  async function loadDashboards() {
    setLoading(true);
    setError(null);
    try {
      const list = await listDashboards();
      setDashboards(list);
      if (list.length > 0) {
        // Restore the last-visited dashboard from localStorage
        const lastId = parseInt(localStorage.getItem('lastDashboardId'), 10);
        const target = lastId && list.find((d) => d.id === lastId) ? lastId : list[0].id;
        await loadDashboard(target);
      } else {
        const created = await createDashboard('My Dashboard');
        setDashboards([created]);
        setCurrentDashboard(created);
        setDashboardName(created.name);
        setWidgets([]);
        localStorage.setItem('lastDashboardId', created.id);
      }
    } catch (err) {
      setError('Failed to connect to the database. Make sure the server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(id) {
    try {
      const data = await getDashboard(id);
      setCurrentDashboard(data.dashboard);
      setDashboardName(data.dashboard.name);
      setWidgets(data.widgets || []);
      setSelectedId(null);
      setUnsaved(false);
      localStorage.setItem('lastDashboardId', id);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    }
  }

  async function handleNewDashboard() {
    const name = `Dashboard ${dashboards.length + 1}`;
    const created = await createDashboard(name);
    const list = await listDashboards();
    setDashboards(list);
    await loadDashboard(created.id);
  }

  async function handleDeleteDashboard() {
    if (!currentDashboard) return;
    if (!window.confirm(`Delete "${dashboardName}"? This cannot be undone.`)) return;
    await deleteDashboard(currentDashboard.id);
    const list = await listDashboards();
    if (list.length > 0) {
      setDashboards(list);
      await loadDashboard(list[0].id);
    } else {
      const created = await createDashboard('My Dashboard');
      setDashboards([created]);
      await loadDashboard(created.id);
    }
  }

  const handleSave = useCallback(async () => {
    if (!currentDashboard) return;
    setSaving(true);
    setSavedRecently(false);
    try {
      await saveLayout(currentDashboard.id, dashboardName, widgets);
      setUnsaved(false);
      setSavedRecently(true);
      const list = await listDashboards();
      setDashboards(list);
      // Clear the "Saved" indicator after 3 seconds
      clearTimeout(savedRecentlyTimerRef.current);
      savedRecentlyTimerRef.current = setTimeout(() => setSavedRecently(false), 3000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  }, [currentDashboard, dashboardName, widgets]);

  // Always keep a ref to the latest handleSave so the autosave timer calls the freshest version
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // Autosave: trigger 2 seconds after the last change
  useEffect(() => {
    if (!unsaved || !currentDashboard) return;
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => handleSaveRef.current(), 2000);
    return () => clearTimeout(autosaveTimerRef.current);
  }, [unsaved, currentDashboard, widgets, dashboardName]);

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  function addWidget(type, subtype, dropX, dropY, dropW, dropH) {
    setUnsaved(true);
    const id = uuidv4();
    const chartType = type === 'chart' ? (subtype || 'bar') : undefined;
    const defaults = {
      text:  { w: 5, h: 3, content: { html: '<p>Double-click to edit this text...</p>' } },
      image: { w: 4, h: 4, content: { url: '', alt: 'Image', objectFit: 'cover' } },
      chart: { w: 6, h: 4, content: { chartType, title: 'Chart', theme: 'blue', customData: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'], values: [45,60,75,55,80,65,70] } } },
    };
    const def = defaults[type];
    const x = dropX ?? 0;
    const y = dropY ?? widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    const w = dropW ?? def.w;
    const h = dropH ?? def.h;
    const newWidget = { id, type, x, y, w, h, content: def.content };
    setWidgets((prev) => [...prev, newWidget]);
    setSelectedId(id);
  }

  const updateWidget = useCallback((id, updates) => {
    setUnsaved(true);
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  function deleteWidget(id) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const onLayoutChange = useCallback((layout) => {
    setWidgets((prev) => {
      let changed = false;
      const next = prev.map((w) => {
        const item = layout.find((l) => l.i === w.id);
        if (!item) return w;
        if (item.x === w.x && item.y === w.y && item.w === w.w && item.h === w.h) return w;
        changed = true;
        return { ...w, x: item.x, y: item.y, w: item.w, h: item.h };
      });
      if (!changed) return prev; // no reference change → no re-render
      setUnsaved(true);
      return next;
    });
  }, []);

  const selectedWidget = widgets.find((w) => w.id === selectedId) || null;

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Connecting to database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading">
        <div className="error-icon">⚠</div>
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={loadDashboards}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <TopBar
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        dashboardName={dashboardName}
        onNameChange={setDashboardName}
        onSelectDashboard={loadDashboard}
        onNewDashboard={handleNewDashboard}
        onDeleteDashboard={handleDeleteDashboard}
        onSave={handleSave}
        saving={saving}
        savedRecently={savedRecently}
        unsaved={unsaved}
        canvasBg={canvasBg}
        onCanvasBgChange={setCanvasBg}
      />
      <div className="main-area">
        <LeftSidebar
          onAddWidget={addWidget}
          widgets={widgets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onWidgetDragStart={setDraggingWidgetType}
          onWidgetDragEnd={() => setDraggingWidgetType(null)}
        />
        <Canvas
          widgets={widgets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onLayoutChange={onLayoutChange}
          onDeleteWidget={deleteWidget}
          onUpdateWidget={updateWidget}
          canvasBg={canvasBg}
          draggingWidgetType={draggingWidgetType}
          onAddWidget={addWidget}
        />
        <RightPanel selectedWidget={selectedWidget} onUpdateWidget={updateWidget} />
      </div>
    </div>
  );
}

export default App;
