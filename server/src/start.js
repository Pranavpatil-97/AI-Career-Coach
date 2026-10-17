import { start } from './index.js';

start().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
