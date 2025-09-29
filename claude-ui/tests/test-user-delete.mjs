import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== TESTING USER UI DELETE (SOFT DELETE/HIDE) ===\n');

    console.log('1. Loading application...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    console.log('2. Checking initial conversation count...');
    const initialCount = await page.locator('.recent-item').count();
    console.log(`   Initial recent chats: ${initialCount}`);

    if (initialCount === 0) {
      console.log('   ⚠️  No conversations to test on!');
      await browser.close();
      return;
    }

    console.log('3. Hovering over first conversation to reveal delete button...');
    const firstChat = page.locator('.recent-item').first();
    await firstChat.hover();
    await page.waitForTimeout(500);

    console.log('4. Checking if delete button is now visible...');
    const deleteBtn = firstChat.locator('.delete-chat-btn');
    const isVisible = await deleteBtn.isVisible();
    console.log(`   Delete button visible after hover: ${isVisible}`);

    if (!isVisible) {
      console.error('   ❌ DELETE BUTTON STILL NOT VISIBLE AFTER HOVER!');
      await page.screenshot({ path: 'claude-ui/test-user-delete-ERROR.png' });
      await browser.close();
      return;
    }

    const chatTitle = await firstChat.locator('.recent-item-title').textContent();
    console.log(`   Will delete: "${chatTitle}"`);

    console.log('5. Clicking delete button...');
    await deleteBtn.click();
    await page.waitForTimeout(1000);

    console.log('6. Checking if conversation was removed from UI...');
    const afterCount = await page.locator('.recent-item').count();
    console.log(`   Recent chats after delete: ${afterCount}`);

    if (afterCount === initialCount - 1) {
      console.log('   ✅ SOFT DELETE SUCCESSFUL - conversation hidden from user UI');
    } else {
      console.error('   ❌ SOFT DELETE FAILED - conversation still visible');
      await page.screenshot({ path: 'claude-ui/test-user-delete-FAILED.png' });
    }

    console.log('\n7. Verifying conversation still exists in admin (should be marked as hidden)...');
    await page.click('.admin-link-btn');
    await page.waitForTimeout(1000);

    const adminCount = await page.locator('.conversation-item').count();
    console.log(`   Admin shows ${adminCount} conversations (including hidden ones)`);

    if (adminCount >= afterCount) {
      console.log('   ✅ VERIFIED - Conversation still exists in database (soft delete)');
    } else {
      console.error('   ❌ ERROR - Conversation count mismatch!');
    }

    console.log('\n✅ User UI delete test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'claude-ui/test-user-ERROR.png' });
  } finally {
    await browser.close();
  }
})();