import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sv910\\.gemini\\antigravity\\brain\\64e13f4c-1e97-45f0-92b1-660e0cf1fa3c';

async function capture() {
  console.log('Capturing Discord-style Group Channels, Soundbox Upload, and Moderation Previews...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9299',
    '--disable-gpu',
    '--window-size=1280,840',
    '--user-data-dir=C:\\Games\\GENZOKU\\.chrome-preview-profile-vol',
    'http://localhost:3000/'
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9299/json');
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

  await new Promise((r) => setTimeout(r, 3000));

  // If on login page, click Kenji and submit
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.location.pathname.includes('/login')) {
          const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Kenji'));
          if (demoBtn) demoBtn.click();
          setTimeout(() => {
            const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign In'));
            if (submitBtn) submitBtn.click();
          }, 300);
        }
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 4000));

  // 1. Capture clean sidebar view (showing simplified logo and compact bottom profile bar without permanent voice clutter)
  const snapSidebar = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_clean_sidebar_ui.png'), Buffer.from(snapSidebar.data, 'base64'));
  console.log('Saved preview_clean_sidebar_ui.png');

  // 2. Select a Group Conversation (e.g. gc or Clan / Squad) to show the Discord-style `# general` and `🔊 lobby` channel bar
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const groupConv = Array.from(document.querySelectorAll('div, button')).find(el => el.innerText && (el.innerText.includes('gc') || el.innerText.includes('Squad') || el.innerText.includes('Clan') || el.innerText.includes('Alpha')));
        if (groupConv) groupConv.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 2000));

  const snapChannels = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_discord_group_channels.png'), Buffer.from(snapChannels.data, 'base64'));
  console.log('Saved preview_discord_group_channels.png');

  // 3. Switch to `🔊 lobby` channel to show the Discord Voice Lounge inside the group
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const lobbyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('lobby'));
        if (lobbyBtn) lobbyBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 2000));

  const snapLobby = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_discord_group_voice_lobby.png'), Buffer.from(snapLobby.data, 'base64'));
  console.log('Saved preview_discord_group_voice_lobby.png');

  // 4. Open Soundbox directly from voice chat
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sbBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Soundbox') || b.title?.includes('Soundbox'));
        if (sbBtn) sbBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1500));

  const snapSoundbox = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_soundbox_media_upload.png'), Buffer.from(snapSoundbox.data, 'base64'));
  console.log('Saved preview_soundbox_media_upload.png');

  // Close Soundbox modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('button[title*="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Close');
        if (closeBtn) closeBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));

  // 5. Open Group Info modal to show Invite Friends, Role Making, Temp Ban & Kick
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const infoBtn = document.querySelector('button[title*="Group Info"]') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Invite') || b.title?.includes('Group Info'));
        if (infoBtn) infoBtn.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1500));

  const snapGroupInfo = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_group_info_roles_ban_kick.png'), Buffer.from(snapGroupInfo.data, 'base64'));
  console.log('Saved preview_group_info_roles_ban_kick.png');

  // 6. Switch to "Invite Friends" tab in Group Info
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const inviteTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Invite Friends'));
        if (inviteTab) inviteTab.click();
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1200));

  const snapInviteFriends = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_group_invite_friends.png'), Buffer.from(snapInviteFriends.data, 'base64'));
  console.log('Saved preview_group_invite_friends.png');

  ws.close();
  chrome.kill();
  console.log('All Discord feature previews captured successfully!');
  process.exit(0);
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
