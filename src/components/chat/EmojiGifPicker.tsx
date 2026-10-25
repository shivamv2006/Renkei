'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Smile,
  Film,
  Sparkles,
  Clock,
  Sticker,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

interface EmojiGifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string) => void;
}

// Built-in Categorized Emojis
const EMOJI_CATEGORIES: { id: string; name: string; icon: string; emojis: string[] }[] = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
      '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
      '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
      '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👻', '👽',
    ],
  },
  {
    id: 'gestures',
    name: 'People & Gestures',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
      '💅', '🤳', '💪', '🧠', '🫀', '👀', '👁️', '👅', '👄', '💋', '❤️', '🧡', '💛', '💚', '💙', '💜',
      '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '⭐', '🌟',
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🐢', '🐍', '🦎', '🦖', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🐅',
      '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🦒', '🦘', '🐕', '🐩', '🐈', '🌸', '🌹', '🌻',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍔',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅',
      '🥑', '🥦', '🌶️', '🌽', '🥕', '🥔', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩',
      '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍣', '🍱',
      '🥟', '🍤', '🍙', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍿', '☕', '🧋',
    ],
  },
  {
    id: 'activity',
    name: 'Activities & Sports',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🥊', '🥋', '🛹', '🛼',
      '🏹', '🎣', '🤿', '🏆', '🥇', '🥈', '🥉', '🏅', '🎫', '🎟️', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼',
      '🎹', '🥁', '🎷', '🎺', '🎸', '🎮', '🕹️', '🎲', '♟️', '🎯', '🎳', '🎰', '🧩', '🚀', '🛸', '✈️',
    ],
  },
];

// Expanded High-Definition Animated GIFs for Direct In-App Sharing (50+ GIFs)
const CURATED_GIFS: { id: string; title: string; category: string; url: string }[] = [
  // Anime & Gaming
  { id: 'a1', title: 'Anya Heh Smug', category: 'anime', url: 'https://media.giphy.com/media/zZC2AqB84z7xe/giphy.gif' },
  { id: 'a2', title: 'Anya Shocked Waku', category: 'anime', url: 'https://media.giphy.com/media/FWAcpJsFT9mVRv0e7a/giphy.gif' },
  { id: 'a3', title: 'Gojo Satoru Hollow Purple', category: 'anime', url: 'https://media.giphy.com/media/ug6l63xVM55OHMAngT/giphy.gif' },
  { id: 'a4', title: 'Naruto Running Fast', category: 'anime', url: 'https://media.giphy.com/media/JRlqKEzTDKcibTGvnL/giphy.gif' },
  { id: 'a5', title: 'Chika Fujiwara Dance', category: 'anime', url: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif' },
  { id: 'a6', title: 'Pikachu Lightning Dance', category: 'anime', url: 'https://media.giphy.com/media/slVWEctHZKvWU/giphy.gif' },
  { id: 'a7', title: 'Dragon Ball Super Saiyan', category: 'anime', url: 'https://media.giphy.com/media/12wsnmdE9IjrnG/giphy.gif' },
  { id: 'a8', title: 'Demon Slayer Nezuko Run', category: 'anime', url: 'https://media.giphy.com/media/sRLh260NNxYZG/giphy.gif' },
  { id: 'a9', title: 'Sailor Moon Sparkle Wink', category: 'anime', url: 'https://media.giphy.com/media/3og0IPbUygZWha8VNKL/giphy.gif' },
  { id: 'a10', title: 'Attack on Titan Salute', category: 'anime', url: 'https://media.giphy.com/media/3o7btQ8jDTPGDpgc6I/giphy.gif' },

  // Gaming & Memes
  { id: 'gm1', title: 'Pop Cat Pop Pop', category: 'meme', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { id: 'gm2', title: 'Doge Head Bobbing', category: 'meme', url: 'https://media.giphy.com/media/oBQZnnWvgHw40/giphy.gif' },
  { id: 'gm3', title: 'Among Us Emergency Call', category: 'gaming', url: 'https://media.giphy.com/media/RtdRhc7TxBxB0YAsK6/giphy.gif' },
  { id: 'gm4', title: 'GTA Wasted Classic', category: 'gaming', url: 'https://media.giphy.com/media/10yXFkBJ0MwGQg/giphy.gif' },
  { id: 'gm5', title: 'Minecraft Steve Dance', category: 'gaming', url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif' },
  { id: 'gm6', title: 'SpongeBob Rainbow Magic', category: 'meme', url: 'https://media.giphy.com/media/BQUITFiYVtNte/giphy.gif' },
  { id: 'gm7', title: 'Think About It Roll Safe', category: 'meme', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif' },
  { id: 'gm8', title: 'Shaq Shimmy Meme', category: 'meme', url: 'https://media.giphy.com/media/UO5elnTqo4vSg/giphy.gif' },
  { id: 'gm9', title: 'Confused Travolta', category: 'meme', url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif' },
  { id: 'gm10', title: 'Rick Astley Dance', category: 'meme', url: 'https://media.giphy.com/media/Vuw9m5wXviFIQ/giphy.gif' },

  // Laugh & Funny
  { id: 'g1', title: 'Laughing Dog', category: 'laugh', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
  { id: 'g2', title: 'Minions Laugh', category: 'laugh', url: 'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif' },
  { id: 'g3', title: 'Kermit Laugh', category: 'laugh', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { id: 'g4', title: 'Cat LOL Roar', category: 'laugh', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
  { id: 'g4b', title: 'Baby Laughing Giggles', category: 'laugh', url: 'https://media.giphy.com/media/9w9Z2ZOjfPoE8/giphy.gif' },

  // Love & Hugs
  { id: 'g5', title: 'Heart Flying', category: 'love', url: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif' },
  { id: 'g6', title: 'Anime Sweet Hug', category: 'love', url: 'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif' },
  { id: 'g7', title: 'Love Heart Beat', category: 'love', url: 'https://media.giphy.com/media/R6gVNROjZa40w/giphy.gif' },
  { id: 'g8', title: 'Puppy Love Lick', category: 'love', url: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif' },
  { id: 'g8b', title: 'Cat Heart Eyes', category: 'love', url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif' },

  // Celebration & Party
  { id: 'g9', title: 'Confetti Party', category: 'party', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 'g10', title: 'Happy Dance', category: 'party', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'g11', title: 'Cheers Toast Leonardo', category: 'party', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: 'g12', title: 'Fireworks Celebration', category: 'party', url: 'https://media.giphy.com/media/peAFQfg7Ol6IE/giphy.gif' },

  // Applause & Clapping
  { id: 'g13', title: 'Leonardo Clapping', category: 'clap', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: 'g14', title: 'Otter Clapping', category: 'clap', url: 'https://media.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif' },
  { id: 'g15', title: 'Slow Clap Respect', category: 'clap', url: 'https://media.giphy.com/media/Swx36wwSsU49HAnIhC/giphy.gif' },

  // Dance & Vibe
  { id: 'g16', title: 'Dancing Baby Groot', category: 'dance', url: 'https://media.giphy.com/media/F9hQLAVhWnLVC/giphy.gif' },
  { id: 'g17', title: 'Groovy Duck Dance', category: 'dance', url: 'https://media.giphy.com/media/bkcbX8SqTCXHG/giphy.gif' },
  { id: 'g18', title: 'Disco Fever Saturday', category: 'dance', url: 'https://media.giphy.com/media/3ohhwfAa9rbXaZeJhK/giphy.gif' },

  // Thumbs Up & Yes
  { id: 'g19', title: 'Big Thumbs Up', category: 'yes', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'g20', title: 'Nodding Yes Cool', category: 'yes', url: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif' },
  { id: 'g21', title: 'Cool Thumbs Up Bro', category: 'yes', url: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif' },

  // Shock & OMG
  { id: 'g22', title: 'Cat Shocked Eyes', category: 'wow', url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif' },
  { id: 'g23', title: 'Mind Blown Galaxy', category: 'wow', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  { id: 'g24', title: 'Dramatic Gasp Soap', category: 'wow', url: 'https://media.giphy.com/media/75ZaxapSmEGB2/giphy.gif' },

  // Fire & Lit
  { id: 'g25', title: 'Elmo Fire Chaos', category: 'fire', url: 'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif' },
  { id: 'g26', title: 'Super Lit Fire Dance', category: 'fire', url: 'https://media.giphy.com/media/26xBvOp1AfVx2FlPe/giphy.gif' },
];

// Curated Preset Stickers (Sticker art transparent graphics)
const PRESET_STICKERS: { id: string; name: string; url: string }[] = [
  { id: 'st1', name: 'Anya Heh', url: 'https://media.giphy.com/media/zZC2AqB84z7xe/giphy.gif' },
  { id: 'st2', name: 'Pop Cat', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { id: 'st3', name: 'Doge Wow', url: 'https://media.giphy.com/media/oBQZnnWvgHw40/giphy.gif' },
  { id: 'st4', name: 'Dancing Duck', url: 'https://media.giphy.com/media/bkcbX8SqTCXHG/giphy.gif' },
  { id: 'st5', name: 'Groot Dance', url: 'https://media.giphy.com/media/F9hQLAVhWnLVC/giphy.gif' },
  { id: 'st6', name: 'Otter Clap', url: 'https://media.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif' },
  { id: 'st7', name: 'Elmo Fire', url: 'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif' },
  { id: 'st8', name: 'Anime Hug', url: 'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif' },
  { id: 'st9', name: 'Pikachu Pulse', url: 'https://media.giphy.com/media/slVWEctHZKvWU/giphy.gif' },
  { id: 'st10', name: 'Among Us', url: 'https://media.giphy.com/media/RtdRhc7TxBxB0YAsK6/giphy.gif' },
  { id: 'st11', name: 'Mind Blown', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  { id: 'st12', name: 'Cat Love', url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif' },
];

interface CustomSticker {
  id: string;
  name: string;
  url: string;
  created_at?: number;
}

export function EmojiGifPicker({ isOpen, onClose, onSelectEmoji, onSelectGif }: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif' | 'stickers'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('smileys');
  const [selectedGifTag, setSelectedGifTag] = useState<string>('all');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [customStickers, setCustomStickers] = useState<CustomSticker[]>([]);
  const [stickerUploadError, setStickerUploadError] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load recents & custom stickers from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedEmojis = localStorage.getItem('genzoku_recent_emojis');
        if (savedEmojis) setRecentEmojis(JSON.parse(savedEmojis));

        const savedStickers = localStorage.getItem('renkei_custom_stickers');
        if (savedStickers) {
          setCustomStickers(JSON.parse(savedStickers));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emoji: string) => {
    const nextRecents = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 16);
    setRecentEmojis(nextRecents);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('genzoku_recent_emojis', JSON.stringify(nextRecents));
      } catch (e) {}
    }
    onSelectEmoji(emoji);
  };

  // Filter emojis based on search
  const filteredEmojiList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      if (selectedCategory === 'recent') return recentEmojis;
      const cat = EMOJI_CATEGORIES.find((c) => c.id === selectedCategory);
      return cat ? cat.emojis : [];
    }
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return all.filter((e) => e.includes(q));
  }, [searchQuery, selectedCategory, recentEmojis]);

  // Filter GIFs based on search and tag
  const filteredGifs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CURATED_GIFS.filter((gif) => {
      const matchesTag = selectedGifTag === 'all' || gif.category === selectedGifTag;
      const matchesSearch = !q || gif.title.toLowerCase().includes(q) || gif.category.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    });
  }, [searchQuery, selectedGifTag]);

  // Handle custom sticker media import
  const handleImportSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStickerUploadError('Please select a valid image (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStickerUploadError('Image must be under 5MB');
      return;
    }

    setStickerUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 16) || 'Custom Sticker';
        const newSticker: CustomSticker = {
          id: `sticker-${Date.now()}`,
          name: cleanName,
          url: dataUrl,
          created_at: Date.now(),
        };
        const updated = [newSticker, ...customStickers];
        setCustomStickers(updated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('renkei_custom_stickers', JSON.stringify(updated));
          } catch (err) {
            console.warn('[Renkei Stickers] LocalStorage quota exceeded:', err);
          }
        }
      }
    };
    reader.readAsDataURL(file);

    if (stickerFileInputRef.current) {
      stickerFileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomSticker = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = customStickers.filter((st) => st.id !== id);
    setCustomStickers(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('renkei_custom_stickers', JSON.stringify(updated));
      } catch (err) {}
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 left-2 sm:left-4 z-40 w-[calc(100vw-24px)] max-w-[390px] h-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 select-none"
    >
      {/* Top Search & Close Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'emoji'
                ? 'Search emojis...'
                : activeTab === 'gif'
                ? 'Search animated GIFs...'
                : 'Search stickers...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-toolbar (Categories or Tags or Import) */}
      {activeTab === 'emoji' && (
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-base">
          {recentEmojis.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategory('recent');
                setSearchQuery('');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'recent' && !searchQuery
                  ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 scale-110'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Recent"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
              }}
              className={`p-1.5 rounded-lg transition-transform cursor-pointer ${
                selectedCategory === cat.id && !searchQuery ? 'scale-125' : 'opacity-70 hover:opacity-100'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'gif' && (
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold no-scrollbar">
          {[
            { id: 'all', label: 'Trending' },
            { id: 'anime', label: '🎌 Anime' },
            { id: 'gaming', label: '🎮 Gaming' },
            { id: 'meme', label: '🐸 Memes' },
            { id: 'laugh', label: '😂 Laugh' },
            { id: 'love', label: '❤️ Love' },
            { id: 'party', label: '🎉 Party' },
            { id: 'dance', label: '💃 Dance' },
            { id: 'clap', label: '👏 Clap' },
            { id: 'yes', label: '👍 Yes' },
            { id: 'wow', label: '😲 Wow' },
            { id: 'fire', label: '🔥 Fire' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                setSelectedGifTag(tag.id);
                setSearchQuery('');
              }}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                selectedGifTag === tag.id && !searchQuery
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'stickers' && (
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Custom & Anime Stickers</span>
          </span>

          {/* Import Sticker Button */}
          <button
            onClick={() => stickerFileInputRef.current?.click()}
            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sticker</span>
          </button>
          <input
            ref={stickerFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImportSticker}
            className="hidden"
          />
        </div>
      )}

      {stickerUploadError && (
        <div className="px-3 py-1 bg-rose-500/15 border-b border-rose-500/30 text-rose-500 text-[11px] font-semibold flex items-center justify-between">
          <span>{stickerUploadError}</span>
          <button onClick={() => setStickerUploadError(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* TAB 1: EMOJIS */}
        {activeTab === 'emoji' && (
          <div>
            {filteredEmojiList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No matching emojis found.</div>
            ) : (
              <div className="grid grid-cols-8 gap-1 text-2xl text-center">
                {filteredEmojiList.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform hover:scale-125 cursor-pointer flex items-center justify-center aspect-square"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GIFS */}
        {activeTab === 'gif' && (
          <div>
            {filteredGifs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No animated GIFs found.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredGifs.map((gif) => (
                  <div
                    key={gif.id}
                    onClick={() => {
                      onSelectGif(gif.url);
                      onClose();
                    }}
                    className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-800 border border-slate-700/60 cursor-pointer shadow-xs hover:border-brand-500 transition-all hover:scale-[1.02]"
                  >
                    <img
                      src={gif.url}
                      alt={gif.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[10px] font-semibold text-white truncate">{gif.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STICKERS (Preset + Custom from Media) */}
        {activeTab === 'stickers' && (
          <div className="space-y-4">
            {/* Custom Created Stickers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  My Media Stickers ({customStickers.length})
                </span>
                <span className="text-[10px] text-slate-400">Saved on Device</span>
              </div>

              {customStickers.length === 0 ? (
                <div
                  onClick={() => stickerFileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-brand-500 transition-colors bg-slate-50 dark:bg-slate-800/40"
                >
                  <ImageIcon className="w-6 h-6 text-brand-500 mx-auto mb-1 opacity-80" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Import Custom Sticker from Media
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tap to upload photo or PNG from your gallery
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {customStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      onClick={() => {
                        onSelectGif(sticker.url);
                        onClose();
                      }}
                      className="relative group rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 cursor-pointer hover:border-brand-500 transition-all flex flex-col items-center justify-center aspect-square"
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.name}
                        className="max-h-16 max-w-16 object-contain"
                      />
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate w-full text-center mt-1">
                        {sticker.name}
                      </span>
                      {/* Delete Custom Sticker Button */}
                      <button
                        onClick={(e) => handleDeleteCustomSticker(e, sticker.id)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        title="Delete Sticker"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Built-in Preset Stickers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Featured Anime & Gaming
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_STICKERS.map((sticker) => (
                  <div
                    key={sticker.id}
                    onClick={() => {
                      onSelectGif(sticker.url);
                      onClose();
                    }}
                    className="group rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2 cursor-pointer hover:border-brand-500 transition-all flex flex-col items-center justify-center aspect-square hover:scale-105"
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.name}
                      loading="lazy"
                      className="max-h-16 max-w-16 object-contain"
                    />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
                      {sticker.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Switcher: EMOJI vs GIF vs STICKERS (3-Way Segmented Control) */}
      <div className="h-12 px-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around shrink-0">
        <button
          onClick={() => {
            setActiveTab('emoji');
            setSearchQuery('');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'emoji'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>EMOJI</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('gif');
            setSearchQuery('');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gif'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>GIF</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('stickers');
            setSearchQuery('');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stickers'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sticker className="w-3.5 h-3.5" />
          <span>STICKERS</span>
        </button>
      </div>
    </div>
  );
}
