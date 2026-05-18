import React, { useCallback } from 'react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import TextWidget from './widgets/TextWidget.jsx';
import ImageWidget from './widgets/ImageWidget.jsx';
import ChartWidget from './widgets/ChartWidget.jsx';

const GridLayout = WidthProvider(ReactGridLayout);

const WIDGET_COMPONENTS = {
  text: TextWidget,
  image: ImageWidget,
  chart: ChartWidget,
};

// Default drop dimensions per widget type
const DROPPING_SIZES = {
  text:  { w: 5, h: 3 },
  image: { w: 4, h: 4 },
  chart: { w: 6, h: 4 },
};

function Canvas({ widgets, selectedId, onSelect, onLayoutChange, onDeleteWidget, onUpdateWidget, canvasBg, draggingWidgetType, onAddWidget }) {
  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 2,
    minH: 2,
  }));

  const handleLayoutChange = useCallback(
    (newLayout) => onLayoutChange(newLayout),
    [onLayoutChange]
  );

  // Build droppingItem based on what type is being dragged from sidebar
  const droppingItem = {
    i: '__dropping-elem__',
    ...(DROPPING_SIZES[draggingWidgetType] || { w: 4, h: 3 }),
  };

  const handleDrop = useCallback((layout, item, e) => {
    const type = e.dataTransfer?.getData('widgetType');
    const subtype = e.dataTransfer?.getData('widgetSubtype') || undefined;
    if (type) onAddWidget(type, subtype, item.x, item.y, item.w, item.h);
  }, [onAddWidget]);

  return (
    <main
      className="canvas-area"
      onMouseDown={(e) => {
        // Only deselect if clicking directly on the background — not on a widget
        if (
          e.target.classList.contains('canvas-area') ||
          e.target.classList.contains('canvas-scroll-inner') ||
          e.target.classList.contains('layout') ||
          e.target.classList.contains('react-grid-layout')
        ) {
          onSelect(null);
        }
      }}
    >
      <div className="canvas-scroll-inner">
        <GridLayout
          className="layout"
          layout={layout}
          style={{ background: canvasBg, transition: 'background 0.3s' }}
          cols={12}
          rowHeight={80}
          draggableHandle=".drag-handle"
          isDroppable={Boolean(draggingWidgetType)}
          droppingItem={droppingItem}
          onDrop={handleDrop}
          onDragStop={handleLayoutChange}
          onResizeStop={handleLayoutChange}
          margin={[12, 12]}
          containerPadding={[16, 16]}
        >
          {widgets.map((widget) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.type];
            const isSelected = widget.id === selectedId;

            return (
              <div
                key={widget.id}
                className={`widget-wrapper${isSelected ? ' widget-selected' : ''}`}
                data-widget-id={widget.id}
                onMouseDown={() => onSelect(widget.id)}
                onClick={() => onSelect(widget.id)}
              >
                {/* Drag handle — dragging only works from here */}
                <div className="drag-handle" title="Drag to move">
                  <span className="drag-dots">⠿</span>
                  {isSelected && <span className="widget-type-badge">{widget.type}</span>}
                </div>

                <button
                  className="widget-delete"
                  onClick={(e) => { e.stopPropagation(); onDeleteWidget(widget.id); }}
                  title="Delete widget"
                >
                  ×
                </button>

                <div className="widget-content">
                  <WidgetComponent
                    widget={widget}
                    isSelected={isSelected}
                    onUpdate={(updates) => onUpdateWidget(widget.id, updates)}
                  />
                </div>
              </div>
            );
          })}
        </GridLayout>

        {widgets.length === 0 && (
          <div className="canvas-empty">
            <div className="canvas-empty-icon">✦</div>
            <p>Your canvas is empty</p>
            <span>Click an element in the left sidebar to add it</span>
          </div>
        )}
      </div>
    </main>
  );
}

export default Canvas;
