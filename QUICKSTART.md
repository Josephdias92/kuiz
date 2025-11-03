# 🎯 Kuiz - Quick Reference

## 🚀 Quick Start Commands

### Docker (Recommended)
```bash
# Start everything (App + MongoDB)
npm run docker:up

# Or use the helper script
./docker-start.sh

# Access at: http://localhost:3000
# Login: demo@kuiz.app / password123
```

### Local Development
```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## 📋 Common Commands

### Docker
```bash
npm run docker:up              # Start (foreground)
npm run docker:up:detached     # Start (background)
npm run docker:down            # Stop
npm run docker:down:volumes    # Stop + delete data
npm run docker:logs            # View logs
npm run docker:dev             # MongoDB only
```

### Database
```bash
npm run db:generate     # Generate Prisma Client
npm run db:push         # Push schema to DB
npm run db:seed         # Seed demo data
npm run db:studio       # Open Prisma Studio
```

### Application
```bash
npm run dev             # Dev server (http://localhost:3000)
npm run build           # Production build
npm run start           # Start production
npm run lint            # Run ESLint
```

## 🔐 Demo Credentials
- **Email**: demo@kuiz.app
- **Password**: password123

## 📚 Documentation
- **README.md** - Full documentation
- **SETUP.md** - Setup guide
- **DOCKER.md** - Docker guide

## 🎮 Features
- ✅ Create quiz templates
- ✅ 6-digit join codes
- ✅ Multiple question types (radio, checkbox, images)
- ✅ Anonymous participants (no account needed!)
- ✅ Real-time scoring
- ✅ World Flags quiz included

## 🛠️ Tech Stack
- Next.js 15 + TypeScript
- MongoDB + Prisma
- Tailwind CSS 4
- NextAuth.js v5
- Docker + Docker Compose

## 📝 Environment Variables
```env
DATABASE_URL=mongodb://...
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🐛 Troubleshooting
- **Docker not starting?** Check if Docker Desktop is running
- **Port 3000 in use?** Stop local Next.js or change port in docker-compose.yml
- **DB connection failed?** Verify DATABASE_URL in .env
- **Prisma errors?** Run `npm run db:generate`

## 🚀 Deployment
```bash
# Vercel (easiest)
vercel

# Docker (any platform)
docker build -t kuiz-app .
docker push your-registry/kuiz-app
```

---

**Need more help?** Check the full documentation in README.md
