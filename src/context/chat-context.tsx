'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Conversation, Message, MessageType, UserProfile, Attachment, MessageReaction } from '@/types';
import { useAuth } from './auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES_AOI, MOCK_USERS } from '@/lib/mock-data';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingMessages: boolean;
  typingUsers: { [conversationId: string]: string[] };
  onlineUserIds: Set<string>;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (
    content: string,
    type?: MessageType,
    replyToId?: string | null,
    attachments?: Attachment[],
    replyToMessage?: Message | null
  ) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  createDirectChat: (targetUser: UserProfile) => Promise<string | null>;
  createGroupChat: (name: string, description: string, memberIds: string[]) => Promise<string | null>;
  setTyping: (isTyping: boolean) => void;
  markAsRead: (conversationId: string) => void;
  allUsers: UserProfile[];
  searchUsers: (query: string) => Promise<UserProfile[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: string[] }>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const activeChannelRef = useRef<any>(null);

  // Load conversations and registered users
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setAllUsers([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || isDemoMode || user.is_demo) {
      // In offline demo mode: load mock users and demo conversations
      setConversations(MOCK_CONVERSATIONS);
      setAllUsers(MOCK_USERS);
      if (!activeConversation && MOCK_CONVERSATIONS.length > 0) {
        setActiveConversation(MOCK_CONVERSATIONS[0]);
      }
      return;
    }

    // In Live Mode: load real registered users from profiles table
    try {
      const { data: dbUsers } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(50);

      if (dbUsers) {
        setAllUsers(dbUsers as UserProfile[]);
      }
    } catch (err) {
      console.warn('[GENZOKU] Fetch live profiles notification:', err);
    }

    // Load real conversations from conversation_members
    try {
      const { data, error } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          is_pinned,
          is_muted,
          conversation:conversations (
            id,
            type,
            name,
            description,
            avatar_url,
            created_by,
            created_at,
            updated_at,
            last_message_at,
            last_message_id,
            members:conversation_members (
              id,
              user_id,
              role,
              profile:profiles (*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false });

      if (error) {
        console.error('[GENZOKU] Error fetching live conversations:', error);
        return;
      }

      if (data) {
        const formatted: Conversation[] = data
          .map((item: any) => {
            const conv = item.conversation;
            if (!conv) return null;

            let otherUser: UserProfile | undefined;
            if (conv.type === 'direct') {
              const otherMember = conv.members?.find((m: any) => m.user_id !== user.id);
              otherUser = otherMember?.profile;
            }

            return {
              id: conv.id,
              type: conv.type,
              name: conv.name,
              description: conv.description,
              avatar_url: conv.avatar_url,
              created_by: conv.created_by,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              last_message_at: conv.last_message_at,
              members: conv.members,
              other_user: otherUser,
              unread_count: 0,
            };
          })
          .filter(Boolean) as Conversation[];

        setConversations(formatted);
        if (!activeConversation && formatted.length > 0) {
          setActiveConversation(formatted[0]);
        }
      }
    } catch (err) {
      console.error('[GENZOKU] Failed to fetch conversations:', err);
    }
  }, [user, activeConversation, isDemoMode]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Realtime Presence & Online / Last Seen Tracking
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id || isDemoMode) {
      if (isDemoMode) {
        setOnlineUserIds(new Set(['demo-aoi', 'demo-kenji', user?.id || '']));
      }
      return;
    }

    // Mark current user as online in database
    supabase
      .from('profiles')
      .update({
        is_online: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .then();

    // Global Presence Channel
    const presenceChannel = supabase.channel('genzoku_global_presence', {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          activeIds.add(key);
        });
        setOnlineUserIds(activeIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds((prev) => new Set([...Array.from(prev), key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Realtime Database Profile updates watcher (synchronize last_seen_at across contacts)
    const profilesWatcher = supabase
      .channel('profiles_realtime_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as UserProfile;
          if (updated?.id) {
            setAllUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
            );
            setConversations((prev) =>
              prev.map((c) => {
                if (c.type === 'direct' && c.other_user?.id === updated.id) {
                  return {
                    ...c,
                    other_user: { ...c.other_user, ...updated },
                  };
                }
                return c;
              })
            );
            setActiveConversation((prev) => {
              if (prev && prev.type === 'direct' && prev.other_user?.id === updated.id) {
                return {
                  ...prev,
                  other_user: { ...prev.other_user, ...updated },
                };
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    const handleBeforeUnload = () => {
      supabase
        .from('profiles')
        .update({
          is_online: false,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
      presenceChannel.unsubscribe();
      profilesWatcher.unsubscribe();
    };
  }, [user?.id, isDemoMode]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || isDemoMode) {
      // Demo mode messages
      if (activeConversation.id === 'conv-aoi-direct') {
        setMessages(MOCK_MESSAGES_AOI);
      } else {
        setMessages(activeConversation.last_message ? [activeConversation.last_message] : []);
      }
      return;
    }

    setIsLoadingMessages(true);
    supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*),
        attachments(*),
        reactions:message_reactions(*)
      `)
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setIsLoadingMessages(false);
        if (!error && data) {
          setMessages(data as Message[]);
        }
      });

    // Realtime channel for active conversation
    const channel = supabase.channel(`conversation_${activeConversation.id}`);
    activeChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          setMessages((prev) => {
            // Check if already present via optimistic or broadcast
            const existingIndex = prev.findIndex(
              (m) =>
                m.id === newMsg.id ||
                (m.sender_id === newMsg.sender_id &&
                  m.content === newMsg.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 4000)
            );
            if (existingIndex !== -1) {
              const copy = [...prev];
              copy[existingIndex] = {
                ...copy[existingIndex],
                id: newMsg.id,
                created_at: newMsg.created_at,
              };
              return copy;
            }
            return [...prev, newMsg];
          });

          // Fetch sender profile
          const { data: senderData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          if (senderData) {
            setMessages((prev) =>
              prev.map((m) => (m.id === newMsg.id ? { ...m, sender: senderData as UserProfile } : m))
            );
          }
        }
      )
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (!payload?.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id || (m.sender_id === payload.sender_id && m.content === payload.content))) {
            return prev;
          }
          return [...prev, payload as Message];
        });
      })
      .on('broadcast', { event: 'message_synced' }, ({ payload }) => {
        if (!payload?.tempId || !payload?.realId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.tempId ? { ...m, id: payload.realId, created_at: payload.createdAt || m.created_at } : m
          )
        );
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Message).id));
        }
      )
      .on('broadcast', { event: 'reaction_update' }, ({ payload }) => {
        if (!payload?.messageId || !payload?.reaction) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== payload.messageId) return m;
            const reactions = m.reactions || [];
            if (payload.action === 'remove') {
              return {
                ...m,
                reactions: reactions.filter(
                  (r) => !(r.user_id === payload.reaction.user_id && r.emoji === payload.reaction.emoji)
                ),
              };
            } else {
              const exists = reactions.some(
                (r) => r.user_id === payload.reaction.user_id && r.emoji === payload.reaction.emoji
              );
              if (exists) return m;
              return { ...m, reactions: [...reactions, payload.reaction] };
            }
          })
        );
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId === user?.id) return;
        setTypingUsers((prev) => {
          const current = prev[activeConversation.id] || [];
          if (payload.isTyping) {
            return {
              ...prev,
              [activeConversation.id]: Array.from(new Set([...current, payload.username || 'Someone'])),
            };
          } else {
            return {
              ...prev,
              [activeConversation.id]: current.filter((u) => u !== payload.username),
            };
          }
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeConversation, user?.id, isDemoMode]);

  const setActiveConversationId = (id: string | null) => {
    if (!id) {
      setActiveConversation(null);
      return;
    }
    const found = conversations.find((c) => c.id === id);
    if (found) {
      setActiveConversation(found);
      markAsRead(found.id);
    }
  };

  const sendMessage = async (
    content: string,
    type: MessageType = 'text',
    replyToId: string | null = null,
    attachments: Attachment[] = [],
    replyToMessage?: Message | null
  ) => {
    if (!activeConversation || !user) return;

    // For voice notes, images, or media sent without caption, ensure content holds the file URL
    let effectiveContent = content.trim();
    if (!effectiveContent && (type === 'audio' || type === 'image' || type === 'video') && attachments.length > 0) {
      effectiveContent = attachments[0].file_url;
    }

    // Resolve replied message object if replying
    const resolvedReplyMessage = replyToMessage || (replyToId ? messages.find((m) => m.id === replyToId) : undefined);

    const tempId = `msg-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      conversation_id: activeConversation.id,
      sender_id: user.id,
      sender: user,
      content: effectiveContent,
      message_type: type,
      reply_to_id: replyToId,
      reply_to_message: resolvedReplyMessage,
      attachments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      receipts: [{ message_id: tempId, user_id: user.id, status: 'sent', updated_at: new Date().toISOString() }],
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);

    // Broadcast immediately over Realtime channel so active receiver sees it with zero latency
    if (activeChannelRef.current) {
      try {
        activeChannelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMsg,
        });
      } catch (bcErr) {
        console.warn('[GENZOKU] Realtime broadcast notice:', bcErr);
      }
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || isDemoMode) return;

    // Live mode persistence with error checking
    const { data: insertedMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        content: effectiveContent,
        message_type: type,
        reply_to_id: replyToId,
      })
      .select()
      .single();

    if (error) {
      console.error('[GENZOKU] Message persistence error:', error);
      // Mark optimistic message as failed so failure is not silently hidden
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, send_failed: true } : m
        )
      );
      return;
    }

    if (insertedMsg) {
      // Sync real database id with active channel
      if (activeChannelRef.current) {
        try {
          activeChannelRef.current.send({
            type: 'broadcast',
            event: 'message_synced',
            payload: { tempId, realId: insertedMsg.id, createdAt: insertedMsg.created_at },
          });
        } catch (syncErr) {
          console.warn('[GENZOKU] Sync broadcast notice:', syncErr);
        }
      }

      // Replace temp id with real database id locally
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: insertedMsg.id, created_at: insertedMsg.created_at } : m
        )
      );

      // Persist attachments rows to database if any
      if (attachments && attachments.length > 0) {
        try {
          const rows = attachments.map((att) => ({
            message_id: insertedMsg.id,
            file_name: att.file_name,
            file_size: att.file_size,
            mime_type: att.mime_type,
            file_url: att.file_url,
          }));
          await supabase.from('attachments').insert(rows);
        } catch (attErr) {
          console.warn('[GENZOKU] Attachments db save notice:', attErr);
        }
      }

      // Update last message timestamp
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_id: insertedMsg.id,
        })
        .eq('id', activeConversation.id);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: newContent, is_edited: true, updated_at: new Date().toISOString() } : m
      )
    );

    const supabase = getSupabaseBrowserClient();
    if (supabase && !isDemoMode) {
      await supabase
        .from('messages')
        .update({ content: newContent, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);
    }
  };

  const deleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    const supabase = getSupabaseBrowserClient();
    if (supabase && !isDemoMode) {
      await supabase.from('messages').delete().eq('id', messageId);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const targetMsg = messages.find((m) => m.id === messageId);
    const existing = (targetMsg?.reactions || []).find((r) => r.user_id === user.id && r.emoji === emoji);
    const isRemoving = Boolean(existing);
    const action: 'add' | 'remove' = isRemoving ? 'remove' : 'add';

    const rxId = `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newReaction: MessageReaction = {
      id: rxId,
      message_id: messageId,
      user_id: user.id,
      emoji,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        if (isRemoving) {
          return { ...m, reactions: reactions.filter((r) => !(r.user_id === user.id && r.emoji === emoji)) };
        }
        return {
          ...m,
          reactions: [...reactions, newReaction],
        };
      })
    );

    // Broadcast in real-time to active conversation room
    if (activeChannelRef.current) {
      activeChannelRef.current.send({
        type: 'broadcast',
        event: 'reaction_update',
        payload: {
          messageId,
          reaction: newReaction,
          action,
        },
      });
    }

    // Persist to Supabase database if live mode
    const supabase = getSupabaseBrowserClient();
    if (supabase && !isDemoMode) {
      try {
        if (isRemoving) {
          await supabase
            .from('message_reactions')
            .delete()
            .match({ message_id: messageId, user_id: user.id, emoji });
        } else {
          await supabase
            .from('message_reactions')
            .insert({
              message_id: messageId,
              user_id: user.id,
              emoji,
            });
        }
      } catch (err) {
        console.warn('[GENZOKU] Database reaction sync error:', err);
      }
    }
  };

  const createDirectChat = async (targetUser: UserProfile): Promise<string | null> => {
    if (!user) return null;

    // Check if direct conversation already exists
    const existing = conversations.find(
      (c) => c.type === 'direct' && c.other_user?.id === targetUser.id
    );
    if (existing) {
      setActiveConversation(existing);
      return existing.id;
    }

    const newConv: Conversation = {
      id: `conv-direct-${Date.now()}`,
      type: 'direct',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_user: targetUser,
      unread_count: 0,
      members: [
        { id: `m1-${Date.now()}`, conversation_id: `conv-direct-${Date.now()}`, user_id: user.id, role: 'owner', joined_at: new Date().toISOString(), profile: user },
        { id: `m2-${Date.now()}`, conversation_id: `conv-direct-${Date.now()}`, user_id: targetUser.id, role: 'member', joined_at: new Date().toISOString(), profile: targetUser },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);

    const supabase = getSupabaseBrowserClient();
    if (supabase && !isDemoMode) {
      try {
        const { data: convData } = await supabase
          .from('conversations')
          .insert({ type: 'direct', created_by: user.id })
          .select()
          .single();

        if (convData) {
          await supabase.from('conversation_members').insert([
            { conversation_id: convData.id, user_id: user.id, role: 'owner' },
            { conversation_id: convData.id, user_id: targetUser.id, role: 'member' },
          ]);
          return convData.id;
        }
      } catch (err) {
        console.error('[GENZOKU] Error creating direct chat:', err);
      }
    }

    return newConv.id;
  };

  const createGroupChat = async (name: string, description: string, memberIds: string[]): Promise<string | null> => {
    if (!user) return null;

    const groupMembers = [
      { id: `mem-${user.id}`, user_id: user.id, role: 'owner', profile: user },
      ...memberIds.map((mId) => {
        const found = allUsers.find((u) => u.id === mId);
        return {
          id: `mem-${mId}`,
          user_id: mId,
          role: 'member',
          profile: found || { id: mId, username: mId, display_name: mId },
        };
      }),
    ];

    let groupConvId = `conv-group-${Date.now()}`;

    const supabase = getSupabaseBrowserClient();
    if (supabase && !isDemoMode && !user.is_demo) {
      try {
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .insert({ type: 'group', name, description, created_by: user.id })
          .select()
          .single();

        if (convErr) {
          console.warn('[GENZOKU] Group DB create notice:', convErr);
        } else if (convData) {
          groupConvId = convData.id;
          const membersToInsert = [
            { conversation_id: convData.id, user_id: user.id, role: 'owner' },
            ...memberIds.map((id) => ({ conversation_id: convData.id, user_id: id, role: 'member' })),
          ];
          await supabase.from('conversation_members').insert(membersToInsert);
        }
      } catch (err) {
        console.error('[GENZOKU] Error creating group chat in database:', err);
      }
    }

    const newGroup: Conversation = {
      id: groupConvId,
      type: 'group',
      name,
      description,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: groupMembers as any,
      unread_count: 0,
    };

    setConversations((prev) => [newGroup, ...prev.filter((c) => c.id !== groupConvId)]);
    setActiveConversation(newGroup);

    return groupConvId;
  };

  const setTyping = (isTyping: boolean) => {
    if (!activeConversation || !user) return;
    const channel = activeChannelRef.current;
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          username: user.display_name,
          isTyping,
        },
      });
    }
  };

  const markAsRead = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    );
  };

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    const q = query.trim().toLowerCase().replace(/^@+/, '');
    if (!q) return [];

    const supabase = getSupabaseBrowserClient();
    if (!supabase || isDemoMode) {
      return allUsers.filter(
        (u) =>
          u.id !== user?.id &&
          (u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      );
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id || '')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(10);

    return (data as UserProfile[]) || [];
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingMessages,
        typingUsers,
        onlineUserIds,
        setActiveConversationId,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        createDirectChat,
        createGroupChat,
        setTyping,
        markAsRead,
        allUsers,
        searchUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
