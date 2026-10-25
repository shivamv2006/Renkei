/**
 * GENZOKU — Core TypeScript Type Definitions
 */

export type RoleType = 'owner' | 'admin' | 'member';
export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'call';
export type ReceiptStatus = 'sent' | 'delivered' | 'read';
export type CallStatus = 'initiating' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
export type CallType = 'audio' | 'video';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  status_text?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
  is_online?: boolean;
  last_seen_at?: string | null;
  is_demo?: boolean;
}

export interface FriendNickname {
  target_user_id: string;
  nickname: string;
  set_by_id: string;
  set_by_name: string;
  updated_at: string;
}

export interface UsernameRequest {
  id: string;
  requester_id: string;
  requester_username: string;
  requested_username: string;
  current_owner_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'nickname' | 'mention' | 'username_request' | 'general';
  read: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  message_id?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  created_at?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageReceipt {
  id?: string;
  message_id: string;
  user_id: string;
  status: ReceiptStatus;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: UserProfile;
  content: string;
  message_type: MessageType;
  reply_to_id?: string | null;
  reply_to_message?: Message | null;
  is_edited?: boolean;
  is_deleted?: boolean;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  receipts?: MessageReceipt[];
  send_failed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: RoleType;
  joined_at: string;
  is_pinned?: boolean;
  is_muted?: boolean;
  is_archived?: boolean;
  profile?: UserProfile;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  last_message?: Message | null;
  members?: ConversationMember[];
  unread_count?: number;
  other_user?: UserProfile; // populated for 'direct' conversations
}

export interface CallSession {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: CallStatus;
  caller_profile?: UserProfile;
  receiver_profile?: UserProfile;
  offer?: any;
  is_simulation?: boolean;
  error_message?: string | null;
  created_at: string;
  ended_at?: string | null;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  nickname?: string | null;
  profile?: UserProfile;
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_message_id?: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}
