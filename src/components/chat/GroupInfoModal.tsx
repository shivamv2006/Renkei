'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import { Conversation, RoleType } from '@/types';
import {
  X,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Edit3,
  Check,
  Search,
  LogOut,
  Crown,
  Sparkles,
  Camera,
  Ban,
  Clock,
  Link,
  Copy,
  UserCheck,
  Share2,
} from 'lucide-react';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

interface BannedMember {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  bannedAt: string;
  banDuration: string; // '1h' | '24h' | '7d'
  expiresAt: number;
}

// 30 Anime Avatars for Quick Group Icon Customization
const AVATAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `/avatars/renkei_avatar_${num}.png`;
});

export function GroupInfoModal({ isOpen, onClose, conversation }: GroupInfoModalProps) {
  const { user } = useAuth();
  const {
    allUsers,
    onlineUserIds,
    updateGroupInfo,
    updateMemberRole,
    addGroupMember,
    removeGroupMember,
    leaveGroup,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'banned'>('members');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [selectedAvatar, setSelectedAvatar] = useState(conversation.avatar_url || '');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [searchNewUserQuery, setSearchNewUserQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Temporary Ban Modal / Menu state
  const [banTarget, setBanTarget] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);
  const [bannedMembers, setBannedMembers] = useState<BannedMember[]>([]);

  // Load banned members from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `renkei_banned_group_${conversation.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed: BannedMember[] = JSON.parse(saved);
          // filter out expired bans
          const now = Date.now();
          const activeBans = parsed.filter((b) => b.expiresAt > now);
          setBannedMembers(activeBans);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, [conversation.id, isOpen]);

  if (!isOpen) return null;

  // Determine current user's role in this group
  const currentMember = (conversation.members || []).find((m) => m.user_id === user?.id);
  const isCurrentUserAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const handleSaveInfo = async () => {
    await updateGroupInfo(conversation.id, {
      name: name.trim() || conversation.name || 'Group',
      description: description.trim(),
      avatar_url: selectedAvatar,
    });
    setIsEditing(false);
    showToast('Group details updated!');
  };

  // Role Making: Promote / Demote Admin
  const handleRoleChange = async (memberId: string, currentRole: RoleType) => {
    const newRole: RoleType = currentRole === 'admin' ? 'member' : 'admin';
    await updateMemberRole(conversation.id, memberId, newRole);
    showToast(`Role updated to ${newRole.toUpperCase()}!`);
  };

  // Kick Member
  const handleKickMember = async (memberId: string, memberName: string) => {
    if (confirm(`Kick ${memberName} from this group?`)) {
      await removeGroupMember(conversation.id, memberId);
      showToast(`${memberName} kicked from group.`);
    }
  };

  // Temporary Ban Member
  const handleApplyTemporaryBan = async (duration: '1h' | '24h' | '7d') => {
    if (!banTarget) return;

    const durationMs =
      duration === '1h' ? 3600 * 1000 : duration === '24h' ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
    const label = duration === '1h' ? '1 Hour' : duration === '24h' ? '24 Hours' : '7 Days';

    const newBan: BannedMember = {
      userId: banTarget.id,
      userName: banTarget.name,
      userAvatar: banTarget.avatar,
      bannedAt: new Date().toISOString(),
      banDuration: label,
      expiresAt: Date.now() + durationMs,
    };

    const updated = [newBan, ...bannedMembers];
    setBannedMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`renkei_banned_group_${conversation.id}`, JSON.stringify(updated));
    }

    // Remove member from the group
    await removeGroupMember(conversation.id, banTarget.id);
    setBanTarget(null);
    showToast(`${banTarget.name} temporarily banned for ${label}.`);
  };

  // Unban Member
  const handleUnbanMember = (userId: string, userName: string) => {
    const updated = bannedMembers.filter((b) => b.userId !== userId);
    setBannedMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`renkei_banned_group_${conversation.id}`, JSON.stringify(updated));
    }
    showToast(`${userName} unbanned! They can now be re-invited.`);
  };

  // Add / Invite Member
  const handleInviteMember = async (userId: string, userName: string) => {
    // Check if banned
    const isBanned = bannedMembers.some((b) => b.userId === userId && b.expiresAt > Date.now());
    if (isBanned) {
      alert(`${userName} is currently temporarily banned from this group. Unban them first.`);
      return;
    }
    await addGroupMember(conversation.id, userId);
    showToast(`${userName} joined the group!`);
  };

  const handleCopyInviteLink = () => {
    const link = `https://renkei.app/invite/grp-${conversation.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedLink(true);
    showToast('Group Invite Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLeaveGroup = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      await leaveGroup(conversation.id);
      onClose();
    }
  };

  // Filter existing group members
  const filteredMembers = (conversation.members || []).filter((m) => {
    const q = searchMemberQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = m.profile?.display_name?.toLowerCase().includes(q);
    const userMatch = m.profile?.username?.toLowerCase().includes(q);
    return nameMatch || userMatch;
  });

  // Non-members available to be added / invited
  const existingMemberIds = new Set((conversation.members || []).map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => {
    if (existingMemberIds.has(u.id)) return false;
    const q = searchNewUserQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Clan & Group Overview</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Ban Duration Modal Overlay */}
        {banTarget && (
          <div className="p-4 bg-rose-950/40 border-b border-rose-900/60 flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <Ban className="w-4 h-4 text-rose-500" />
                <span>Temporary Ban for {banTarget.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setBanTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Select ban duration. The member will be removed from the squad and blocked from rejoining until expired:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleApplyTemporaryBan('1h')}
                className="py-1.5 px-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Clock className="w-3 h-3" /> 1 Hour
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemporaryBan('24h')}
                className="py-1.5 px-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Clock className="w-3 h-3" /> 24 Hours
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemporaryBan('7d')}
                className="py-1.5 px-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Clock className="w-3 h-3" /> 7 Days
              </button>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {actionSuccess && (
          <div className="bg-emerald-500 text-white text-xs font-bold py-1.5 px-4 text-center animate-in fade-in flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Group Avatar and Editable Info */}
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="relative group mb-2">
              <Avatar
                src={selectedAvatar || conversation.avatar_url}
                name={conversation.name || 'Group'}
                size="xl"
              />
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-cyan-500 text-white shadow-md hover:bg-cyan-400 transition-colors cursor-pointer"
                  title="Change Group Icon"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Avatar Picker Grid */}
            {isAvatarPickerOpen && isCurrentUserAdmin && (
              <div className="w-full max-h-36 overflow-y-auto p-2 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl animate-in fade-in">
                <span className="text-[10px] font-bold text-cyan-400 block mb-1">
                  Choose Anime Icon for Squad
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_OPTIONS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(url);
                        setIsAvatarPickerOpen(false);
                      }}
                      className={`p-0.5 rounded-full border-2 transition-all ${
                        selectedAvatar === url ? 'border-cyan-400 scale-105' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="icon" className="w-8 h-8 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="w-full space-y-2 mt-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group Name"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold text-center focus:outline-hidden focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Group Topic / Tagline"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 text-center focus:outline-hidden focus:border-cyan-500"
                />
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveInfo}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 justify-center">
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {conversation.name}
                  </h4>
                  {isCurrentUserAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                      title="Edit Group Info"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-0.5">
                  {conversation.description || 'Welcome to the squad! Chat, voice lounge, and coordinate.'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-mono text-[10px] font-bold border border-cyan-500/30">
                    {(conversation.members || []).length} Members
                  </span>
                  {currentMember && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                      Your Role: {currentMember.role}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Navigation Sub-Tabs: Members | Invite Friend | Banned Users */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({(conversation.members || []).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'invite'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Friends</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('banned')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'banned'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Banned ({bannedMembers.length})</span>
            </button>
          </div>

          {/* TAB 1: MEMBERS WITH ROLE MAKING, KICK & BAN */}
          {activeTab === 'members' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  placeholder="Filter members..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredMembers.map((member) => {
                  const memberProfile = member.profile;
                  const isMemberOnline = member.user_id ? onlineUserIds.has(member.user_id) : false;
                  const isTargetOwner = member.role === 'owner';
                  const isTargetAdmin = member.role === 'admin' || isTargetOwner;
                  const isSelf = member.user_id === user?.id;

                  return (
                    <div
                      key={member.id || member.user_id}
                      className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Avatar
                          src={memberProfile?.avatar_url}
                          name={memberProfile?.display_name || 'Member'}
                          size="sm"
                          isOnline={isMemberOnline}
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {memberProfile?.display_name || member.user_id}
                            </span>
                            {isSelf && <span className="text-[10px] text-cyan-400 font-bold">(You)</span>}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate font-mono">
                            @{memberProfile?.username || 'user'}
                          </span>
                        </div>
                      </div>

                      {/* Role Pill & Admin Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isTargetOwner ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span>Owner</span>
                          </span>
                        ) : isTargetAdmin ? (
                          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                            Member
                          </span>
                        )}

                        {/* Admin Action Buttons on other members */}
                        {isCurrentUserAdmin && !isTargetOwner && !isSelf && (
                          <div className="flex items-center gap-1 ml-1">
                            {/* Role Making Button */}
                            <button
                              type="button"
                              onClick={() => handleRoleChange(member.user_id, member.role)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                                isTargetAdmin
                                  ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30'
                                  : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
                              }`}
                              title={isTargetAdmin ? 'Demote to Member' : 'Promote to Admin'}
                            >
                              <Shield className="w-3 h-3" />
                              <span>{isTargetAdmin ? 'Demote' : 'Make Admin'}</span>
                            </button>

                            {/* Temporary Ban Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setBanTarget({
                                  id: member.user_id,
                                  name: memberProfile?.display_name || 'Member',
                                  avatar: memberProfile?.avatar_url,
                                })
                              }
                              className="px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              title="Temporary Ban"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Ban</span>
                            </button>

                            {/* Kick Member Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleKickMember(member.user_id, memberProfile?.display_name || 'Member')
                              }
                              className="px-2 py-1 bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              title="Kick from Group"
                            >
                              <UserMinus className="w-3 h-3" />
                              <span>Kick</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INVITE FRIENDS (LINK & CONTACTS) */}
          {activeTab === 'invite' && (
            <div className="space-y-3">
              {/* Copy Invite Link Card */}
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Group Invite Link</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="p-2 bg-slate-950/80 rounded-xl font-mono text-[11px] text-cyan-400 truncate border border-cyan-900/50">
                  https://renkei.app/invite/grp-{conversation.id}
                </div>
              </div>

              {/* Direct Invite Friends List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Invite From Contacts & Friends
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {availableUsers.length} available
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchNewUserQuery}
                    onChange={(e) => setSearchNewUserQuery(e.target.value)}
                    placeholder="Search friend name or @username..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableUsers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No more contacts to invite. All your friends are already in this squad!
                    </div>
                  ) : (
                    availableUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {u.display_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">@{u.username}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInviteMember(u.id, u.display_name)}
                          className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BANNED USERS & UNBAN ACTION */}
          {activeTab === 'banned' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Temporarily Banned Members ({bannedMembers.length})
              </span>

              {bannedMembers.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <UserCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Banned Members</p>
                  <p className="text-[11px] text-slate-500">
                    The squad is in good standing! When admins temporarily ban a member, they appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {bannedMembers.map((b) => (
                    <div
                      key={b.userId}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-950/20 border border-rose-900/40"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Avatar src={b.userAvatar} name={b.userName} size="sm" />
                        <div className="truncate">
                          <span className="font-bold text-xs text-rose-300 block truncate">{b.userName}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-400" /> Banned for {b.banDuration}
                          </span>
                        </div>
                      </div>

                      {isCurrentUserAdmin && (
                        <button
                          type="button"
                          onClick={() => handleUnbanMember(b.userId, b.userName)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Unban</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleLeaveGroup}
            className="px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
