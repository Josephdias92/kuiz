# 🚀 Kuiz - Setup & Quick Start Guide

## Project Overview

**Kuiz** is a modern quiz platform built with the latest technologies (2025):
- ✅ **Next.js 15** with App Router & Turbopack (faster than Vite)
- ✅ **TypeScript 5** for type safety
- ✅ **MongoDB** with Prisma ORM
- ✅ **NextAuth.js v5** for authentication
- ✅ **Tailwind CSS 4** for styling
- ✅ **Zod** for validation

## Key Features

### For Creators
- Create quiz templates with multiple question types
- Add images, radio buttons, checkboxes, true/false questions
- Generate 6-digit codes for quiz sessions
- Track participant scores in real-time

### For Participants (NO ACCOUNT NEEDED!)
- Join with just a 6-digit code and name
- Answer questions and see immediate feedback
- View your score on the leaderboard

## 📋 Setup Steps

### 1. MongoDB Setup

You have two options:

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `.env` file:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/kuiz?retryWrites=true&w=majority"
```

#### Option B: Local MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Update .env
DATABASE_URL="mongodb://localhost:27017/kuiz"
```

### 2. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and update `.env`:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to MongoDB (creates collections)
npm run db:push

# Seed with demo data (includes World Flags quiz!)
npm run db:seed
```

### 4. Run the App

```bash
npm run dev
```

Visit: http://localhost:3000

## 🎮 Try It Out

### Demo Credentials
- **Email**: `demo@kuiz.app`
- **Password**: `password123`

### Test the Flag Quiz
1. Sign in with demo credentials
2. Go to Templates → "World Flags Quiz"
3. Click "Start Session"
4. Get a 6-digit code
5. Open a new browser window
6. Go to `/join`
7. Enter the code and your name
8. Start answering flag questions!

## 📁 Project Architecture

### Database Models

```
User (Creators only)
  ↓
Template (Quiz template)
  ↓
Question (Individual questions)
  ↓
Session (Active quiz with 6-digit code)
  ↓
Participant (Anonymous, no auth needed)
  ↓
Response (Answers submitted)
```

### Key Design Decisions

1. **Participants are anonymous** - Only creators need accounts
2. **6-digit codes** - Easy to share and remember
3. **MongoDB** - Flexible schema for different question types
4. **Turbopack** - Faster dev server than Vite
5. **Server Components** - Default in Next.js 15 for better performance

## 🎯 Question Types Supported

1. **MULTIPLE_CHOICE** - Radio buttons (single answer)
   - Example: "What is the capital of France?"
   
2. **CHECKBOX** - Multiple selections
   - Example: "Select all prime numbers"
   
3. **TRUE_FALSE** - Boolean
   - Example: "The Earth is flat"
   
4. **IMAGE_CHOICE** - Questions with images
   - Example: Flag identification 🇺🇸 🇬🇧 🇯🇵
   
5. **TEXT_INPUT** - Free text
   - Example: "Name this animal"

## 🔧 Available Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to MongoDB
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (GUI for database)
```

## 🌟 Pre-seeded Content

The `db:seed` command creates:

### Demo User
- Email: demo@kuiz.app
- Password: password123

### World Flags Quiz
- 20 countries with flag emojis
- Multiple choice questions
- 10 points per question
- 15 seconds time limit per question
- Includes: 🇺🇸 🇬🇧 🇯🇵 🇨🇦 🇩🇪 🇫🇷 🇮🇹 and more!

### Additional Templates
- Capital Cities Quiz
- Math Challenge
- Science Trivia

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Environment Variables

Set these in Vercel dashboard:
- `DATABASE_URL` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Generate with openssl
- `NEXTAUTH_URL` - Your production URL (e.g., https://kuiz.vercel.app)
- `NEXT_PUBLIC_APP_URL` - Same as NEXTAUTH_URL

## 📊 Useful Prisma Commands

```bash
# View database in browser
npm run db:studio

# Reset database (careful!)
npx prisma db push --force-reset

# Re-seed after reset
npm run db:seed
```

## 🐛 Troubleshooting

### "Failed to load config file"
- Make sure `.env` file exists
- Check that `DATABASE_URL` is set
- Run `npm install dotenv`

### "PrismaClient is not configured"
- Run `npm run db:generate`
- Restart your dev server

### "Cannot connect to MongoDB"
- Check your `DATABASE_URL` is correct
- For Atlas: Whitelist your IP address
- For local: Make sure MongoDB is running

### TypeScript errors
- Run `npm run build` to see all errors
- Make sure all imports are correct
- Clear `.next` folder: `rm -rf .next`

## 🎓 How It Works

### 1. Creator Flow
```
Sign In → Create Template → Add Questions → Start Session → Get Code → Share Code
```

### 2. Participant Flow
```
Visit /join → Enter Code → Enter Name → Answer Questions → See Score
```

### 3. Real-time Updates
- Responses are saved immediately
- Scores update automatically
- Host can see all participants

## 💡 Tips

1. **Use Prisma Studio** - Great way to visualize your data
   ```bash
   npm run db:studio
   ```

2. **Test with Multiple Windows** - Open different browsers to test multiplayer

3. **Use MongoDB Atlas Free Tier** - Perfect for development and small apps

4. **TypeScript Strict Mode** - Catches errors early

5. **Next.js 15 Features**:
   - React Server Components by default
   - Turbopack for faster builds
   - React Compiler for automatic optimization

## 📝 Next Steps

1. ✅ Set up MongoDB
2. ✅ Run `npm install`
3. ✅ Configure `.env`
4. ✅ Run database setup commands
5. ✅ Start dev server
6. ✅ Sign in with demo account
7. ✅ Test the World Flags quiz!

## 🤝 Need Help?

Check the main README.md for:
- Full API documentation
- Database schema details
- Deployment instructions
- Contributing guidelines

---

**Happy Quizzing! 🎉**
