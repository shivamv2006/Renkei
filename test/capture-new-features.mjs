import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sv910\\.gemini\\antigravity\\brain\\64e13f4c-1e97-45f0-92b1-660e0cf1fa3c';

async function captureNewFeatures() {
  console.log('Launching Chrome to capture new feature previews...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9244',
    '--disable-gpu',
    '--window-size=1280,840',
    '--user-data-dir=C:\\Games\\GENZOKU\\.chrome-preview-profile-features',
    'http://localhost:3000/login'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9244/json');
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
  console.log('Signing in as Kenji...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Kenji'));
        if (demoBtn) demoBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign In'));
        if (submitBtn) submitBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 4000));

  // 2. Select Aoi Tanaka direct chat (shows direct chat with Phone & Video call buttons in header)
  console.log('Selecting direct chat...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const chat = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('Aoi Tanaka') && d.className.includes('cursor-pointer'));
        if (chat) chat.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 2b. Open Emoji/GIF/Sticker drawer and click STICKERS tab
  console.log('Opening Stickers picker...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const smileBtn = document.querySelector('button[title=\"Emoji & GIF Picker\"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-smile'));
        if (smileBtn) smileBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Switch to STICKERS tab
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const stickersBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('STICKERS'));
        if (stickersBtn) stickersBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const shotStickers = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_stickers_custom.png'), Buffer.from(shotStickers.data, 'base64'));
  console.log('Saved preview_stickers_custom.png');

  // Close Picker by clicking close icon
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('.animate-in button');
        if (closeBtn) closeBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  // 3. Connect to Voice to access the Soundboard
  console.log('Opening Soundboard...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const joinVoice = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Join Voice Lounge'));
        if (joinVoice) joinVoice.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Click Soundboard button in voice panel
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sbBtn = document.querySelector('button[title*=\"Soundboard\"]');
        if (sbBtn) sbBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const shotSoundboard = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_soundboard_12.png'), Buffer.from(shotSoundboard.data, 'base64'));
  console.log('Saved preview_soundboard_12.png');

  // Close Soundboard modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('.fixed button[title*=\"Close\"]') || document.querySelector('.fixed button');
        if (closeBtn) closeBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  // 4. Select Group Chat (e.g. Neo-Tokyo Night Runners / Cyber Clan)
  console.log('Opening Group Info with Admin Roles...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const groupChat = Array.from(document.querySelectorAll('div')).find(d => d.innerText && (d.innerText.includes('Cyber') || d.innerText.includes('Runners') || d.innerText.includes('Clan') || d.innerText.includes('Tokyo')) && d.className.includes('cursor-pointer'));
        if (groupChat) groupChat.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Click on Group Header / Info button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const infoBtn = document.querySelector('button[title*=\"Group Info\"]') || document.querySelector('header div[title*=\"Group Info\"]');
        if (infoBtn) infoBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const shotGroupInfo = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_group_info_roles.png'), Buffer.from(shotGroupInfo.data, 'base64'));
  console.log('Saved preview_group_info_roles.png');

  // Close Group Info
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('.fixed button[title*=\"Close\"]') || document.querySelector('.fixed button');
        if (closeBtn) closeBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  // 5. Mobile Viewport (390x844) preview of DIY Theme & Wallpaper Modal
  console.log('Capturing Mobile Theme Modal...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click Palette icon in header
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const themeBtn = document.querySelector('button[title*=\"Theme\"]') || document.querySelector('header button');
        if (themeBtn) themeBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const shotMobileTheme = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_mobile_theme_modal.png'), Buffer.from(shotMobileTheme.data, 'base64'));
  console.log('Saved preview_mobile_theme_modal.png');

  ws.close();
  try {
    chrome.kill();
  } catch {}

  console.log('All feature screenshots successfully generated!');
}

captureNewFeatures().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
