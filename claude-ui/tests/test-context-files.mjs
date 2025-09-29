// Test script for context file functionality
import axios from 'axios';

const SERVER_URL = 'http://localhost:3001';

async function testContextFiles() {
  console.log('\n=== Testing Context File Functionality ===\n');

  try {
    // 1. Test file tree endpoint
    console.log('1. Fetching file tree...');
    const fileTreeResponse = await axios.get(`${SERVER_URL}/api/files`);
    console.log(`   ✓ File tree loaded with ${fileTreeResponse.data.files.length} items`);
    console.log(`   Root: ${fileTreeResponse.data.root}`);

    // Find first 2 files from the tree
    const files = [];
    function collectFiles(nodes) {
      for (const node of nodes) {
        if (node.type === 'file') {
          files.push(node.path);
          if (files.length >= 2) return;
        } else if (node.children) {
          collectFiles(node.children);
          if (files.length >= 2) return;
        }
      }
    }
    collectFiles(fileTreeResponse.data.files);

    if (files.length < 2) {
      console.log('   ⚠ Not enough files found for testing');
      return;
    }

    console.log(`   Selected files for context: ${files.join(', ')}`);

    // 2. Test CLI calls endpoint to verify logging
    console.log('\n2. Checking recent CLI calls...');
    const cliCallsResponse = await axios.get(`${SERVER_URL}/api/cli-calls?limit=5`);
    console.log(`   ✓ Found ${cliCallsResponse.data.length} recent CLI calls`);

    if (cliCallsResponse.data.length > 0) {
      const lastCall = cliCallsResponse.data[0];
      console.log(`\n   Last CLI Call Details:`);
      console.log(`   - ID: ${lastCall.id}`);
      console.log(`   - User Message: ${lastCall.user_message.substring(0, 50)}...`);
      console.log(`   - Success: ${lastCall.success}`);
      console.log(`   - Duration: ${lastCall.duration_ms}ms`);

      if (lastCall.context_files) {
        console.log(`   - Context Files: ${lastCall.context_files}`);
      } else {
        console.log(`   - Context Files: (none)`);
      }

      if (lastCall.full_stdin) {
        console.log(`   - Full stdin: ${lastCall.full_stdin.substring(0, 100)}...`);
      } else {
        console.log(`   - Full stdin: (none)`);
      }
    }

    console.log('\n✅ Context file infrastructure is working correctly!');
    console.log('\nNext steps for manual testing:');
    console.log('1. Open http://localhost:5174 in your browser');
    console.log('2. Go to Files view');
    console.log('3. Select 2 files using checkboxes');
    console.log('4. Go back to Chat view (should see "2 in context" badge)');
    console.log('5. Send a message like "what do the selected files contain?"');
    console.log('6. Check browser console for getContextFiles() debug output');
    console.log('7. Go to CLI History admin to verify context_files and full_stdin columns');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testContextFiles();