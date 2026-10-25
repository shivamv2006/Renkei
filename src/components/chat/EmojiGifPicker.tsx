'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Smile, Film, Sparkles, Clock } from 'lucide-react';

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

// Curated High-Definition Animated GIFs for Direct In-App Sharing
const CURATED_GIFS: { id: string; title: string; category: string; url: string }[] = [
  // Laugh & Funny
  { id: 'g1', title: 'Laughing Dog', category: 'laugh', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
  { id: 'g2', title: 'Minions Laugh', category: 'laugh', url: 'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif' },
  { id: 'g3', title: 'Kermit Laugh', category: 'laugh', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { id: 'g4', title: 'Cat LOL', category: 'laugh', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },

  // Love & Hugs
  { id: 'g5', title: 'Heart Flying', category: 'love', url: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif' },
  { id: 'g6', title: 'Anime Hug', category: 'love', url: 'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif' },
  { id: 'g7', title: 'Love Heart Beat', category: 'love', url: 'https://media.giphy.com/media/R6gVNROjZa40w/giphy.gif' },
  { id: 'g8', title: 'Puppy Love', category: 'love', url: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif' },

  // Celebration & Party
  { id: 'g9', title: 'Confetti Party', category: 'party', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 'g10', title: 'Happy Dance', category: 'party', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'g11', title: 'Cheers Toast', category: 'party', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: 'g12', title: 'Fireworks Celebration', category: 'party', url: 'https://media.giphy.com/media/peAFQfg7Ol6IE/giphy.gif' },

  // Applause & Clapping
  { id: 'g13', title: 'Leonardo Clapping', category: 'clap', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: 'g14', title: 'Otter Clapping', category: 'clap', url: 'https://media.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif' },
  { id: 'g15', title: 'Slow Clap', category: 'clap', url: 'https://media.giphy.com/media/Swx36wwSsU49HAnIhC/giphy.gif' },

  // Dance & Vibe
  { id: 'g16', title: 'Dancing Baby Groot', category: 'dance', url: 'https://media.giphy.com/media/F9hQLAVhWnLVC/giphy.gif' },
  { id: 'g17', title: 'Groovy Duck Dance', category: 'dance', url: 'https://media.giphy.com/media/bkcbX8SqTCXHG/giphy.gif' },
  { id: 'g18', title: 'Disco Fever', category: 'dance', url: 'https://media.giphy.com/media/3ohhwfAa9rbXaZeJhK/giphy.gif' },

  // Thumbs Up & Yes
  { id: 'g19', title: 'Big Thumbs Up', category: 'yes', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'g20', title: 'Nodding Yes', category: 'yes', url: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif' },
  { id: 'g21', title: 'Cool Thumbs Up', category: 'yes', url: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif' },

  // Shock & OMG
  { id: 'g22', title: 'Cat Shocked', category: 'wow', url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif' },
  { id: 'g23', title: 'Mind Blown', category: 'wow', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  { id: 'g24', title: 'Dramatic Gasp', category: 'wow', url: 'https://media.giphy.com/media/75ZaxapSmEGB2/giphy.gif' },

  // Fire & Lit
  { id: 'g25', title: 'Elmo Fire', category: 'fire', url: 'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif' },
  { id: 'g26', title: 'Super Lit Fire', category: 'fire', url: 'https://media.giphy.com/media/26xBvOp1AfVx2FlPe/giphy.gif' },
];

export function EmojiGifPicker({ isOpen, onClose, onSelectEmoji, onSelectGif }: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('smileys');
  const [selectedGifTag, setSelectedGifTag] = useState<string>('all');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('genzoku_recent_emojis');
        if (saved) setRecentEmojis(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

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
    // Save to recents
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

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 left-2 sm:left-4 z-40 w-[330px] sm:w-[380px] h-[410px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 select-none"
    >
      {/* Top Search & Close Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'emoji' ? 'Search emoji...' : 'Search animated GIFs...'}
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

      {/* Categories Toolbar */}
      {activeTab === 'emoji' ? (
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
      ) : (
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
          {[
            { id: 'all', label: 'Trending' },
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'emoji' ? (
          <div>
            {filteredEmojiList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No matching emojis found.</div>
            ) : (
              <div className="grid grid-cols-8 gap-1.5 text-2xl text-center">
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
        ) : (
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
      </div>

      {/* Bottom Switcher: EMOJI vs GIF (WhatsApp Style) */}
      <div className="h-12 px-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around shrink-0">
        <button
          onClick={() => {
            setActiveTab('emoji');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'emoji'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>EMOJI</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('gif');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gif'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>GIF</span>
        </button>
      </div>
    </div>
  );
}
