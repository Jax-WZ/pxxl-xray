const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const DIST = path.join(__dirname, 'xray.zip');
const BIN = path.join(__dirname, 'web-worker');
const DAT = path.join(__dirname, 'geoip.dat');

function get(url, file) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(file);
    https.get(url, { headers: { 'User-Agent': 'setup' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        f.close();
        try { fs.unlinkSync(file); } catch (e) {}
        return get(res.headers.location, file).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      res.pipe(f);
      f.on('finish', () => f.close(resolve));
    }).on('error', reject);
  });
}

(async () => {
  if (fs.existsSync(BIN) && fs.existsSync(DAT)) {
    console.log('setup ok');
    return;
  }
  const api = 'https://api.github.com/repos/XTLS/Xray-core/releases/latest';
  const rel = await new Promise((resolve, reject) => {
    https.get(api, { headers: { 'User-Agent': 'setup', Accept: 'application/vnd.github+json' } }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        try { resolve(JSON.parse(b)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
  const assets = rel.assets || [];
  const zip = assets.find((a) => /Xray-linux-64\.zip$/.test(a.name));
  if (!zip) throw new Error('release asset not found');
  await get(zip.browser_download_url, DIST);
  execSync('unzip -o -q xray.zip && mv -f xray web-worker && chmod +x web-worker && rm -f xray.zip LICENSE README.md', { stdio: 'inherit', cwd: __dirname });
  if (!fs.existsSync(BIN)) throw new Error('no binary after unzip');
})().catch((e) => { console.error(e); process.exit(1); });
