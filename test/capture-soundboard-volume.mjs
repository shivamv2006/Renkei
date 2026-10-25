import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sv910\\.gemini\\antigravity\\brain\\64e13f4c-1e97-45f0-92b1-660e0cf1fa3c';

async function capture() {
  console.log('Capturing Soundboard volume slider preview...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-gpu',
    '--window-size=1280,840',
    '--user-data-dir=C:\\Games\\GENZOKU\\.chrome-preview-profile-vol',
    'http://localhost:3000/login'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9255/json');
  const targets = await res.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  await new Promise((r) => setTimeout(r, 2000));

  // 1. Sign in as Kenji
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Kenji'));
        if (demoBtn) demoBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 600));

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign In'));
        if (submitBtn) submitBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 3500));

  // Click Soundboard button next to Join Voice Lounge (or in voice panel)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sbBtn = document.querySelector('button[title*=\"Soundboard\"]');
        if (sbBtn) sbBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1200));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_soundboard_volume_slider.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved preview_soundboard_volume_slider.png');

  ws.close();
  try {
    chrome.kill();
  } catch {}
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
