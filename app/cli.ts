async function makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET'): Promise<Response> {
    const baseUrl = 'http://localhost:8000';
    return await fetch(`${baseUrl}/api/v1${endpoint}`, { method });
  }
  
  function showMenu() {
    console.log('\n🌐 Cyber Framework CLI');
    console.log('====================');
    console.log('Available APIs:');
    console.log('1. Counter');
    console.log('0. Exit');
  }
  
  async function showCounterMenu() {
    const response = await makeRequest('/counter');
    const { count } = await response.json();
    
    console.log('\n⚡ Counter API');
    console.log('============');
    console.log('Current count:', count);
    console.log('\nOperations:');
    console.log('1. Increment');
    console.log('2. Decrement');
    console.log('0. Back to main menu');
  }
  
  async function handleCounter() {
    while (true) {
      await showCounterMenu();
      const choice = prompt('\nSelect operation (0-2): ');
  
      switch (choice) {
        case '1': {
          const response = await makeRequest('/counter/increment', 'POST');
          const { count } = await response.json();
          console.log('Counter incremented. New value:', count);
          break;
        }
        case '2': {
          const response = await makeRequest('/counter/decrement', 'POST');
          const { count } = await response.json();
          console.log('Counter decremented. New value:', count);
          break;
        }
        case '0':
          return;
        default:
          console.log('Invalid selection. Please try again.');
      }
    }
  }
  
  async function main() {
    while (true) {
      showMenu();
      const choice = prompt('\nSelect API (0-1): ');
  
      switch (choice) {
        case '1':
          await handleCounter();
          break;
        case '0':
          console.log('Goodbye! 👋');
          Deno.exit(0);
          break;
        default:
          console.log('Invalid selection. Please try again.');
      }
    }
  }
  
  if (import.meta.main) {
    main();
  }