/**
 * Simple Test Script for Messaging Frontend
 * Run this in your browser console to test the messaging components
 */

// Test 1: API Connectivity
console.log('🧪 Testing API Connectivity...');

async function testAPI() {
  try {
    // Create test user
    const response = await fetch('http://localhost:8000/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_user_' + Date.now() })
    });
    const user = await response.json();
    console.log('✅ API Test Passed - User created:', user);
    return user;
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return null;
  }
}

// Test 2: WebSocket Connectivity
console.log('🧪 Testing WebSocket...');

function testWebSocket(userId) {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(`ws://localhost:8000/api/ws/${userId}`);
      
      ws.onopen = () => {
        console.log('✅ WebSocket Test Passed - Connected');
        ws.close();
        resolve(true);
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket Test Failed:', error);
        reject(error);
      };
    } catch (error) {
      console.error('❌ WebSocket Test Failed:', error);
      reject(error);
    }
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Messaging Frontend Tests...\n');
  
  const user = await testAPI();
  if (user) {
    await testWebSocket(user.id);
  }
  
  console.log('\n✨ All tests completed!');
  console.log('💡 Open http://localhost:3000 to use the messaging app');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testAPI, testWebSocket };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runTests();
}
