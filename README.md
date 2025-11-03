# 🎯 Kuiz - Modern Quiz Platform

A modern, real-time quiz platform built with Next.js 15, TypeScript, MongoDB, and Prisma. Perfect for educators, trainers, and teams to create engaging quizzes with images, multiple choice questions, and more.

## ✨ Features

- 🎨 **Rich Quiz Templates** - Create quizzes with images, radio buttons, checkboxes, and various question types
- 🔢 **6-Digit Join Codes** - Participants join instantly without creating accounts
- ⚡ **Real-time Updates** - See responses and scores as they happen
- 🎯 **Multiple Question Types** - Multiple choice, checkboxes, true/false, image choice, and text input
- 🌍 **Built-in Flag Quiz** - Pre-seeded World Flags quiz template to get started
- 📊 **Score Tracking** - Automatic scoring and leaderboards
- 🔐 **Creator Authentication** - Secure auth for quiz creators using NextAuth.js

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **Validation**: Zod
- **State Management**: Zustand

## 🚀 Getting Started

### Option 1: Docker (Recommended - Easiest!)

```bash
# Run everything with Docker Compose
docker-compose up --build

# Access at http://localhost:3000
# Login: demo@kuiz.app / password123
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

### Option 2: Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Update the `.env` file with your MongoDB connection string:

```env
# Database - Replace with your MongoDB connection string
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/kuiz?retryWrites=true&w=majority"

# Or use local MongoDB:
# DATABASE_URL="mongodb://localhost:27017/kuiz"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to MongoDB (no migrations needed for MongoDB)
npm run db:push

# Seed database with demo user and World Flags quiz
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Demo Credentials

After seeding, you can log in with:
- **Email**: demo@kuiz.app
- **Password**: password123

## 🎮 How to Use

### For Creators
1. Sign Up / Sign In
2. Create a quiz template
3. Add questions with images, multiple choice, etc.
4. Start a session to generate a 6-digit code
5. Share the code with participants
6. Monitor responses in real-time

### For Participants
1. Go to `/join`
2. Enter the 6-digit code
3. Enter your name (no account needed!)
4. Answer questions and see your score

## 📜 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to MongoDB
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

## 🎯 API Endpoints

- `POST /api/sessions` - Create new quiz session (generates 6-digit code)
- `POST /api/sessions/join` - Join session with code (no auth required)
- `POST /api/responses` - Submit answer
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `POST /api/questions` - Add question

## 🎨 Question Types

1. **MULTIPLE_CHOICE** - Radio buttons, single answer
2. **CHECKBOX** - Multiple selections
3. **TRUE_FALSE** - Boolean questions
4. **IMAGE_CHOICE** - Questions with image options
5. **TEXT_INPUT** - Free text responses

## 🌍 Pre-seeded Content

The seed script includes a complete **World Flags Quiz** with 20 countries, perfect for testing the application!

## 🚀 Deployment

Deploy to Vercel (recommended):

```bash
vercel
```

Make sure to set environment variables in your deployment platform:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## 📄 License

MIT

---

**Built with Next.js 15, TypeScript, MongoDB, and modern web technologies (2025)**
