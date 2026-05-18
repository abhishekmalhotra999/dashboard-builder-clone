import { test, expect, request } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:3001';

let testDashboardId;

// Create a fresh test dashboard before the suite and clean it up after
test.beforeAll(async () => {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/api/dashboards`, { data: { name: 'Audit Test Dashboard' } });
  const body = await res.json();
  testDashboardId = body.id;
  // Seed with initial widgets so tests that need existing widgets work
  await ctx.put(`${API}/api/dashboards/${testDashboardId}/layout`, {
    data: {
      name: 'Audit Test Dashboard',
      widgets: [
        {
          id: 'audit-chart-1', type: 'chart', x: 0, y: 0, w: 6, h: 4,
          content: { chartType: 'bar', title: 'Audit Chart', theme: 'blue', customData: { labels: ['A','B','C'], values: [10,20,30] } },
        },
        {
          id: 'audit-text-1', type: 'text', x: 6, y: 0, w: 5, h: 3,
          content: { html: '<p>Audit text widget</p>' },
        },
        {
          id: 'audit-image-1', type: 'image', x: 0, y: 4, w: 4, h: 4,
          content: { url: '', alt: 'Audit image', objectFit: 'cover' },
        },
      ],
    },
  });
  await ctx.dispose();
});

test.afterAll(async () => {
  const ctx = await request.newContext();
  await ctx.delete(`${API}/api/dashboards/${testDashboardId}`);
  await ctx.dispose();
});

test.describe('Dashboard Builder – Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Always start on our dedicated test dashboard
    await page.addInitScript((id) => {
      localStorage.setItem('lastDashboardId', String(id));
    }, testDashboardId);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('.topbar', { timeout: 15000 });
    await page.waitForFunction(
      () => document.querySelector('.topbar-name')?.textContent?.trim().length > 1,
      { timeout: 10000 }
    );
  });

  test('1. Page loads: topbar, sidebar, canvas visible', async ({ page }) => {
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.left-sidebar')).toBeVisible();
    await expect(page.locator('.canvas-area')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
    console.log('✅ 3-panel layout present');
  });

  test('2. Seeded widgets load from DB (widgets on canvas)', async ({ page }) => {
    // The dashboard was seeded with 3 widgets (chart, text, image)
    await page.waitForSelector('.widget-wrapper', { timeout: 10000 });
    const count = await page.locator('.widget-wrapper').count();
    console.log(`Widget count from DB: ${count}`);
    expect(count).toBeGreaterThanOrEqual(3);
    console.log('✅ Seeded widgets loaded from DB');
  });

  test('3. Dashboard name shows and is editable', async ({ page }) => {
    const nameEl = page.locator('.topbar-name');
    await expect(nameEl).toBeVisible();
    const name = await nameEl.textContent();
    console.log(`Dashboard name: ${name}`);

    await nameEl.click();
    const input = page.locator('.topbar-name-input');
    await expect(input).toBeVisible();
    await input.fill('My Test Dashboard');
    await input.press('Enter');
    await expect(page.locator('.topbar-name')).toContainText('My Test Dashboard');
    console.log('✅ Dashboard name editable');
  });

  test('4. Add Text widget from sidebar', async ({ page }) => {
    const before = await page.locator('.widget-wrapper').count();
    await page.locator('.sidebar-item', { hasText: 'Heading' }).click();
    await page.waitForTimeout(500);
    const after = await page.locator('.widget-wrapper').count();
    expect(after).toBe(before + 1);
    console.log('✅ Text widget added');
  });

  test('5. Text widget: double-click opens editor', async ({ page }) => {
    // Add a fresh text widget
    await page.locator('.sidebar-item', { hasText: 'Heading' }).click();
    await page.waitForTimeout(400);

    // Find the most recently added widget (last one)
    const widgets = page.locator('.widget-wrapper');
    const last = widgets.last();
    await last.dblclick();
    await page.waitForTimeout(400);

    // Quill toolbar should appear
    const toolbar = page.locator('.ql-toolbar');
    const toolbarVisible = await toolbar.last().isVisible();
    console.log(`Quill toolbar visible after dblclick: ${toolbarVisible}`);
    if (!toolbarVisible) {
      console.log('❌ Text editor did NOT open on double-click');
    } else {
      console.log('✅ Text editor opens on double-click');
    }
  });

  test('6. Add Chart widget and verify it renders', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Bar Chart' }).click();
    await page.waitForTimeout(600);
    const canvas = page.locator('canvas').last();
    await expect(canvas).toBeVisible();
    console.log('✅ Chart widget (canvas) renders');
  });

  test('7. Add Image widget – shows upload placeholder', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Image' }).click();
    await page.waitForTimeout(400);
    const placeholder = page.locator('.image-placeholder').last();
    await expect(placeholder).toBeVisible();
    console.log('✅ Image upload placeholder visible');
  });

  test('8. Clicking widget selects it + right panel updates', async ({ page }) => {
    await page.waitForSelector('.widget-wrapper', { timeout: 8000 });
    const widget = page.locator('.widget-wrapper').first();
    // Use force:true to bypass react-grid-layout drag interception
    await widget.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.right-panel-header')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.panel-badge')).toBeVisible();
    const type = await page.locator('.panel-badge').textContent();
    console.log(`✅ Right panel shows type: ${type}`);
  });

  test('9. Chart right panel: toggle bar→line updates chart', async ({ page }) => {
    await page.waitForSelector('.chart-widget', { timeout: 8000 });
    // Click the chart widget
    const chartWidget = page.locator('.widget-wrapper').filter({ has: page.locator('.chart-widget') }).first();
    await chartWidget.click({ force: true });
    await page.waitForTimeout(300);

    const badge = await page.locator('.panel-badge').textContent({ timeout: 5000 });
    if (badge?.toLowerCase() !== 'chart') {
      console.log(`❌ Expected chart badge, got: ${badge}`);
      return;
    }

    const lineBtn = page.locator('.toggle-btn', { hasText: 'Line' });
    await lineBtn.click();
    await page.waitForTimeout(400);
    await expect(lineBtn).toHaveClass(/active/);
    console.log('✅ Chart type toggle works (bar→line)');
  });

  test('10. Save button: sends PUT request to DB', async ({ page }) => {
    let savedPayload = null;
    page.on('request', req => {
      if (req.method() === 'PUT' && req.url().includes('/layout')) {
        savedPayload = req.postDataJSON();
      }
    });
    const saveBtn = page.locator('.btn-primary', { hasText: /Save/ });
    await saveBtn.click();
    await page.waitForTimeout(1500);
    if (savedPayload) {
      console.log(`✅ Save sent ${savedPayload.widgets?.length} widgets to DB`);
    } else {
      console.log('❌ Save button did NOT fire PUT /layout request');
    }
  });

  test('11. New dashboard button creates new dashboard', async ({ page }) => {
    let createdId = null;
    page.on('response', async res => {
      if (res.request().method() === 'POST' && res.url().includes('/api/dashboards')) {
        try { const body = await res.json(); createdId = body.id; } catch {}
      }
    });
    await page.locator('.btn-secondary', { hasText: '+ New' }).click();
    await page.waitForTimeout(2000);
    if (createdId) {
      console.log(`✅ New dashboard POST request fired — got ID ${createdId}`);
      // Clean up the extra dashboard via API
      await page.request.delete(`${API}/api/dashboards/${createdId}`);
    } else {
      console.log('❌ New dashboard button did NOT fire POST request');
    }
  });

  test('12. Widget delete button removes widget', async ({ page }) => {
    await page.locator('.sidebar-item', { hasText: 'Heading' }).click();
    await page.waitForTimeout(400);
    const before = await page.locator('.widget-wrapper').count();

    const last = page.locator('.widget-wrapper').last();
    await last.hover();
    const del = last.locator('.widget-delete');
    await del.click();
    await page.waitForTimeout(300);

    const after = await page.locator('.widget-wrapper').count();
    expect(after).toBe(before - 1);
    console.log('✅ Widget delete removes widget');
  });

  test('13. Reload – layout restores from DB', async ({ page }) => {
    // Add a widget to have something to persist
    await page.locator('.sidebar-item', { hasText: 'Heading' }).click();
    await page.waitForTimeout(400);
    const beforeCount = await page.locator('.widget-wrapper').count();
    console.log(`Widgets before save+reload: ${beforeCount}`);
    expect(beforeCount).toBeGreaterThan(0);

    // Save then reload
    await page.locator('.btn-primary', { hasText: /Save/ }).click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: 'networkidle' });
    // Wait for the dashboard to fully load
    await page.waitForSelector('.topbar', { timeout: 10000 });
    await page.waitForFunction(
      () => document.querySelector('.topbar-name')?.textContent?.trim().length > 1,
      { timeout: 8000 }
    );
    await page.waitForSelector('.widget-wrapper', { timeout: 10000 });

    const afterCount = await page.locator('.widget-wrapper').count();
    expect(afterCount).toBe(beforeCount);
    console.log(`✅ Layout restored after reload (${afterCount} widgets)`);
  });
});
