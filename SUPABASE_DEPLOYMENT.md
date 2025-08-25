# 🚀 Supabase Deployment Guide for Cinekinetic API

## Why Supabase?
- **Production-ready PostgreSQL database** with automatic backups
- **Built-in authentication** with social logins
- **Real-time subscriptions** for live updates
- **File storage** for media assets
- **Auto-generated APIs** for your database
- **Free tier** perfect for getting started

## Quick Setup with Supabase

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login
3. Click "New Project"
4. Fill in:
   - Project name: `cinekinetic-api`
   - Database password: (save this securely!)
   - Region: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is created, go to:
- **Settings → API** for:
  - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
  - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
  - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

- **Settings → Database** for:
  - Connection string → DATABASE_URL (use the "Connection pooling" one)
  - Direct connection → DIRECT_URL

### 3. Configure Your Local Environment

```bash
# Clone the repository
git clone https://github.com/TheVoodooSoul/CinaKZ.git
cd CinaKZ

# Install dependencies
npm install

# Install Supabase client (if not already installed)
npm install @supabase/supabase-js

# Copy Supabase environment template
cp .env.supabase.example .env

# Edit .env with your Supabase credentials
nano .env  # or use your preferred editor
```

### 4. Update Your .env File

Replace the placeholders with your actual values:
```env
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### 5. Push Database Schema to Supabase

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Optional: If you have existing data to migrate
npm run db:migrate
```

### 6. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Deploy to Vercel with Supabase

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Supabase"
git push origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - All variables from your `.env` file
   - Make sure to use production values
4. Deploy!

### 3. Configure Supabase for Production
In Supabase dashboard:
1. Go to **Authentication → URL Configuration**
2. Add your Vercel URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/*`

## Using Supabase Features

### Authentication
```typescript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Real-time Subscriptions
```typescript
// Subscribe to changes
const subscription = supabase
  .channel('changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe()
```

### File Storage
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('media')
  .upload('path/to/file.jpg', file)

// Get public URL
const { data } = supabase.storage
  .from('media')
  .getPublicUrl('path/to/file.jpg')
```

## Database Schema Management

### Using Prisma with Supabase
```bash
# Pull existing schema from Supabase
npx prisma db pull

# Generate migrations
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy
```

### Direct SQL Access
You can also run SQL directly in Supabase:
1. Go to SQL Editor in Supabase dashboard
2. Write and execute your SQL
3. Save queries as templates

## Monitoring & Analytics

Supabase provides built-in monitoring:
- **Database → Reports**: Query performance
- **Database → Logs**: Real-time logs
- **Storage → Usage**: File storage metrics
- **Auth → Users**: User management

## Troubleshooting

### Connection Issues
```bash
# Test database connection
npx prisma db pull

# If connection fails, check:
# 1. Firewall/IP restrictions in Supabase
# 2. Correct password in connection string
# 3. SSL requirements
```

### Migration Issues
```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Force push schema (overwrites database)
npx prisma db push --force-reset
```

### Performance Optimization
1. Enable **Row Level Security (RLS)** in Supabase
2. Create indexes for frequently queried columns
3. Use connection pooling (already configured)
4. Enable **Prisma query optimization**

## Free Tier Limits
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

## Upgrading to Pro
When you need more resources:
- $25/month for Pro tier
- 8 GB database
- 100 GB storage
- 250 GB bandwidth
- No user limits

## Security Best Practices

1. **Enable RLS** for all tables
2. **Use service role key** only on server-side
3. **Never expose** service role key to client
4. **Set up** proper CORS policies
5. **Enable** 2FA for your Supabase account
6. **Rotate** API keys regularly

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/TheVoodooSoul/CinaKZ/issues)

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Push schema to database
4. ✅ Test locally
5. 🚀 Deploy to production
6. 📊 Monitor usage
7. 🎯 Scale as needed

---

Ready to launch with Supabase! 🚀
