# Match Sync API - Setup Guide

## Overview

Automated match synchronization from **football-data.org** API to your Supabase database.

---

## 🚀 Quick Setup

### 1. Database Migration

Run the migration to add required columns:

```sql
-- Execute: add_external_sync_columns.sql
```

This adds:
- `external_id` - Maps to football-data.org match IDs
- `status` - Match status (SCHEDULED, IN_PLAY, FINISHED, etc.)
- `last_synced_at` - Last sync timestamp
- `full_time_home_score` / `full_time_away_score` - Final scores

### 2. Get API Key

1. Sign up at [football-data.org](https://www.football-data.org/)
2. Get your free API key (or subscribe for more requests)
3. Free tier: 10 requests/minute, 100/day

### 3. Configure Environment Variables

Create/update `.env` with:

```bash
# Football Data API
FOOTBALL_DATA_API_KEY=your_api_key_here

# Supabase (Service Role for admin operations)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Security: Secret to authorize sync requests
MATCH_SYNC_SECRET=your_random_secret_here_generate_strong_one
```

### 4. Deploy API Route

#### Option A: Vercel (Recommended)

1. Create `vercel.json`:
```json
{
  "functions": {
    "api/*.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

2. Deploy:
```bash
vercel --prod
```

Your endpoint: `https://your-app.vercel.app/api/update-matches`

#### Option B: Netlify

1. Create `netlify.toml`:
```toml
[functions]
  directory = "api"
  node_bundler = "esbuild"
```

2. Deploy via Netlify CLI or Git integration

#### Option C: Standalone Script (Development/Testing)

Run locally:
```bash
node api/update-matches-standalone.js
```

---

## 📡 Usage

### Manual Trigger

```bash
curl -X POST https://your-app.vercel.app/api/update-matches \
  -H "Authorization: Bearer YOUR_MATCH_SYNC_SECRET" \
  -H "Content-Type: application/json"
```

### Automated Scheduling

#### Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/update-matches",
    "schedule": "*/15 * * * *"
  }]
}
```

**Note**: Vercel Cron requires Pro plan.

#### GitHub Actions (Free Alternative)

Create `.github/workflows/sync-matches.yml`:
```yaml
name: Sync Matches

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Match Sync
        run: |
          curl -X POST ${{ secrets.SYNC_ENDPOINT }} \
            -H "Authorization: Bearer ${{ secrets.MATCH_SYNC_SECRET }}"
```

#### Alternative: Supabase Edge Function + pg_cron

Schedule directly in Supabase (advanced).

---

## 🔧 Team Mapping

The API route includes a `TEAM_MAPPING` dictionary. Update it with your teams:

```typescript
const TEAM_MAPPING: Record<string, string> = {
  'Brazil': 'BRA',
  'Argentina': 'ARG',
  // Add all 48 World Cup 2026 teams
};
```

**Pro Tip**: After first sync, the `external_id` makes future syncs 100% accurate without fuzzy matching.

---

## 📊 Response Format

Success:
```json
{
  "success": true,
  "summary": {
    "total": 64,
    "updated": 32,
    "created": 0,
    "skipped": 32
  },
  "timestamp": "2026-02-17T10:30:00.000Z"
}
```

Error:
```json
{
  "success": false,
  "error": "FOOTBALL_DATA_API_KEY not configured",
  "timestamp": "2026-02-17T10:30:00.000Z"
}
```

---

## 🛡️ Security

1. **Never commit** `.env` files
2. Use **service role key** (not anon key) for admin operations
3. Rotate `MATCH_SYNC_SECRET` periodically
4. Use Vercel/Netlify environment variables for production

---

## 🧪 Testing

1. **Dry run**: Comment out Supabase updates, just log data
2. **Check mapping**: Verify all teams resolve correctly
3. **Monitor logs**: Check Vercel/Netlify function logs

---

## 📈 Monitoring

- **Vercel**: Dashboard > Functions > Logs
- **Netlify**: Functions tab
- **Supabase**: Check `last_synced_at` timestamps

---

## 🔄 Migration from Manual Updates

If you have existing matches without `external_id`:

1. Run sync once
2. Check `errors` in response for unmapped teams
3. Manually set `external_id` for matched rows
4. Re-run sync to update scores

---

## 💡 Next Steps

1. Add **error notifications** (email, Slack, Discord)
2. Implement **retry logic** for failed syncs
3. Track **sync history** in a `sync_logs` table
4. Add **real-time updates** via WebSocket when match status changes
5. Create **admin dashboard** to view sync status

---

## ⚠️ API Limits

Free tier: **10 requests/min, 100/day**

- 1 request = all matches for competition
- Schedule syncs conservatively (every 15-30 min during matches)
- Consider paid tier for live match days

---

## 🐛 Troubleshooting

**401 Unauthorized**
- Check `MATCH_SYNC_SECRET` matches in request header

**500 Server Error**
- Verify environment variables are set
- Check Supabase service key has proper permissions
- Review function logs for detailed errors

**Teams not found**
- Update `TEAM_MAPPING` with correct team names
- Check football-data.org API docs for exact team names

---

## 📞 Support

- Football Data API Docs: https://docs.football-data.org/
- Vercel Functions: https://vercel.com/docs/functions
- Supabase RLS: Ensure service key bypasses RLS policies
