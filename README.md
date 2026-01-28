# ATS Resume Builder

An AI-powered SaaS application for tailoring resumes to job postings with ATS (Applicant Tracking System) optimization.

## Features

- **Base Resume Management**: Upload or paste your base resume once
- **Job Description Extraction**: Automatically extract requirements from job posting URLs
- **AI-Powered Tailoring**: Tailor your resume to match job requirements without hallucinating
- **ATS Optimization**: Get keyword analysis and coverage scores
- **Multiple Export Formats**: Export as DOCX (ATS-friendly), TXT, or PDF
- **Usage Tracking**: Monitor your resume generation usage
- **Subscription Management**: $5/month for up to 500 tailored resumes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Payments**: Razorpay
- **LLM**: Groq or OpenAI (pluggable adapter interface)

## Architecture

### Core Principles

1. **Canonical JSON Format**: All resumes are stored and edited as structured JSON. LLM only edits JSON, never raw DOCX/HTML.
2. **No Hallucination**: Strict constraints ensure the LLM never invents companies, dates, degrees, or achievements.
3. **ATS-Friendly**: Generated DOCX files follow ATS best practices (single column, no tables, simple formatting).

### Data Model

- `users`: User accounts with subscription info
- `base_resumes`: User's base resume (raw text + parsed JSON)
- `jobs`: Job postings with extracted requirements
- `tailored_resumes`: Tailored resumes with ATS analysis
- `usage_events`: Usage tracking for billing

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Groq API key (recommended) or OpenAI API key
- Razorpay account (for payments)

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq (Recommended - Fast and cost-effective)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-70b-versatile

# OR OpenAI / OpenRouter (Alternative)
# For standard OpenAI:
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_MODEL=gpt-4-turbo-preview
# For OpenRouter (e.g., gpt-oss-120b):
# OPENAI_API_KEY=sk-or-v1-your_openrouter_key
# OPENAI_BASE_URL=https://openrouter.ai/api/v1
# OPENAI_MODEL=openai/gpt-oss-120b

# LLM Provider (groq or openai)
LLM_PROVIDER=groq

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the migration file to create tables and RLS policies:

```sql
-- Run the SQL from supabase/migrations/001_initial_schema.sql
-- in your Supabase SQL editor
```

3. Enable email authentication in Supabase dashboard
4. Configure email templates if needed

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── app/               # Main app pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── lib/                   # Utility libraries
│   ├── llm/              # LLM adapter interface and implementations
│   ├── supabase/         # Supabase client setup
│   ├── export/           # DOCX/TXT export functions
│   ├── job-extractor.ts  # Job description extraction
│   └── usage-limits.ts   # Usage tracking and limits
├── types/                 # TypeScript type definitions
│   ├── resume.ts         # Resume JSON schema
│   └── database.ts        # Database types
├── supabase/
│   └── migrations/       # Database migrations
└── components/           # React components (if any)
```

## API Endpoints

- `POST /api/resume/base` - Create/update base resume
- `POST /api/job/from-url` - Extract job requirements from URL
- `POST /api/resume/tailor` - Tailor resume to job
- `POST /api/resume/export/docx` - Export as DOCX
- `POST /api/resume/export/txt` - Export as TXT
- `POST /api/razorpay/webhook` - Handle payment webhooks

## Usage Flow

1. **Sign Up/Login**: Create an account or sign in
2. **Add Base Resume**: Paste or upload your base resume text
3. **Add Job URL**: Paste a job posting URL
4. **Tailor Resume**: System extracts requirements and tailors your resume
5. **Preview & Export**: Review the tailored resume and export in desired format

## LLM Adapter

The system uses a pluggable LLM adapter interface, allowing you to swap providers:

```typescript
interface LLMAdapter {
  extractJobRequirements(jdText: string): Promise<JobRequirements>;
  parseResume(rawText: string): Promise<ResumeJSON>;
  tailorResume(baseResume: ResumeJSON, jobRequirements: JobRequirements): Promise<TailoredResume>;
}
```

Currently implemented:
- `GroqAdapter` - Uses Groq (Llama 3.1, Mixtral) - **Recommended** (fast & cost-effective)
- `OpenAIAdapter` - Uses OpenAI GPT-4 or OpenAI-compatible APIs (OpenRouter, Together AI, etc.)
  - Supports custom base URLs for services like OpenRouter
  - Can use models like `openai/gpt-oss-120b` through OpenRouter

To add a new provider, implement the `LLMAdapter` interface and update `lib/llm/index.ts`.

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- API routes verify authentication
- Webhook signature verification for Razorpay

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in your deployment platform.

## License

MIT

## Contributing

This is a production-ready MVP. When extending:

1. Maintain the canonical JSON format
2. Never allow LLM to hallucinate data
3. Keep ATS-friendly export formats
4. Follow existing code patterns
