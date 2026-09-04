# KarigarAI — From Handmade to Market-Ready in Minutes 🎨✨

**KarigarAI** is an AI-powered e-commerce enablement platform created for Indian traditional artisans, craftspeople, and micro-entrepreneurs. It transforms raw craft photos and vernacular voice notes into market-ready digital products with automated visual analysis, studio image enhancement, multilingual catalogue copywriting, explainable cost-plus smart pricing, and an AI Business Advisor.

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [Folder Structure](#4-folder-structure)
5. [Installation](#5-installation)
6. [Environment Variables](#6-environment-variables)
7. [How to Run Backend](#7-how-to-run-backend)
8. [How to Run Frontend](#8-how-to-run-frontend)
9. [MongoDB Setup](#9-mongodb-setup)
10. [API Documentation](#10-api-documentation)
11. [Database Schema](#11-database-schema)
12. [AI Workflow](#12-ai-workflow)
13. [Authentication Architecture](#13-authentication-architecture)
14. [Image Workflow](#14-image-workflow)
15. [Pricing Workflow](#15-pricing-workflow)
16. [Demo Mode](#16-demo-mode)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Project Overview
Traditional Indian artisans create exquisite handcrafted products (pottery, handlooms, woodwork, metalware, folk paintings) but face high digital entry barriers: difficulty writing e-commerce product titles/descriptions, complex pricing models, poor product photography, and lack of marketing expertise.

**KarigarAI** solves this with an intuitive, mobile-first, multi-lingual platform powered by multimodal AI and smart fallback engines.

---

## 2. Key Features
- 🔐 **Artisan Authentication**: JWT-secured login/registration with profile & craft hub isolation.
- 📸 **AI Multimodal Vision Analysis**: Detects craft attributes, materials, colors, and visual characteristics automatically from craft photos.
- 🎨 **Product Photo Studio**: AI background removal & studio lighting enhancement with live side-by-side before/after comparison slider.
- 🎙️ **Vernacular Speech-to-Text**: Converts spoken artisan notes (English, Hindi, Gujarati) into clean product descriptions.
- ✍️ **Multilingual Catalogue Copywriter**: Generates titles, descriptions, keywords, tags, and target audience personas in English, Hindi (हिन्दी), and Gujarati (ગુજરાતી).
- 💰 **Explainable Cost-Plus Smart Pricing**: Transparent price recommendations with cost breakdown, margin sliders, demand tiering, and market benchmarks.
- 🛍️ **Marketplace Preview & Export**: Live buyer view simulator with JSON/CSV catalog export.
- 💡 **AI Business Advisor**: Practical selling recommendations (titles, keywords, pricing strategy, target audience, festival & gift positioning, photo & description tips) with zero unrealistic revenue promises.
- 🎨 **Robust Offline Demo Mode**: Seamless offline/fallback operation with prepared demo data (*Bandhani Dupatta*, *Handmade Bag*, *Traditional Painting*).

---

## 3. Technology Stack
- **Frontend**: React 18, Vite, React Router DOM v6, Lucide Icons, Vanilla CSS (Design Tokens).
- **Backend**: Node.js, Express.js REST API.
- **Database**: MongoDB & Mongoose ORM.
- **AI Integrations**:
  - Google Gemini Multimodal API (`gemini-1.5-flash`)
  - OpenAI API (`gpt-4o-mini`, Whisper)
  - Remove.bg API (Studio Background Removal)
  - Native Karigar Heuristic Engine (Smart Offline Fallback)

---

## 4. Folder Structure
```
karigar-ai/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment and DB configuration
│   │   ├── controllers/      # Route logic handlers (Auth, Product, AI, Pricing, Catalogue, Advisor)
│   │   ├── middleware/       # JWT auth & error handling middleware
│   │   ├── models/           # Mongoose DB Schemas (User, Product)
│   │   ├── routes/           # Express REST endpoints
│   │   ├── services/         # Business logic layer & AI API callers
│   │   └── app.js            # Express app configuration
│   ├── server.js             # Server execution entrypoint
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── assets/           # Logos & SVG graphics
│   │   ├── components/       # Reusable UI components (Input, Button, Card, Modal, Loader, Toast, etc.)
│   │   ├── context/          # Auth Context provider
│   │   ├── pages/            # View pages (Dashboard, AddProduct, Studio, Catalogue, Pricing, Advisor, etc.)
│   │   ├── services/         # API client services & demo data
│   │   ├── styles/           # Global CSS & design system tokens
│   │   ├── App.jsx           # React App router
│   │   └── main.jsx          # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 5. Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB instance (Local or MongoDB Atlas)

```bash
# Clone the repository
git clone <repository-url>
cd karigar-ai
```

### Install Backend Dependencies
```bash
cd backend
npm install
```

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## 6. Environment Variables

### Backend `.env` (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/karigar-ai
JWT_SECRET=karigar_ai_super_secret_jwt_key_2026

# AI API Keys (Optional - Fallbacks activate automatically if unconfigured)
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
REMOVE_BG_API_KEY=your_remove_bg_api_key
IMAGE_ENHANCE_API_KEY=your_image_enhance_key
```

### Frontend `.env` (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. How to Run Backend
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

---

## 8. How to Run Frontend
```bash
cd frontend
cmd /c npm run dev
# SPA starts on http://localhost:3000 (or http://localhost:5173)
```

---

## 9. MongoDB Setup
1. **Local MongoDB**: Ensure `mongod` service is running locally on port 27017.
2. **MongoDB Atlas**: Set `MONGODB_URI` in `backend/.env` to your connection string.
3. The app automatically creates collections (`users`, `products`) upon initial registration or product upload.

---

## 10. API Documentation

| Method | Endpoint | Purpose | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new artisan | No |
| `POST` | `/api/auth/login` | Authenticate artisan & return JWT | No |
| `GET` | `/api/auth/profile` | Get current artisan profile | Yes |
| `GET` | `/api/products` | Get all products for logged-in artisan | Yes |
| `POST` | `/api/products` | Create new product document | Yes |
| `GET` | `/api/products/:id` | Get single product details | Yes |
| `PUT` | `/api/products/:id` | Update product details | Yes |
| `DELETE`| `/api/products/:id` | Delete product | Yes |
| `POST` | `/api/products/:id/image` | Upload craft photo | Yes |
| `POST` | `/api/ai/analyze-image` | Multimodal AI visual analysis | Yes |
| `POST` | `/api/ai/enhance-image` | AI studio image enhancement | Yes |
| `POST` | `/api/ai/speech-to-text` | Vernacular speech transcription | Yes |
| `POST` | `/api/ai/generate-catalogue` | Multilingual AI copywriter | Yes |
| `POST` | `/api/products/:id/pricing` | Calculate explainable pricing | Yes |
| `POST` | `/api/ai/advisor` | Get AI Business Advisor advice | Yes |

---

## 11. Database Schema

### `User` Collection Schema
```javascript
{
  name: String (Required),
  email: String (Required, Unique),
  password: String (Required, Hashed with bcrypt),
  craftType: String,
  location: String,
  experienceYears: Number,
  language: String,
  createdAt: Date,
  updatedAt: Date
}
```

### `Product` Collection Schema
```javascript
{
  artisan: ObjectId (Ref: 'User', Index),
  name: String (Required),
  description: String,
  category: String,
  material: String,
  craftType: String,
  originalImage: String,
  enhancedImage: String,
  price: Number (Required),
  materialCost: Number,
  labourCost: Number,
  packagingCost: Number,
  otherCost: Number,
  tags: [String],
  language: String,
  status: Enum ['Draft', 'Published', 'Market-Ready', 'Archived'],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 12. AI Workflow
1. **Visual Image Analysis**: Uploaded photo -> Gemini / OpenAI Multimodal Vision -> Strict JSON attribute extraction (`productType`, `material`, `craftType`, `colors`, `characteristics`).
2. **Speech Transcription**: Voice clip -> Gemini Multimodal Audio / OpenAI Whisper -> Transcript text in native script or transliteration.
3. **Multilingual Catalogue Copywriting**: Inputs (Visuals + Voice + Specs) -> LLM -> JSON (`title`, `shortDescription`, `description`, `category`, `material`, `craftType`, `keywords`, `tags`, `targetAudience`).
4. **AI Business Advisor**: Product Context + Query -> LLM -> Categorized strategy (Title, Keywords, Pricing, Target Audience, Festival, Gifting, Photo & Description tips, Selling tactics, Ethical Disclaimer).

---

## 13. Authentication Architecture
- Passwords hashed using `bcryptjs` (salt rounds: 10).
- Stateless JWT Tokens issued on login/registration (expires in 30 days).
- Handled via `protect` middleware (`Authorization: Bearer <token>`).
- Database ownership checks enforce that artisans can only view/edit/delete their own products.

---

## 14. Image Workflow
- Image Upload -> File Validation (MIME type check, Max 5MB size limit).
- Conversion to Base64 / Local Storage in `/uploads/products/`.
- Studio Processing: Background removal (RemoveBG / Studio Pipeline) + Lighting normalization + 1:1 Aspect centering.

---

## 15. Pricing Workflow
- Cost-Plus Base Formula: $\text{Base Cost} = \text{Material} + \text{Labour} + \text{Packaging} + \text{Other}$
- Suggested Margin: 35% - 50%
- AI Demand Adjustments:
  - Festive Season: +15%
  - Rare Heritage Craft: +20%
- Explainable Cost Breakdown Output: Direct cost transparency for buyers, margin sliders, and benchmark price range.

---

## 16. Demo Mode
- **Zero-Failure Guarantee**: When external AI APIs are absent or offline, KarigarAI automatically switches to native Smart Heuristic Fallback engines.
- **Prepared Demo Craft Items**:
  1. **Bandhani Dupatta** (*Kutch Silk Bandhani Dupatta*)
  2. **Handmade Bag** (*Handcrafted Jute Embroidered Tote Bag*)
  3. **Traditional Painting** (*Pattachitra Traditional Heritage Folk Painting*)
- **Clear Identification**: Fallback items and heuristic outputs are prominently tagged with `🎨 [Demo Fallback]` badges.

---

## 17. Troubleshooting
- **Port 5000 in use**: Change `PORT` in `backend/.env` to `5001` and update `VITE_API_URL` in `frontend/.env`.
- **PowerShell Execution Policy Error on Windows**: Run frontend dev/build using `cmd /c npm run dev` or `cmd /c npm run build`.
- **MongoDB Connection Error**: Ensure local MongoDB service is running or check your MongoDB Atlas credentials.

---

**KARIGARAI DEVELOPMENT COMPLETE — STEP 16/16**
