/// <reference lib="deno.unstable" />
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { handleRequest } from './app/router.ts';

const port = parseInt(Deno.env.get('PORT') ?? '8000');
console.log(`Server running on http://localhost:${port}`);

Deno.serve({ port }, handleRequest); 