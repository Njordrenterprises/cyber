/// <reference lib="deno.unstable" />
import { handleRequest } from './app/router.ts';

const port = 8000;
console.log(`Server running on http://localhost:${port}`);

Deno.serve({ port }, handleRequest); 