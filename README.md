# <div align="center">PlanYt ▶

<div align="center">

PlanYt is a modern full-stack learning SaaS that helps you convert scattered YouTube content into structured playlists with progress tracking, goal planning, and focused completion workflows.

---

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square)](https://zod.dev/)

</div>

---

## <div align="center">🎬 Demo / 🌐 Live

Add your links here:

- Demo Video: https://your-demo-link
- Live App: https://your-live-link

---

## ✨ Features

- Playlist creation from individual YouTube video links or full playlist links
- Automatic video metadata handling with resilient title and duration fallback
- Embedded YouTube player with playback position sync
- Progress tracking at video and playlist level
- Completion goals with multiple planning modes:
	- Minutes per day
	- Deadline based completion
	- Target days
- Reorder videos with drag and drop
- Notes per video with autosave behavior
- Dashboard for playlist overview and completion stats
- Protected app routes with Clerk authentication
- Secure API design with validation, same-origin checks, and rate limiting

---

## 🛠️ Technologies Used

| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | Full-stack framework |
| React 19 | UI rendering |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Styling and design system |
| Prisma | ORM and schema management |
| PostgreSQL | Primary database |
| Clerk | Authentication and user management |
| Zod | API payload validation |
| Framer Motion | UI transitions |
| Lucide React | Icons |

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (local or hosted)
- Clerk project credentials

### Quick Start

1. Clone Repository

```bash
git clone <your-repo-url>
cd plan-yt
```

2. Install Dependencies

```bash
npm install
```

3. Configure Environment

Create a .env file in project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"

# Optional (recommended for richer metadata)
YOUTUBE_API_KEY="your_google_api_key"
```

4. Generate Prisma Client and Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start Dev Server

```bash
npm run dev
```

App runs at: http://localhost:3000

---

## 💡 Usage

### Create Account

1. Open sign up page
2. Register/login with Clerk
3. Enter dashboard

### Create Playlist

1. Click Create Playlist
2. Add title
3. Paste one or more YouTube URLs
4. Submit

### Learn in Workspace

1. Open any playlist
2. Select a video to play
3. Progress and watched seconds sync automatically
4. Add notes and set completion goal

### Track Completion

- View completion percentage on cards and workspace
- Mark videos complete/in progress manually when needed
- Follow daily plan recommendations from goal card

---

## 🧩 System Architecture Diagram

```mermaid
flowchart TD
		U[User Browser] --> N[Next.js App Router]

		N --> M[Clerk Middleware]
		M --> P[Protected Pages Dashboard/Playlists/Settings]

		U --> YP[YouTube Iframe Player]
		YP -->|watch time + duration| N

		P --> API[Route Handlers /api/playlists/*]
		API --> V[Zod Validation + Security Checks]
		V --> DB[(PostgreSQL)]
		DB <--> PR[Prisma ORM]
		PR <--> API

		API --> YT[YouTube Metadata Services]
		YT --> GV[YouTube Data API v3]
		YT --> OE[oEmbed Fallback]
		YT --> WH[Watch Page Duration Fallback]

		API --> S[Playlist Stats Sync Engine]
		S --> DB

		DB --> P
		P --> U
```

### Data Flow Summary

1. User authenticates via Clerk.
2. Protected routes call server handlers.
3. Payloads are validated and guarded.
4. Prisma writes/reads from PostgreSQL.
5. Video metadata is fetched from YouTube services with fallback chain.
6. Player sends watched position and duration sync to API.
7. Progress and goal stats are recomputed and reflected in UI.

---

## 📁 Project Structure

```text
plan-yt/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   ├── api/playlists/
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── playlist/
│   │   └── ui/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── progress.ts
│   │   ├── security.ts
│   │   ├── validators.ts
│   │   └── youtube.ts
│   └── middleware.ts
├── package.json
└── README.md
```

---

## 📝 Available Scripts

```bash
# Development
npm run dev

# Build and Run
npm run build
npm run start

# Quality
npm run lint

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

---

## 🔐 Security Highlights

- Clerk-based authentication
- Route-level protected access via middleware
- Same-origin enforcement for mutating API requests
- Rate limiting for mutation endpoints
- Zod input validation
- Controlled error responses

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push repository to GitHub
2. Import project in Vercel
3. Add required environment variables
4. Deploy

Required environment variables in production:

- DATABASE_URL
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- YOUTUBE_API_KEY (optional but recommended)

---

## 🐛 Troubleshooting

### Duration stays as syncing

- Ensure the app can reach YouTube endpoints
- Open playlist page once to trigger metadata sync
- Verify network is not blocking watch/oEmbed/API requests

### Database connection issues

- Check DATABASE_URL
- Run prisma generate and prisma migrate
- Confirm DB host accessibility

### Clerk auth errors

- Verify Clerk keys in .env
- Restart dev server after env update

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

## 👨‍💻 Author

**Saurabh Chauhan**

<div align="center">

### Connect With Me

[![Portfolio](https://img.shields.io/badge/Portfolio-000?style=flat-square&logo=vercel&logoColor=white)](https://saurabh-s-w-e.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-000?style=flat-square&logo=github&logoColor=white)](https://github.com/Saurabh-git-hub)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/saurabhchauhan2000/)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=flat-square&logo=twitter&logoColor=white)](https://x.com/saurabh_10_12)

</div>

---

<div align="center">

**⭐ If you found this project helpful, star it on GitHub!**

**Made with ❤️ by Saurabh Chauhan**

</div>
