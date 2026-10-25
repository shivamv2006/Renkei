import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sv910\\.gemini\\antigravity\\brain\\64e13f4c-1e97-45f0-92b1-660e0cf1fa3c';

async function capture() {
  console.log('Capturing all new features previews with proper login...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9277',
    '--disable-gpu',
    '--window-size=1280,840',
    '--user-data-dir=C:\\Games\\GENZOKU\\.chrome-preview-profile-allnew2',
    'http://localhost:3000/login'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9277/json');
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

  // 1. Select Kenji and Click Sign In
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

  await new Promise((r) => setTimeout(r, 4000));

  // 2. Open Settings Modal (to show Profile with Bio)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const settingsBtn = document.querySelector('button[title*="Settings"]') ||
                            document.querySelector('button[title*="settings"]') ||
                            Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-settings') || b.innerText.includes('Settings'));
        if (settingsBtn) settingsBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1200));

  // Fill in sample bio so it is visible
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = "Full-stack cyber developer & Renkei squad leader. Exploring P2P voice lounges, anime avatars, and real-time coordination protocols.";
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 600));

  const snapSettings = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_renkei_settings_bio.png'), Buffer.from(snapSettings.data, 'base64'));
  console.log('Saved preview_renkei_settings_bio.png');

  // 3. Switch to Username & Claims tab in Settings
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const usernameTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Username & Claims'));
        if (usernameTab) usernameTab.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1000));

  // Type a sample reserved username to demonstrate ownership request flow
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('input[placeholder="new_handle"]');
        if (input) {
          input.value = "cyber_ace";
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 600));

  const snapUsernameClaims = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_renkei_username_claims.png'), Buffer.from(snapUsernameClaims.data, 'base64'));
  console.log('Saved preview_renkei_username_claims.png');

  // 4. Switch to Nicknames tab in Settings
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nickTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Nicknames'));
        if (nickTab) nickTab.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1000));

  const snapNicknames = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_renkei_nicknames_tab.png'), Buffer.from(snapNicknames.data, 'base64'));
  console.log('Saved preview_renkei_nicknames_tab.png');

  // Close Settings modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('button[title*="Close Settings"]') || document.querySelector('button[title*="Close"]');
        if (closeBtn) closeBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));

  // 5. Open New Chat Modal to verify Username Privacy Search Shield
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const newChatBtn = document.querySelector('button[title*="New direct chat"]') ||
                           Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-user-plus') || b.innerText.includes('Private Chat'));
        if (newChatBtn) newChatBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1200));

  const snapPrivacySearch = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_renkei_privacy_search.png'), Buffer.from(snapPrivacySearch.data, 'base64'));
  console.log('Saved preview_renkei_privacy_search.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('button[title*="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x'));
        if (closeBtn) closeBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));

  // 6. Select Group Chat (e.g. Clan / Squad) and type "@" to show mention autocomplete popup
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const groupConv = Array.from(document.querySelectorAll('button, div')).find(el => el.innerText && (el.innerText.includes('Squad') || el.innerText.includes('Clan') || el.innerText.includes('Alpha')));
        if (groupConv) groupConv.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1500));

  // Focus message input and type "@"
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('textarea') || document.querySelector('input[placeholder*="Type a message"]') || document.querySelector('input[type="text"]');
        if (input) {
          input.value = "Hey @";
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        }
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1200));

  const snapMentions = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_renkei_mentions.png'), Buffer.from(snapMentions.data, 'base64'));
  console.log('Saved preview_renkei_mentions.png');

  ws.close();
  chrome.kill();
  console.log('All detailed preview snapshots captured successfully!');
  process.exit(0);
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
