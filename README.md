# renkei ⚡

> **stay in sync • connect & coordinate**  
> An independent full-stack web and mobile application with Discord-style Voice Lounge, illuminated neon branding, 30 official anime avatars, and P2P screen sharing.

---

## 🎨 Branding & Identity

- **App Name**: renkei (Configurable in `src/config/branding.ts`)
- **Tagline**: stay in sync • connect & coordinate
- **Logo**: Illuminated geometric neon "R" with dual-track loop and neon glow
- **Signature Themes**:
  1. `01. Original Cyber`: Cyber Cyan (`#00f0ff`) & Electric Purple (`#c026d3`) on Deep Navy (`#090d16`)
  2. `02. Sunset Amber`: Warm Amber (`#f59e0b`) & Sunset Orange (`#ef4444`)
  3. `03. Electric Mint`: Lime Green (`#84cc16`) & Mint Teal (`#14b8a6`)
  4. `04. Ice Sapphire`: Ice Blue (`#38bdf8`) & Royal Sapphire (`#2563eb`)
- **Avatars**: 30 Official custom Anime, Cyber, and Streetwear avatars directly selectable in Profile Settings.

---

## 🚀 Key Features

1. **Email Authentication**:
   - Signup with display name, username normalization, password strength meter, confirmation validation, and duplicate email prevention.
   - Login with email and password, show/hide visibility toggle, and secure session management.
   - Forgot Password and Reset Password recovery flows with token and expired-link handling.
   - Account settings: Profile avatar upload, status text, password change, and permanent account deletion.

2. **1-on-1 & Group Messaging**:
   - Real-time messaging powered by Supabase Realtime and PostgreSQL.
   - Read receipts (Sent ✓, Delivered ✓✓, Read ✓✓ Cyan checks).
   - Real-time typing indicators ("Aoi is typing...").
   - Message editing, deletion, reply quotes, and emoji reactions.
   - Media and document attachment sharing with preview.

3. **Voice & Video Calling**:
   - WebRTC peer-to-peer calling with real-time signaling over Supabase channels.
   - Incoming call notification modal, accept/reject, microphone mute, camera toggle, and duration counter.

4. **Database & Security**:
   - Strict PostgreSQL Row Level Security (RLS) on all tables (`profiles`, `conversations`, `conversation_members`, `messages`, `attachments`, `call_sessions`, `user_blocks`, `reports`).
   - Secure server-checked permissions preventing unauthorized group manipulation.

---

## 🛠️ Quick Start Guide

### 1. Install Dependencies
```powershell
npm install
```

### 2. Configure Environment
```powershell
copy .env.example .env.local
```
Edit `.env.local` to add your independent Supabase project URL and anonymous key. If left blank, GENZOKU will run in interactive Demo / Evaluation Mode with preloaded profiles (Kenji, Aoi, Ren).

### 3. Run Development Server
```powershell
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Test Suite
```powershell
npm run test
```

### 5. Build for Production
```powershell
npm run build
```

---

## 📁 Repository Structure

```text
C:\Games\GENZOKU/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Responsive dashboard (Desktop & Mobile)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/               # GenzokuLogo, Avatar, etc.
│   │   ├── chat/             # Sidebar, ChatPane, MessageBubble, Modals
│   │   ├── call/             # CallModal (WebRTC overlay)
│   │   └── settings/         # SettingsModal
│   ├── config/
│   │   └── branding.ts       # Central branding configuration
│   ├── context/
│   │   ├── auth-context.tsx  # Authentication & Session
│   │   ├── chat-context.tsx  # Real-time messaging & state
│   │   └── call-context.tsx  # WebRTC signaling
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── mock-data.ts      # Offline evaluation data
│   │   ├── validation.ts     # Zod validation schemas
│   │   └── utils.ts
│   └── types/
│       └── index.ts          # Core TypeScript contracts
├── supabase/
│   └── migrations/
│       └── 20261024000000_genzoku_initial_schema.sql
├── test/
│   └── validation.test.mjs   # Automated unit tests
├── .env.example
├── package.json
└── README.md
```
