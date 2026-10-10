import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Runtime-written logs (feedback, eval sessions). Override with DATA_DIR so tests
// and deployments don't write into the tracked server/data folder.
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

export function dataFile(name) {
  return path.join(DATA_DIR, name);
}
