// Mağazalara yüklenecek zip'leri üretir: dist/<isim>-<sürüm>-chrome.zip ve -firefox.zip
// Kullanım: npm run package
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const FILES = ['src', 'icons', 'LICENSE'];

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const { name } = require(path.join(ROOT, 'package.json'));

const targets = {
  // Chrome bilinmeyen anahtar için uyarı veriyor, Firefox'a özel alanı çıkar
  chrome: ({ browser_specific_settings, ...rest }) => rest,
  firefox: (m) => m,
};

fs.rmSync(DIST, { recursive: true, force: true });

for (const [target, transform] of Object.entries(targets)) {
  const dir = path.join(DIST, target);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FILES) fs.cpSync(path.join(ROOT, f), path.join(dir, f), { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(transform(manifest), null, 2) + '\n');

  const zip = path.join(DIST, `${name}-${manifest.version}-${target}.zip`);
  execFileSync('zip', ['-qrX', zip, '.', '-x', '.DS_Store', '*/.DS_Store'], { cwd: dir });
  console.log(path.relative(ROOT, zip));
}
