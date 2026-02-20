import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.message}`));

    console.log("Navigating to HubView...");
    await page.goto('http://localhost:3000');

    // Inject localStorage so it thinks we are logged in as Daniel
    await page.evaluate(() => {
        localStorage.setItem('hubview_user', JSON.stringify({ id: '61FA33EB-C992-4804-AA38-560784A0DA40', email: 'daniel.carvalho@uninovahub.com.br', name: 'Daniel B. Carvalho' }));
    });
    // Reload to apply localStorage
    await page.reload();

    // Small wait for initial tasks to load
    await page.waitForTimeout(3000);

    // Click on the first task title we can find
    console.log("Clicking task...");
    const taskBox = page.locator('div.group.p-4').first();
    await taskBox.click();

    // Wait for TaskModal
    await page.waitForTimeout(1000);

    // Open Sidebar if needed. Is it open? The chevron has title "Ver Histórico & Logs"
    console.log("Opening Sidebar...");
    const sidebarToggle = page.locator('button[title="Ver Histórico & Logs"]');
    if (await sidebarToggle.count() > 0) {
        await sidebarToggle.click();
        await page.waitForTimeout(1000);
    }

    console.log("Typing in comment...");
    const commentInput = page.locator('textarea[placeholder="Adicione um comentário para a equipe (use @ para mencionar)..."]');
    await commentInput.fill('@Daniel B. Carvalho teste script 123');

    console.log("Clicking Enviar...");
    const enviarBtn = page.locator('button:has-text("ENVIAR COMENTÁRIO")');
    await enviarBtn.click();

    await page.waitForTimeout(2000);

    await browser.close();
    console.log("Test finished.");
})();
