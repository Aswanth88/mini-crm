# Mini CRM
A lightweight Customer Relationship Management system built with modern web technologies. This mini-CRM helps small businesses manage their customer interactions, track leads, and streamline sales processes with integrated email automation.

## ✨ Features

**🚀 Lead Management System**
- Add leads manually via form or automatically from uploaded PDFs/Images using OCR
- Store and manage lead details: name, email, phone, status, source, company, title, address, industry, website, confidence score, and more
- Supports lead status tracking: New, Contacted, Qualified, Converted, Closed

**📥 Smart Document Upload**
- Drag-and-drop upload of documents (PDF/PNG)
- Extracts lead info like name and email using OCR (OpenRouter-powered)
- Calculates a confidence score based on the completeness of extracted info

**🏢 Company Intelligence**

- Company Dashboard: Dedicated company overview with key metrics and insights
- Business Analytics: Deep dive into company performance, revenue trends, and growth patterns
- Competitive Analysis: Track market position and competitor insights
- Financial Tracking: Revenue forecasting, deal value analysis, and ROI calculations

**🧠 Agentic AI Integration (Simulated LLM)**
- One-click "Chat" button opens a modal to interact with a mock LLM
- Handles queries like:
  - lead_details_request
  - follow_up_request
  - schedule_meeting
  - status_update
  - analytics_request
  - and more...

**📊 Advanced Dashboard**
- Sortable, searchable, and filterable lead table
- Filter by status or source
- Inline status update dropdown for each lead
- Beautiful UI with Tailwind CSS and animations via Framer Motion

**🧩 Workflow Designer (React Flow)**
- Drag-and-drop node editor to design workflows
- Trigger: "Lead Created" (fixed)
- Actions: "Send Email (3 types of templates)" or "Update Status"
- Conditions: "Check Status" or "Email Opened"
- Connect nodes visually; simulate execution with toast notifications
- Saving workflows in react state

**📧 SMTP Email Integration**
- Fully integrated SMTP email service for automated communications
- Support for multiple email templates (Welcome, Follow-up, Nurture)
- Real-time email sending with delivery confirmation
- Email logging and tracking capabilities
- Configurable SMTP settings (Gmail, Outlook, custom servers)
- HTML email templates with professional styling

**💬 Email Automation (FastAPI)**
- Send emails via the `/send-email` API (router included in backend)
- SMTP configuration management
- Email template rendering and personalization
- Logs sent emails and shows feedback in console
- Error handling and retry mechanisms

**⚙️ FastAPI Backend**
- `/ocr`: Process uploaded images and extract lead data
- `/llm`: Accepts prompt, lead info, and returns mock AI reply
- `/send-email`: Send emails via SMTP with template support
- `/health`: Returns app and service status
- Modular router structure for easy scaling

**🌐 Supabase Integration**
- All leads and metadata are stored in a PostgreSQL table on Supabase
- Constraints ensure clean data (e.g., allowed values for status, source)
- Uses Supabase JS client to insert, update, and delete leads
- Email activity logging in database

**🛡 Robust UX**
- Safe deletion with confirmation dialogs
- Input validation and fallback handling
- Custom 404 handler, startup logging, and structured logs
- Real-time email sending feedback

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Zustand
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **OCR**: Python-based OCR API (e.g. OpenRouter)
- **Email**: SMTP integration with configurable providers

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Aswanth88/mini-crm.git
cd mini-crm
```

### 2. Environment Configuration

Create a `.env` file in the root directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_USE_TLS=true

# API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 🚀 Frontend Setup

**Prerequisites:**
- Node.js >= 18
- npm or yarn

```bash
# Install dependencies
npm install
```

### 🧪 Development

To start the development server with Turbopack (blazing fast):
```bash
npm run dev
```
Opens the app at http://localhost:3000 by default.

### 🏗️ Build for Production

To create a production-ready build:
```bash
npm run build
```

To start the built app:
```bash
npm run start
```

### 🔍 Linting

To run lint checks:
```bash
npm run lint
```

### 🐍 Backend Setup

**Prerequisites:**
- Python >= 3.8
- pip

```bash
cd crm-backend
pip install -r requirements.txt
```

**Backend Dependencies:**
```bash
pip install fastapi uvicorn python-multipart supabase python-dotenv
pip install pillow pytesseract  # for OCR
pip install aiosmtplib email-validator jinja2  # for SMTP email
```

### 🚀 Start Backend Server

```bash
uvicorn main:app --reload --port 8000
```

### 🗄️ Supabase Setup

1. Create a Supabase project
2. Configure `supabaseUrl` and `supabaseAnonKey` in your `.env` file
3. Create the leads table using the provided schema:

```sql
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Closed')),
    source VARCHAR(100),
    company VARCHAR(255),
    title VARCHAR(255),
    address TEXT,
    industry VARCHAR(100),
    website VARCHAR(255),
    confidence_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

```

### 📧 SMTP Configuration

The system supports various email providers:

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an app password
3. Use `smtp.gmail.com:587` with TLS

**Outlook Setup:**
1. Use `smtp-mail.outlook.com:587`
2. Enable "Less secure app access" if needed

**Custom SMTP:**
Configure your SMTP server details in the `.env` file

### 🎯 Email Templates

The system includes three pre-built email templates:
- **Welcome Email**: Sent to new leads
- **Follow-up Email**: For ongoing communication
- **Qualification Email**: For lead who are converted

Templates are customizable and support dynamic content insertion.

### 📱 API Endpoints

- `GET /health` - Health check
- `POST /ocr` - OCR document processing
- `POST /llm` - AI chat interaction
- `POST /email/send` - Send email via SMTP
- `GET /email/templates` - Get available email templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions, please open an issue on GitHub or contact the maintainers.

---
