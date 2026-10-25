import { Conversation, Message, UserProfile, ConversationMember } from '@/types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    username: 'kenji_sato',
    display_name: 'Kenji Sato',
    email: 'kenji@renkei.app',
    status_text: 'stay in sync with Renkei ⚡',
    avatar_url: '/avatars/renkei_avatar_27.png',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    is_online: true,
    is_demo: true,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    username: 'aoi_tanaka',
    display_name: 'Aoi Tanaka',
    email: 'aoi@renkei.app',
    status_text: 'Designing Renkei UI/UX 🎨',
    avatar_url: '/avatars/renkei_avatar_24.png',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    updated_at: new Date().toISOString(),
    is_online: true,
    is_demo: true,
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    username: 'ren_takahashi',
    display_name: 'Ren Takahashi',
    email: 'ren@renkei.app',
    status_text: 'Renkei Voice Lounge & WebRTC 🛡️',
    avatar_url: '/avatars/renkei_avatar_17.png',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
    is_online: false,
    last_seen_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_demo: true,
  },
];

export const MOCK_CURRENT_USER = MOCK_USERS[0];

export const MOCK_MESSAGES_AOI: Message[] = [
  {
    id: 'msg-001',
    conversation_id: 'conv-aoi-direct',
    sender_id: MOCK_USERS[1].id,
    content: 'Hey Kenji! Welcome to Renkei. How does the new Ice Sapphire theme look to you?',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'msg-002',
    conversation_id: 'conv-aoi-direct',
    sender_id: MOCK_USERS[0].id,
    content: 'It looks incredible! The illuminated neon R and voice lounge are super responsive.',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'msg-003',
    conversation_id: 'conv-aoi-direct',
    sender_id: MOCK_USERS[1].id,
    content: 'Awesome! Realtime messaging, group channels, and screen sharing are all synced.',
    message_type: 'text',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export const MOCK_MEMBERS_TRIBE: ConversationMember[] = MOCK_USERS.map((u, i) => ({
  id: `member-${i + 1}`,
  conversation_id: 'conv-renkei-tribe',
  user_id: u.id,
  role: i === 0 ? 'owner' : 'member',
  joined_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  profile: u,
}));

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-aoi-direct',
    type: 'direct',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    other_user: MOCK_USERS[1],
    last_message: MOCK_MESSAGES_AOI[2],
    unread_count: 1,
  },
  {
    id: 'conv-renkei-tribe',
    type: 'group',
    name: 'Renkei Core Squad ⚡',
    description: 'Renkei core network and voice lounge channels',
    avatar_url: '/icons/renkei_app_icon_cyber.png',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    last_message: {
      id: 'msg-tribe-01',
      conversation_id: 'conv-renkei-tribe',
      sender_id: MOCK_USERS[2].id,
      content: 'WebRTC mesh and screen sharing active across all channels.',
      message_type: 'text',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    unread_count: 0,
    members: MOCK_MEMBERS_TRIBE,
  },
];
