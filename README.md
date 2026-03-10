<p align="center">
  <img src="public/icon-512.png" alt="StudyPlus YT Logo" width="120" />
</p>

<h1 align="center">StudyPlus YT</h1>

<p align="center">
  <strong>Transform YouTube into a focused learning environment</strong><br/>
  Progress tracking · Timestamp notes · Distraction-free playback · IITM BS Degree support
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.4-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.19.2-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa" alt="PWA" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Design System](#-design-system)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🎯 Overview

**The Problem:** YouTube is built for entertainment, not education. Ads, recommendations, comments, and autoplay constantly pull learners away from focused study.

**The Solution:** StudyPlus YT is a modern, full-stack Progressive Web App that wraps YouTube's video playback in a study-optimized environment. It strips away distractions and adds features designed specifically for learning — timestamp-based notes, progress tracking, analytics, playlist management, and a dedicated IITM BS Degree curriculum browser.

**Who is this for?**
- 🎓 **IITM BS Students** — Pre-curated course playlists mapped to the official curriculum (Foundation → Diploma → BSc → BS)
- 📚 **Lifelong Learners** — Anyone using YouTube for self-study who wants to track progress and stay focused
- 👨‍💻 **Developers** — Studying programming tutorials, documentation walkthroughs, etc.

---

## ✨ Features

### 🔐 Authentication & User Management
| Feature | Description |
|---------|-------------|
| **Email/Password Auth** | Secure registration with bcrypt password hashing |
| **Google OAuth** | One-click sign-in via Google accounts |
| **IITM Email Detection** | Auto-detects `@iitm.ac.in`, `@study.iitm.ac.in`, `@ds.study.iitm.ac.in` domains |
| **JWT Sessions** | 30-day session persistence with NextAuth.js v4 |
| **Route Protection** | Middleware-enforced auth on all `/app/*` routes |
| **User Preferences** | Configurable daily reminders, weekly reports, and new feature notifications |

### 🎬 Video Player & Playback
| Feature | Description |
|---------|-------------|
| **Distraction-Free Player** | YouTube iframe without recommendations, comments, or sidebar |
| **Player State Persistence** | Saves current time, playback rate (0.25x–2x), and mute state per video |
| **Resume Playback** | Always pick up exactly where you left off |
| **Progress Tracking** | 0–100% progress per video with completion marking |
| **Watch History** | Automatic tracking with cumulative watch time |
| **Quick Add** | Paste a YouTube URL to instantly add to your library |
| **YouTube Search** | Built-in search for videos, channels, and playlists (Enter key triggered) |

### 📝 Timestamp-Based Notes
| Feature | Description |
|---------|-------------|
| **Inline Notes** | Take notes tied to specific timestamps in the video |
| **Click-to-Seek** | Click any note to jump directly to that moment |
| **Per-Video Notes** | Notes organized by video with full CRUD operations |
| **Dedicated Notes Page** | Browse and manage all notes across all videos |

### 📂 Playlist Management
| Feature | Description |
|---------|-------------|
| **Create Playlists** | Organize videos into custom playlists |
| **IITM Playlists** | Auto-created playlists visually separated from personal ones |
| **Playlist Viewer** | View playlist details with video ordering and progress |
| **Drag & Order** | Videos maintain position within playlists |
| **Bulk Operations** | Add/remove multiple videos |

### 📊 Analytics Dashboard
| Feature | Description |
|---------|-------------|
| **Total Watch Time** | Cumulative learning hours tracked |
| **Videos Completed** | Count of fully completed videos |
| **Learning Streaks** | Current and longest daily streak tracking |
| **Weekly Activity Chart** | Visual bar chart of this week's activity (hours per day, video count, "Today" indicator) |
| **Stats Cards** | Animated stat cards with trend indicators |

### 🎓 IITM BS Degree Curriculum
| Feature | Description |
|---------|-------------|
| **Full Curriculum Browser** | Navigate Foundation → Diploma → BSc → BS sections |
| **Course Categories** | Core, Electives, Projects organized within each section |
| **Per-Course Details** | Course code, credits, level, lesson count, YouTube playlist link |
| **User Progress Tracking** | Track started, in-progress, and completed courses |
| **Pre-Seeded Data** | Full IITM BS curriculum data seeded from `iitm_bs_courses.json` |

### 📱 Progressive Web App (PWA)
| Feature | Description |
|---------|-------------|
| **Installable** | Install as a native-like app on any device |
| **Service Worker** | Offline fallback page with caching strategies |
| **App Manifest** | Full PWA manifest with icons (192px, 512px, maskable) |
| **Install Prompt** | Custom in-app install banner |
| **Mobile Optimized** | Responsive sidebar, mobile header, rotate banner for landscape suggestion |

### 🤖 AI Study Assistant (Claude)
| Feature | Description |
|---------|-------------|
| **Context-Aware Chat** | AI assistant that knows your current video, description, and notes |
| **Streaming Responses** | Real-time word-by-word AI responses |
| **Quick Actions** | One-click "Summarize", "Quiz Me", "Explain Simply" buttons |
| **Markdown Rendering** | Formatted AI responses with headers, lists, code blocks |
| **Chat History** | Maintains conversation context within a session |

### 🌗 Additional Features
- **Dark/Light/System Theme** — Powered by `next-themes`
- **Rate Limiting** — LRU-cache based API rate limiting
- **Input Sanitization** — XSS protection on user inputs
- **Error Handling** — Structured error codes and YouTube API error handling
- **Env Validation** — Startup validation of required environment variables
- **Vercel Analytics** — Built-in analytics integration
- **Email Contact Form** — Contact form with Nodemailer (Gmail) integration
- **Contributors Page** — Donor/contributor wall with amounts and messages

---

## 🛠️ Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.1.4 | Full-stack React framework with App Router |
| [React](https://react.dev/) | 19.2.3 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Static type checking |

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| [PostgreSQL](https://www.postgresql.org/) | — | Primary database (hosted on Neon, ap-southeast-1) |
| [Prisma](https://www.prisma.io/) | 6.19.2 | Type-safe ORM with migrations |

### Authentication
| Technology | Version | Purpose |
|------------|---------|---------|
| [NextAuth.js](https://next-auth.js.org/) | 4.24.13 | Authentication framework (JWT strategy) |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.0.3 | Password hashing |

### Styling & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Utility-first CSS framework |
| [Radix UI](https://www.radix-ui.com/) | Various | 20+ accessible headless UI primitives |
| [shadcn/ui](https://ui.shadcn.com/) | — | 51 pre-built Radix-based components |
| [Lucide React](https://lucide.dev/) | 0.562 | Icon library |
| [Framer Motion](https://www.framer.com/motion/) | 12.29 | Animations and transitions |

### Data & State
| Technology | Version | Purpose |
|------------|---------|---------|
| [TanStack React Query](https://tanstack.com/query) | 5.90 | Server state management |
| [React Hook Form](https://react-hook-form.com/) | 7.71 | Form handling with Zod validation |
| [Zod](https://zod.dev/) | 4.3 | Schema validation |
| [Axios](https://axios-http.com/) | 1.13 | HTTP client |

### AI
| Technology | Version | Purpose |
|------------|---------|---------|
| [Anthropic Claude SDK](https://docs.anthropic.com/) | Latest | AI study assistant (streaming chat) |

### Charts & Media
| Technology | Version | Purpose |
|------------|---------|---------|
| [Recharts](https://recharts.org/) | 3.7 | Analytics charts and visualizations |
| [Embla Carousel](https://www.embla-carousel.com/) | 8.6 | Feature carousel with autoplay |
| [React Markdown](https://github.com/remarkjs/react-markdown) | 10.1 | Markdown rendering for notes |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| [Vercel Analytics](https://vercel.com/analytics) | 1.6 | Production analytics |
| [Nodemailer](https://nodemailer.com/) | 7.0 | Email sending (contact form) |
| [Sonner](https://sonner.emilkowal.dev/) | 2.0 | Toast notifications |
| [LRU Cache](https://github.com/isaacs/node-lru-cache) | 11.2 | Rate limiting |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  React   │  │ Framer   │  │ Recharts │  │  YouTube IFrame  │   │
│  │  19 + UI │  │ Motion   │  │ Charts   │  │  Player API      │   │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│       │                                                             │
│  ┌────┴──────────────────────────────────────────────────────────┐  │
│  │       Next.js App Router (Client + Server Components)         │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │  │
│  │  │ Landing │ │  Auth    │ │ Protected │ │ Service Worker │  │  │
│  │  │  Pages  │ │  Pages   │ │ /app/*    │ │ (PWA Offline)  │  │  │
│  │  └─────────┘ └──────────┘ └─────┬─────┘ └────────────────┘  │  │
│  └─────────────────────────────────┼────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────┘
                                     │
┌────────────────────────────────────┼───────────────────────────────┐
│                     Next.js API Routes (/api)                      │
│                                    │                                │
│  ┌─────┐ ┌────────┐ ┌──────┐ ┌────┴───┐ ┌──────────┐ ┌────────┐  │
│  │Auth │ │Videos  │ │Notes │ │Playlst │ │Analytics │ │YouTube │  │
│  │     │ │  CRUD  │ │ CRUD │ │  CRUD  │ │  Stats   │ │ Search │  │
│  └──┬──┘ └───┬────┘ └──┬───┘ └───┬────┘ └────┬─────┘ └───┬────┘  │
│     │        │         │         │            │           │        │
│  ┌──┴────────┴─────────┴─────────┴────────────┴───────────┴─────┐ │
│  │                    Prisma ORM (Type-Safe)                     │ │
│  └──────────────────────────────┬────────────────────────────────┘ │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │   PostgreSQL (Neon Cloud)    │
                   │   12 Tables · Serverless     │
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │   YouTube Data API v3        │
                   │   Video details · Search     │
                   │   Playlist fetching          │
                   └─────────────────────────────┘
```

### Request Flow

1. **Unauthenticated users** see public pages: landing, about, features, blog, contact, privacy, terms, contributors, install
2. **Middleware** (`middleware.ts`) intercepts `/app/*` routes → redirects to `/login` if no JWT
3. **Authenticated users** access the protected app shell with collapsible sidebar navigation
4. **API routes** handle all data mutations, validated with sessions and rate-limited
5. **YouTube API** is called server-side for video details, search, and playlist fetching with error handling and pagination limits

---

## 📁 Project Structure

```
studyplus-yt/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (providers, fonts, analytics)
│   ├── page.tsx                      # Landing page (public)
│   ├── globals.css                   # Global styles & Tailwind base
│   ├── not-found.tsx                 # Custom 404 page
│   │
│   ├── login/page.tsx                # Login (credentials + Google OAuth)
│   ├── signup/page.tsx               # Registration with IITM detection
│   ├── about/page.tsx                # About page
│   ├── blog/page.tsx                 # Blog page
│   ├── contact/page.tsx              # Contact page
│   ├── contributors/page.tsx         # Contributors/donors wall
│   ├── features/page.tsx             # Features showcase
│   ├── install/page.tsx              # PWA installation guide
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   │
│   ├── app/                          # 🔒 Protected app shell
│   │   ├── layout.tsx                # App layout with sidebar + mobile nav
│   │   ├── dashboard/page.tsx        # Main dashboard (stats, recent, search)
│   │   ├── videos/page.tsx           # Video library
│   │   ├── watch/page.tsx            # Watch redirect
│   │   ├── watch/[id]/page.tsx       # Video player + notes + playlist sidebar
│   │   ├── playlists/page.tsx        # Playlist management
│   │   ├── playlists/[id]/page.tsx   # Playlist detail view
│   │   ├── notes/page.tsx            # All notes browser
│   │   ├── history/page.tsx          # Watch history
│   │   ├── analytics/page.tsx        # Analytics dashboard with charts
│   │   ├── settings/page.tsx         # User settings & preferences
│   │   └── iitm/page.tsx             # IITM curriculum browser
│   │
│   ├── actions/                      # Server actions
│   │
│   └── api/                          # REST API routes (25 endpoints)
│       ├── auth/[...nextauth]/       # NextAuth handler
│       ├── auth/signup/              # Registration endpoint
│       ├── register/                 # User registration
│       ├── videos/                   # Video CRUD (add, list, delete, update)
│       ├── videos/[id]/              # Single video operations
│       ├── videos/[id]/notes/        # Notes for a specific video
│       ├── videos/update-durations/  # Batch duration updates
│       ├── notes/                    # Notes CRUD
│       ├── notes/[id]/               # Single note operations
│       ├── playlists/                # Playlist CRUD (add, list, delete)
│       ├── playlists/[id]/           # Single playlist operations
│       ├── playlists/[id]/videos/    # Playlist video management
│       ├── analytics/                # User analytics
│       ├── history/                  # Watch history
│       ├── user/profile/             # User profile management
│       ├── user/preferences/         # User preferences
│       ├── iitm/curriculum/          # IITM curriculum data
│       ├── iitm/progress/            # IITM progress tracking
│       └── youtube/search/           # YouTube search proxy
│
├── components/
│   ├── AuthProvider.tsx              # NextAuth session provider
│   ├── ThemeProvider.tsx             # next-themes wrapper
│   ├── ThemeToggle.tsx               # Dark/light mode toggle
│   ├── YouTubePlayer.tsx             # YouTube IFrame API wrapper (10KB)
│   ├── ServiceWorkerRegistration.tsx # PWA service worker registration
│   │
│   ├── app/                          # Protected app components
│   │   ├── AppSidebar.tsx            # Collapsible navigation sidebar
│   │   ├── QuickAdd.tsx              # Quick video add dialog
│   │   ├── YouTubeSearch.tsx         # YouTube search with results
│   │   └── RotateBanner.tsx          # Mobile landscape suggestion
│   │
│   ├── landing/                      # Landing page sections
│   │   ├── Hero.tsx                  # Hero section with CTA
│   │   ├── Features.tsx              # Feature cards
│   │   ├── Comparison.tsx            # YouTube vs StudyPlus comparison
│   │   ├── AppPreview.tsx            # App preview screenshots
│   │   ├── WhyStudyPlus.tsx          # Value proposition
│   │   ├── Testimonials.tsx          # User testimonials
│   │   ├── Contact.tsx               # Contact form (Nodemailer)
│   │   ├── CTA.tsx                   # Call-to-action banner
│   │   ├── InstallPrompt.tsx         # PWA install prompt
│   │   └── MobilePromoMarquee.tsx    # Mobile promotional marquee
│   │
│   ├── layout/                       # Layout components
│   │   ├── Navbar.tsx                # Public navbar
│   │   └── Footer.tsx                # Public footer
│   │
│   ├── providers/                    # Context providers
│   │   ├── AuthProvider.tsx          # Auth session provider
│   │   ├── ToastProvider.tsx         # Toast notification provider
│   │   └── InstallProvider.tsx       # PWA install context
│   │
│   ├── contributors/                 # Contributor components
│   │
│   └── ui/                           # 51 shadcn/ui components
│       ├── button.tsx, card.tsx, dialog.tsx, tabs.tsx, ...
│       ├── chart.tsx                 # Recharts wrapper
│       ├── sidebar.tsx               # Full sidebar component (22KB)
│       ├── VideoPlayer.tsx           # Video player UI component
│       ├── FeatureCarousel.tsx       # Landing feature carousel
│       └── FloatingInput.tsx         # Animated floating label input
│
├── hooks/                            # Custom React hooks
│   ├── use-mobile.tsx                # Mobile viewport detection
│   ├── use-toast.ts                  # Toast notification hook
│   ├── useDebounce.tsx               # Input debounce hook
│   └── useScrollAnimation.tsx        # Scroll-based animation hook
│
├── lib/                              # Shared utilities
│   ├── auth.ts                       # NextAuth configuration
│   ├── prisma.ts                     # Prisma client singleton
│   ├── youtube.ts                    # YouTube Data API v3 client
│   ├── env.ts                        # Environment variable validation
│   ├── errors.ts                     # Structured error handling
│   ├── rate-limit.ts                 # LRU-cache rate limiter
│   ├── sanitize.ts                   # Input sanitization (XSS protection)
│   └── utils.ts                      # General helpers (cn, formatters)
│
├── prisma/
│   ├── schema.prisma                 # Database schema (12 models)
│   ├── migrations/                   # Database migration history
│   ├── seed-iitm.ts                  # IITM curriculum seeder
│   ├── seed-contributors.ts          # Contributors seeder
│   └── clear-iitm.ts                 # IITM data cleanup script
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── service-worker.js             # Service worker (caching + offline)
│   ├── sw.js                         # Service worker registration
│   ├── offline.html                  # Offline fallback page
│   ├── icon-192.png                  # PWA icon (192×192)
│   ├── icon-512.png                  # PWA icon (512×512)
│   └── icon-maskable-512.png         # Maskable PWA icon
│
├── types/
│   └── next-auth.d.ts                # NextAuth TypeScript augmentations
│
├── iitm_bs_courses.json              # IITM BS curriculum source data
├── middleware.ts                      # Next.js middleware (auth + redirects)
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Dependencies and scripts
```

---

## 🗃️ Database Schema

The application uses **12 Prisma models** across two domains:

### Core Models

```
┌───────────────────────────────────────────────────────────────────────┐
│                           User                                        │
│  id · name · email · image · password · isIITMUser · timestamps       │
├───────────────┬──────────────┬──────────────┬────────────────────────┤
│               │              │              │                        │
▼               ▼              ▼              ▼                        ▼
Video        Playlist      Note      WatchHistory    UserAnalytics
(library)   (organize)   (study)    (tracking)       (stats)
│               │
▼               ▼
PlaylistVideo  UserPreferences
(junction)     (settings)

VideoSearch (search cache with 24h TTL)
Contributor (donor wall)
```

| Model | Key Fields | Purpose |
|-------|------------|---------|
| **User** | email, password, isIITMUser | User accounts with IITM flag |
| **Video** | youtubeId, progress, currentTime, playbackRate, muted | Video library with player state |
| **Note** | content, timestamp, videoId | Timestamp-linked notes |
| **Playlist** | name, isIITM | User-created and IITM playlists |
| **PlaylistVideo** | position, playlistId, videoId | Ordered playlist membership |
| **WatchHistory** | watchTime, watchedAt | Per-video watch tracking |
| **UserAnalytics** | totalWatchTime, currentStreak, longestStreak, videosCompleted | Aggregated stats |
| **UserPreferences** | dailyReminders, weeklyReports, newFeatures | Notification preferences |
| **VideoSearch** | query, type, results (JSON), expiresAt | Search result cache (24h TTL) |
| **Contributor** | name, amount, message, isAnonymous | Donor/contributor wall |

### IITM Curriculum Models

| Model | Key Fields | Purpose |
|-------|------------|---------|
| **IITMCurriculumSection** | slug, title, order, icon | Top-level sections (Foundation, Diploma, BSc, BS) |
| **IITMCourseCategory** | slug, title, sectionId | Categories within sections (Core, Electives, Projects) |
| **IITMCourse** | courseCode, youtubePlaylistId, credits, level, lessonsCount | Individual courses with YouTube links |
| **IITMUserProgress** | videosWatched, totalVideos, completionRate, isStarted, isCompleted | Per-user course progress |

---

## 📡 API Reference

All API routes are under `/api/` and require authentication (via NextAuth JWT) unless noted.

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | ❌ | Register new user (email/password) |
| `POST` | `/api/register` | ❌ | Alternative registration endpoint |
| `*` | `/api/auth/[...nextauth]` | ❌ | NextAuth handler (login, logout, session) |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/videos` | List all videos with filtering |
| `GET` | `/api/videos/list` | Paginated video list |
| `POST` | `/api/videos/add` | Add video by YouTube URL/ID |
| `GET` | `/api/videos/[id]` | Get single video details |
| `PATCH` | `/api/videos/[id]` | Update video (progress, player state) |
| `DELETE` | `/api/videos/delete` | Delete video(s) |
| `POST` | `/api/videos/update-durations` | Batch update video durations |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notes` | List all notes |
| `POST` | `/api/notes` | Create a note |
| `PATCH` | `/api/notes/[id]` | Update a note |
| `DELETE` | `/api/notes/[id]` | Delete a note |
| `GET` | `/api/videos/[id]/notes` | Get notes for a specific video |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/playlists` | List all playlists |
| `GET` | `/api/playlists/list` | Paginated playlist list |
| `POST` | `/api/playlists` | Create playlist |
| `POST` | `/api/playlists/add` | Add video to playlist |
| `GET` | `/api/playlists/[id]` | Get playlist details |
| `DELETE` | `/api/playlists/[id]` | Delete playlist |
| `DELETE` | `/api/playlists/delete` | Bulk delete playlists |
| `GET` | `/api/playlists/[id]/videos` | Get playlist videos |
| `POST` | `/api/playlists/[id]/videos` | Add/remove videos in playlist |

### Analytics & History
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics` | Get user analytics (watch time, streaks, weekly) |
| `GET` | `/api/history` | Get watch history |
| `POST` | `/api/history` | Log watch activity |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get user profile |
| `PATCH` | `/api/user/profile` | Update user profile |
| `GET` | `/api/user/preferences` | Get notification preferences |
| `PATCH` | `/api/user/preferences` | Update preferences |

### IITM
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/iitm/curriculum` | Get full IITM curriculum tree |
| `GET` | `/api/iitm/progress` | Get user's IITM course progress |
| `POST` | `/api/iitm/progress` | Start/update course progress |

### YouTube
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/youtube/search` | Search YouTube (videos, channels, playlists) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (included with Node.js)
- **PostgreSQL** database — [Neon](https://neon.tech/) (free tier) or any PostgreSQL instance
- **YouTube Data API v3** key — [Get one here](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
- **Google OAuth** credentials (optional) — [Console](https://console.cloud.google.com/apis/credentials)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Roushan-Gupta1889/StudyPlus-YT-Next.js-.git
cd studyplus-yt

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env

# 4. Generate Prisma client
npx prisma generate

# 5. Push database schema (or run migrations)
npx prisma db push
# or: npx prisma migrate deploy

# 6. (Optional) Seed IITM curriculum data
npm run seed:iitm

# 7. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# ──────────────────────────────────
# Required
# ──────────────────────────────────

# PostgreSQL connection string (Neon, Supabase, or local)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# YouTube Data API v3
YOUTUBE_API_KEY="your-youtube-api-key"

# ──────────────────────────────────
# Optional
# ──────────────────────────────────

# Google OAuth (enables "Sign in with Google")
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (contact form via Gmail SMTP)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
```

> **💡 Tip:** Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma + build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed:iitm` | Seed IITM BS curriculum data |
| `npm run clear:iitm` | Clear all IITM curriculum data |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db push` | Push schema changes to database |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma studio` | Open Prisma database browser |

---

## 🎨 Design System

### Theme
- **Font:** Geist Sans + Geist Mono (Google Fonts)
- **Primary Color:** Indigo (`#4F46E5` / `#6366F1`)
- **Accent Color:** Green (`#10B981`) for progress/success
- **Dark Mode:** Full dark theme support via `next-themes`
- **Component Library:** 51 shadcn/ui components built on Radix UI primitives

### Design Principles
- **Calm & Minimal** — Soft backgrounds, generous spacing, no visual clutter
- **Learning-First** — Every design decision optimizes for focused study
- **Premium Feel** — Subtle shadows, smooth animations, polished micro-interactions
- **Responsive** — Mobile-first with collapsible sidebar, mobile header, and landscape suggestions

### Key Animations
- **Framer Motion** — Page transitions, card entrances, stat counter animations
- **Scroll Animations** — Custom `useScrollAnimation` hook for reveal-on-scroll
- **Embla Carousel** — Auto-playing feature carousel on landing page
- **CSS Transitions** — Sidebar collapse, hover effects, theme switching

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Prisma](https://www.prisma.io/) — Next-generation Node.js ORM
- [NextAuth.js](https://next-auth.js.org/) — Authentication for Next.js
- [Neon](https://neon.tech/) — Serverless PostgreSQL
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful component library
- [Radix UI](https://www.radix-ui.com/) — Accessible UI primitives
- [YouTube Data API](https://developers.google.com/youtube/v3) — Video metadata and search
- [Vercel](https://vercel.com/) — Deployment platform
- [IIT Madras](https://www.iitm.ac.in/) — BS Degree curriculum

---

<p align="center">
  <strong>Built with ❤️ for focused learning</strong><br/>
  <sub>StudyPlus YT — Because learning deserves better than YouTube's distractions</sub>
</p>
