'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
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

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [selectedAvatar, setSelectedAvatar] = useState(conversation.avatar_url || '');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchNewUserQuery, setSearchNewUserQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  const handleRoleChange = async (memberId: string, currentRole: RoleType) => {
    const newRole: RoleType = currentRole === 'admin' ? 'member' : 'admin';
    await updateMemberRole(conversation.id, memberId, newRole);
    showToast(`Role updated to ${newRole.toUpperCase()}!`);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from this group?`)) {
      await removeGroupMember(conversation.id, memberId);
      showToast(`${memberName} removed from group.`);
    }
  };

  const handleAddMember = async (userId: string, userName: string) => {
    await addGroupMember(conversation.id, userId);
    setIsAddMemberOpen(false);
    showToast(`${userName} added to group!`);
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

  // Non-members available to be added
  const existingMemberIds = new Set((conversation.members || []).map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => {
    if (existingMemberIds.has(u.id)) return false;
    const q = searchNewUserQuery.toLowerCase().trim();
    if (!q) return true;
    return u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
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
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Group Information</span>
                {actionSuccess && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-in fade-in">
                    {actionSuccess}
                  </span>
                )}
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

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Group Profile Hero Banner */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 relative">
            <div className="relative group mb-3">
              <Avatar
                src={selectedAvatar || conversation.avatar_url}
                name={name || conversation.name}
                size="xl"
              />
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                  className="absolute bottom-0 right-0 p-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-90"
                  title="Change Group Icon"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Avatar Preset Selector */}
            {isAvatarPickerOpen && isCurrentUserAdmin && (
              <div className="w-full mb-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Group Avatar:</span>
                  <button
                    onClick={() => setIsAvatarPickerOpen(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                  {AVATAR_OPTIONS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(av);
                        setIsAvatarPickerOpen(false);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                        selectedAvatar === av
                          ? 'border-brand-500 scale-105 shadow-md'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-9 h-9 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="w-full space-y-3 mt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 text-left mb-1">Group Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    placeholder="Group name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 text-left mb-1">Description / Topic</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    placeholder="What is this group about?"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setName(conversation.name || '');
                      setDescription(conversation.description || '');
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInfo}
                    className="px-4 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 justify-center">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {name || conversation.name}
                  </h4>
                  {isCurrentUserAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
                      title="Edit Group Info"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {description || conversation.description || 'No description set'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[11px]">
                    {(conversation.members || []).length} Members
                  </span>
                  {currentMember && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider">
                      Your Role: {currentMember.role}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Members Section Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Users className="w-4 h-4 text-brand-500" />
                <span>Group Members ({(conversation.members || []).length})</span>
              </div>
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                  className="px-2.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add Member Dropdown Panel */}
            {isAddMemberOpen && isCurrentUserAdmin && (
              <div className="p-3 bg-brand-50/50 dark:bg-slate-800/80 rounded-2xl border border-brand-200/60 dark:border-brand-900/60 space-y-2 animate-in fade-in">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchNewUserQuery}
                    onChange={(e) => setSearchNewUserQuery(e.target.value)}
                    placeholder="Search users to add..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {availableUsers.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">No new users found to add.</p>
                  ) : (
                    availableUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Avatar src={u.avatar_url} name={u.display_name} size="xs" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {u.display_name}
                            </span>
                            <span className="text-[10px] text-slate-400">@{u.username}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMember(u.id, u.display_name)}
                          className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Member Filter Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Filter members..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Members List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredMembers.map((member) => {
                const memberProfile = member.profile;
                const isMemberOnline = member.user_id ? onlineUserIds.has(member.user_id) : false;
                const isTargetOwner = member.role === 'owner';
                const isTargetAdmin = member.role === 'admin' || isTargetOwner;
                const isSelf = member.user_id === user?.id;

                return (
                  <div
                    key={member.id || member.user_id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
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
                          {isSelf && (
                            <span className="text-[10px] text-slate-400 font-semibold">(You)</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          @{memberProfile?.username || 'user'}
                        </span>
                      </div>
                    </div>

                    {/* Roles & Admin Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role Pill */}
                      {isTargetOwner ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>Owner</span>
                        </span>
                      ) : isTargetAdmin ? (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-500" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                          Member
                        </span>
                      )}

                      {/* Admin Controls on other members */}
                      {isCurrentUserAdmin && !isTargetOwner && !isSelf && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRoleChange(member.user_id, member.role)}
                            className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isTargetAdmin
                                ? 'text-amber-500 hover:bg-amber-500/10'
                                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                            title={isTargetAdmin ? 'Demote to Member' : 'Promote to Admin'}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveMember(member.user_id, memberProfile?.display_name || 'Member')
                            }
                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg text-xs cursor-pointer transition-colors"
                            title="Remove from Group"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleLeaveGroup}
            className="px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
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
