import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', '.nojekyll', 'assets/favicon.svg', 'assets/fonts', 'assets/images']) {
  await cp(resolve(root, name), resolve(root, 'dist', name), { recursive: true });
}
// Remove only the two known obsolete generated outputs; the user's reference is retained in source.
await rm(resolve(root, 'dist/assets/reference.png'), { force: true });
await rm(resolve(root, 'dist/assets/reference.png.json'), { force: true });
console.log('Статическая страница собрана в dist/');
