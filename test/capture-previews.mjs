import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sv910\\.gemini\\antigravity\\brain\\64e13f4c-1e97-45f0-92b1-660e0cf1fa3c';

async function capture() {
  console.log('Launching headless Chrome to capture Discord voice, group chat & media previews...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--disable-gpu',
    '--window-size=1280,820',
    '--user-data-dir=C:\\Games\\GENZOKU\\.chrome-preview-profile-voice',
    'http://localhost:3000/login'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9235/json');
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

  // 2. Click "Join Voice Lounge" to activate Discord Voice Connected panel
  console.log('Joining Voice Lounge...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const joinVoiceBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Join Voice Lounge'));
        if (joinVoiceBtn) joinVoiceBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 2000));

  // 3. Select Aoi Tanaka chat
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const chat = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('Aoi Tanaka') && d.className.includes('cursor-pointer'));
        if (chat) chat.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1500));

  // 4. Capture Discord Voice Panel active at bottom left of sidebar
  console.log('Capturing Discord Voice Panel...');
  const shotVoice = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_discord_voice_panel.png'), Buffer.from(shotVoice.data, 'base64'));

  // 5. Open New Group Clan Modal
  console.log('Capturing New Group Modal...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[title=\"New Group\"]')?.click();`,
  });
  await new Promise((r) => setTimeout(r, 1200));
  const shotGroup = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_group_clan_modal.png'), Buffer.from(shotGroup.data, 'base64'));

  // Close Group Modal
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.fixed button')?.click();`,
  });
  await new Promise((r) => setTimeout(r, 800));

  // 6. Test Reply Feature: Click reply on the first message
  console.log('Testing Reply Feature...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const replyBtn = document.querySelector('button[title=\"Reply\"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Reply'));
        if (replyBtn) replyBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotReply = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_reply_active.png'), Buffer.from(shotReply.data, 'base64'));

  ws.close();
  try {
    chrome.kill();
  } catch {}

  console.log('All Discord, Group, and Reply previews captured successfully!');
}

capture().catch((e) => {
  console.error('Error during capture:', e);
  process.exit(1);
});
