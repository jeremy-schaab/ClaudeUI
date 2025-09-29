# UI Verification with Screenshots

Use this prompt when you need to verify that a web application's UI is displaying correctly.

## Prompt

```
I need you to verify the UI is working correctly by taking screenshots. Please:

1. Install Playwright if needed: `npm install playwright && npx playwright install chromium`

2. Create a screenshot verification script that:
   - Launches a headless browser
   - Captures console logs and errors
   - Navigates to the application URL
   - Takes screenshots of all major views/pages
   - Clicks through interactive elements to test functionality
   - Reports what's visible on each page

3. Run the script and show me the screenshots

4. Analyze the screenshots and verify:
   - All UI elements are rendering correctly
   - No blank/white screens
   - Proper styling is applied
   - Interactive elements work as expected
   - No JavaScript errors in console

5. If issues are found, fix them and re-verify

6. Clean up temporary files when done

Please use Playwright for this task.
```

## Example Usage

This prompt is useful when:
- UI appears blank or broken
- You need to verify changes didn't break the interface
- Testing responsive layouts
- Debugging CSS/styling issues
- Verifying React component rendering
- Checking for JavaScript errors

## Technical Details

The script should:
- Use `playwright` package for browser automation
- Listen to `page.on('console')` for browser logs
- Listen to `page.on('pageerror')` for JavaScript errors
- Use `page.waitForTimeout()` for async operations
- Take full page screenshots with `page.screenshot({ fullPage: true })`
- Clean up screenshots after verification

## Example Output

The assistant should provide:
1. Status of what's visible: "Admin visible: true"
2. Browser console logs: "BROWSER LOG: Connected to server"
3. Browser errors: "BROWSER ERROR: Rendered fewer hooks..."
4. Screenshot images embedded in the response
5. Analysis of what the screenshots show
6. Fixes for any issues found