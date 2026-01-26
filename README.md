# StudyPlus YT

> Transform YouTube into a focused learning environment with progress tracking, notes, and distraction-free playback.

A modern, premium SaaS platform designed for serious learners. Watch educational videos without ads, recommendations, or endless scrolling. Perfect for IITM students and lifelong learners.

---

## 🎯 Project Vision

**The Problem:** YouTube is built for entertainment, not education. Ads, recommendations, and comments constantly distract from learning.

**The Solution:** A clean, focused platform where you can:
- Watch YouTube videos without distractions
- Take timestamp-based notes
- Track learning progress
- Organize content into playlists
- Resume exactly where you left off

**Special Feature for IITM Students:** Pre-curated BS degree course playlists + all standard features.

---

## ✅ Completed Features

### 🔐 Authentication System
- **Email/Password authentication** with bcrypt hashing
- **Google OAuth** integration
- **IITM email detection** (supports `@iitm.ac.in`, `@study.iitm.ac.in`, `@ds.study.iitm.ac.in`)
- **JWT sessions** with 30-day expiry
- **Protected routes** using Next.js middleware
- **Session management** with NextAuth.js v4

### 🗄️ Database Setup
- **PostgreSQL** via Neon (serverless)
- **Prisma ORM** for type-safe database access
- **9 database models:**
  - User (with IITM flag)
  - Video (YouTube metadata)
  - Playlist (user-created)
  - PlaylistVideo (junction table)
  - Note (timestamp-based)
  - WatchHistory (progress tracking)
  - UserSettings (preferences)
  - InstitutionalPlaylist (IITM courses)
  - InstitutionalPlaylistVideo

### 🎨 Design System
- **Tailwind CSS** with custom design tokens
- **Calm, minimal aesthetic** (#FAFAFA backgrounds, indigo primary)
- **Inter font family** throughout
- **Reusable component classes** (buttons, inputs, cards)
- **Responsive design** ready

### 📄 Pages Built
- **Landing page** - Hero, features, testimonials ✅
- **Login page** - Credentials + Google OAuth ✅
- **Signup page** - With live IITM email detection ✅
- **Test Dashboard** - Session verification ✅

---

## 🛠️ Tech Stack

### Core
- **Next.js 16.1.4** - App Router
- **TypeScript** - Type safety
- **React 19.2.3** - UI components

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **Custom design tokens** - Calm, focused palette

### Database & Auth
- **PostgreSQL** - Via Neon (ap-southeast-1)
- **Prisma 6.19.2** - ORM with migrations
- **NextAuth.js 4.24.13** - Authentication
- **bcryptjs** - Password hashing

### Libraries
- **lucide-react** - Icons
- **framer-motion** - Animations (ready for use)
- **react-player** - YouTube player (ready for use)
- **recharts** - Analytics charts (ready for use)
- **react-markdown** - Note rendering (ready for use)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL database (Neon account)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studyplus-yt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   
   Create `.env` and `.env.local` with:
   ```env
   # Database
   DATABASE_URL="your-postgres-connection-string"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # YouTube Data API
   YOUTUBE_API_KEY="your-youtube-api-key"
   ```

4. **Database setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
studyplus-yt/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/   # NextAuth handler
│   │       └── signup/          # Registration API
│   ├── app/
│   │   └── dashboard/           # Protected dashboard
│   ├── login/                   # Login page
│   ├── signup/                  # Signup page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
│
├── components/                   # Reusable components
│   └── AuthProvider.tsx         # Session provider
│
├── lib/                         # Utilities
│   ├── auth.ts                  # NextAuth config
│   ├── prisma.ts                # Prisma client
│   └── utils.ts                 # Helper functions
│
├── prisma/
│   └── schema.prisma            # Database schema
│
├── types/
│   └── next-auth.d.ts           # TypeScript definitions
│
├── middleware.ts                # Route protection
└── tailwind.config.ts           # Tailwind config
```

---

## 🧪 Testing Authentication

### Test Signup
1. Visit http://localhost:3000/signup
2. Register with email/password
3. Try an IITM email to see detection badge
4. Should auto-login and redirect to dashboard

### Test Login
1. Visit http://localhost:3000/login
2. Login with credentials or Google
3. Should redirect to dashboard
4. IITM users see special badge

### Test Route Protection
1. Sign out from dashboard
2. Try accessing `/app/dashboard` directly
3. Should redirect to login
4. Sign back in to verify

---

## 🎨 Design Philosophy

### Visual Principles
- **Calm & Minimal** - Soft backgrounds, generous spacing
- **Learning-First** - Remove all distractions
- **Premium Feel** - Subtle shadows, smooth animations
- **Responsive** - Works on all devices

### Color Palette
- Background: `#FAFAFA`, `#F5F5F5`
- Primary (Indigo): `#4F46E5`, `#6366F1`
- Accent (Green): `#10B981` - For progress
- Text: `#1F2937`, `#374151` - Not pure black

---

## 🔜 Next Steps

### Immediate (Building Foundation)
- [ ] Build real dashboard (replace test page)
- [ ] Create app layout with sidebar
- [ ] Build video import functionality
- [ ] Implement YouTube metadata fetching

### Core Features (MVP)
- [ ] Video watch page with player
- [ ] Timestamp-based note taking
- [ ] Progress tracking system
- [ ] Playlist management
- [ ] Resume playback feature

### Advanced Features
- [ ] Focus mode (minimal UI)
- [ ] Keyboard shortcuts
- [ ] Search functionality
- [ ] Analytics dashboard
- [ ] Settings page
- [ ] IITM institutional playlists

### Polish
- [ ] Responsive design refinement
- [ ] Loading states & skeletons
- [ ] Error handling
- [ ] SEO optimization
- [ ] Performance optimization

---

## 📊 Current Status

**Phase:** Authentication & Database Complete ✅  
**Next Phase:** Core Application Pages 🔄

### What Works
✅ User registration & login  
✅ Google OAuth authentication  
✅ IITM email detection  
✅ Route protection  
✅ Database with all models  
✅ Session management  

### In Development
🚧 Dashboard UI  
🚧 Video player integration  
🚧 Playlist management  
🚧 Notes system  

---

## 🤝 Contributing

This is a learning project. Contributions, issues, and feature requests are welcome!

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Next.js** - The React framework
- **Tailwind CSS** - Utility-first CSS
- **Prisma** - Next-generation ORM
- **NextAuth.js** - Authentication for Next.js
- **Neon** - Serverless PostgreSQL

---

**Built with ❤️ for focused learning**
