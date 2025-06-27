# Approvia — Intelligent Investment Request Management

Approvia is a business-case-driven, AI-enhanced investment request and approval platform for modern finance, ESG, and operations teams. It replaces spreadsheets and static workflows with dynamic approvals, carbon impact tracking, ROI simulations, and intelligent automation.

🧭 Demo-ready, mobile-first, and tailored for CapEx + OpEx lifecycle visibility.

---

## 🚀 Key Features

✅ Multi-step Investment Request Form

- CapEx / OpEx allocation
- Multi-year spend projections
- Business case tagging (Compliance, ESG, Cost Control, Asset Creation, Expansion, IPO Prep)
- Supporting document upload (e.g., ESG reports, project plans)

✅ Dynamic Multi-level Approval Flows

- Routes based on amount, department, and business case
- Smart approval matrix (e.g., ESG → Sustainability Officer, IPO → CFO & Legal)
- Approval log with timestamps, comments, and trail

✅ Dashboard Analytics

- Investments by business case, department, year
- Real-time ROI, IRR, Payback
- Delay penalty tracker: how ROI is impacted by slow approvals
- Charts: CapEx/OpEx vs ROI, delays vs case type

✅ AI-Powered Insight Engine

- ROI reduction simulator based on delay
- Business case summary generator (OpenAI API)
- Smart flagging for missing documents or weak KPIs

✅ ESG & Carbon Calculator

- Track estimated CO₂ impact of investment
- Attach offset plans or mitigation estimates
- ESG audit flags

✅ Mobile-Ready & Slack/Teams Integration

- Approvers receive request notifications via Slack/Email
- Approve/reject with one click on any device

---

## 🧱 Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + File Storage)
- AI: OpenAI API (for text generation and insights)
- Notifications: Slack + Email (SendGrid/Mailgun)
- Hosting: Netlify (auto-deployed)

---

## 📊 Database Schema

1. InvestmentRequests

- ProjectTitle, Objective, Description
- CapEx, OpEx, TotalInvestment (calculated)
- BusinessCaseType (multi-select)
- SupportingDocuments (file)
- StartYear, EndYear, Department
- SubmittedBy, SubmittedDate, Status

2. KPIs

- ROI, IRR, PaybackPeriod
- BasisOfCalculation, CO₂Impact

3. ApprovalMatrix

- Role, Level, Department, BusinessCaseType, AmountMin, AmountMax

4. ApprovalLog

- RequestID, ApprovedBy, Role, Timestamp, Status, Comments

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key (optional)
- Slack webhook URL (optional)
- Email service API key (optional)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd Approvia
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env.local` and configure:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API (for AI insights)
VITE_OPENAI_API_KEY=your_openai_api_key

# Notifications (optional)
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
VITE_EMAIL_SERVICE=sendgrid
VITE_EMAIL_API_KEY=your_email_service_api_key
VITE_EMAIL_FROM=noreply@yourdomain.com
```

### 3. Database Setup

Run the Supabase migrations in order:

```bash
# Apply all migrations to your Supabase project
supabase db push
```

### 4. Storage Setup

Create a storage bucket in Supabase:

- Bucket name: `investment-documents`
- Public bucket for file access
- Set up RLS policies for security

### 5. Run Development

```bash
npm run dev
```

### 6. Deploy to Netlify

```bash
npm run build
# Deploy the dist folder to Netlify
```

---

## 📋 Implementation Status

### ✅ **Completed Features**

- ✅ Complete React + TypeScript frontend
- ✅ Supabase backend with full database schema
- ✅ Authentication system with role-based access
- ✅ Multi-step investment request form
- ✅ Dynamic approval matrix and routing
- ✅ Dashboard with analytics and charts
- ✅ ESG impact calculator
- ✅ AI-powered insights engine (rule-based)
- ✅ Approval tracker with workflow management
- ✅ Multi-currency support with exchange rates
- ✅ Mobile-responsive design
- ✅ File upload system
- ✅ Notification system (Slack + Email)
- ✅ OpenAI API integration

### 🔄 **Next Steps to Complete**

#### **1. Environment Configuration** (High Priority)

- [ ] Set up `.env.local` with your API keys
- [ ] Configure Supabase project URL and keys
- [ ] Add OpenAI API key for AI features
- [ ] Set up Slack webhook for notifications
- [ ] Configure email service (SendGrid/Mailgun)

#### **2. Database & Storage Setup** (High Priority)

- [ ] Apply all Supabase migrations
- [ ] Create storage bucket for file uploads
- [ ] Set up Row Level Security policies
- [ ] Test user authentication flow

#### **3. Integration Testing** (Medium Priority)

- [ ] Test OpenAI API integration
- [ ] Test notification system
- [ ] Test file upload functionality
- [ ] Test approval workflow end-to-end

#### **4. Production Deployment** (Medium Priority)

- [ ] Deploy to Netlify
- [ ] Configure custom domain
- [ ] Set up environment variables in Netlify
- [ ] Test production build

#### **5. Advanced Features** (Low Priority)

- [ ] Add more AI insights
- [ ] Implement advanced reporting
- [ ] Add user management features
- [ ] Create mobile app version

---

## 📎 Sample Use Case

🔹 Request: ₹5 Cr CapEx for solar installation  
🔹 Business Case: ESG + Cost Control  
🔹 Flow: Sustainability Officer → Ops Head → CFO  
🔹 Delay by 2 weeks → ROI drops from 21% → 18.4%  
🔹 Approver sees alert → takes action via Slack

---

## 🧠 Why Approvia?

→ Salesforce handles enterprise CapEx — but lacks ESG focus, ROI impact simulation, and AI-enhanced approvals.  
→ Approvia fills this gap — faster to deploy, easier to use, and smarter out-of-the-box.

🎯 Inspired by real-world feedback from the Global Practice Lead – FIS Global.

---

## 🤝 Team & Credits

- Designed & Developed by [Your Name]
- UI/UX powered by React + Tailwind CSS
- AI magic via OpenAI API
- Backend powered by Supabase

---

## 📜 License

MIT License - feel free to use and modify for your organization.
