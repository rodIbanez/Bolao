# Match Sync API - Quick Reference

## 🚀 What Was Created

### 1. **Database Migration**
- **File**: [add_external_sync_columns.sql](add_external_sync_columns.sql)
- **Purpose**: Adds `external_id`, `status`, `last_synced_at` columns to `matches` table
- **Action**: Run this SQL in Supabase SQL Editor

### 2. **API Routes**
- **Serverless**: [api/update-matches.ts](api/update-matches.ts) - For Vercel/Netlify deployment
- **Standalone**: [api/update-matches-standalone.js](api/update-matches-standalone.js) - For local/cron execution

### 3. **Configuration Files**
- [.env.example](.env.example) - Template for environment variables
- [vercel.json](vercel.json) - Vercel deployment config with cron
- [.github/workflows/sync-matches.yml](.github/workflows/sync-matches.yml) - GitHub Actions scheduler

### 4. **Documentation**
- [MATCH_SYNC_SETUP.md](MATCH_SYNC_SETUP.md) - Comprehensive setup guide

---

## ⚡ Quick Start (3 Steps)

### Step 1: Database Setup
```sql
-- Run in Supabase SQL Editor
-- File: add_external_sync_columns.sql
ALTER TABLE matches ADD COLUMN external_id TEXT UNIQUE;
-- ... (see file for complete migration)
```

### Step 2: Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Fill in your values:
FOOTBALL_DATA_API_KEY=your_key_here
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
MATCH_SYNC_SECRET=random_secret_123
```

### Step 3: Test Locally
```bash
# Run standalone script
npm run sync-matches
```

---

## 🌐 Deployment Options

### Option A: Vercel (Recommended)
```bash
vercel --prod
```
- Auto-deploys `api/update-matches.ts`
- Endpoint: `https://yourapp.vercel.app/api/update-matches`
- Cron requires Pro plan ($20/mo)

### Option B: GitHub Actions (Free)
1. Push to GitHub
2. Add secrets:
   - `SYNC_ENDPOINT`: Your API URL
   - `MATCH_SYNC_SECRET`: Your secret
3. Runs every 15 minutes automatically

### Option C: Server Cron
```bash
# Add to crontab
*/15 * * * * cd /path/to/project && npm run sync-matches >> /var/log/match-sync.log 2>&1
```

---

## 🔧 How It Works

### Architecture
```
football-data.org API 
    ↓ (every 15 min)
API Route (serverless function)
    ↓ (authenticated request)
Supabase Database
    ↓ (real-time)
Your App (auto-updates)
```

### Matching Logic
1. **Primary**: Match by `external_id` (100% accurate after first sync)
2. **Fallback**: Fuzzy match by `home_team_id` + `away_team_id` + `start_time` (same day)
3. **Team Mapping**: Uses `TEAM_MAPPING` dict to convert API names to DB IDs

### What Gets Synced
- ✅ Match scores (`actual_home_score`, `actual_away_score`)
- ✅ Match status (`SCHEDULED`, `IN_PLAY`, `FINISHED`, etc.)
- ✅ Start time adjustments
- ✅ External ID linking

---

## 📞 Manual Trigger

```bash
# Test endpoint
curl -X POST https://yourapp.vercel.app/api/update-matches \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "summary": {
#     "total": 64,
#     "updated": 32,
#     "created": 0,
#     "skipped": 32
#   },
#   "timestamp": "2026-02-17T10:30:00Z"
# }
```

---

## ⚠️ Important Notes

1. **API Limits**: Free tier = 10 requests/min, 100/day
2. **Security**: Use `Bearer` token in `Authorization` header
3. **Service Key**: Required for bypassing RLS policies
4. **Team Mapping**: Update `TEAM_MAPPING` with all 48 teams before first sync

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `MATCH_SYNC_SECRET` matches |
| 500 Server Error | Verify env vars in deployment dashboard |
| Teams not found | Update `TEAM_MAPPING` in API route |
| No updates | Check `external_id` is set after first sync |

---

## 📈 Next Steps

- [ ] Update `TEAM_MAPPING` with all WC 2026 teams
- [ ] Deploy to Vercel/Netlify
- [ ] Test with manual trigger
- [ ] Set up automated scheduling
- [ ] Add error notifications (Discord/Slack)
- [ ] Monitor sync logs

---

**Need help?** See [MATCH_SYNC_SETUP.md](MATCH_SYNC_SETUP.md) for detailed instructions.
