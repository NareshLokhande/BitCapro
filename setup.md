# BitCapro Setup Guide

## 🚀 Quick Start Checklist

### Step 1: Environment Setup

1. **Copy environment file:**

   ```bash
   cp env.example .env.local
   ```

2. **Configure your `.env.local`:**

   ```bash
   # Required: Supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   # Optional: OpenAI (for AI features)
   VITE_OPENAI_API_KEY=sk-your_openai_key_here

   # Optional: Notifications
   VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   VITE_EMAIL_SERVICE=sendgrid
   VITE_EMAIL_API_KEY=SG.your_sendgrid_key
   VITE_EMAIL_FROM=noreply@yourdomain.com
   ```

### Step 2: Supabase Setup

1. **Create Supabase project** at https://supabase.com
2. **Get your project URL and anon key** from Settings > API
3. **Apply database migrations:**

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link your project
   supabase link --project-ref your-project-ref

   # Apply migrations
   supabase db push
   ```

4. **Create storage bucket:**
   - Go to Storage in Supabase dashboard
   - Create bucket named `investment-documents`
   - Set to public
   - Add RLS policy for authenticated users

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run Development Server

```bash
npm run dev
```

### Step 5: Test Core Features

1. **Authentication:** Sign up/login with test users
2. **Submit Request:** Create a new investment request
3. **Approval Flow:** Test approval workflow
4. **AI Insights:** Test AI-powered analysis (if OpenAI configured)
5. **Notifications:** Test Slack/email notifications (if configured)

## 🔧 Configuration Details

### Supabase RLS Policies

Your migrations already include RLS policies, but verify these tables have proper access:

- `user_profiles`
- `investment_requests`
- `approval_matrix`
- `approval_log`
- `kpis`

### Storage Bucket Policies

Add this policy to your `investment-documents` bucket:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'investment-documents');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'investment-documents');
```

### Test Users

The migrations create these test users:

- `admin@BitCapro.com` / `password123` (Admin)
- `ceo@BitCapro.com` / `password123` (CEO)
- `cfo@BitCapro.com` / `password123` (CFO)
- `john.doe@BitCapro.com` / `password123` (Submitter)

## 🚨 Common Issues & Solutions

### Issue: "Supabase client not initialized"

**Solution:** Check your `.env.local` has correct Supabase URL and anon key

### Issue: "File upload fails"

**Solution:**

1. Verify storage bucket exists and is public
2. Check RLS policies on storage bucket
3. Ensure bucket name matches `investment-documents`

### Issue: "AI insights not working"

**Solution:**

1. Add OpenAI API key to `.env.local`
2. Check API key is valid and has credits
3. Verify network connectivity

### Issue: "Notifications not sending"

**Solution:**

1. Check Slack webhook URL is valid
2. Verify email service API key
3. Test with simple message first

## 📱 Mobile Testing

Your app is mobile-responsive. Test on:

- iPhone Safari
- Android Chrome
- iPad Safari
- Desktop browsers

## 🚀 Production Deployment

### Netlify Deployment

1. **Connect your GitHub repo** to Netlify
2. **Set build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables** in Netlify dashboard
4. **Deploy!**

### Custom Domain

1. Add custom domain in Netlify
2. Update Supabase auth settings with new domain
3. Configure SSL certificate

## 📊 Monitoring & Analytics

### Supabase Dashboard

Monitor:

- Database performance
- Storage usage
- Authentication logs
- API usage

### Application Logs

Check browser console for:

- API errors
- Authentication issues

## 🔒 Security Checklist

- [ ] Supabase RLS policies configured
- [ ] Storage bucket policies set
- [ ] Environment variables secured
- [ ] API keys not exposed in client code
- [ ] HTTPS enabled in production
- [ ] Authentication flow tested

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase dashboard for database issues
3. Test API endpoints directly
4. Review environment configuration

## 🎯 Next Steps After Setup

1. **Customize branding** and colors
2. **Add your organization's** approval matrix
3. **Configure business case types** for your needs
4. **Set up user roles** and permissions
5. **Train team** on the platform
6. **Monitor usage** and optimize workflows
