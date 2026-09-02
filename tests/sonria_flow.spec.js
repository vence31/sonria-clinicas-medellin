const { test, expect } = require('@playwright/test');

test.describe('Sonría Clínicas Odontológicas Medellín - E2E Suite', () => {

  test('Test 1: App Loads, Sede Selector Works & Nav Switcher Points to Port 3000', async ({ page }) => {
    await page.goto('/');
    
    // Check Brand Title & Nav
    await expect(page.locator('.brand-logo')).toContainText('Sonría');
    const switchBtn = page.locator('.nav-switch-btn');
    await expect(switchBtn).toHaveAttribute('href', 'http://localhost:3000');

    // Test Sede Dropdown change
    const dropdown = page.locator('#sede-dropdown');
    await dropdown.selectOption('envigado');
    await expect(page.locator('#sede-info-box')).toContainText('Calle 37 Sur # 43-57');
  });

  test('Test 2: COP Calculator Computes Treatment & Financing Installments', async ({ page }) => {
    await page.goto('/');

    const treatmentSelect = page.locator('#calc-treatment');
    const qtyInput = page.locator('#calc-qty');

    // 8 carillas en porcelana ($1.400.000 * 8 = $11.200.000)
    await treatmentSelect.selectOption('porcelana');
    await qtyInput.fill('8');
    await qtyInput.dispatchEvent('input');

    await expect(page.locator('#res-total-cop')).toContainText('11.200.000');
    await expect(page.locator('#res-monthly-cop')).toContainText('933.333');
  });

  test('Test 3: Speed Dial #262 Simulator Operates IVR Menu', async ({ page }) => {
    await page.goto('/');

    // Click Speed dial button
    await page.click('#dial-btn');
    await expect(page.locator('#dial-modal')).toBeVisible();

    // Press Option 1 (Nueva Cita)
    await page.click('.key-btn:has-text("1")');
    await expect(page.locator('#ivr-output')).toContainText('Opción 1 seleccionada');

    // Hangup
    await page.click('.btn-hangup');
    await expect(page.locator('#dial-modal')).toBeHidden();
  });

  test('Test 4: WhatsApp Funnel Completes Booking with Camila and Stores Lead', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('#user-input');
    const sendBtn = page.locator('#send-btn');

    // Step 1: Request treatment
    await input.fill('Quiero hacerme un diseño de sonrisa en carillas');
    await sendBtn.click();
    await expect(page.locator('#chat-stream')).toContainText('¿En qué sede de Medellín');

    // Step 2: Choose Sede
    await input.fill('Laureles');
    await sendBtn.click();
    await expect(page.locator('#chat-stream')).toContainText('Sede Laureles');

    // Step 3: Choose Time
    await input.fill('Este viernes en la mañana');
    await sendBtn.click();
    await expect(page.locator('#chat-stream')).toContainText('Nombre completo');

    // Step 4: Contact details
    await input.fill('Carlos Restrepo, 3109876543');
    await sendBtn.click();
    await expect(page.locator('#chat-stream')).toContainText('¡Tu solicitud de cita en Sonría Clínicas Odontológicas ha quedado registrada');
  });

  test('Test 5: Admin CRM Modal Lists Booked Citas', async ({ page }) => {
    await page.goto('/');

    // Open Admin Modal
    await page.click('.btn-outline-primary');
    await expect(page.locator('#admin-modal')).toBeVisible();

    // Verify lead count badge is >= 1
    const countVal = await page.locator('#stat-leads-count').textContent();
    expect(parseInt(countVal)).toBeGreaterThanOrEqual(1);

    await page.click('#admin-modal .btn-close');
    await expect(page.locator('#admin-modal')).toBeHidden();
  });

  test('Test 6: YouTube Edition Page Loads & Toggle Works Both Ways', async ({ page }) => {
    await page.goto('/');

    // Click toggle to YouTube Edition
    const ytToggle = page.locator('#video-tour a[href*="youtube-tour.html"]');
    await expect(ytToggle).toBeVisible();
    await ytToggle.click();

    // Verify YouTube page and iframe
    await page.waitForURL('**/youtube-tour.html#video-tour');
    const iframe = page.locator('#video-tour iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/VwGrXe2ricE/);

    // Click back to Veo Commercial
    const backToggle = page.locator('#video-tour a[href*="index.html"]');
    await expect(backToggle).toBeVisible();
    await backToggle.click();
    await page.waitForURL('**/index.html#video-tour');
    await expect(page.locator('#video-tour video')).toBeVisible();
  });

});


