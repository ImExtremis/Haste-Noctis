# Noctis — Phase 1 Development Sprint
### Google Jules Prompt | Based on Feature Audit Results

> The rebrand is complete. The audit is done. Now we build.
> This prompt tells you exactly what to build, in what order, and how.
> Work through each sprint block sequentially. Do not skip ahead.

---

## AUDIT SUMMARY (What We Know)

From the completed audit:
- ✅ Core auth, servers, channels, messaging, reactions, roles, friends, profiles — **exist, rebranded**
- 🔧 DMs, moderation, notifications, file uploads — **exist but need significant work**
- ❌ E2E encryption, polls, voice messages, support/appeals portal, opt-in telemetry — **must be built from scratch**
- ⚠️ LiveKit → mediasoup migration needed | AGPLv3 licensing must be walled off

---

## GROUND RULES BEFORE STARTING

1. **Commit after every completed sprint block.** Format: `feat(block-N): description`
2. **Never break the running dev server.** Test after every major change.
3. **The spec is law.** When in doubt, re-read `NOCTIS_SPEC.md`.
4. **Flag AGPLv3 files.** Any Fluxer file you modify heavily — add a comment at the top: `// LEGAL-REVIEW: derived from AGPLv3 source, pending proprietary clearance`
5. **Do not start Block 2 until Block 1 is 100% verified working.**

---

## SPRINT BLOCK 1 — Fix The Foundation
### Priority: CRITICAL | Do this before anything else

The existing auth and account system needs hardening before any feature work happens on top of it. A broken foundation breaks everything above it.

### 1A — Auth Hardening

**Forgot Password / Reset Flow**
- `POST /api/auth/forgot-password` — accepts email, sends reset link (expires 15 min)
- `POST /api/auth/reset-password` — accepts token + new password, invalidates token after use
- Reset email template: Noctis branding, clear CTA, warn user if they didn't request this
- On success: invalidate ALL existing sessions for that user (security)

**Login Alert on New Device**
- On every login, compare: IP geolocation (coarse — city level only) + User-Agent
- If new device/location detected → send email alert: "New login to your Noctis account from [City, Device]"
- Email includes: timestamp, IP (masked last octet), device info, "Secure my account" link
- Store known devices in DB: `user_devices` table (user_id, device_hash, last_seen, created_at)
- Device hash = hash of User-Agent + IP subnet (not exact IP)

**Session Management**
- `GET /api/auth/sessions` — returns all active sessions for current user
- `DELETE /api/auth/sessions/:sessionId` — revoke a specific session
- `DELETE /api/auth/sessions` — revoke all sessions except current
- Frontend: Settings → Account → Active Sessions
  - Show: device type icon, browser, approximate location, last active time
  - "Log out all other devices" button
  - Individual revoke button per session

**Account Deletion — 7-Day Grace Period**
- `DELETE /api/auth/account` — initiates deletion
- Sets `account_status = 'pending_deletion'`, `deletion_scheduled_at = NOW() + 7 days`
- User immediately logged out of all sessions
- Email sent: "Your account will be deleted on [date]. Click here to cancel."
- `GET /api/auth/account/cancel-deletion` — cancels pending deletion, restores account
- Cron job: every hour, check for accounts where `deletion_scheduled_at <= NOW()`
  - Hard delete: user row, all messages replaced with `[Deleted User]` text, files purged from storage
  - Send final confirmation email: "Your Noctis account has been deleted."

**Verification: Block 1A is done when:**
- [ ] Password reset flow works end to end (email → reset → login)
- [ ] New device login triggers email alert
- [ ] Sessions page shows all active sessions, revoke works
- [ ] Account deletion initiates, cancel works, 7-day purge runs via cron

---

### 1B — Rate Limiting (Security Hardening)

Apply rate limits to all public-facing endpoints. Use Redis for distributed rate limit counters.

```
POST /api/auth/login          → 5 attempts / 15 min / per IP
POST /api/auth/register       → 3 attempts / 1 hour / per IP
POST /api/auth/forgot-password → 3 attempts / 1 hour / per email
POST /api/channels/:id/messages → 5 messages / 1 second / per user
POST /api/upload              → 10 uploads / 1 minute / per user
POST /api/auth/2fa/verify     → 5 attempts / 15 min / per user
```

On limit exceeded: return `429 Too Many Requests` with `Retry-After` header.
Frontend: show user-friendly message "Too many attempts. Try again in X minutes."

**Commit:** `feat(block-1): auth hardening, session management, rate limiting`

---

## SPRINT BLOCK 2 — E2E Encryption for DMs
### Priority: CRITICAL | Core Noctis differentiator

This is the feature that makes Noctis fundamentally different from Discord. Build it right.

### Architecture

```
Alice wants to DM Bob:

1. On registration, each user generates a Curve25519 keypair:
   - Private key → encrypted with user's password-derived key (Argon2id) → stored in IndexedDB
   - Public key → stored on Noctis server (unencrypted, this is fine — it's public)

2. Alice opens DM with Bob:
   - Alice fetches Bob's public key from API: GET /api/users/:id/public-key
   - Alice generates ephemeral Curve25519 keypair (throwaway, per-message)
   - Alice computes shared secret: X25519(alice_ephemeral_private, bob_public)
   - Alice encrypts message: XSalsa20-Poly1305(shared_secret, message_plaintext)
   - Alice sends to API: { ciphertext, ephemeral_public_key, nonce }
   - Server stores ciphertext, ephemeral_public_key, nonce — NEVER sees plaintext

3. Bob receives message:
   - Bob fetches message from server: gets { ciphertext, ephemeral_public_key, nonce }
   - Bob retrieves his private key from IndexedDB (decrypted with his password-derived key)
   - Bob computes shared secret: X25519(bob_private, alice_ephemeral_public)
   - Bob decrypts: XSalsa20-Poly1305_decrypt(shared_secret, ciphertext, nonce)
   - Bob sees plaintext message ✓
```

### Implementation Steps

**Backend Changes**

Add to users table:
```sql
ALTER TABLE users ADD COLUMN public_key TEXT; -- base64 encoded Curve25519 public key
```

New endpoint:
```
GET /api/users/:id/public-key → { userId, publicKey }
```

DM messages table — add columns:
```sql
ALTER TABLE direct_messages ADD COLUMN is_encrypted BOOLEAN DEFAULT false;
ALTER TABLE direct_messages ADD COLUMN ephemeral_public_key TEXT;
ALTER TABLE direct_messages ADD COLUMN nonce TEXT;
-- The 'content' column now stores ciphertext when is_encrypted = true
```

Important: Server must NOT attempt to read, search, or process content of encrypted messages. AutoMod does NOT run on E2E encrypted DMs.

**Frontend — Crypto Engine**

Create `apps/web/src/lib/crypto.ts`:

```ts
// Install: npm install libsodium-wrappers
import sodium from 'libsodium-wrappers';

// Initialize sodium (call once on app start)
export async function initCrypto(): Promise<void>

// Generate a new keypair for a new user
export async function generateKeypair(): Promise<{ publicKey: Uint8Array, privateKey: Uint8Array }>

// Derive an encryption key from the user's password (for encrypting private key at rest)
// Uses Argon2id via sodium
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array>

// Encrypt the private key before storing in IndexedDB
export async function encryptPrivateKey(privateKey: Uint8Array, derivedKey: Uint8Array): Promise<{ encrypted: Uint8Array, salt: Uint8Array }>

// Decrypt the private key from IndexedDB
export async function decryptPrivateKey(encrypted: Uint8Array, password: string, salt: Uint8Array): Promise<Uint8Array>

// Encrypt a message for a recipient (returns ciphertext + ephemeral public key + nonce)
export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: Uint8Array
): Promise<{ ciphertext: string, ephemeralPublicKey: string, nonce: string }>

// Decrypt a received message
export async function decryptMessage(
  ciphertext: string,
  ephemeralPublicKey: string,
  nonce: string,
  myPrivateKey: Uint8Array
): Promise<string>
```

**Frontend — Key Storage (IndexedDB)**

Create `apps/web/src/lib/keystore.ts`:

```ts
// IndexedDB wrapper for cryptographic key storage
// Database name: 'noctis-keystore'
// Object store: 'keys'

export async function storePrivateKey(userId: string, encryptedKey: Uint8Array, salt: Uint8Array): Promise<void>
export async function getPrivateKey(userId: string): Promise<{ encryptedKey: Uint8Array, salt: Uint8Array } | null>
export async function deletePrivateKey(userId: string): Promise<void>
// Called on logout — private key removed from memory
export function clearKeyFromMemory(): void
```

**Frontend — Key Initialization Flow**

On first registration:
1. Generate keypair
2. Derive encryption key from password using Argon2id
3. Encrypt private key
4. Store encrypted private key + salt in IndexedDB
5. Upload public key to server: `POST /api/auth/register` (include public key in payload)

On login:
1. Fetch encrypted private key from IndexedDB using userId
2. Prompt for password (already done for login)
3. Derive key from password + stored salt
4. Decrypt private key → hold in memory (never in localStorage)
5. Private key held in a module-level variable, cleared on logout

On logout:
1. Call `clearKeyFromMemory()`
2. Clear all stores
3. Private key gone from memory

**DM Message Component Changes**

In the DM message input component:
- On send: call `encryptMessage()` before calling API
- Show lock icon in DM header: "🔒 End-to-end encrypted"
- If decryption fails (corrupted or key mismatch): show "[Unable to decrypt message]" — never crash

On message receive (WebSocket):
- If `is_encrypted = true`: call `decryptMessage()` before rendering
- If `is_encrypted = false` (legacy/unencrypted): render as-is (backward compat)

**Key Verification UI**

In DM settings panel:
- "Encryption" section showing:
  - Your public key fingerprint (first 16 chars of base64 key, formatted in groups)
  - Recipient's public key fingerprint
  - "Verify Safety Number" — compare fingerprints out-of-band to confirm no MITM

**Commit:** `feat(block-2): E2E DM encryption with libsodium/Curve25519`

---

## SPRINT BLOCK 3 — Group DMs & DM System Cleanup
### Priority: HIGH

**Raise Group DM limit from 10 → 20**
- Update DB constraint: `CHECK (member_count <= 20)`
- Update API validation: reject add-member if count would exceed 20
- Update frontend: show "20 member limit" in group info

**DM Request System**
- Users not on each other's friends list must send a DM request first
- New table: `dm_requests` (id, from_user_id, to_user_id, status: pending/accepted/declined, created_at)
- `POST /api/dm-requests` — send request
- `GET /api/dm-requests/pending` — incoming pending requests
- `PUT /api/dm-requests/:id` — accept or decline
- Frontend: DM home shows "Message Requests" section with accept/decline UI
- Privacy setting integration: if user has DMs set to "Friends only" → auto-reject requests from non-friends

**Read Receipts**
- Add `read_at` timestamp to DM messages
- `POST /api/channels/:id/messages/read` — marks all messages as read, sends WebSocket event
- WebSocket event: `DM_READ` → { channelId, userId, readAt }
- Frontend: show double checkmark (✓✓) when recipient has read
- Privacy setting: if read receipts disabled → don't send the event, don't show the checkmarks

**Block User**
- Block already exists in friends system — extend it:
  - Blocked users cannot send DM requests
  - Blocked users cannot see your online status
  - In shared servers: blocked user's messages hidden behind "Blocked message — click to show" toggle
  - Blocking someone does not notify them

**Commit:** `feat(block-3): group DM cap to 20, DM requests, read receipts, block extensions`

---

## SPRINT BLOCK 4 — Native Poll System
### Priority: HIGH

Polls must be fully native — no bot dependency.

**Database Schema**
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id),
  question TEXT NOT NULL CHECK (char_length(question) <= 300),
  allow_multiselect BOOLEAN DEFAULT false,
  results_hidden BOOLEAN DEFAULT false, -- hide results until poll ends
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 100),
  position INTEGER NOT NULL, -- display order
  CHECK (position BETWEEN 1 AND 10)
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (poll_id, option_id, user_id) -- one vote per option per user
);
```

**API Endpoints**
```
POST /api/channels/:channelId/polls
  Body: { question, options: string[], allowMultiselect, resultsHidden, expiresAt }
  → Creates poll + message in channel
  → Returns: poll object with options

GET /api/polls/:pollId
  → Returns poll with options and vote counts (or hidden if resultsHidden=true and not expired)

POST /api/polls/:pollId/vote
  Body: { optionIds: string[] }
  → Cast vote(s). Validates multiselect rules.
  → Emits POLL_VOTE WebSocket event to channel

DELETE /api/polls/:pollId/vote
  → Remove your vote(s) from a poll (only if poll not expired)

POST /api/polls/:pollId/end
  → End poll early (creator or Manage Messages permission)
  → Sets expires_at = NOW(), reveals results if they were hidden
```

**WebSocket Events**
```
POLL_VOTE    → { pollId, optionId, voteCounts } — broadcast to channel on every vote
POLL_ENDED   → { pollId } — broadcast when poll expires or manually ended
```

**Poll Expiry Cron Job**
- Runs every minute
- Finds polls where `expires_at <= NOW()` and not yet marked ended
- Emits POLL_ENDED event to channel
- If `results_hidden = true`, now reveals results

**Frontend — Poll Creation UI**
- Trigger: click `+` in message bar → "Create Poll" option
- Modal:
  - Question text input
  - Options list (minimum 2, add up to 10, drag to reorder)
  - Toggle: Allow multiple choices
  - Toggle: Hide results until poll ends
  - Duration selector: 1hr / 4hr / 8hr / 24hr / 3 days / 7 days
  - Preview of poll appearance
  - Create button

**Frontend — Poll Display Component**
```
┌─────────────────────────────────┐
│ 📊 Which OS do you use?         │
├─────────────────────────────────┤
│ ○ Windows          ████░░  42%  │
│ ○ Linux            ██░░░░  21%  │
│ ○ macOS            ███░░░  31%  │
│ ○ Other            █░░░░░   6%  │
├─────────────────────────────────┤
│ 48 votes · Ends in 6 hours      │
└─────────────────────────────────┘
```
- Clicking an option casts vote and animates the bar updating in real time
- Voted option shown with filled circle and violet highlight
- "Change vote" link appears after voting (if not multiselect)
- Progress bars animate smoothly on vote events via WebSocket

**Commit:** `feat(block-4): native poll system with real-time vote updates`

---

## SPRINT BLOCK 5 — Voice Messages
### Priority: HIGH

**Frontend — Recording**

Create `apps/web/src/hooks/useVoiceRecorder.ts`:
```ts
// Uses MediaRecorder API (browser native)
// Returns: { isRecording, startRecording, stopRecording, cancelRecording, audioBlob, duration }
// Max duration: 5 minutes (300 seconds) — auto-stop at limit
// Format: audio/ogg;codecs=opus (best compression) with WebM fallback
// Waveform: sample audio buffer during recording using Web Audio API AnalyserNode
//   → store amplitude samples array → used to render static waveform on playback
```

**Frontend — Voice Message UI in Input Bar**
- Hold microphone button → starts recording
- While recording:
  - Red pulsing indicator + "Recording..." text + live duration counter
  - Waveform animates in real time (amplitude bars)
  - "Cancel" (✕) button — discards recording
  - Release button → stops recording, shows preview
- Preview state:
  - Playback button to preview before sending
  - Duration displayed
  - "Send" button (↑) and "Discard" button (✕)

**Frontend — Voice Message Playback Component**
```
┌─────────────────────────────────────────────────┐
│ ▶  ████████████░░░░░░░░░░░░  0:12 / 0:47       │
│    [waveform visualization]         1x  1.5x  2x│
└─────────────────────────────────────────────────┘
```
- Scrubbing: click anywhere on waveform to jump to position
- Speed: 1x / 1.5x / 2x buttons
- Plays in background if user navigates away (don't interrupt)
- Shows sender avatar + "Voice Message" label
- Duration shown before playing

**Backend**
- Voice messages are just file uploads with `type = 'voice_message'`
- Store: `{ fileUrl, duration, waveformData: number[] }` in message metadata
- `POST /api/channels/:id/messages` with `type: 'voice_message'`
- File upload endpoint handles audio blob like any other file
- Enforce max duration: 300 seconds server-side check

**Commit:** `feat(block-5): voice messages with waveform recording and playback`

---

## SPRINT BLOCK 6 — Moderation Case System + Warning System
### Priority: HIGH | Core Noctis differentiator

This is native moderation tracking — something Discord doesn't have without bots.

**Database Schema**
```sql
CREATE TABLE mod_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number SERIAL, -- auto-incrementing number per server
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('warn', 'timeout', 'kick', 'ban', 'unban', 'softban')),
  target_user_id UUID NOT NULL REFERENCES users(id),
  moderator_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  duration_seconds INTEGER, -- for timeout/temp ban
  expires_at TIMESTAMPTZ, -- for temp bans/timeouts
  notes TEXT, -- moderator private notes, updatable
  appeal_status TEXT CHECK (appeal_status IN ('none', 'pending', 'reviewing', 'upheld', 'overturned')) DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  mod_case_id UUID REFERENCES mod_cases(id),
  reason TEXT NOT NULL,
  moderator_id UUID NOT NULL REFERENCES users(id),
  active BOOLEAN DEFAULT true, -- can be pardoned
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE server_automod_thresholds (
  server_id UUID PRIMARY KEY REFERENCES servers(id) ON DELETE CASCADE,
  warn_threshold INTEGER, -- auto-timeout after N warnings
  timeout_threshold INTEGER, -- auto-ban after N warnings
  timeout_duration_seconds INTEGER DEFAULT 3600,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints**
```
GET  /api/servers/:id/cases              → List all mod cases (paginated, filterable by type/user)
GET  /api/servers/:id/cases/:caseId      → Get single case detail
PUT  /api/servers/:id/cases/:caseId      → Update case notes
GET  /api/servers/:id/members/:userId/cases → All cases for a specific user

POST /api/servers/:id/members/:userId/warn
  Body: { reason }
  → Creates warning + mod case
  → DMs the user: "You have received a warning in [Server]: [reason]"
  → Checks warning thresholds → applies auto-action if threshold hit

GET  /api/servers/:id/members/:userId/warnings → Warning history for user (mod only)
DELETE /api/servers/:id/warnings/:warningId    → Pardon a warning

GET/PUT /api/servers/:id/automod/thresholds → Get and update warning thresholds
```

All existing moderation actions (kick, ban, timeout) must now:
1. Create a mod_case row automatically
2. Include the case number in the DM sent to the user

**Frontend — Mod Cases Panel**

In Server Settings → Moderation → Cases:
```
┌──────────────────────────────────────────────────────────┐
│  MOD CASES                                    [Filter ▾] │
├──────────────────────────────────────────────────────────┤
│ #47  BAN      @username    by @mod    2 days ago    [→]  │
│      Reason: Repeated spam after warnings                │
├──────────────────────────────────────────────────────────┤
│ #46  WARN     @username2   by @mod    3 days ago    [→]  │
│      Reason: Inappropriate language                      │
├──────────────────────────────────────────────────────────┤
│ #45  TIMEOUT  @username3   by @mod    5 days ago    [→]  │
│      Duration: 1 hour | Reason: Spam                     │
└──────────────────────────────────────────────────────────┘
```

Case detail view (click →):
- Full case info
- Private notes field (editable by mods)
- Appeal status indicator (if user appealed)
- "View User History" link (all cases for that user)

**Frontend — Warning Threshold Settings**

In Server Settings → Moderation → Auto-Actions:
```
Auto-action thresholds:
After [3] warnings → Timeout for [1 hour]
After [5] warnings → Ban permanently

[Save Changes]
```

**Frontend — User Context Menu**

Right-clicking a user in chat or member list:
```
Moderation →
  ├── Warn @username
  ├── Timeout @username →  (submenu: 60s / 5m / 10m / 1hr / 1d / 1w)
  ├── Kick @username
  ├── Ban @username
  └── View Mod History
```

Warn action → opens modal:
```
Warn @username
Reason: [text input]
[This will be logged as Case #48 and the user will be notified via DM]
[Warn]  [Cancel]
```

**Commit:** `feat(block-6): native mod case system and warning system`

---

## SPRINT BLOCK 7 — Support & Appeals Portal
### Priority: HIGH | Biggest Noctis differentiator

This is a separate mini-application. Can live at `support.noctis.app` or as pages in the main app.

**Database Schema**
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- human readable: NCT-2026-00042
  user_id UUID REFERENCES users(id), -- nullable (can submit without account for ban appeals)
  email TEXT NOT NULL, -- always required for responses
  category TEXT NOT NULL CHECK (category IN ('account', 'billing', 'safety', 'bug', 'appeal', 'other')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')), -- Stellar = high
  is_stellar BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5)
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'agent')),
  author_id UUID REFERENCES users(id), -- agent's user id if author_type = 'agent'
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ban_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_number TEXT UNIQUE NOT NULL, -- NCA-2026-00012
  ticket_id UUID REFERENCES support_tickets(id),
  banned_user_id UUID REFERENCES users(id),
  banned_email TEXT NOT NULL,
  server_id UUID REFERENCES servers(id), -- null = platform-wide ban
  ban_reason TEXT,
  appeal_explanation TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]',
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'decision_made')),
  decision TEXT CHECK (decision IN ('upheld', 'overturned')),
  decision_reason TEXT,
  reviewer_id UUID REFERENCES users(id),
  estimated_resolution_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Ticket Number Generation**
```ts
// Format: NCT-YYYY-NNNNN (e.g. NCT-2026-00042)
// Appeal format: NCA-YYYY-NNNNN (e.g. NCA-2026-00012)
function generateTicketNumber(type: 'ticket' | 'appeal'): string {
  const prefix = type === 'ticket' ? 'NCT' : 'NCA';
  const year = new Date().getFullYear();
  const seq = incrementSequence(type); // Redis INCR for atomicity
  return `${prefix}-${year}-${seq.toString().padStart(5, '0')}`;
}
```

**API Endpoints**
```
-- USER FACING --
POST /api/support/tickets               → Submit new ticket
GET  /api/support/tickets/:ticketId     → Get ticket status (by ticket number, auth or email token)
POST /api/support/tickets/:ticketId/reply → User replies to ticket

POST /api/support/appeals               → Submit ban appeal
GET  /api/support/appeals/:appealId     → Get appeal status (PUBLIC — no auth needed, by appeal ID)

-- ADMIN FACING (requires support_agent role) --
GET  /api/admin/tickets                 → List all tickets (filterable, paginated)
GET  /api/admin/tickets/:ticketId       → Get ticket with full history
POST /api/admin/tickets/:ticketId/reply → Agent responds to ticket
PUT  /api/admin/tickets/:ticketId/status → Update ticket status
PUT  /api/admin/tickets/:ticketId/assign → Assign to agent

GET  /api/admin/appeals                 → List all appeals
PUT  /api/admin/appeals/:appealId       → Update appeal status / submit decision
```

**SLA Enforcement**
```ts
// On ticket creation, set SLA based on priority:
const slaHours = ticket.is_stellar ? 24 : 72;
const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

// Cron job (every 30 min): flag tickets approaching SLA deadline
// Send internal alert to support team Slack/email if ticket will breach SLA
```

**Email Notifications (all via Resend/Postmark)**
```
On ticket created     → "Your ticket NCT-2026-00042 has been received"
On agent reply        → "A support agent has responded to your ticket"
On ticket resolved    → "Your ticket has been resolved" + satisfaction survey link
On appeal submitted   → "Your appeal NCA-2026-00012 has been submitted"
On appeal decision    → "A decision has been made on your appeal"
```

**Frontend — Support Form (in-app)**

Accessible from: Help button in app sidebar → "Contact Support"

```
Category: [Account ▾]
Subject: [text input]
Description: [textarea - min 50 chars]
Attachments: [drag and drop, max 5 files, max 10MB each]

[Submit Ticket]

Your ticket will be answered by a real human.
Estimated response: 72 hours (24 hours for Stellar members)
```

**Frontend — Ticket Status Page**

At `support.noctis.app/tickets/NCT-2026-00042` or linked from email:
```
┌───────────────────────────────────────────────┐
│  Ticket NCT-2026-00042                        │
│  Subject: Can't access my account             │
│  Status: 🟡 In Progress                        │
│  Opened: 2 days ago                           │
├───────────────────────────────────────────────┤
│  [Message thread between user and agent]      │
│  [Reply box]                                  │
└───────────────────────────────────────────────┘
```

**Frontend — Public Appeal Dashboard**

At `support.noctis.app/appeals/NCA-2026-00012`:

```
┌───────────────────────────────────────────────┐
│  🌑 NOCTIS APPEAL CENTER                      │
│  Appeal ID: NCA-2026-00012                    │
├───────────────────────────────────────────────┤
│  PROGRESS                                     │
│  ●━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━○          │
│  Submitted    Under Review    Decision         │
│                    ▲ You are here             │
├───────────────────────────────────────────────┤
│  Estimated decision: within 5 business days   │
│  Submitted: April 7, 2026                     │
│                                               │
│  [Submit additional evidence]                 │
└───────────────────────────────────────────────┘
```

When decision is made:
```
Decision: OVERTURNED ✓
Your account has been reinstated. We apologize for the inconvenience.
The ban record has been removed from your account history.
[Login to Noctis]
```

Or:
```
Decision: UPHELD
Reason: [clear explanation written by reviewer]
You may request a secondary review once.
[Request Secondary Review]
```

**Commit:** `feat(block-7): support ticket system and public appeals dashboard`

---

## SPRINT BLOCK 8 — Opt-In Telemetry System
### Priority: MEDIUM

Noctis's principle: collect nothing without explicit consent.

**What To Remove / Disable From Fluxer**
- Find all existing analytics calls, tracking pixels, or behavioral logging
- Disable them completely by default
- Comment each disabled call with: `// TELEMETRY: disabled by default, re-enabled only if user opts in`

**If User Opts In — What We Collect**
Only these things, no more:
```ts
type TelemetryEvent =
  | { event: 'app_crash', data: { errorMessage: string, stackTrace: string } }
  | { event: 'feature_used', data: { feature: string } }  // e.g. "polls", "voice_message"
  | { event: 'performance', data: { loadTime: number, region: string } }
// NO user IDs in telemetry. All events anonymized with a random session token that rotates every 24hrs.
```

**Database**
```sql
ALTER TABLE users ADD COLUMN telemetry_opt_in BOOLEAN DEFAULT false;
```

**API**
```
PUT /api/users/me/settings/telemetry
  Body: { optIn: boolean }
  → Updates telemetry_opt_in
  → If opting out: purge all previously collected data for this user from telemetry store
```

**Frontend — Settings UI**

In Settings → Privacy & Safety → Data & Telemetry:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Help improve Noctis (optional)

[Toggle: OFF by default]

If you enable this, Noctis will collect:
✓ Anonymous crash reports (no personal data)
✓ Feature usage statistics (anonymized)
✓ Performance metrics (load times, region)

We will NEVER collect:
✗ Your messages or file contents
✗ Your contacts or friends list
✗ What apps or games you use
✗ Your keystrokes or input

Your session ID rotates every 24 hours.
We cannot link telemetry data back to you.

[View full privacy policy]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Telemetry Client**

Create `apps/web/src/lib/telemetry.ts`:
```ts
// Checks opt-in status before every event
// If not opted in → silently drops the event
// Never blocks the main thread — fire and forget
export function track(event: TelemetryEvent): void {
  if (!userStore.getState().telemetryOptIn) return;
  // send to /api/telemetry (fire and forget, no await)
}
```

**Commit:** `feat(block-8): opt-in telemetry with full transparency disclosure`

---

## SPRINT BLOCK 9 — LiveKit → mediasoup Migration
### Priority: MEDIUM (can ship with LiveKit for MVP, migrate before public launch)

> ⚠️ This is the highest-risk block. Do it on a separate branch: `feat/mediasoup-migration`.
> Do not merge until thoroughly tested. LiveKit stays as fallback.

**Why mediasoup over LiveKit**
- Full control over routing logic
- Lower latency for India-region deployments
- No dependency on external LiveKit cloud
- Matches Noctis spec exactly
- Cost: runs on Haste Cloud infrastructure directly

**Migration Plan**

Phase A — Set Up mediasoup Server
```ts
// apps/media-server/ — new package
// mediasoup Worker → Router → WebRtcTransport (send + recv per user)
// One Router per voice channel
// Workers: spawn one per CPU core

const worker = await mediasoup.createWorker({
  rtcMinPort: 10000,
  rtcMaxPort: 10999,
  logLevel: 'warn',
});

const router = await worker.createRouter({
  mediaCodecs: [
    { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
    { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
    { kind: 'video', mimeType: 'video/H264', clockRate: 90000 },
  ]
});
```

Phase B — Client-Side WebRTC (mediasoup-client)
```ts
// apps/web/src/lib/voice.ts — replace LiveKit client calls with mediasoup-client
import { Device } from 'mediasoup-client';

// Flow:
// 1. GET /api/voice/:channelId/join → returns { routerRtpCapabilities, sendTransportOptions, recvTransportOptions }
// 2. device.load({ routerRtpCapabilities })
// 3. device.createSendTransport(sendTransportOptions) → produce audio
// 4. device.createRecvTransport(recvTransportOptions) → consume other participants
// 5. On 'connect' events → POST transport params back to server
// 6. On new participant → server pushes 'new-producer' event → client creates consumer
```

Phase C — Rip Out LiveKit
- Remove LiveKit SDK from all package.json files
- Remove LiveKit environment variables from .env.example
- Remove LiveKit-specific components: replace with mediasoup equivalents
- Remove LiveKit room/participant abstractions

Phase D — Noise Suppression (RNNoise)
```ts
// Replace Krisp (LiveKit bundled) with RNNoise
// npm install @rnnoise/rnnoise-wasm
// Apply as a Web Audio API processing node before sending audio track
// Works on all platforms including Linux — this is a key advantage over Discord
```

**Test Matrix Before Merging**
- [ ] 2 users in voice channel — both hear each other
- [ ] Video camera enable/disable
- [ ] Screen share start/stop
- [ ] User joins mid-call — hears existing participants
- [ ] User disconnects — others notified
- [ ] Network drop + reconnect — call recovers
- [ ] 10+ simultaneous users in one channel
- [ ] Noise suppression active on audio

**Commit:** `feat(block-9): mediasoup SFU replacing LiveKit, RNNoise noise suppression`

---

## SPRINT BLOCK 10 — Notification System Completion
### Priority: MEDIUM

**Per-Channel Notification Overrides**

Database:
```sql
CREATE TABLE notification_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  setting TEXT NOT NULL CHECK (setting IN ('all', 'mentions', 'nothing')),
  muted_until TIMESTAMPTZ, -- null = not muted, specific time = muted until then, far future = indefinite
  UNIQUE (user_id, channel_id),
  UNIQUE (user_id, server_id)
);
```

API:
```
PUT /api/servers/:id/notification-settings      → server-level preference
PUT /api/channels/:id/notification-settings     → channel-level override
PUT /api/channels/:id/mute                      → mute with duration
```

**Mute Duration Options**
Frontend dropdown: 15 minutes / 1 hour / 3 hours / 8 hours / 24 hours / Until I turn it back on

**DND Schedule**
```sql
ALTER TABLE users ADD COLUMN dnd_schedule_start TIME; -- e.g. '23:00'
ALTER TABLE users ADD COLUMN dnd_schedule_end TIME;   -- e.g. '07:00'
ALTER TABLE users ADD COLUMN dnd_schedule_timezone TEXT;
```

Cron job (every minute): check users whose DND window is active → set presence to DND → restore on window end

**@mention Badge vs General Unread**
- Unread count: grey badge on server/channel icon
- Mention count: violet badge with `@` symbol — takes priority over unread
- Both must be tracked separately in Redis:
  - `unread:{userId}:{channelId}` → count
  - `mentions:{userId}:{channelId}` → count
- Cleared when user views the channel

**Commit:** `feat(block-10): complete notification system with per-channel overrides and DND schedule`

---

## FINAL CHECKLIST — Before Calling Phase 1 Done

Go through this before moving to Phase 2 work:

### Auth & Accounts
- [ ] Registration + email verification
- [ ] Login + JWT + refresh token
- [ ] 2FA (TOTP)
- [ ] Forgot password / reset
- [ ] New device login alert
- [ ] Session management (view + revoke)
- [ ] Account deletion (7-day grace, full purge)
- [ ] Rate limiting on all auth endpoints

### Messaging
- [ ] Full Markdown rendering
- [ ] Edit (with history indicator)
- [ ] Delete
- [ ] Inline reply
- [ ] Forward
- [ ] Reactions
- [ ] File attachments (25MB free, virus scan hook)
- [ ] Voice messages (record, waveform, playback speeds)
- [ ] Typing indicator
- [ ] Native polls
- [ ] Message action context menu

### DMs
- [ ] E2E encryption (libsodium/Curve25519)
- [ ] DM request system
- [ ] Read receipts + privacy toggle
- [ ] Group DMs up to 20 users
- [ ] Block user (extended)
- [ ] Encryption indicator in DM header

### Voice & Video
- [ ] Voice channel join/leave (WebRTC)
- [ ] Audio controls (mute, deafen)
- [ ] Camera on/off
- [ ] Screen sharing
- [ ] RNNoise noise suppression (all platforms)
- [ ] Speaking indicators
- [ ] Push-to-talk mode
- [ ] Persistent voice controls bar

### Moderation
- [ ] Warn (with DM notification)
- [ ] Timeout, Kick, Ban (all with DM notification)
- [ ] Temp ban with auto-expiry
- [ ] Mod Case System (auto-creates case on every action)
- [ ] Warning System with thresholds
- [ ] Audit log (existing, verify it logs new actions)

### Support & Appeals
- [ ] Support ticket submission (in-app)
- [ ] Ticket status page
- [ ] Email notifications on ticket events
- [ ] Ban appeal submission
- [ ] Public appeal dashboard with live status
- [ ] SLA enforcement (24hr Stellar / 72hr free)

### Privacy
- [ ] Opt-in telemetry (default OFF, with full disclosure UI)
- [ ] Who can DM setting
- [ ] Who can friend request setting
- [ ] Activity status visibility
- [ ] Read receipts toggle
- [ ] Data export request endpoint

### Notifications
- [ ] Per-server notification settings
- [ ] Per-channel notification overrides
- [ ] Mute with duration
- [ ] DND mode + schedule
- [ ] Unread count badges
- [ ] @mention badge (separate from unread)
- [ ] Desktop notifications (Web Notifications API)
- [ ] PWA push notifications

### Infrastructure
- [ ] Docker Compose runs full local stack
- [ ] All environment variables documented in .env.example
- [ ] mediasoup running (or LiveKit clearly marked for replacement)
- [ ] Redis for sessions + rate limiting + presence
- [ ] PostgreSQL migrations all run cleanly from scratch

---

## COMMIT MESSAGE GUIDE

```
feat(block-1):  auth hardening, sessions, rate limiting
feat(block-2):  E2E DM encryption with libsodium
feat(block-3):  group DM cap 20, DM requests, read receipts
feat(block-4):  native poll system
feat(block-5):  voice messages with waveform
feat(block-6):  mod case system and warning system
feat(block-7):  support ticket and appeals portal
feat(block-8):  opt-in telemetry
feat(block-9):  mediasoup migration, RNNoise
feat(block-10): notification system completion
```

---

*Noctis Phase 1 Sprint — Haste Industries*
*Start at Block 1. Work in order. Ship what's real.*
