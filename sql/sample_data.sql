-- Dashboard Builder - Sample Data
-- Run AFTER schema.sql

INSERT INTO dashboards (name) VALUES ('Analytics Overview');

SET @did = LAST_INSERT_ID();

INSERT INTO widgets (id, dashboard_id, type, x, y, w, h, content) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    @did,
    'text',
    0, 0, 5, 3,
    '{"html": "<h2><strong>Welcome to Dashboard Builder</strong></h2><p>This is a <strong>rich text</strong> widget. <em>Double-click</em> to edit it with full formatting support: bold, italic, font sizes, colors, and more.</p>"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    @did,
    'chart',
    5, 0, 7, 5,
    '{"chartType": "bar", "title": "Monthly Revenue (USD)", "theme": "purple"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    @did,
    'chart',
    0, 3, 5, 5,
    '{"chartType": "line", "title": "Weekly Active Users", "theme": "green"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    @did,
    'image',
    5, 5, 7, 4,
    '{"url": "", "alt": "Dashboard image", "objectFit": "cover"}'
  );
