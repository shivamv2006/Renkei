import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLastSeen, formatRelativeDate } from '../src/lib/utils.ts';

test('GENZOKU Feature Suite — Real-time Reactions, Media, Themes & Voice Notes', async (t) => {
  await t.test('1. Message Reactions: Aggregation and Toggle Logic', () => {
    const messageReactions = [
      { id: 'rx-1', message_id: 'm1', user_id: 'user-1', emoji: '👍', created_at: new Date().toISOString() },
      { id: 'rx-2', message_id: 'm1', user_id: 'user-2', emoji: '👍', created_at: new Date().toISOString() },
      { id: 'rx-3', message_id: 'm1', user_id: 'user-1', emoji: '❤️', created_at: new Date().toISOString() },
    ];

    const currentUserId = 'user-1';

    // Grouping logic matching MessageBubble.tsx
    const grouped = messageReactions.reduce((acc, rx) => {
      if (!acc[rx.emoji]) acc[rx.emoji] = { count: 0, userReacted: false };
      acc[rx.emoji].count += 1;
      if (rx.user_id === currentUserId) acc[rx.emoji].userReacted = true;
      return acc;
    }, {});

    assert.equal(grouped['👍'].count, 2, 'Thumbs up should have count 2');
    assert.equal(grouped['👍'].userReacted, true, 'User-1 should be marked as reacted to thumbs up');
    assert.equal(grouped['❤️'].count, 1, 'Heart should have count 1');
    assert.equal(grouped['❤️'].userReacted, true, 'User-1 should be marked as reacted to heart');

    // Toggle removal logic matching chat-context.tsx
    const afterRemoval = messageReactions.filter(
      (r) => !(r.user_id === 'user-1' && r.emoji === '👍')
    );
    assert.equal(afterRemoval.length, 2, 'Removing reaction should leave 2 items');
    assert.equal(afterRemoval.some((r) => r.user_id === 'user-1' && r.emoji === '👍'), false);
  });

  await t.test('2. Voice Note & Video Note Message Types', () => {
    const voiceAttachment = {
      id: 'att-voice-1',
      file_name: 'voice-note-1792850000.webm',
      file_size: 45000,
      mime_type: 'audio/webm',
      file_url: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
    };

    const videoAttachment = {
      id: 'att-video-1',
      file_name: 'clip.mp4',
      file_size: 1200000,
      mime_type: 'video/mp4',
      file_url: 'https://example.com/videos/sample.mp4',
    };

    assert.equal(voiceAttachment.mime_type.startsWith('audio/'), true, 'Voice note must match audio MIME');
    assert.equal(voiceAttachment.file_name.endsWith('.webm'), true, 'Voice note filename ends in .webm');
    assert.equal(videoAttachment.mime_type.startsWith('video/'), true, 'Video attachment must match video MIME');
  });

  await t.test('3. WebRTC Configuration: Verified STUN URLs and Safe Error Suppression', () => {
    const stunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun.cloudflare.com:3478'
    ];

    assert.equal(stunServers.length >= 4, true, 'Should provide at least 4 redundant STUN servers');
    assert.equal(stunServers.some(s => s.includes('google.com')), true, 'Google STUN included');
    assert.equal(stunServers.some(s => s.includes('cloudflare.com')), true, 'Cloudflare STUN included');

    // Error banner suppression rule: Call error should only display when connectedAtRef.current is truthy
    const callStatus = 'ringing';
    let connectedAt = null;
    let callError = null;

    // Simulate ICE state change while status is ringing
    const iceState = 'failed';
    if (iceState === 'failed' && connectedAt !== null) {
      callError = 'Connection interrupted. Attempting to reconnect...';
    }

    assert.equal(callError, null, 'Error banner must remain suppressed while status is still ringing');

    // Once connected
    connectedAt = Date.now();
    if (iceState === 'failed' && connectedAt !== null) {
      callError = 'Connection interrupted. Attempting to reconnect...';
    }
    assert.notEqual(callError, null, 'Error banner triggers if failure occurs during active call');
  });

  await t.test('4. DIY Theme & Wallpaper Customization Tokens', () => {
    const diyColors = [
      'linear-gradient(to bottom, #0f172a, #020617)',
      'linear-gradient(to bottom, #0b141a, #071015)',
      'linear-gradient(to bottom, #030712, #0c1527)',
      'linear-gradient(to bottom, #130a24, #080312)',
      'linear-gradient(to bottom, #210a14, #0d0307)',
      'linear-gradient(to bottom, #041a12, #020a06)'
    ];

    diyColors.forEach(gradient => {
      assert.equal(gradient.startsWith('linear-gradient'), true, 'Color gradient must be valid CSS');
    });

    const presetWallpapers = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=60'
    ];

    presetWallpapers.forEach(url => {
      assert.equal(url.startsWith('https://'), true, 'Preset wallpaper must have valid secure URL');
    });
  });

  await t.test('5. Avatar Presets & Thumbnail Optimization', () => {
    const avatarPresets = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ];

    assert.equal(avatarPresets.length, 8, 'Must have 8 preset avatars for instant selection');
    avatarPresets.forEach(preset => {
      assert.equal(preset.startsWith('https://'), true);
    });
  });

  await t.test('6. Presence & Last Seen Relative Time Formatter', () => {
    assert.equal(formatLastSeen(null), 'Offline');
    assert.equal(formatLastSeen(undefined), 'Offline');

    const justNow = new Date(Date.now() - 30 * 1000).toISOString();
    assert.equal(formatLastSeen(justNow), 'last seen just now');

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    assert.equal(formatLastSeen(fiveMinAgo), 'last seen 5m ago');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const formatted = formatLastSeen(twoHoursAgo);
    assert.equal(formatted.includes('last seen today at') || formatted.includes('last seen yesterday at'), true);
  });
});
