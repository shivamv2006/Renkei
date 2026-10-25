import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\sv910\\.gemini\\antigravity\\brain\\64e13f4c-1e97-45f0-92b1-660e0cf1fa3c';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9244',
  '--disable-gpu',
  '--window-size=1280,840',
  '--user-data-dir=C:\\Games\\GENZOKU\\.chrome-preview-profile-direct',
  'http://localhost:3000/login'
]);

await new Promise((r) => setTimeout(r, 2000));
const res = await fetch('http://127.0.0.1:9244/json');
const targets = await res.json();
const page = targets.find((t) => t.type === 'page');
const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 1;
const send = (m, p = {}) =>
  new Promise((resolve) => {
    const cur = id++;
    const onm = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) {
        ws.removeEventListener('message', onm);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', onm);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

await send('Runtime.enable');
await send('Page.enable');
await new Promise((r) => setTimeout(r, 1000));

// Set demo user directly in localStorage and navigate to /
await send('Runtime.evaluate', {
  expression: `(() => {
    localStorage.setItem('genzoku_demo_user', '10000000-0000-4000-8000-000000000001');
    window.location.href = '/';
  })()`,
});

await new Promise((r) => setTimeout(r, 3500));

const status = await send('Runtime.evaluate', {
  expression: `({
    url: window.location.href,
    title: document.title,
    body: document.body.innerText.slice(0, 150)
  })`,
  returnByValue: true,
});
console.log('Dashboard status:', status.result.value);

// Screenshot 1: Clean sidebar
const snapSidebar = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_clean_sidebar_ui.png'), Buffer.from(snapSidebar.data, 'base64'));
console.log('Saved preview_clean_sidebar_ui.png, size:', snapSidebar.data.length);

// Screenshot 2: Click a group (gc or clan)
await send('Runtime.evaluate', {
  expression: `(() => {
    const gc = Array.from(document.querySelectorAll('h4, div, span')).find(el => el.innerText === 'gc' || el.innerText === 'Alpha Clan' || el.innerText?.includes('Squad'));
    if (gc) { (gc.closest('div[class*="cursor-pointer"]') || gc).click(); }
  })()`,
});

await new Promise((r) => setTimeout(r, 2000));

const snapChannels = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_discord_group_channels.png'), Buffer.from(snapChannels.data, 'base64'));
console.log('Saved preview_discord_group_channels.png, size:', snapChannels.data.length);

// Screenshot 3: Click `🔊 lobby` channel
await send('Runtime.evaluate', {
  expression: `(() => {
    const lobbyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('lobby'));
    if (lobbyBtn) lobbyBtn.click();
  })()`,
});

await new Promise((r) => setTimeout(r, 2000));

const snapLobby = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_discord_group_voice_lobby.png'), Buffer.from(snapLobby.data, 'base64'));
console.log('Saved preview_discord_group_voice_lobby.png, size:', snapLobby.data.length);

// Screenshot 4: Open Soundbox
await send('Runtime.evaluate', {
  expression: `(() => {
    const sbBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Soundbox') || b.title?.includes('Soundbox'));
    if (sbBtn) sbBtn.click();
  })()`,
});

await new Promise((r) => setTimeout(r, 1500));

const snapSoundbox = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_soundbox_media_upload.png'), Buffer.from(snapSoundbox.data, 'base64'));
console.log('Saved preview_soundbox_media_upload.png, size:', snapSoundbox.data.length);

// Close Soundbox modal
await send('Runtime.evaluate', {
  expression: `(() => {
    const closeBtn = document.querySelector('button[title*="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Close');
    if (closeBtn) closeBtn.click();
  })()`,
});

await new Promise((r) => setTimeout(r, 800));

// Screenshot 5: Open Group Info to show Admin roles, Temp Ban, Kick
await send('Runtime.evaluate', {
  expression: `(() => {
    const infoBtn = document.querySelector('button[title*="Group Info"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Invite') || b.title?.includes('Group Info'));
    if (infoBtn) infoBtn.click();
  })()`,
});

await new Promise((r) => setTimeout(r, 1500));

const snapGroupInfo = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_group_info_roles_ban_kick.png'), Buffer.from(snapGroupInfo.data, 'base64'));
console.log('Saved preview_group_info_roles_ban_kick.png, size:', snapGroupInfo.data.length);

// Screenshot 6: Switch to Invite Friends tab
await send('Runtime.evaluate', {
  expression: `(() => {
    const inviteTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Invite Friends'));
    if (inviteTab) inviteTab.click();
  })()`,
});

await new Promise((r) => setTimeout(r, 1200));

const snapInviteFriends = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_group_invite_friends.png'), Buffer.from(snapInviteFriends.data, 'base64'));
console.log('Saved preview_group_invite_friends.png, size:', snapInviteFriends.data.length);

ws.close();
chrome.kill();
console.log('Done capturing all previews successfully!');
process.exit(0);
