# 🐳 Docker Setup for Kuiz

This project includes Docker support for easy deployment and development.

## 📦 What's Included

- **Dockerfile** - Multi-stage build for production
- **docker-compose.yml** - Full stack (App + MongoDB) for production
- **docker-compose.dev.yml** - MongoDB only for local development
- **.dockerignore** - Optimized Docker builds

## 🚀 Quick Start

### Option 1: Full Stack with Docker Compose (Recommended)

Run the entire application with MongoDB in Docker:

```bash
# Build and start everything
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

The app will be available at: http://localhost:3000

**Default credentials:**
- Email: `demo@kuiz.app`
- Password: `password123`

### Option 2: MongoDB Only (for local development)

Use Docker for MongoDB but run Next.js locally:

```bash
# Start MongoDB in Docker
docker-compose -f docker-compose.dev.yml up -d

# Update .env file
DATABASE_URL="mongodb://dev_user:dev_password@localhost:27017/kuiz_dev?authSource=admin"

# In another terminal, run Next.js locally
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Option 3: Build and Run Docker Image Manually

```bash
# Build the Docker image
docker build -t kuiz-app .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="your-mongodb-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  kuiz-app
```

## 🔧 Configuration

### Environment Variables

The `docker-compose.yml` includes default values. For production, update these:

```yaml
environment:
  - DATABASE_URL=mongodb://kuiz_user:kuiz_password@mongodb:27017/kuiz?authSource=admin
  - NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production  # ⚠️ CHANGE THIS!
  - NEXTAUTH_URL=http://localhost:3000
  - NEXT_PUBLIC_APP_URL=http://localhost:3000
```

To generate a secure secret:
```bash
openssl rand -base64 32
```

### MongoDB Credentials

Default MongoDB credentials in `docker-compose.yml`:
- **Username**: `kuiz_user`
- **Password**: `kuiz_password`
- **Database**: `kuiz`

**⚠️ Change these for production!**

## 📊 Useful Docker Commands

### Application Management

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs app
docker-compose logs mongodb

# Follow logs
docker-compose logs -f

# Restart services
docker-compose restart app
docker-compose restart mongodb

# Execute commands in running container
docker-compose exec app sh
docker-compose exec mongodb mongosh
```

### Database Management

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u kuiz_user -p kuiz_password kuiz

# Backup database
docker-compose exec mongodb mongodump --out=/data/backup

# View database size
docker-compose exec mongodb mongosh -u kuiz_user -p kuiz_password --eval "db.stats()"
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker rmi kuiz-app

# Clean up all unused Docker resources
docker system prune -a
```

## 🏗️ Dockerfile Explained

The Dockerfile uses a **multi-stage build** for optimization:

1. **deps** - Install dependencies
2. **builder** - Build the Next.js app
3. **runner** - Minimal production image

Benefits:
- Smaller image size (~200MB vs 1GB+)
- Faster builds with layer caching
- More secure (only runtime dependencies)

## 🔍 Troubleshooting

### "Cannot connect to MongoDB"

**Solution 1:** Wait for MongoDB to be ready
```bash
# Check if MongoDB is healthy
docker-compose ps
```

**Solution 2:** Verify connection string
```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh -u kuiz_user -p kuiz_password kuiz
```

### "Prisma Client not generated"

The Dockerfile automatically runs `prisma generate`. If issues persist:

```bash
# Rebuild without cache
docker-compose build --no-cache app
```

### "Port 3000 already in use"

**Solution 1:** Stop local Next.js
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Solution 2:** Change the port in `docker-compose.yml`
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### "Out of memory" during build

Increase Docker memory:
- Docker Desktop → Settings → Resources → Memory (increase to 4GB+)

### Seed data not appearing

The app automatically runs seed on first start. To manually seed:

```bash
# Access the container
docker-compose exec app sh

# Run seed manually
npx prisma db seed
```

## 🚀 Production Deployment

### Environment Variables for Production

Create a `.env.production` file:

```env
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/kuiz?retryWrites=true&w=majority
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Deploy to Cloud Platforms

#### Railway / Render

1. Connect GitHub repository
2. Detect Dockerfile automatically
3. Set environment variables
4. Deploy!

#### AWS / GCP / Azure

```bash
# Build for your platform
docker build --platform linux/amd64 -t kuiz-app .

# Tag and push to registry
docker tag kuiz-app your-registry/kuiz-app
docker push your-registry/kuiz-app
```

#### Kubernetes

Create deployment.yaml and service.yaml (not included, but straightforward with the Docker image)

## 📈 Performance Tips

1. **Use external MongoDB** for production (MongoDB Atlas)
2. **Enable caching** - Redis for session storage
3. **Use CDN** - For static assets
4. **Scale horizontally** - Run multiple app containers
5. **Monitor** - Add health checks and logging

## 🔐 Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use HTTPS in production
- [ ] Enable MongoDB authentication
- [ ] Limit MongoDB ports (don't expose 27017 publicly)
- [ ] Use environment-specific secrets
- [ ] Enable rate limiting
- [ ] Regular security updates

## 📝 Docker Compose Services

### App Service
- Built from Dockerfile
- Depends on MongoDB
- Auto-runs Prisma migrations and seed
- Exposes port 3000

### MongoDB Service
- Official MongoDB image
- Persistent volume for data
- Health checks enabled
- Root credentials configurable

## 🎯 Next Steps

1. ✅ Review and update environment variables
2. ✅ Change default passwords
3. ✅ Test locally: `docker-compose up`
4. ✅ Access at http://localhost:3000
5. ✅ Login with demo credentials
6. ✅ Deploy to production!

---

**Need help?** Check the main README.md or SETUP.md for more information.
