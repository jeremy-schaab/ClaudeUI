import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  console.log('Page loaded');

  // Check if there are recent chats
  const recentItems = await page.$$('.recent-item');
  console.log(`Found ${recentItems.length} recent chats`);

  if (recentItems.length > 0) {
    // Hover over the first recent chat to reveal delete button
    await recentItems[0].hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'delete-test-1-hover.png' });
    console.log('Captured hover state with delete button');

    // Click the delete button
    const deleteBtn = await page.$('.delete-chat-btn');
    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'delete-test-2-after-delete.png' });
      console.log('Chat deleted from user UI');

      // Go to Admin to verify it's still there but hidden
      await page.click('.admin-link-btn');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'delete-test-3-admin.png' });
      console.log('Navigated to Admin UI');

      // Click on Conversations tab
      const conversationsTab = await page.$('button.tab');
      if (conversationsTab) {
        await conversationsTab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'delete-test-4-admin-conversations.png' });
        console.log('Viewing admin conversations');

        // Select a conversation
        const convItem = await page.$('.conversation-item');
        if (convItem) {
          await convItem.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'delete-test-5-with-delete-btn.png' });
          console.log('Conversation selected with delete button visible');
        }
      }
    }
  } else {
    console.log('No recent chats found to test');
    await page.screenshot({ path: 'delete-test-no-chats.png' });
  }

  await browser.close();
})();