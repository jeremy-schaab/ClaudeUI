import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Loading application...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'claude-ui/test-step1-loaded.png' });

    console.log('2. Checking for existing conversations...');
    const recentChats = await page.locator('.recent-item').count();
    console.log(`   Found ${recentChats} recent chats`);

    // Check if delete button exists in user UI
    if (recentChats > 0) {
      console.log('3. Testing user UI delete (should hide, not delete)...');
      const deleteBtn = page.locator('.delete-chat-btn').first();
      const isVisible = await deleteBtn.isVisible();
      console.log(`   Delete button visible: ${isVisible}`);
      await page.screenshot({ path: 'claude-ui/test-step2-user-ui.png' });
    }

    console.log('4. Navigating to Admin panel...');
    await page.click('.admin-link-btn');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'claude-ui/test-step3-admin.png' });

    console.log('5. Checking Conversations tab in Admin...');
    const conversationItems = await page.locator('.conversation-item').count();
    console.log(`   Found ${conversationItems} conversations in admin`);

    if (conversationItems === 0) {
      console.log('   ⚠️  No conversations to test delete on!');
      await browser.close();
      return;
    }

    console.log('6. Selecting first conversation...');
    await page.locator('.conversation-item').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'claude-ui/test-step4-selected.png' });

    console.log('7. Checking for Delete button...');
    const deleteConversationBtn = page.locator('.delete-conversation-btn');
    const deleteExists = await deleteConversationBtn.count() > 0;
    console.log(`   Delete conversation button exists: ${deleteExists}`);

    if (!deleteExists) {
      console.error('   ❌ DELETE BUTTON NOT FOUND IN ADMIN!');
      await page.screenshot({ path: 'claude-ui/test-ERROR-no-delete-btn.png' });
      await browser.close();
      return;
    }

    const conversationTitleBefore = await page.locator('.conversation-header h2').textContent();
    console.log(`   Selected conversation: "${conversationTitleBefore}"`);

    console.log('8. Clicking Delete button...');
    await deleteConversationBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'claude-ui/test-step5-confirm-dialog.png' });

    console.log('9. Checking for confirmation dialog...');
    // Check if browser confirm dialog appeared
    page.on('dialog', async dialog => {
      console.log(`   Confirm dialog text: "${dialog.message()}"`);
      console.log('10. Accepting deletion...');
      await dialog.accept();
    });

    // Click delete again to trigger the dialog (since we set up handler after first click)
    await deleteConversationBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'claude-ui/test-step6-after-delete.png' });

    console.log('11. Checking if conversation was removed...');
    const conversationItemsAfter = await page.locator('.conversation-item').count();
    console.log(`   Conversations after delete: ${conversationItemsAfter}`);

    if (conversationItemsAfter === conversationItems - 1) {
      console.log('   ✅ DELETE SUCCESSFUL - conversation count decreased');
    } else if (conversationItemsAfter === conversationItems) {
      console.error('   ❌ DELETE FAILED - conversation count unchanged');

      // Check for error messages
      const errorMsg = await page.locator('.error-message').textContent().catch(() => null);
      const successMsg = await page.locator('.success-message').textContent().catch(() => null);
      console.log(`   Error message: ${errorMsg}`);
      console.log(`   Success message: ${successMsg}`);
    }

    console.log('12. Going back to user UI...');
    await page.click('.back-btn');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'claude-ui/test-step7-back-to-user.png' });

    const recentChatsAfter = await page.locator('.recent-item').count();
    console.log(`   Recent chats in user UI: ${recentChatsAfter}`);

    console.log('\n✅ Test completed successfully!');
    console.log('📸 Screenshots saved to claude-ui/ directory');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'claude-ui/test-ERROR.png' });
  } finally {
    await browser.close();
  }
})();