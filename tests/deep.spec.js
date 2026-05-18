// ============================================================
// Deep E2E Test Suite — Dashboard Builder
// Tests every major feature from the frontend perspective.
// Run: npx playwright test tests/deep.spec.js
// ============================================================
import { test, expect, request } from '@playwright/test';

const API = 'http://localhost:3001';

// Seed a fresh test dashboard with known widgets via API before the suite
let deepDashboardId;

test.beforeAll(async () => {
  const ctx = await request.newContext();
  // Create the test dashboard
  const res = await ctx.post(`${API}/api/dashboards`, { data: { name: 'Deep Test Dashboard' } });
  const body = await res.json();
  deepDashboardId = body.id;
  // Seed it with a chart + text + image widget
  await ctx.put(`${API}/api/dashboards/${deepDashboardId}/layout`, {
    data: {
      name: 'Deep Test Dashboard',
      widgets: [
        { id: 'deep-text-1',  type: 'text',  x: 0, y: 0, w: 5, h: 3, content: { html: '<p>Hello Deep Test</p>' } },
        { id: 'deep-chart-1', type: 'chart', x: 5, y: 0, w: 6, h: 4, content: { chartType: 'bar', title: 'Deep Chart', theme: 'blue', customData: { labels: ['A','B','C'], values: [10,20,30] } } },
        { id: 'deep-image-1', type: 'image', x: 0, y: 3, w: 4, h: 4, content: { url: '', alt: 'Test Image', objectFit: 'cover' } },
      ],
    },
  });
  await ctx.dispose();
});

test.afterAll(async () => {
  const ctx = await request.newContext();
  await ctx.delete(`${API}/api/dashboards/${deepDashboardId}`);
  await ctx.dispose();
});

test.describe('Dashboard Builder – Deep E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Always load our dedicated test dashboard
    await page.addInitScript((id) => {
      localStorage.setItem('lastDashboardId', String(id));
    }, deepDashboardId);
    await page.goto('/');
    await page.waitForSelector('.widget-wrapper', { timeout: 15000 });
  });

  // ════════════════════════════════════════════════════════
  // GROUP 1 — Layout Structure
  // ════════════════════════════════════════════════════════

  test('1. Three-panel layout: topbar, sidebar, canvas, right-panel all visible', async ({ page }) => {
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.left-sidebar')).toBeVisible();
    await expect(page.locator('.canvas-area')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
  });

  test('2. Topbar has logo, name, Save, +New, Delete, shortcut-hint, canvas-bg-btn', async ({ page }) => {
    await expect(page.locator('.logo-text')).toContainText('DashBuilder');
    await expect(page.locator('.topbar-name')).toBeVisible();
    await expect(page.locator('.btn-primary')).toContainText('Save');
    await expect(page.locator('.btn-secondary')).toContainText('New');
    await expect(page.locator('.btn-danger-ghost')).toContainText('Delete');
    await expect(page.locator('.shortcut-hint')).toBeVisible();
    await expect(page.locator('.canvas-bg-btn')).toBeVisible();
  });

  test('3. Ctrl+S shortcut-hint title contains "Ctrl+S"', async ({ page }) => {
    const title = await page.locator('.shortcut-hint').getAttribute('title');
    expect(title).toContain('Ctrl+S');
  });

  test('4. Left sidebar has Layers section + Add Elements sections', async ({ page }) => {
    await expect(page.locator('.section-title').filter({ hasText: 'Layers' })).toBeVisible();
    await expect(page.locator('.section-title').filter({ hasText: 'Typography' })).toBeVisible();
    await expect(page.locator('.section-title').filter({ hasText: 'Charts' })).toBeVisible();
    await expect(page.locator('.section-title').filter({ hasText: 'Media' })).toBeVisible();
  });

  test('5. Right panel shows empty-state when nothing is selected', async ({ page }) => {
    // Click outside all widgets to deselect
    await page.locator('.canvas-area').click({ position: { x: 8, y: 8 }, force: true });
    await page.waitForTimeout(200);
    await expect(page.locator('.right-panel-empty')).toBeVisible();
  });

  // ════════════════════════════════════════════════════════
  // GROUP 2 — Layers Panel
  // ════════════════════════════════════════════════════════

  test('6. Layers panel shows badge count matching widget count', async ({ page }) => {
    const count = parseInt(await page.locator('.layers-count').textContent());
    const widgets = await page.locator('.widget-wrapper').count();
    expect(count).toBe(widgets);
  });

  test('7. Layers panel list count matches canvas widget count', async ({ page }) => {
    const layers = await page.locator('.layer-item').count();
    const widgets = await page.locator('.widget-wrapper').count();
    expect(layers).toBe(widgets);
  });

  test('8. Clicking a layer item selects the widget + opens right panel', async ({ page }) => {
    // Deselect first
    await page.locator('.canvas-area').click({ position: { x: 8, y: 8 }, force: true });
    await page.waitForTimeout(200);
    await expect(page.locator('.right-panel-empty')).toBeVisible();

    await page.locator('.layer-item').first().click();
    await page.waitForTimeout(300);

    await expect(page.locator('.right-panel-header')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.widget-selected')).toBeVisible();
  });

  test('9. Layer item has type icon, label and type badge', async ({ page }) => {
    const first = page.locator('.layer-item').first();
    await expect(first.locator('.layer-icon')).toBeVisible();
    await expect(first.locator('.layer-label')).toBeVisible();
    await expect(first.locator('.layer-type-tag')).toBeVisible();
  });

  test('10. Layers updates live when a widget is added', async ({ page }) => {
    const before = await page.locator('.layer-item').count();
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    expect(await page.locator('.layer-item').count()).toBe(before + 1);
  });

  test('11. Layers updates live when a widget is deleted', async ({ page }) => {
    // Add then delete
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    const before = await page.locator('.layer-item').count();

    const last = page.locator('.widget-wrapper').last();
    await last.hover();
    await last.locator('.widget-delete').click({ force: true });
    await page.waitForTimeout(300);
    expect(await page.locator('.layer-item').count()).toBe(before - 1);
  });

  test('12. Collapsing Layers section hides layer items', async ({ page }) => {
    await page.locator('.section-title').filter({ hasText: 'Layers' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.layers-list')).not.toBeVisible();
    // Re-expand
    await page.locator('.section-title').filter({ hasText: 'Layers' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.layers-list')).toBeVisible();
  });

  // ════════════════════════════════════════════════════════
  // GROUP 3 — Widget Add via Sidebar Click
  // ════════════════════════════════════════════════════════

  test('13. Add text widget: appears on canvas, selected, right panel opens', async ({ page }) => {
    const before = await page.locator('.widget-wrapper').count();
    await page.locator('.sidebar-item').filter({ hasText: 'Rich Text' }).click();
    await page.waitForTimeout(300);
    expect(await page.locator('.widget-wrapper').count()).toBe(before + 1);
    await expect(page.locator('.right-panel-header')).toBeVisible();
    await expect(page.locator('.widget-selected')).toBeVisible();
  });

  test('14. Add bar chart widget: canvas element renders', async ({ page }) => {
    const before = await page.locator('.widget-wrapper').count();
    await page.locator('.sidebar-item').filter({ hasText: 'Bar Chart' }).click();
    await page.waitForTimeout(500);
    expect(await page.locator('.widget-wrapper').count()).toBe(before + 1);
    await expect(page.locator('.chart-widget canvas').last()).toBeVisible();
  });

  test('15. Add image widget: shows upload placeholder', async ({ page }) => {
    await page.locator('.sidebar-item').filter({ hasText: 'Image' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.image-placeholder').last()).toBeVisible();
  });

  test('16. Sidebar elements are draggable (have draggable=true)', async ({ page }) => {
    const items = page.locator('.sidebar-item');
    for (let i = 0; i < await items.count(); i++) {
      const attr = await items.nth(i).getAttribute('draggable');
      expect(attr).toBe('true');
    }
  });

  // ════════════════════════════════════════════════════════
  // GROUP 4 — Text Widget
  // ════════════════════════════════════════════════════════

  test('17. Text widget: double-click opens Quill editor with toolbar', async ({ page }) => {
    // Select via layer first to ensure it's on screen, then dblclick the content div
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'text' }) }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.text-widget-view').first().dblclick({ force: true });
    await expect(page.locator('.ql-toolbar').first()).toBeVisible({ timeout: 5000 });
  });

  test('18. Text widget: "Done editing" button closes editor', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'text' }) }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.text-widget-view').first().dblclick({ force: true });
    await expect(page.locator('.ql-toolbar').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.text-done-btn').first().click();
    await expect(page.locator('.ql-toolbar').first()).not.toBeVisible({ timeout: 3000 });
  });

  test('19. Text widget: deselecting widget closes editor', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'text' }) }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.text-widget-view').first().dblclick({ force: true });
    await expect(page.locator('.ql-toolbar').first()).toBeVisible({ timeout: 5000 });
    // Deselect by clicking canvas bg
    await page.locator('.canvas-area').click({ position: { x: 8, y: 8 }, force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.ql-toolbar').first()).not.toBeVisible();
  });

  test('20. Text widget layer label shows stripped text content', async ({ page }) => {
    const textLayer = page.locator('.layer-item').filter({
      has: page.locator('.layer-type-tag', { hasText: 'text' }),
    }).first();
    const label = (await textLayer.locator('.layer-label').textContent()).trim();
    expect(label.length).toBeGreaterThan(0);
  });

  // ════════════════════════════════════════════════════════
  // GROUP 5 — Image Widget
  // ════════════════════════════════════════════════════════

  test('21. Image widget: URL input in right panel renders the image', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'image' }) }).first().click();
    await page.waitForTimeout(400);
    const iw = page.locator('.widget-selected');
    const urlInput = page.locator('.prop-input[type="url"]');
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://picsum.photos/seed/dash/200/200');
    await page.waitForTimeout(800);
    await expect(iw.locator('img')).toBeVisible({ timeout: 6000 });
  });

  test('22. Image widget: alt text input updates the value', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'image' }) }).first().click();
    await page.waitForTimeout(400);
    const altInput = page.locator('.prop-input[placeholder="Describe the image"]');
    await altInput.fill('Dashboard screenshot');
    expect(await altInput.inputValue()).toBe('Dashboard screenshot');
  });

  test('23. Image widget: object-fit dropdown has Cover, Contain, Fill, None', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'image' }) }).first().click();
    await page.waitForTimeout(400);
    const opts = await page.locator('select.prop-input').locator('option').allTextContents();
    expect(opts).toEqual(expect.arrayContaining(['Cover', 'Contain', 'Fill', 'None']));
  });

  // ════════════════════════════════════════════════════════
  // GROUP 6 — Chart Controls (Right Panel)
  // ════════════════════════════════════════════════════════

  test('24. Chart: select shows Chart section with type toggles', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('.panel-badge', { hasText: 'chart' })).toBeVisible();
    await expect(page.locator('.toggle-btn', { hasText: 'Bar' })).toBeVisible();
    await expect(page.locator('.toggle-btn', { hasText: 'Line' })).toBeVisible();
  });

  test('25. Chart: Bar→Line toggle – Line button becomes active', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    await page.locator('.toggle-btn', { hasText: 'Line' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('.toggle-btn', { hasText: 'Line' })).toHaveClass(/active/);
    // Reset to Bar
    await page.locator('.toggle-btn', { hasText: 'Bar' }).click();
  });

  test('26. Chart: title input is editable and value is reflected', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const titleInput = page.locator('.prop-input[placeholder="e.g. Monthly Sales"]');
    await titleInput.fill('Q1 Revenue');
    expect(await titleInput.inputValue()).toBe('Q1 Revenue');
  });

  test('27. Chart: Y-axis label input is visible and editable (bug fix check)', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const yInput = page.locator('.prop-input[placeholder="e.g. Revenue ($)"]');
    await expect(yInput).toBeVisible();
    await yInput.fill('Units Sold');
    await page.waitForTimeout(400);
    expect(await yInput.inputValue()).toBe('Units Sold');
  });

  test('28. Chart: Y-axis label persists through save and reload', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const yInput = page.locator('.prop-input[placeholder="e.g. Revenue ($)"]');
    await yInput.fill('Revenue ($)');
    await page.waitForTimeout(200);

    // Save
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);

    // Reload
    await page.reload();
    await page.waitForSelector('.widget-wrapper', { timeout: 10000 });

    // Re-select the chart via layers
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const yInput2 = page.locator('.prop-input[placeholder="e.g. Revenue ($)"]');
    expect(await yInput2.inputValue()).toBe('Revenue ($)');

    // Cleanup: reset to empty
    await yInput2.fill('');
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);
  });

  test('29. Chart: legend default is Off, toggling On changes button state', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    // Default Off
    await expect(page.locator('.toggle-btn', { hasText: 'Off' }).first()).toHaveClass(/active/);
    // Toggle On
    await page.locator('.toggle-btn', { hasText: 'On' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.toggle-btn', { hasText: 'On' }).first()).toHaveClass(/active/);
    // Reset Off
    await page.locator('.toggle-btn', { hasText: 'Off' }).first().click();
  });

  test('30. Chart: all 5 color theme dots are present and clickable', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const dots = page.locator('.color-dot');
    await expect(dots).toHaveCount(5);
    // Click green → becomes active
    await page.locator('.color-green').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.color-green')).toHaveClass(/active/);
    // Reset to purple
    await page.locator('.color-purple').click();
  });

  // ════════════════════════════════════════════════════════
  // GROUP 7 — Chart Data Editor
  // ════════════════════════════════════════════════════════

  test('31. Chart data editor: rows visible with label and value inputs', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('.data-editor')).toBeVisible();
    expect(await page.locator('.data-editor-row').count()).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.data-input').first()).toBeVisible();
    await expect(page.locator('.data-input-num').first()).toBeVisible();
  });

  test('32. Chart data editor: editing a label updates the input', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const first = page.locator('.data-input').first();
    const original = await first.inputValue();
    await first.fill('Week 1');
    expect(await first.inputValue()).toBe('Week 1');
    // Restore
    await first.fill(original);
  });

  test('33. Chart data editor: editing a numeric value updates the input', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const firstVal = page.locator('.data-input-num').first();
    await firstVal.fill('999');
    expect(await firstVal.inputValue()).toBe('999');
  });

  test('34. Chart data editor: Add Data Point adds a row', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    const before = await page.locator('.data-editor-row').count();
    await page.locator('.add-data-btn').click();
    await page.waitForTimeout(300);
    expect(await page.locator('.data-editor-row').count()).toBe(before + 1);
  });

  test('35. Chart data editor: delete button removes a row', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);
    // Ensure there are at least 2 rows
    await page.locator('.add-data-btn').click();
    await page.waitForTimeout(300);
    const before = await page.locator('.data-editor-row').count();
    await page.locator('.data-row-delete').last().click();
    await page.waitForTimeout(300);
    expect(await page.locator('.data-editor-row').count()).toBe(before - 1);
  });

  test('36. Chart data editor: last delete button disabled when only 1 row remains', async ({ page }) => {
    // Add a fresh chart to test on cleanly
    await page.locator('.sidebar-item').filter({ hasText: 'Bar Chart' }).click();
    await page.waitForTimeout(400);
    // Delete rows until 1 left
    let count = await page.locator('.data-editor-row').count();
    while (count > 1) {
      await page.locator('.data-row-delete:not([disabled])').first().click();
      await page.waitForTimeout(150);
      count = await page.locator('.data-editor-row').count();
    }
    await expect(page.locator('.data-row-delete').first()).toBeDisabled();
  });

  // ════════════════════════════════════════════════════════
  // GROUP 8 — Canvas Background
  // ════════════════════════════════════════════════════════

  test('37. Canvas bg swatch default is white', async ({ page }) => {
    const swatch = page.locator('.canvas-bg-swatch');
    await expect(swatch).toBeVisible();
    const bg = await swatch.evaluate(el => el.style.background);
    expect(bg).toMatch(/#fff|#ffffff|rgb\(255, 255, 255\)/i);
  });

  test('38. Canvas bg change via JS input event updates layout background', async ({ page }) => {
    await page.evaluate(() => {
      const input = document.querySelector('.canvas-bg-picker input[type="color"]');
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        .set.call(input, '#e0f2fe');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(400);
    const bg = await page.locator('.react-grid-layout').evaluate(el => el.style.background);
    // React/browser may convert hex to rgb()
    expect(bg).toMatch(/#e0f2fe|rgb\(224,\s*242,\s*254\)/);
    // Reset
    await page.evaluate(() => {
      const input = document.querySelector('.canvas-bg-picker input[type="color"]');
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        .set.call(input, '#ffffff');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // ════════════════════════════════════════════════════════
  // GROUP 9 — Unsaved State & Save
  // ════════════════════════════════════════════════════════

  test('39. Unsaved dot absent on page load, appears after widget add', async ({ page }) => {
    await expect(page.locator('.autosave-pending')).not.toBeVisible();
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.autosave-pending')).toBeVisible();
  });

  test('40. Unsaved dot disappears after Save', async ({ page }) => {
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.autosave-pending')).toBeVisible();
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.autosave-pending')).not.toBeVisible();
  });

  test('41. Save button fires PUT /api/dashboards/:id/layout', async ({ page }) => {
    let putFired = false;
    page.on('request', r => {
      if (r.method() === 'PUT' && r.url().includes('/api/dashboards/')) putFired = true;
    });
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(2000);
    expect(putFired).toBe(true);
  });

  test('42. Ctrl+S also fires PUT /api/dashboards/:id/layout', async ({ page }) => {
    let putFired = false;
    page.on('request', r => {
      if (r.method() === 'PUT' && r.url().includes('/api/dashboards/')) putFired = true;
    });
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);
    expect(putFired).toBe(true);
  });

  test('43. Save response is 200 OK', async ({ page }) => {
    let statusCode = null;
    page.on('response', r => {
      if (r.request().method() === 'PUT' && r.url().includes('/api/dashboards/')) {
        statusCode = r.status();
      }
    });
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(2500);
    expect(statusCode).toBe(200);
  });

  // ════════════════════════════════════════════════════════
  // GROUP 10 — Dashboard Management
  // ════════════════════════════════════════════════════════

  test('44. Dashboard name inline edit: type + Enter confirms', async ({ page }) => {
    await page.locator('.topbar-name').click();
    const input = page.locator('.topbar-name-input');
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.fill('My Renamed Dashboard');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await expect(page.locator('.topbar-name')).toContainText('My Renamed Dashboard');
    // Reset to original name
    await page.locator('.topbar-name').click();
    await page.locator('.topbar-name-input').fill('Deep Test Dashboard');
    await page.keyboard.press('Enter');
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);
  });

  test('45. + New dashboard: POST fires, canvas is empty, layers is empty', async ({ page }) => {
    let postFired = false;
    let newId = null;
    page.on('response', async r => {
      if (r.request().method() === 'POST' && r.url().includes('/api/dashboards')) {
        postFired = true;
        try { const b = await r.json(); newId = b.id; } catch {}
      }
    });
    await page.locator('.btn-secondary').click();
    await page.waitForTimeout(2500);
    expect(postFired).toBe(true);
    await expect(page.locator('.canvas-empty')).toBeVisible();
    await expect(page.locator('.layers-empty')).toBeVisible();
    // Clean up the extra dashboard
    if (newId) await page.request.delete(`${API}/api/dashboards/${newId}`);
  });

  test('46. Delete dashboard: dialog message contains "Delete"', async ({ page }) => {
    // Create a temp dashboard to delete
    let tempId = null;
    page.on('response', async r => {
      if (r.request().method() === 'POST' && r.url().includes('/api/dashboards')) {
        try { const b = await r.json(); tempId = b.id; } catch {}
      }
    });
    await page.locator('.btn-secondary').click();
    await page.waitForTimeout(2000);

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss(); // dismiss — don't actually delete
    });
    await page.locator('.btn-danger-ghost').click();
    await page.waitForTimeout(500);
    expect(dialogMessage).toContain('Delete');
    // Clean up the temp dashboard we created
    if (tempId) await page.request.delete(`${API}/api/dashboards/${tempId}`);
  });

  test('47. Delete dashboard: accepting dialog navigates to another dashboard', async ({ page }) => {
    // Create a temp dashboard to delete
    let tempId = null;
    page.on('response', async r => {
      if (r.request().method() === 'POST' && r.url().includes('/api/dashboards')) {
        try { const b = await r.json(); tempId = b.id; } catch {}
      }
    });
    await page.locator('.btn-secondary').click();
    await page.waitForTimeout(2000);
    const nameBefore = (await page.locator('.topbar-name').textContent()).replace('✎', '').trim();

    page.once('dialog', dialog => dialog.accept());
    await page.locator('.btn-danger-ghost').click();
    await page.waitForTimeout(2500);

    // After deletion, should be on a DIFFERENT dashboard
    const nameAfter = (await page.locator('.topbar-name').textContent()).replace('✎', '').trim();
    expect(nameAfter).not.toBe(nameBefore);
  });

  // ════════════════════════════════════════════════════════
  // GROUP 11 — Widget Interactions on Canvas
  // ════════════════════════════════════════════════════════

  test('48. Clicking widget selects it and shows widget-selected class', async ({ page }) => {
    const w = page.locator('.widget-wrapper').first();
    await w.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.widget-selected')).toBeVisible();
  });

  test('49. Widget type badge visible on selected widget drag handle', async ({ page }) => {
    const w = page.locator('.widget-wrapper').first();
    await w.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.widget-type-badge')).toBeVisible();
  });

  test('50. Resize handle visible on widget hover', async ({ page }) => {
    const w = page.locator('.widget-wrapper').first();
    await w.hover();
    await expect(page.locator('.react-resizable-handle').first()).toBeVisible({ timeout: 3000 });
  });

  test('51. Widget delete button removes widget from canvas and layers', async ({ page }) => {
    await page.locator('.sidebar-item').filter({ hasText: 'Heading' }).click();
    await page.waitForTimeout(300);
    const wBefore = await page.locator('.widget-wrapper').count();
    const lBefore = await page.locator('.layer-item').count();

    const last = page.locator('.widget-wrapper').last();
    await last.hover();
    await last.locator('.widget-delete').click({ force: true });
    await page.waitForTimeout(300);

    expect(await page.locator('.widget-wrapper').count()).toBe(wBefore - 1);
    expect(await page.locator('.layer-item').count()).toBe(lBefore - 1);
  });

  test('52. Clicking canvas background deselects selected widget', async ({ page }) => {
    const w = page.locator('.widget-wrapper').first();
    await w.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.widget-selected')).toBeVisible();

    await page.locator('.canvas-area').click({ position: { x: 8, y: 8 }, force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.widget-selected')).not.toBeVisible();
    await expect(page.locator('.right-panel-empty')).toBeVisible();
  });

  // ════════════════════════════════════════════════════════
  // GROUP 12 — Persistence & Reload
  // ════════════════════════════════════════════════════════

  test('53. Add widget + save + reload: widget count preserved', async ({ page }) => {
    await page.locator('.sidebar-item').filter({ hasText: 'Bar Chart' }).click();
    await page.waitForTimeout(300);
    const countAfterAdd = await page.locator('.widget-wrapper').count();

    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);

    await page.reload();
    await page.waitForSelector('.widget-wrapper', { timeout: 10000 });

    expect(await page.locator('.widget-wrapper').count()).toBe(countAfterAdd);

    // Cleanup: remove the extra widget and save
    const last = page.locator('.widget-wrapper').last();
    await last.hover();
    await last.locator('.widget-delete').click({ force: true });
    await page.waitForTimeout(300);
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);
  });

  test('54. Chart customData persists after save and reload', async ({ page }) => {
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);

    // Set a distinctive value in first data point
    const firstVal = page.locator('.data-input-num').first();
    const original = await firstVal.inputValue();
    await firstVal.fill('777');
    await page.waitForTimeout(200);

    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForSelector('.widget-wrapper', { timeout: 10000 });

    // Re-select chart via layers
    await page.locator('.layer-item').filter({ has: page.locator('.layer-type-tag', { hasText: 'chart' }) }).first().click();
    await page.waitForTimeout(400);

    expect(await page.locator('.data-input-num').first().inputValue()).toBe('777');

    // Restore
    await page.locator('.data-input-num').first().fill(original);
    await page.locator('.btn-primary').click();
    await page.waitForTimeout(1500);
  });

  test('55. API health check: GET /api/health returns 200', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/api/health');
    expect(response.status()).toBe(200);
  });

  test('56. API GET /api/dashboards returns array with at least 1 dashboard', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/api/dashboards');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  test('57. API GET /api/dashboards/:id returns dashboard with widgets array', async ({ page }) => {
    const response = await page.request.get(`${API}/api/dashboards/${deepDashboardId}`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('dashboard');
    expect(data).toHaveProperty('widgets');
    expect(Array.isArray(data.widgets)).toBe(true);
  });
});
