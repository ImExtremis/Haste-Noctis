# NOCTIS — Complete Product Specification
### A Haste Industries Product | Built for Google Jules

> **Document Purpose:** This is the single source of truth for the Noctis platform. Every feature, workflow, branding decision, technical direction, and philosophy is documented here. This document is sufficient to begin and guide full development.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Company & Brand Context](#2-company--brand-context)
3. [Visual Identity & Branding](#3-visual-identity--branding)
4. [Core Philosophy & Principles](#4-core-philosophy--principles)
5. [Architecture Overview](#5-architecture-overview)
6. [Feature Specification — Complete](#6-feature-specification--complete)
   - 6.1 Authentication & Accounts
   - 6.2 Servers
   - 6.3 Channels
   - 6.4 Messaging
   - 6.5 Direct Messages & Group Chats
   - 6.6 Voice & Video
   - 6.7 Screen Sharing
   - 6.8 Roles & Permissions
   - 6.9 Moderation
   - 6.10 Bots & Integrations
   - 6.11 Search
   - 6.12 Notifications
   - 6.13 User Profiles & Social
   - 6.14 Friends System
   - 6.15 Scheduled Events
   - 6.16 Stellar (Premium Subscription)
   - 6.17 Support System
   - 6.18 Privacy & Security
   - 6.19 Settings
   - 6.20 Developer & API
7. [Workflows — How Things Work](#7-workflows--how-things-work)
8. [Support System — Detailed](#8-support-system--detailed)
9. [Privacy & Data Policy](#9-privacy--data-policy)
10. [Monetization](#10-monetization)
11. [Platform Support & Client](#11-platform-support--client)
12. [Infrastructure](#12-infrastructure)
13. [Phased Roadmap](#13-phased-roadmap)
14. [What Noctis Does Better Than Discord](#14-what-noctis-does-better-than-discord)
15. [Out of Scope (For Now)](#15-out-of-scope-for-now)

---

## 1. Product Overview

**Noctis** is a modern communication platform for friends, communities, and developers. It is a direct competitor to Discord, built to fix everything Discord gets wrong — starting with privacy, performance, and support.

| Property | Value |
|---|---|
| Product Name | Noctis |
| Parent Company | Haste Industries |
| Domain (proposed) | noctis.app / noctis.gg |
| Category | Instant messaging, VoIP, community platform |
| Model | Freemium (free tier + Stellar premium subscription) |
| Source | Closed source, proprietary |
| Base Reference | Noctis (open source, AGPLv3) used as development reference/starting point |
| Launch Region | India first, global expansion later |
| Primary Infra | Haste Cloud |

### What is Noctis?

Noctis is a platform where people can:
- Chat with friends via text, voice, and video
- Build and manage communities (servers) of any size
- Send private DMs and group messages
- Share files, media, and screens
- Integrate bots and tools into their communities
- Do all of this with genuine privacy, a lightweight client, and real human support

### Why Noctis Exists

Discord has become the dominant platform for online communities but has accumulated years of failures:
- A support system that is essentially non-functional
- An Electron-based client that is heavy, slow, and memory-hungry
- Rampant false-positive bans with no real appeal process
- Aggressive monetization that paywalls basic features
- No end-to-end encryption — Discord reads your DMs
- Data collection including keystrokes, open apps, and game activity
- Identity document collection with poor data deletion guarantees
- A history of data breaches

Noctis is built to be the answer to every single one of those problems.

---

## 2. Company & Brand Context

### Haste Industries

Haste Industries is a multi-subsidiary holding company founded in India. The subsidiaries are:

| Subsidiary | Domain |
|---|---|
| Haste Cloud | Hosting & infrastructure (primary revenue engine) |
| Haste Tech | Consumer electronics (home of Cosmos NAS device) |
| Haste Electronics | Hardware & electronics products |
| Haste AI | AI ventures |
| Haste Studios | Creative — Minecraft servers, media |
| Avior | Luxury clothing |

**Noctis** is a standalone product under **Haste Industries** directly, funded initially by Haste Cloud revenue. It is not open source and is built for profit.

### Founder Context

Noctis is founded by a young Indian entrepreneur with deep roots in the tech and gaming community. This background directly shapes Noctis's personality — it is not a corporate product. It speaks to its users, it understands gaming culture, it understands the jugaad mindset of doing more with less, and it is built with genuine frustration at the status quo.

---

## 3. Visual Identity & Branding

### Theme Direction: Deep Space

Noctis means *"of the night"* in Latin. The visual identity leans fully into this — a deep space aesthetic that feels premium, futuristic, and immersive without being aggressive.

### Color Palette

| Role | Color Name | Hex | Usage |
|---|---|---|---|
| Background (deepest) | Void Black | `#07080F` | App background, sidebars |
| Background (surface) | Deep Navy | `#0D0F1E` | Cards, panels, message areas |
| Background (elevated) | Midnight | `#12152A` | Modals, dropdowns, hover states |
| Background (subtle) | Nebula | `#1A1E38` | Input fields, secondary panels |
| Primary Accent | Electric Violet | `#7C3AED` | Buttons, links, highlights, active states |
| Secondary Accent | Cyan Pulse | `#06B6D4` | Online indicators, info states, secondary CTAs |
| Text (primary) | Star White | `#F0F2FF` | Main body text |
| Text (secondary) | Dust | `#8B92B8` | Timestamps, placeholders, secondary labels |
| Text (muted) | Crater | `#4A5080` | Disabled states, subtle labels |
| Danger / Error | Nova Red | `#EF4444` | Errors, ban indicators, delete actions |
| Warning | Amber Flare | `#F59E0B` | Warnings, caution states |
| Success | Pulsar Green | `#10B981` | Online, success states, confirmations |
| Stellar (premium) | Gold Comet | `#D4A017` | Stellar badge, premium features, subscription UI |

### Gradients

- **Hero Gradient:** `linear-gradient(135deg, #07080F 0%, #0D0F1E 50%, #1A1238 100%)`
- **Accent Gradient:** `linear-gradient(135deg, #7C3AED, #06B6D4)`
- **Stellar Gradient:** `linear-gradient(135deg, #D4A017, #F59E0B, #FDE68A)`
- **Glow Effect (violet):** `box-shadow: 0 0 24px rgba(124, 58, 237, 0.4)`
- **Glow Effect (cyan):** `box-shadow: 0 0 24px rgba(6, 182, 212, 0.3)`

### Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / Logo | Orbitron | 700, 900 | Used for the wordmark and major headings only |
| UI Headings | Sora | 600, 700 | Channel names, section headers, modal titles |
| Body / Messages | Sora | 400, 500 | All message content, descriptions, labels |
| Monospace / Code | JetBrains Mono | 400 | Code blocks, developer content |
| Stellar / Premium UI | Cinzel | 600 | Only used in Stellar subscription pages and badges |

### Logo

- **Wordmark:** "NOCTIS" in Orbitron Bold, letter-spaced
- **Icon Mark:** A crescent moon integrated with a subtle constellation/network node pattern — representing both the night theme and the network/community aspect
- **Colors:** Wordmark in Star White `#F0F2FF`, icon mark in Electric Violet to Cyan gradient
- **Dark backgrounds only** — Noctis does not have a light mode in its brand identity (though the app may offer one)

### Iconography

- Style: Rounded stroke icons, 1.5px stroke weight, consistent corner radius
- Library base: Lucide Icons (extended with custom Noctis-specific icons)
- Custom icons needed: Noctis logo mark, Stellar badge, server boost equivalent, constellation decoratives

### Motion & Animation

- Transitions: `200ms ease-out` for UI state changes
- Modals: slide-up + fade-in from `translateY(16px)` to `translateY(0)`
- Notifications: slide-in from right, auto-dismiss with progress bar
- Hover states: subtle `box-shadow` glow on interactive elements
- Loading states: pulsing skeleton screens in `#1A1E38`
- Particle/star effect: subtle, CSS-only, on auth screens and empty states only (not in main UI)
- Page transitions: crossfade, `150ms`
- No jarring animations. Smooth, purposeful, never distracting.

### Voice & Tone

- **Direct.** No corporate speak. No "We're excited to announce." Just say the thing.
- **Human.** Errors should feel like a friend telling you something went wrong, not a system.
- **Confident but not arrogant.** Noctis knows it's better. It doesn't need to shout it.
- **Inclusive.** Gaming roots but not gatekeeping. Everyone belongs.

#### Example Microcopy

| Situation | Discord Says | Noctis Says |
|---|---|---|
| Login error | "Invalid credentials." | "That doesn't look right. Check your password and try again." |
| Account banned | "Your account has been disabled." | "Your account has been suspended. Here's why, and here's how to appeal." |
| Empty DM list | "No messages yet." | "Nothing here yet. Say hi to someone." |
| File too large | "File exceeds maximum size." | "That file's too big. Max size is 100MB — try compressing it." |
| Joining a server | — | "You're in. Welcome to [Server Name]." |

---

## 4. Core Philosophy & Principles

These are not marketing lines. These are the engineering and product constraints that every decision is measured against.

### 1. Privacy is not a feature. It is the foundation.
Noctis does not sell user data. Noctis does not read your messages beyond what is technically required for delivery. DMs are end-to-end encrypted. Telemetry is opt-in. Every data collection decision must be justifiable to the user in plain language.

### 2. Performance is respect.
A person with a low-end phone or an old laptop deserves the same experience as someone on a flagship device. Noctis must be lightweight, fast, and efficient. If a feature makes the app slower, it must justify that cost.

### 3. Support is a promise.
Every user who contacts Noctis support will receive a response from a human being. Not a bot. Not a template. A person who has read their issue. This is non-negotiable.

### 4. Bans must be explainable.
No account is suspended without a clear reason delivered to the user. Every suspension is appealable through a transparent process with a defined timeline. False positives are treated as a system failure, not user error.

### 5. Free users are not second-class citizens.
The free tier of Noctis must be genuinely good. Stellar (premium) unlocks extras and cosmetics, not basic functionality. Users should never feel punished for not paying.

### 6. Trust is earned through transparency.
Noctis publishes what data it collects. Noctis publishes its moderation statistics. Noctis publishes its uptime and incident reports. No hidden practices.

---

## 5. Architecture Overview

### Tech Stack (Reference / Starting Point)

Noctis uses **Noctis** (open source, AGPLv3, [github.com/noctisapp/noctis](https://github.com/noctisapp/noctis)) as a development reference and starting point for architecture understanding. Noctis itself is **closed source and proprietary**.

#### Backend
- **Language:** Node.js (TypeScript) or Go — evaluate for performance at scale
- **Framework:** Fastify or Express (Node) / Fiber (Go)
- **Real-time:** WebSockets (Socket.io or native WS)
- **Voice/Video:** WebRTC (mediasoup SFU for scalable voice/video routing)
- **Database:** PostgreSQL (primary), Redis (caching, presence, sessions)
- **File Storage:** S3-compatible object storage (Haste Cloud or Cloudflare R2)
- **Search:** Meilisearch or Typesense (fast, self-hostable)
- **Queue:** BullMQ (background jobs — notifications, email, media processing)
- **Email:** Resend or Postmark

#### Frontend (Web)
- **Framework:** React 18+ with TypeScript
- **State Management:** Zustand or Jotai (lightweight, not Redux bloat)
- **Styling:** Tailwind CSS + custom CSS variables for the design system
- **Real-time client:** Native WebSocket with reconnection logic
- **Voice/Video client:** mediasoup-client / simple-peer
- **Build:** Vite

#### Desktop Client (Future)
- **Framework:** Tauri (Rust-based) — dramatically lighter than Electron
- Tauri wraps the web frontend, eliminating the full Chromium bundle
- Target: <100MB install, <200MB RAM idle (vs Discord's ~500MB+)

#### Mobile (Future)
- **Framework:** Flutter (single codebase for iOS + Android)
- Alternatively: React Native if web code reuse is prioritized

#### Infrastructure
- **Primary:** Haste Cloud (India)
- **CDN:** Cloudflare
- **DDoS Protection:** Cloudflare / Path.net
- **Voice Servers:** Regional mediasoup instances
- **Monitoring:** Prometheus + Grafana
- **Reverse Proxy:** Nginx / Caddy

---

## 6. Feature Specification — Complete

---

### 6.1 Authentication & Accounts

#### Registration
- Email + password (minimum 8 chars, must include number + special character)
- Username selection (unique globally, alphanumeric + underscores, 2–32 chars)
- Display name (separate from username, can be anything, 1–64 chars)
- Email verification required before access
- Optional: phone number (for account recovery only — not required, not stored long-term for verification)
- CAPTCHA on registration to prevent bot signups

#### Login
- Email + password
- Remember device (30-day session token)
- 2FA support: TOTP (Google Authenticator, Authy etc.) and SMS
- Login alert email when new device/location detected
- Active session list in settings — see all logged-in devices, revoke any

#### Password & Recovery
- Forgot password via email link (expires in 15 minutes)
- 2FA backup codes (8 codes, one-time use each, regeneratable)
- Account recovery via verified email only — no phone required for recovery

#### Account Deletion
- Initiate deletion from settings
- 7-day grace period (account deactivated but not deleted, can cancel)
- After 7 days: all messages replaced with `[Deleted User]`, account fully purged
- Data deletion confirmation email sent when complete
- Faster than Discord's 14-day window

#### Guest / Temp Access
- Users can preview public servers without an account (read-only, no posting)
- Invite link can show server preview before requiring signup

---

### 6.2 Servers

#### Creating a Server
- Name (2–100 chars)
- Icon (upload image, any common format, auto-cropped to circle)
- Type selection at creation: Gaming / Study / Creative / Tech / Friends / Other (affects default channel templates)
- Region selection (affects voice server routing)
- Public or Private toggle

#### Server Settings
- Name, icon, banner (animated banner for boosted servers)
- Description (shown in discovery)
- Vanity invite URL (e.g. `noctis.gg/myserver`) — unlocked at boost level 2
- Verification level: None → Email Verified → Phone Verified → Server Member (10 min) → Highest (10 min + phone)
- Default notification settings for new members
- System messages channel (welcome, boost announcements)
- Server language setting
- Community mode toggle (enables discovery, rules channel, member screening)

#### Invites
- Generate invite links: permanent or expiring (1hr / 12hr / 1d / 7d / 30d / never)
- Max uses option (1, 5, 10, 25, 50, 100, unlimited)
- Invite list — see all active invites, who created them, usage count
- Revoke individual invites
- Server invite widget (embeddable on websites)

#### Server Discovery
- Public servers can opt into Noctis Discovery
- Searchable by name, category, tags, language
- Shown: member count, online count, description, icon, banner
- Tags: up to 5 custom tags

#### Member Management
- Member list with role-based display
- Search members by username
- Click member → see profile, roles, joined date, mutual servers
- Kick, ban, timeout from member list
- Assign/remove roles from member list
- Transfer server ownership

#### Server Boost System
- Users can boost servers (with Stellar subscription — included boosts, or purchasable separately)
- Boost levels:

| Level | Boosts Required | Perks |
|---|---|---|
| Level 1 | 2 | Animated icon, 50 extra emoji slots, 128kbps audio |
| Level 2 | 7 | Server banner, vanity URL, 256kbps audio, 100 extra emoji slots |
| Level 3 | 14 | Animated banner, 384kbps audio, 200 extra emoji slots, 100MB upload |

#### Server Templates
- Save current server structure (channels, categories, roles — not messages) as a template
- Use templates when creating new servers
- Built-in templates: Gaming Community, Study Group, Dev Team, Friend Group, Content Creator

---

### 6.3 Channels

#### Channel Types
| Type | Description |
|---|---|
| Text Channel | Standard text chat |
| Voice Channel | Persistent voice room, join/leave freely |
| Announcement Channel | Publish messages to following servers |
| Forum Channel | Threaded posts with tags, like a bulletin board |
| Stage Channel | Speaker/audience model for events, AMAs, podcasts |
| Media Channel | Image/video-focused, grid display layout |

#### Channel Settings
- Name (1–100 chars)
- Topic / description (shown at top of channel, 1024 chars)
- Category (grouping)
- NSFW toggle (requires age gate confirmation to view)
- Slowmode (0s / 5s / 10s / 15s / 30s / 1m / 2m / 5m / 10m / 15m / 30m / 1hr / 6hr / 24hr)
- Permission overrides per role and per user
- Default thread archive duration
- Voice channel user limit (0 = unlimited)
- Voice channel bitrate (8kbps – 384kbps, upper limit based on boost level)
- Voice channel region override

#### Channel Organization
- Drag-and-drop reorder channels
- Drag-and-drop into categories
- Collapse/expand categories
- Private channels (only visible to specific roles)

#### Threads
- Start a thread from any message or from the thread button
- Thread name (1–100 chars)
- Public threads: visible to anyone with channel access
- Private threads: invite-only, not visible in thread list to others
- Auto-archive after: 1hr / 24hr / 3 days / 7 days of inactivity
- Manual archive/unarchive
- Thread pinning (pin important threads in channel)
- Thread list panel (see all active threads in a channel)

#### Pinned Messages
- Pin any message in a channel (requires Manage Messages permission)
- Up to 50 pinned messages per channel
- Pinned messages panel accessible from channel header

#### Channel Following
- Follow an Announcement Channel from another server
- Published announcements appear in the following channel automatically

---

### 6.4 Messaging

#### Composing Messages
- Rich text input with Markdown support
- Markdown shortcuts (type `**` for bold, `_` for italic, etc.)
- Toolbar: Bold, Italic, Underline, Strikethrough, Code, Code Block, Spoiler, Link, List
- Slash commands (type `/` to trigger bot commands or app commands)
- Mention users with `@username` (autocomplete dropdown)
- Mention roles with `@rolename`
- Mention channels with `#channelname`
- `@everyone` and `@here` (permission-gated)
- Emoji picker (standard Unicode emoji + server custom emoji + Stellar emoji)
- GIF picker (integrated with Tenor or Giphy)
- Sticker picker (standard + server + Stellar stickers)
- File attachment button (drag-and-drop also supported)
- Voice message button (hold to record, release to send)

#### Markdown Formatting Support
| Syntax | Result |
|---|---|
| `**bold**` | **bold** |
| `_italic_` | *italic* |
| `__underline__` | underline |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `` `inline code` `` | `inline code` |
| ` ```code block``` ` | syntax-highlighted code block |
| `\|\|spoiler\|\|` | hidden until clicked |
| `> quote` | block quote |
| `# Heading` | large heading |
| `## Heading 2` | medium heading |
| `### Heading 3` | small heading |
| `- item` | unordered list |
| `1. item` | ordered list |

#### Sending & Receiving
- Messages delivered in real-time via WebSocket
- Offline message queue — messages queued if connection drops, sent on reconnect
- Read receipts in DMs (can be disabled in privacy settings)
- Typing indicator (shows "[User] is typing..." — disappears after 5s inactivity or on send)
- Message character limit: 2,000 (free) / 4,000 (Stellar)

#### Message Actions (hover/long-press on a message)
- React (emoji reaction)
- Reply (inline reply with quote)
- Edit (only own messages, shows edit history indicator)
- Delete (own messages, or with Manage Messages permission)
- Pin (with permission)
- Forward (send to another channel or DM)
- Mark as Unread
- Copy Message Link
- Copy Text
- Report Message
- Create Thread (from this message)

#### Reactions
- Click/tap the add reaction button or existing reaction to toggle
- Standard emoji + server custom emoji
- Animated emoji in reactions (Stellar only for animated server emoji)
- Reaction list: hover/tap reaction to see who reacted
- Up to 20 unique reactions per message

#### Embeds
- URLs in messages automatically generate rich embeds (title, description, image, favicon)
- Video links (YouTube, etc.) show inline playable preview
- Twitter/X links show tweet preview
- Image links show inline image
- Music links (Spotify) show track card
- Embeds can be dismissed per-message by the sender

#### File Attachments
- Free: up to 25MB per file
- Stellar: up to 100MB per file
- Boosted server Level 3: up to 100MB for all members in that server
- Supported preview types: JPG, PNG, GIF, WEBP, MP4, MOV, MP3, PDF
- Virus scanning on all uploads before delivery
- Files hosted on Haste Cloud / R2 storage
- File expiry: files attached to messages are stored indefinitely (not deleted like Discord)

#### Voice Messages
- Hold mic button to record (max 5 minutes)
- Preview before sending
- Waveform display in chat
- Playback speed controls (1x, 1.5x, 2x)

#### Polls
- Create a poll from the `+` menu or `/poll` command
- Question (up to 300 chars)
- Up to 10 options
- Duration: 1hr / 4hr / 8hr / 24hr / 3d / 7d
- Single choice or multi-choice mode
- Results visible during poll (optional — can hide until end)
- Poll results show vote count + percentage bar

#### Message History & Navigation
- Infinite scroll upward to load history
- Jump to a specific date
- Jump to oldest unread message
- Jump to pinned messages
- Jump to a message via link
- "Jump to Present" button when viewing old messages

---

### 6.5 Direct Messages & Group Chats

#### DMs
- Start a DM from a user's profile, member list, or friends list
- Full messaging feature parity with channels (markdown, files, reactions, voice messages, etc.)
- End-to-end encrypted — Noctis cannot read DM content
- Read receipts (can be disabled in privacy settings)
- DM requests: users not on your friends list send a request first (you accept or decline)
- Block user: stops all messages, removes from DM list
- DM search: search message history within a DM

#### Group DMs
- Create from DM list or friends list — select multiple users
- Up to 20 participants (vs Discord's 10 — improvement)
- Group name and icon (customizable by creator or any member)
- Add/remove members (any member can add, only owner can remove)
- Transfer ownership
- Leave group
- Group DMs are **not** E2E encrypted (server-side encrypted at rest only) — this is displayed clearly to users

#### DM Privacy
- Privacy setting: Who can DM you — Everyone / Friends only / Nobody
- Friend requests can be sent even if DMs are closed
- Server members can DM you only if you share a server (configurable)

---

### 6.6 Voice & Video

#### Voice Channels
- Persistent rooms — no scheduling required, join anytime someone is there
- Join by clicking the channel name in the sidebar
- User list shown in voice channel in sidebar (with speaking indicators)
- Full voice channel panel shows on join (bottom bar minimized view available)
- Camera, mic, and deafen controls always visible
- Leave voice by clicking the disconnect button

#### Voice Quality
- Codec: Opus
- Bitrate: 64kbps (default) → up to 384kbps (boost level 3)
- Noise suppression: RNNoise (open source, works on all platforms including Linux)
- Echo cancellation: WebRTC built-in
- Auto gain control: WebRTC built-in
- Push-to-talk mode (configurable keybind)
- Voice activity detection mode
- Input/output device selection in settings

#### Video Calls
- Enable camera in any voice channel or DM call
- Up to 25 simultaneous video feeds in a channel (grid layout)
- Free: 720p video
- Stellar: 1080p video
- Camera effects: background blur (all users), virtual backgrounds (Stellar)
- Mute/unmute individual video feeds

#### Stage Channels
- Two roles: Speaker and Audience
- Speakers can talk, audience listens only
- Request to speak button for audience members
- Stage moderator can invite audience member to speak, move back to audience, or remove
- Stage topic displayed prominently
- Stage discovery (public stages visible in server list)

#### Soundboard
- Server soundboard: upload short audio clips (.mp3, .ogg, max 5s, max 512KB)
- Standard sounds included for all users
- Custom sounds: free users get 5 slots per server, Stellar users get unlimited
- Play sounds in voice channel (audible to all in VC)
- Sound volume control

#### Multi-Device
- Join the same voice channel from multiple devices simultaneously
- Each device has independent audio controls
- Camera can only be active on one device at a time

---

### 6.7 Screen Sharing

#### How Screen Sharing Works

Screen sharing in Noctis uses WebRTC `getDisplayMedia()` API to capture the user's screen and streams it to other participants via the mediasoup SFU (Selective Forwarding Unit).

**Workflow:**

1. User clicks the "Share Screen" button in the voice channel panel
2. Browser/client prompts the user to select what to share:
   - Entire screen
   - Specific application window
   - Specific browser tab
3. User selects source and clicks "Share"
4. A screen share track is created and sent to the mediasoup SFU
5. SFU forwards the track to all other participants in the channel
6. Other participants see the screen share appear as a video feed in the channel
7. Multiple users can screen share simultaneously (shown in a grid)
8. The sharing user sees a red border/indicator around their screen and a "Stop Sharing" button in the Noctis panel
9. User clicks "Stop Sharing" or closes the Noctis panel to end the share

**Quality:**
- Free: 720p @ 30fps
- Stellar: 1080p @ 60fps
- Adaptive bitrate based on network conditions

**Go Live (Streaming to VC):**
- Users can stream their screen to a voice channel with an audience view
- Audience joins the stream separately (doesn't need to be in VC themselves)
- Up to 50 viewers (free) / 250 viewers (Stellar)
- Stream quality same as screen share tiers

**Technical Flow (Backend):**
```
User Client → WebRTC Offer → Noctis Media Server (mediasoup SFU)
                                      ↓
                          Other participants subscribe to the producer
                                      ↓
                          mediasoup forwards RTP packets to subscribers
```

---

### 6.8 Roles & Permissions

#### Roles
- Create roles with a name, color, and icon (custom image)
- Role hierarchy: higher position = more authority
- Hoisted roles: shown as separate sections in member list
- Mentionable toggle: allow @rolename mentions
- Managed roles: assigned by bots/integrations, cannot be manually removed
- Default role (@everyone): applies to all members, configure base permissions here

#### Permission Nodes (Full List)

**General Server**
- View Channels
- Manage Channels
- Manage Roles
- Create Expressions (emoji/stickers)
- Manage Expressions
- View Audit Log
- View Server Insights
- Manage Server
- Manage Webhooks
- Manage Invites

**Membership**
- Create Invites
- Change Nickname
- Manage Nicknames
- Kick Members
- Ban Members
- Timeout Members

**Text Channels**
- Send Messages
- Send Messages in Threads
- Create Public Threads
- Create Private Threads
- Embed Links
- Attach Files
- Add Reactions
- Use External Emoji
- Use External Stickers
- Mention @everyone/@here
- Manage Messages (edit/delete others)
- Manage Threads
- Read Message History
- Send TTS Messages
- Use Application Commands (bots)

**Voice Channels**
- Connect
- Speak
- Video
- Use Soundboard
- Use External Sounds
- Use Voice Activity (vs push-to-talk requirement)
- Priority Speaker
- Mute Members
- Deafen Members
- Move Members
- Stage Moderator

**Advanced**
- Administrator (bypasses all permissions — use sparingly)

#### Permission Overrides
- Any permission can be overridden at the channel level for any role or specific user
- Three states per node: Allow (✓) / Neutral (inherited) / Deny (✗)
- User-specific overrides take precedence over role overrides

---

### 6.9 Moderation

#### Basic Actions
| Action | Description | Duration |
|---|---|---|
| Warn | Log a warning against a user | Permanent record |
| Timeout | User cannot send messages or join voice | 60s / 5m / 10m / 1hr / 1d / 1w |
| Kick | Remove user from server (can rejoin) | Immediate |
| Ban | Remove and block from server | Permanent or temp (1d/7d/30d) |
| Softban | Ban + unban immediately (deletes recent messages) | Immediate |

- All actions require a reason (optional but logged)
- User receives a DM notification of the action with reason (configurable)
- Timeout users cannot send messages, add reactions, join VCs, or use slash commands

#### AutoMod (Native)
Configurable automatic moderation rules:

| Rule Type | Description |
|---|---|
| Keyword filter | Block messages containing specified words/phrases/regex |
| Spam detection | Flag rapid message sending (configurable threshold) |
| Mention spam | Flag messages with excessive @mentions |
| Link filter | Block or flag messages containing URLs |
| Harmful link detection | Auto-block known phishing/malware URLs |
| Repeated character spam | Block "aaaaaaa"-style spam |
| CAPS spam | Block excessive capitals |
| New account filter | Flag/hold messages from accounts newer than X days |

AutoMod actions: Block message / Send alert to mod channel / Timeout user / Notify user

#### Audit Log
- Every moderation action is logged
- Logged: Action type, target user, actor (who did it), reason, timestamp, additional details
- Filterable by action type and user
- Retained for 90 days (Stellar server owners can retain indefinitely)

#### Moderation Case System (Native — Discord doesn't have this)
- Every moderation action creates a numbered Case
- Cases visible in a dedicated Mod Cases panel
- Each case: ID, type, target, moderator, reason, timestamp, notes
- Cases can be updated with additional notes
- Appeal status per case (if user appeals, linked here)
- Export cases as CSV for record-keeping

#### Warning System
- Issue warnings through the mod panel or `/warn @user reason`
- Warning thresholds: configure auto-actions at N warnings (e.g. timeout at 3, ban at 5)
- Warning history visible to moderators on user profile
- Users can see their own warning count (not reason, unless disclosed)

#### Raid Protection
- Auto-detect mass joins (configurable threshold: X joins in Y seconds)
- Auto-actions on raid detection: pause invites / enable verification / lock channels
- Alert sent to configured mod channel
- One-click raid lockdown from mod panel

#### Reporting
- Any user can report any message (right-click → Report)
- Report categories: Spam / Harassment / NSFW / Misinformation / Illegal content / Other
- Reports go to server mod queue AND Noctis Trust & Safety (for legal content)
- Reporters receive a DM when their report is reviewed

---

### 6.10 Bots & Integrations

#### Bot Accounts
- Developers can register bot applications via the Noctis Developer Portal
- Bot tokens for API authentication
- Bot permissions scoped via OAuth2
- Bot verification required for servers >100 users (reviewed within 72hrs — faster than Discord)
- Bots can be added to servers via OAuth2 authorization flow

#### Slash Commands
- Bots register slash commands via API
- Commands appear in the `/` autocomplete menu
- Subcommands supported
- Command options: string, integer, boolean, user, channel, role, mentionable, number, attachment

#### Message Components
- Buttons (primary, secondary, success, danger, link)
- Select menus (string, user, role, channel, mentionable)
- Text input modals
- Components can be attached to any bot message

#### Webhooks
- Incoming webhooks: POST messages to a channel without a bot
- Webhook URL per channel
- Webhook can have custom name and avatar
- Supports embed payloads
- Rate limit: 30 messages/minute per webhook

#### Rich Presence
- Bots and game clients can set rich presence status for users
- Shown on user profile: "Playing [Game Name]" with detail and state fields
- Elapsed time display
- Party size display
- Join/Spectate buttons

#### App Directory
- Browse and add verified bots
- Categories: Moderation / Music / Utility / Fun / Economy / Leveling / Tickets / Logging
- Ratings and reviews
- Install count shown

---

### 6.11 Search

#### Message Search
- Full-text search within a server or DM
- Filters:
  - `from:@user` — messages from specific user
  - `in:#channel` — messages in specific channel
  - `has:link` — messages with URLs
  - `has:file` — messages with attachments
  - `has:image` — messages with images
  - `has:video` — messages with video
  - `has:embed` — messages with embeds
  - `has:reaction` — messages with reactions
  - `before:YYYY-MM-DD` — messages before date
  - `after:YYYY-MM-DD` — messages after date
  - `during:month YYYY` — messages during month
  - `pinned:true` — pinned messages only
  - `mentions:@user` — messages mentioning user
- Results show message in context with "Jump to Message" button
- Search index updated in near real-time

#### Quick Switcher
- Keyboard shortcut: `Ctrl+K` / `Cmd+K`
- Fuzzy search: servers, channels, DMs, users
- Recent channels shown by default
- Type to filter instantly
- Arrow keys to navigate, Enter to select

---

### 6.12 Notifications

#### Notification Types
- Desktop notification (system notification, click to jump to message)
- Mobile push notification
- In-app notification badge (unread count on server/channel icons)
- Email notification (configurable — immediate / daily digest / never)
- @mention badge (separate indicator from general unread)

#### Notification Settings (Per Server)
- All Messages
- Only @mentions (default)
- Nothing
- Override @everyone/@here mentions (suppress them)
- Mobile push notification separate setting per server

#### Notification Settings (Per Channel)
- Override server-level setting
- Options: All Messages / Only @mentions / Nothing
- Mute channel (with duration: 15m / 1hr / 3hr / 8hr / 24hr / Until turned off)

#### Notification Settings (Per Thread)
- Same as channel-level overrides
- Auto-subscribe to threads you create or reply to (configurable)

#### Muting
- Mute a server (hides unread indicators, suppresses notifications, server stays in list)
- Mute duration option
- Muted servers shown with lower opacity in sidebar

#### Do Not Disturb
- Status: DND — suppresses all desktop notifications
- DND schedule: set automatic DND hours (e.g. 11pm–7am)
- Critical @everyone alerts still break through if configured

#### Notification Sounds
- Configurable per notification type: message / mention / DM / join/leave voice
- Upload custom notification sounds (Stellar)
- Volume control per sound type

---

### 6.13 User Profiles & Social

#### Profile Components
- **Avatar** — upload image (JPG, PNG, WEBP, GIF); animated GIF avatars for Stellar users
- **Display Name** — shown in chat (can differ from username)
- **Username** — unique handle used for friend requests (e.g. `extremis`)
- **Banner** — profile banner image or color; animated banner for Stellar
- **Bio** — up to 190 chars, supports bold/italic/links
- **Pronouns** — optional free-text field
- **Badges** — displayed on profile (see below)
- **Linked Accounts** — Steam, GitHub, Xbox, PlayStation, Spotify, YouTube, Twitch, Twitter/X
- **Member Since** — Noctis account creation date shown on profile
- **Mutual Servers** — shown when viewing someone else's profile (servers you share)
- **Mutual Friends** — shown when viewing someone else's profile

#### Per-Server Profiles (Stellar)
- Set a different avatar per server
- Set a different display name per server (separate from global nickname)
- Server profile shown in that server's context

#### Badges
| Badge | How to Get |
|---|---|
| Stellar | Active Stellar subscription |
| Early Adopter | Joined Noctis in the first 6 months |
| Bug Hunter | Verified bug reports submitted |
| Verified Bot Developer | Published a verified bot |
| Server Booster | Currently boosting a server |
| Moderator Alumni | Former Noctis staff |
| Noctis Staff | Current Noctis team member |
| Partner | Noctis Partner program member |

#### Custom Status
- Text (up to 128 chars)
- Emoji (standard or Stellar custom)
- Expiry: Don't clear / Clear after 30min / 1hr / 4hr / today / this week

#### Presence / Status
- Online (green)
- Idle (yellow/amber — auto after 5 min inactivity, or manual)
- Do Not Disturb (red — suppresses notifications)
- Invisible (appears offline, but fully functional)
- Offline (shown to others when actually disconnected)

#### Activity Status
- Opt-in: show what game/app you're currently using
- Rich presence from game clients shows game name, detail, elapsed time
- Music presence: if Spotify linked, shows currently playing track
- Can be hidden globally or per-server

---

### 6.14 Friends System

#### Friend Requests
- Send by username (e.g. search `extremis`)
- Pending list: Incoming / Outgoing tabs
- Accept or decline incoming requests
- Cancel outgoing requests
- Blocked users cannot send friend requests

#### Friends List
- All friends listed with online status
- Filter: Online / All / Pending / Blocked
- Sort: Online status, alphabetical
- Click friend → open DM
- Right-click friend → Start Video Call / Remove Friend / Block

#### Blocking
- Blocked users: cannot DM you, cannot see your online status, cannot react to your messages in shared servers
- Their messages in shared servers are hidden behind a "Blocked message" toggle (you can choose to reveal)
- Block is one-way (they don't know they're blocked except by inference)

---

### 6.15 Scheduled Events

#### Creating Events
- Name (1–100 chars)
- Description (up to 1000 chars)
- Location type: Voice Channel / Stage Channel / External (with custom location text)
- Start time + End time
- Cover image (optional)
- Privacy: Server event (all members) or specific roles only

#### Event Discovery
- Events listed in server header
- Interested / Going RSVP (shows count)
- Reminder notification when event starts (to those who marked interested)
- Events shown in a calendar view (upcoming events sidebar)

#### Recurring Events
- Daily / Weekly / Custom recurrence (basic repeat support)

---

### 6.16 Stellar (Premium Subscription)

**Stellar** is Noctis's premium subscription tier. It does not lock basic functionality. It unlocks cosmetics, higher limits, and extra features.

#### Pricing
- Monthly: ₹149/month (India), $4.99/month (Global)
- Yearly: ₹1,199/year (India), $39.99/year (Global) — ~33% saving
- Family plan: 6 accounts at ~50% discount (future)

#### What Stellar Includes

**Profile & Cosmetics**
- Animated avatar (GIF)
- Animated profile banner
- Profile themes (custom background + accent color on profile)
- Custom profile badge (Stellar star badge)
- Per-server avatar and display name
- Stellar-exclusive avatar frames / decorations
- Animated emoji in messages (from any server)
- Extended bio (400 chars vs 190)

**Messaging**
- Extended message length: 4,000 chars (vs 2,000)
- Higher file upload: 100MB (vs 25MB)
- Message scheduling (send later) — native, no bot needed
- Custom emoji everywhere (not just servers you're in)
- Stellar-exclusive sticker packs

**Voice & Video**
- 1080p / 60fps screen share
- 1080p video calls
- Virtual backgrounds in video
- Custom soundboard sounds (unlimited)

**Server Boosts**
- 2 server boosts included per month (rollover if unused, max 4 stored)
- 30% discount on additional boost purchases

**Utilities**
- Extended message edit history (full history vs last 5 edits)
- Priority support (dedicated queue, 24hr response guarantee — see Support section)
- Longer message search history (no limit vs 30-day limit for free)

**What Stellar Does NOT Lock**
- Basic profile avatar (non-animated)
- Basic bio
- File sharing (just lower limit)
- Custom status
- All moderation features
- All server features for free users in their servers
- Voice and video calling (just at lower quality cap)
- Screen sharing (just at lower quality cap)

---

### 6.17 Support System

This is Noctis's biggest differentiator. See Section 8 for full detail.

**Summary:**
- Every ticket answered by a human
- Free users: 72hr response SLA
- Stellar users: 24hr response SLA
- Public appeal dashboard with real-time status
- No auto-closures without human review

---

### 6.18 Privacy & Security

See Section 9 for full Privacy & Data Policy.

**Summary of Key Points:**
- DMs are end-to-end encrypted (users hold keys)
- No collection of open apps, keystrokes, or game activity without explicit opt-in rich presence
- Opt-in telemetry only — clear disclosure of what is collected
- No sale of user data to third parties ever
- ID verification: 72hr deletion guarantee (see details in Section 9)
- Data export available at any time (full export, usable JSON format)
- Account deletion: 7-day grace period, then full purge with confirmation email
- Login notifications for new devices

---

### 6.19 Settings

#### Account
- Change display name
- Change username (once per 30 days)
- Change email (verification required)
- Change password
- Enable/disable 2FA
- View active sessions (device, location, last active) + revoke
- Authorized apps (view + revoke OAuth apps)
- Request data export
- Delete account

#### Privacy & Safety
- Who can DM you: Everyone / Friends / Nobody
- Who can send friend requests: Everyone / Friends of friends / Nobody
- Show activity status: Everyone / Friends / Nobody
- Show current server in profile: on/off
- Read receipts in DMs: on/off
- Explicit content filter: off / from non-friends / always on
- Telemetry opt-in/out (with clear list of what's collected if opted in)

#### Notifications
- Per-type toggles: message, mention, DM, friend request, server events
- Email notification frequency
- Desktop notification sound
- Mobile push notification settings
- DND schedule

#### Appearance
- Theme: Dark (default) / Light / System
- Compact message mode (smaller avatars, denser layout)
- Font size (12px – 18px slider)
- Message display: Cozy (default, with avatars) / Compact
- Reduce motion: on/off (for accessibility)
- GIF auto-play: always / when focused / never
- Video auto-play: always / never
- Show role colors in member list: on/off
- Show rich presence: on/off

#### Accessibility
- Reduce motion
- Contrast mode (higher contrast text)
- Font size
- Screen reader optimizations
- Keyboard navigation mode
- Role color differentiation toggle

#### Voice & Video
- Input device selection
- Output device selection
- Input volume
- Output volume
- Noise suppression: on/off
- Echo cancellation: on/off
- Auto gain control: on/off
- Push to talk keybind
- Video device selection
- Video quality preference

#### Keybinds (Desktop Client)
- Fully customizable keybinds
- Defaults: Toggle mic (M), Toggle deafen (D), Quick Switcher (Ctrl+K), Push to Talk (configured by user)

#### Advanced
- Developer mode (enables Copy ID on right-click of any object)
- Experiments (opt into beta features)
- Custom CSS (power users — apply custom stylesheet to the app)
- Hardware acceleration: on/off

---

### 6.20 Developer & API

#### Developer Portal
- Register applications (bots, OAuth apps, rich presence apps)
- Generate bot token
- Configure OAuth2 scopes and redirect URLs
- Webhook management
- API key management

#### REST API
- Full REST API for all platform features
- Rate limiting: standard per-endpoint limits, documented clearly
- Versioned API (`/api/v1/`)
- JSON responses throughout
- API documentation hosted at `developers.noctis.app`

#### WebSocket Gateway
- Real-time event stream
- Events: message create/update/delete, presence updates, voice state updates, channel updates, etc.
- Heartbeat / reconnect protocol documented
- Library support: official JS/Python SDKs, community libraries

#### OAuth2
- Standard OAuth2 authorization flow
- Scopes: identify / email / guilds / guilds.join / connections / bot
- Used for bot authorization and third-party app integrations

#### Webhooks (Outgoing)
- Configure webhooks to receive events from Noctis (for external integrations)
- Event subscription model
- HMAC signature verification for security

---

## 7. Workflows — How Things Work

### 7.1 New User Onboarding

```
1. User visits noctis.app
2. Clicks "Sign Up"
3. Enters: Email, Display Name, Username, Password
4. CAPTCHA verification
5. Verification email sent → user clicks link
6. Account created, redirected to app
7. Onboarding flow:
   a. "What brings you to Noctis?" (Gaming / Friends / Community / Work / Other)
   b. Suggested servers based on selection
   c. Option to create a server or join with invite
   d. Quick tutorial overlay (dismissible)
8. User lands in their first server or DM home
```

### 7.2 Sending a Message

```
1. User clicks text input in channel
2. Types message
3. Presses Enter (or Shift+Enter for new line)
4. Client sends HTTP POST to /api/v1/channels/{id}/messages
5. Server validates: auth, permissions, rate limits, AutoMod rules
6. If AutoMod triggers: message blocked, user notified
7. If valid: message saved to PostgreSQL, event emitted via WebSocket
8. WebSocket gateway broadcasts MESSAGE_CREATE event to all connected clients subscribed to that channel
9. Other clients render the message in real-time
10. If user is offline: message stored, delivered on next connection
```

### 7.3 Joining a Voice Channel

```
1. User clicks a voice channel name in sidebar
2. Client sends request to join voice channel via WebSocket (VOICE_STATE_UPDATE)
3. Server allocates user to the regional mediasoup server for that channel
4. Client receives VOICE_SERVER_UPDATE with WebSocket URL and token for media server
5. Client establishes WebRTC connection to mediasoup SFU:
   a. Creates RTCPeerConnection
   b. Sends Offer SDP to mediasoup
   c. Receives Answer SDP
   d. ICE candidates exchanged
   e. Connection established
6. Client subscribes to existing producers (other users' audio/video tracks) in the channel
7. Other users in the channel receive VOICE_STATE_UPDATE and see the new user in the member list
8. Audio flows: User mic → WebRTC → mediasoup SFU → other subscribers
9. User sees voice controls panel at bottom of app
10. User clicks Disconnect → VOICE_STATE_UPDATE sent → SFU connection closed → user removed from channel
```

### 7.4 Screen Share Flow

```
1. User in voice channel clicks "Share Screen" button
2. Browser shows native OS screen picker: Screen / Window / Tab
3. User selects source and clicks Share
4. Browser calls getDisplayMedia() → returns MediaStream with video track
5. Client creates a new WebRTC producer for the screen track on mediasoup
6. mediasoup SFU receives screen track
7. All other channel participants receive PRODUCER_CREATED event
8. Other clients subscribe to the screen share producer
9. Screen appears as a video feed in the channel for all subscribers
10. Quality: 720p/30fps (free), 1080p/60fps (Stellar)
11. Adaptive bitrate: mediasoup adjusts based on network bandwidth
12. User clicks Stop Sharing → producer closed → PRODUCER_CLOSED event → screen removed for all subscribers
```

### 7.5 Creating a Server

```
1. Click "+" icon in server sidebar
2. Choose: Create a Server or Join with Invite
3. Select server type (Gaming / Study / Friends / Creative / Other)
4. Enter server name
5. Upload icon (optional)
6. Click Create
7. Server created with default channel structure based on type:
   - Gaming: #general, #gaming-chat, #lfg, General Voice, Gaming Voice
   - Friends: #general, #memes, Hangout Voice
8. Server owner given Administrator role automatically
9. Invite link generated and shown for easy sharing
10. Owner lands in #general channel
```

### 7.6 Moderation: Banning a User

```
1. Moderator right-clicks user in member list or message
2. Selects "Ban [Username]"
3. Modal opens:
   - Reason (text field, optional)
   - Delete message history: None / Last 24hrs / Last 7 days
   - Duration: Permanent / 1 day / 7 days / 30 days
4. Moderator clicks Confirm
5. Action sent to API: POST /api/v1/guilds/{id}/bans/{user_id}
6. Server validates: moderator has Ban Members permission, target is not higher role
7. User removed from server
8. User receives DM: "You have been banned from [Server Name]. Reason: [reason]. Duration: [X]."
9. A Mod Case is created (Case #N: Ban, Target, Moderator, Reason, Timestamp)
10. Audit log entry created
11. If temp ban: scheduled job set to unban at expiry
```

### 7.7 Support Ticket Flow

```
1. User visits support.noctis.app or clicks Help in app
2. Selects category: Account / Billing / Safety / Bug / Appeal / Other
3. Fills form:
   - Subject
   - Description
   - Attach screenshots (optional)
4. Ticket submitted → confirmation email sent with Ticket ID
5. Ticket enters queue (Stellar users → priority queue)
6. Support agent picks up ticket within SLA window (24hr Stellar / 72hr free)
7. Agent reads full context, crafts human response
8. User receives email notification of response
9. User can reply in the ticket portal
10. Ticket marked Resolved when issue closed
11. User can reopen within 7 days
12. User receives satisfaction survey after closure
```

### 7.8 Ban Appeal Flow

```
1. Banned user receives DM with ban reason and appeal link
2. Appeal link takes to: appeals.noctis.app
3. User logs in (or uses email if account inaccessible)
4. Sees their Public Appeal Dashboard:
   - Appeal ID
   - Ban reason
   - Current status: Submitted → Under Review → Decision Made
   - Estimated review time shown
5. User submits appeal:
   - Explanation of what happened
   - Why they believe the ban was incorrect
   - Evidence (screenshots, context)
6. Appeal assigned to Trust & Safety reviewer (human, not bot)
7. Reviewer examines: original ban reason, user history, evidence submitted
8. Decision made within:
   - Standard: 5 business days
   - Stellar users: 2 business days
9. Decision communicated via email + dashboard update:
   - Upheld: reason explained clearly
   - Overturned: account reinstated, apology sent, ban removed from record
10. If upheld, user can request secondary review (once per ban)
```

### 7.9 ID Verification Flow (If Required)

```
Context: Only required for age-gating adult content access or creator monetization.

1. User attempts to access NSFW content or monetization features
2. Prompted: "Age verification required"
3. User submits ID:
   - Option A: Upload government ID photo (front only, no back required)
   - Option B: Video selfie with ID (liveness check)
4. ID submitted to secure, isolated verification service
5. Automated check: age extracted from ID, liveness verified
6. If manual review needed: reviewed within 24hrs
7. Result: Verified or Not Verified
8. CRITICAL: After verification decision (pass or fail):
   - ID image/video DELETED from all storage within 72 hours
   - Only the result (age-verified: yes/no) and verification date stored
   - Zero images retained
9. User notified of deletion via email
10. Verification remains valid for 12 months (no re-verification needed)
```

---

## 8. Support System — Detailed

### Philosophy
Noctis treats support as a core product feature, not a cost center. Every person who contacts support is a real human with a real problem. They will speak to another real human. This is the commitment.

### Structure

#### Tiers
| Tier | Users | SLA | Channel |
|---|---|---|---|
| Standard | Free users | 72 hours | Ticket portal |
| Priority | Stellar users | 24 hours | Ticket portal + live chat (future) |
| Server Owner | Server owners with 1000+ members | 48 hours | Dedicated queue |

#### Teams
- **General Support** — account issues, billing, technical help
- **Trust & Safety** — reports, content moderation, platform safety
- **Appeals** — ban appeals, account restoration
- **Developer Support** — API, bot verification, webhook issues

### Ticket System
- Web portal: `support.noctis.app`
- Accessible from within the app (Help button)
- Categories: Account / Billing / Safety / Bug Report / Ban Appeal / Other
- Every ticket gets a unique ID
- Email updates at every status change
- No auto-closure without human review (tickets remain open until explicitly resolved)
- 7-day reopen window after resolution

### Appeals System (Detailed in Workflow 7.8)
- Public Appeal Dashboard per user — see exact status of their appeal
- No black box — estimated timelines shown
- Human reviewer on every appeal
- Two-stage review available

### What Support Agents Are Trained To Do
- Read the full ticket before responding (no template-pasting without reading)
- Acknowledge the user's frustration before jumping to solutions
- Provide specific next steps, not vague advice
- Escalate edge cases rather than close them
- Log every decision for accountability

### What Noctis Support Will Never Do
- Auto-close tickets
- Send a bot-only response to an account or ban issue
- Give no reason for a ban decision
- Require users to prove identity to submit a support ticket

---

## 9. Privacy & Data Policy

### Data We Collect

| Data | Purpose | Retention |
|---|---|---|
| Email address | Account, communication | Until account deleted |
| Username / Display name | Identity | Until account deleted |
| Password (hashed, bcrypt) | Authentication | Until changed or deleted |
| IP address (login) | Security alerts, fraud detection | 90 days |
| Message content | Delivery and storage | Until deleted by user or account |
| File uploads | Storage and delivery | Indefinitely (or until deleted) |
| Voice/video streams | Real-time delivery only | NOT stored |
| Device info (browser/OS) | Session management | 30 days |
| Telemetry (if opted in) | Performance improvement | 90 days, anonymized |

### Data We Do NOT Collect
- Keystrokes
- List of open applications
- Game activity (unless user enables rich presence)
- Location beyond coarse IP-level (and only for 90 days)
- Government ID (deleted within 72hrs after verification)
- Browsing history
- Any data from outside the Noctis platform

### Encryption
- **DMs:** End-to-end encrypted. Noctis servers relay encrypted payloads. Noctis cannot read DM content.
- **Server messages:** Encrypted in transit (TLS 1.3) and at rest (AES-256). Noctis can read server messages (required for AutoMod and moderation).
- **Passwords:** Hashed with bcrypt (cost factor 12+). Never stored in plaintext.
- **Files:** Encrypted at rest in object storage.
- **Sessions:** Secure, HttpOnly cookies. CSRF protection on all state-changing requests.

### Data Export
- Users can request a full data export at any time from Settings
- Export delivered as JSON within 48 hours
- Contains: account info, all messages sent, files, server memberships, DMs (decrypted for the user's own copy)

### Data Deletion
- Account deletion: 7-day grace period, then full purge
- Message deletion: immediate from UI, purged from database within 24hrs
- File deletion: removed from storage within 24hrs
- ID verification data: deleted within 72hrs of decision
- Telemetry data: purged every 90 days (if opted in)

### Transparency
- Noctis publishes a bi-annual Transparency Report covering:
  - Number of law enforcement requests received
  - Number of accounts suspended (by category)
  - Number of appeals received and outcomes
  - Data breach disclosures (if any)
- Any data breach affecting users will be disclosed within 72 hours of discovery

### Third Parties
- Noctis does not sell user data to any third party
- Third-party services used:
  - Email delivery: Resend/Postmark (message content not retained by them)
  - CDN: Cloudflare (metadata only, content encrypted)
  - Payment processing: Razorpay (India) / Stripe (Global) — payment data handled entirely by processor, not stored by Noctis

---

## 10. Monetization

### Revenue Streams

#### 1. Stellar Subscription (Primary)
- ₹149/month or ₹1,199/year (India)
- $4.99/month or $39.99/year (Global)
- Full feature list in Section 6.16

#### 2. Server Boosts (Secondary)
- Users can purchase additional boosts beyond the 2 included with Stellar
- ₹49/boost/month (India), $1.99/boost/month (Global)
- Or buy boost packs: 5 boosts for ₹199/month

#### 3. Cosmetics Store (Future)
- One-time purchase avatar decorations, profile effects, animated banners
- No loot boxes. No RNG. What you see is what you buy.
- Items from ₹49 to ₹499

#### 4. Server Subscriptions (Future)
- Server owners can set up paid subscription tiers for their communities
- Members pay a monthly fee for exclusive roles/channels
- Noctis takes 10% platform fee (vs Discord's 10% — same but with faster payouts)
- Payouts within 7 days (vs Discord's 30+ days)

### What Will Always Be Free
- Creating an account
- Joining servers (unlimited)
- Creating servers (up to 10 per account)
- Text messaging
- Voice and video calling (at reasonable quality)
- Screen sharing (at reasonable quality)
- File sharing (up to 25MB)
- Basic profile customization (static avatar, bio, status)
- Bot usage
- All moderation features

---

## 11. Platform Support & Client

### Phase 1 (Launch)
- **Web app** (primary) — React SPA, works in all modern browsers
- **Progressive Web App (PWA)** — installable on desktop and mobile from browser, push notifications via Web Push API
- Responsive design: works on mobile browsers, tablet, desktop

### Phase 2 (Post-Launch)
- **Desktop client** — Tauri (Rust + WebView)
  - Windows, macOS, Linux
  - Target: <100MB install size, <200MB RAM idle
  - System tray integration
  - Global keybinds (push to talk, toggle mute)
  - In-app update mechanism
  - Hardware acceleration
  - Not Electron — Tauri uses the OS's native WebView (WebKit on Mac/Linux, WebView2 on Windows)

### Phase 3 (Scale)
- **Mobile apps** — Flutter (iOS + Android)
  - Full feature parity with web
  - Native push notifications
  - Background audio for voice calls
  - Picture-in-picture for video calls
  - Haptic feedback

### Performance Targets
| Metric | Target |
|---|---|
| Initial load time (web) | < 2 seconds on 4G |
| Time to interactive | < 3 seconds on mid-range device |
| Message send latency | < 200ms p99 |
| Voice latency | < 100ms p50 |
| Desktop RAM (Tauri, idle) | < 200MB |
| Mobile app size | < 50MB |
| Minimum supported Android | Android 9 (API 28) |
| Minimum supported iOS | iOS 14 |

---

## 12. Infrastructure

### Launch Setup (India)

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare (CDN + DDoS)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               Nginx / Caddy (Reverse Proxy)              │
└──────┬──────────────┬───────────────┬───────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────┐
│  API Server │ │ WebSocket  │ │  Media Server      │
│  (Node/Go)  │ │  Gateway   │ │  (mediasoup SFU)   │
└──────┬──────┘ └─────┬──────┘ └────────────────────┘
       │              │
┌──────▼──────────────▼──────┐
│       PostgreSQL            │
│       Redis                 │
│       Meilisearch           │
└────────────────────────────┘
       │
┌──────▼──────────────┐
│  Object Storage     │
│  (R2 / S3-compat)   │
└─────────────────────┘
```

### Monitoring & Reliability
- Prometheus metrics collection
- Grafana dashboards
- Uptime monitoring: UptimeRobot / BetterUptime
- Public status page: `status.noctis.app`
- Alerting: PagerDuty or equivalent for on-call
- Database backups: hourly snapshots, retained 30 days
- Target uptime: 99.9% (8.7hr downtime/year max)

### Scaling Plan
- Horizontal scaling of API and WebSocket servers behind load balancer
- Redis Cluster for distributed presence/sessions at scale
- Read replicas for PostgreSQL as read load increases
- Regional media servers as user base grows globally
- CDN caching for static assets and file delivery

---

## 13. Phased Roadmap

### Phase 1 — Core Platform (MVP)
**Goal:** A working Discord alternative with the fundamentals done right.

- [x] User registration, login, 2FA
- [x] Servers with channels (text + voice)
- [x] Text messaging with full Markdown
- [x] File attachments (25MB)
- [x] Direct messages (E2E encrypted)
- [x] Group DMs (up to 20)
- [x] Voice channels (WebRTC + mediasoup)
- [x] Video calls
- [x] Screen sharing
- [x] Roles and permissions system
- [x] Basic moderation (ban, kick, timeout)
- [x] Audit log
- [x] Bot support (slash commands, webhooks)
- [x] Custom emoji and stickers
- [x] Search (basic)
- [x] Notifications (desktop + push)
- [x] User profiles
- [x] Friends system
- [x] Support ticket system (human-staffed)
- [x] Appeal system with public dashboard
- [x] Privacy settings
- [x] Web app (PWA)

### Phase 2 — Polish & Differentiation
**Goal:** Beat Discord on the things that matter most to users.

- [ ] Stellar subscription launch
- [ ] Server boosts
- [ ] Moderation Case System (native, no bot needed)
- [ ] Native warning system
- [ ] Native poll system
- [ ] AutoMod (advanced)
- [ ] Stage channels
- [ ] Forum channels
- [ ] Scheduled events
- [ ] Soundboard
- [ ] Voice messages
- [ ] Reactions (extended)
- [ ] Message scheduling (Stellar)
- [ ] Advanced search filters
- [ ] Desktop client (Tauri)
- [ ] Server discovery
- [ ] App directory (bot marketplace)

### Phase 3 — Scale & Ecosystem
**Goal:** Build the ecosystem that makes Noctis sticky.

- [ ] Mobile apps (Flutter — iOS + Android)
- [ ] Server subscriptions (creator monetization)
- [ ] Cosmetics store
- [ ] Developer portal (full)
- [ ] Rich presence SDK for games
- [ ] Global infrastructure expansion (EU, SE Asia)
- [ ] Transparency reports
- [ ] Noctis Partner program
- [ ] Family plan for Stellar

### Phase 4 — Future Vision
**Goal:** Features that Discord hasn't done and won't do.

- [ ] Haste ecosystem integration (Cosmos file sharing, Haste Cloud hosting for server bots)
- [ ] Native moderation marketplace (verified, trusted bots with quality ratings)
- [ ] Community wiki feature (native, no bot needed)
- [ ] Native ticketing system for communities
- [ ] Async video messages (Loom-style)
- [ ] AI-assisted moderation suggestions (not auto-action, human reviews)
- [ ] Voice channel transcription (opt-in)
- [ ] Cross-server identity (optional verified profile)
- [ ] End-to-end encrypted group chats (Phase 4 upgrade)

---

## 14. What Noctis Does Better Than Discord

| Area | Discord | Noctis |
|---|---|---|
| Support | Bot replies, no SLA, black-box bans | Human agents, defined SLA, transparent appeals |
| Privacy | Reads DMs, collects app/keystroke data | E2E encrypted DMs, zero unnecessary collection |
| ID verification | Stores gov IDs indefinitely | Deleted within 72hrs, verified only |
| Client performance | Electron, 500MB+ RAM | Web PWA now, Tauri later — target <200MB |
| Ban appeals | No transparency, no timeline | Public dashboard, defined timeline, human review |
| Free tier | Heavily paywalled | Genuinely usable without paying |
| File uploads | 10MB free | 25MB free |
| Screen share quality | 720p/30fps free | 720p/30fps free (same), but better adaptive bitrate |
| Group DMs | Max 10 users | Max 20 users |
| Moderation tools | Requires bots for warn/cases | Native warn + case system |
| Telemetry | Opt-out (and not fully off) | Opt-in, full transparency |
| Data export | Partial, slow | Full JSON, 48hr delivery |
| Account deletion | 14-day wait | 7-day grace period |
| Notification control | Complicated, buried | Clear, per-server/channel/thread |
| Voice noise suppression | Windows/Mac only (Krisp) | All platforms (RNNoise) |

---

## 15. Out of Scope (For Now)

These are intentionally deferred. Do not build these in Phase 1 or 2.

- Haste ecosystem integration (Cosmos, Haste Cloud tie-ins)
- Native wiki / documentation per server
- AI-generated content features
- Cryptocurrency / NFT anything (never)
- In-game overlay (desktop client Phase 3+)
- Self-hosting option for enterprises (Phase 4+)
- Voice/video recording (legal complexity, Phase 4+ with opt-in consent flow)
- End-to-end encrypted group chats (complex key management, Phase 4)
- Live streaming to external platforms (Twitch/YouTube integration)

---

## Appendix A — Terminology Reference

| Term | Meaning |
|---|---|
| Server | A community/group space (Noctis uses standard "Server" terminology) |
| Stellar | Noctis premium subscription |
| Channel | A text, voice, or other communication space within a server |
| DM | Direct Message — private conversation between two users |
| Group DM | Private group conversation, up to 20 users |
| Stage | A broadcast-style channel with speakers and audience |
| Forum | A threaded post-style channel |
| Boost | A server enhancement purchased or included with Stellar |
| Case | A logged moderation action with full context |
| Appeal | A formal dispute of a moderation action |
| SFU | Selective Forwarding Unit — the server that routes voice/video streams |
| E2E | End-to-end encryption |
| AutoMod | Automated moderation rules that run on all messages |
| Rich Presence | Status showing what game/app a user is currently using |

---

## Appendix B — Key URLs (Proposed)

| URL | Purpose |
|---|---|
| `noctis.app` | Main landing page |
| `app.noctis.app` | Web application |
| `support.noctis.app` | Support ticket portal |
| `appeals.noctis.app` | Ban appeal portal |
| `status.noctis.app` | Platform status page |
| `developers.noctis.app` | Developer documentation + portal |
| `blog.noctis.app` | Blog and announcements |

---

*Document Version: 1.0*
*Prepared for: Google Antigravity (AI Development Assistant)*
*Prepared by: Haste Industries*
*Last Updated: April 2026*
*Classification: Internal — Development Reference*
