# TrackBackAI

A collaborative music production platform that uses Music Information Retrieval (MIR) to help producers complete unfinished tracks.

**Live:** [trackbackai.me](https://trackbackai.me)

---

## What It Does

Producers upload incomplete loops, the platform automatically detects BPM and energy level using Librosa, collaborators discover tracks by filtering musical characteristics, they submit completed versions, the community votes, and the track gets finished.

**Workflow:** Upload → MIR Analysis → Discover → Collaborate → Submit → Vote → Complete

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, WaveSurfer.js |
| Backend API | Node.js, Express.js, Socket.IO |
| Database | PostgreSQL |
| ML Service | Python, Flask, Librosa |
| File Storage | AWS S3 (private bucket, signed URLs) |
| Email | Resend |
| Deployment | Docker Compose, Render |

---

## Project Structure

```
├── backend/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection pool
│   │   ├── email.js             # Resend email templates (6 types)
│   │   ├── emailTrigger.js      # Email dispatch logic
│   │   ├── onlineUsers.js       # Online user tracking
│   │   └── s3.js                # AWS S3 signed URL management
│   ├── middleware/
│   │   ├── auth.js              # JWT verification (TOKEN_EXPIRED vs INVALID_TOKEN)
│   │   └── optionalAuth.js      # Optional auth for public routes
│   ├── routes/
│   │   ├── auth.js              # Register, login, verify email, password reset
│   │   ├── collaborations.js    # Request, approve, reject collaborations
│   │   ├── comments.js          # Submission comments
│   │   ├── messages.js          # Real-time messaging + REST fallback
│   │   ├── notifications.js     # In-app notification system
│   │   ├── online.js            # Online status tracking
│   │   ├── submissions.js       # Version-numbered submission uploads
│   │   ├── tracks.js            # Upload, discover, filter, complete
│   │   ├── users.js             # Profiles, avatar upload, social links
│   │   └── votes.js             # Upvote/toggle with self-vote prevention
│   ├── init.sql                 # Full PostgreSQL schema
│   ├── server.js                # Express + Socket.IO server
│   ├── Dockerfile
│   └── load_test.txt            # Load test script (50 concurrent users)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── collaborations/  # ReceivedRequestCard, SentRequestCard
│   │   │   ├── comments/        # CommentForm, CommentItem, CommentList, CommentSection
│   │   │   ├── common/          # Avatar, Navigation, NotificationBell, Toast, Footer, ThemeToggle
│   │   │   ├── community/       # CommunityStats, CommunityTabs, CompletedTrackCard, RankBadge
│   │   │   ├── editprofile/     # EditProfileTab, EditMusicTab, EditSecurityTab, EditSocialTab
│   │   │   ├── messages/        # MessageBubble, MessageThread, ConversationList, TypingIndicator
│   │   │   ├── profile/         # ProfileHeader, ProfileBanner, ProfileTracks, SocialLinks
│   │   │   ├── submissions/     # SubmissionCard, SubmissionForm, VoteButton
│   │   │   └── tracks/          # TrackCard, TrackEditForm, WaveformPlayer
│   │   ├── context/
│   │   │   ├── AuthContext.js   # JWT auth state + token refresh
│   │   │   └── SocketContext.js # Socket.IO connection management
│   │   ├── hooks/
│   │   │   ├── useCollaborations.js
│   │   │   ├── useConversations.js
│   │   │   ├── useMessages.js
│   │   │   ├── useSubmissionsPage.js
│   │   │   └── useTrackDetail.js
│   │   ├── pages/               # 17 page components
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance with JWT interceptor + refresh queue
│   │   │   └── socket.js        # SocketService singleton
│   │   ├── App.js
│   │   ├── index.css            # Tailwind + custom theme (dark/light)
│   │   └── index.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── ml-service/
│   ├── app.py                   # Flask + Librosa BPM/energy analysis
│   ├── bpm_test.txt             # BPM accuracy test script (50 tracks, 98% accuracy)
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── .gitignore
```

---

## Features

**Audio Analysis (MIR)**
- Automated BPM detection using Librosa with median interval filtering
- Energy level classification (Low/Medium/High) via raw RMS thresholds
- Asynchronous processing — API returns immediately, MIR service posts results back via webhook

**Collaboration Workflow**
- Track discovery with multi-parameter filtering (BPM range, energy, genre, title search)
- Collaboration request/approve/reject with real-time Socket.IO notifications
- Version-numbered submissions (v1, v2, v3... auto-incremented per collaborator)
- Community voting with self-vote prevention
- Track completion with automatic winner selection

**Real-Time Messaging**
- Socket.IO WebSocket with polling fallback
- Typing indicators, online status, conversation search
- Dual-path message deletion (Socket.IO + REST for reliability)
- Optimistic UI updates with server confirmation

**Authentication & Security**
- JWT with granular error codes (TOKEN_EXPIRED vs INVALID_TOKEN)
- Email verification with 24-hour token expiry
- Password reset with 15-minute tokens
- bcrypt (cost factor 12), Helmet.js CSP, parameterised SQL
- Rate limiting: auth (10/15min), registration (5/hr), uploads (20/hr), global (200/15min)
- Private S3 bucket with prefix-based signed URL expiry (15min avatars, 1hr audio)

**Email Notifications**
- 6 notification types via Resend: collaboration request, response, new submission, vote, comment, new message
- Per-user preference management (toggle each type on/off)
- HTML branded email templates

**UI/UX**
- Dark/light theme with CSS variables
- Waveform visualisation (WaveSurfer.js)
- Responsive design with iOS Safari tap-fix
- Glass-morphic card design system
- Avatar with signed URL + initial letter fallback

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- AWS S3 bucket (private, Block All Public Access)
- Docker & Docker Compose (optional)

### Environment Variables

**Backend (`backend/.env`)**
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=your-region
S3_BUCKET=your-bucket
RESEND_API_KEY=your-key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
PORT=5001
```

**Frontend (`frontend/.env`)**
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

**ML Service (`ml-service/.env`)**
```
BACKEND_URL=http://localhost:5001
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=your-region
S3_BUCKET=your-bucket
```

### Run with Docker Compose

```bash
docker-compose up --build
```

This starts all services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |
| ML Service | http://localhost:5000 |
| PostgreSQL | localhost:5432 |

### Run Manually

```bash
# Database
psql -U postgres -f backend/init.sql

# Backend
cd backend
npm install
node server.js

# Frontend
cd frontend
npm install
npm start

# ML Service
cd ml-service
pip install -r requirements.txt
python app.py
```

---

## Testing

**BPM Accuracy Test (98% on 50 tracks)**
```bash
cd ml-service
python bpm_test.txt /path/to/audio/folder
```

**Load Test (50 concurrent users)**
```bash
cd backend
node load_test.txt
```

---

## Deployment

Deployed on Render with three services:

- **Frontend** — Static site serving the React build
- **Backend** — Web service running Node.js/Express
- **ML Service** — Web service running Python/Flask

All services are connected via environment variables. HTTPS is enforced automatically by Render.

---

## Database Schema

14 tables: `users`, `tracks`, `collaboration_requests`, `active_collaborations`, `submissions`, `votes`, `comments`, `messages`, `conversations`, `conversation_participants`, `notifications`, `password_reset_tokens`, `social_links`, `email_preferences`

Key constraints:
- `UNIQUE(track_id, collaborator_id)` on `active_collaborations`
- `UNIQUE(submission_id, user_id)` on `votes`
- `analysis_status` enum on `tracks` (`pending` / `completed` / `failed`)
- `read_by INTEGER[]` on `messages` (PostgreSQL array for read tracking)

Full schema in `backend/init.sql`.

---

## Author

**David Afful** — W1886235
BSc (Hons) Software Engineering
University of Westminster
Supervisor: Francesco Tusa

---

## License

Developed as a final year project for 6COSC023W Computer Science Final Project at the University of Westminster.