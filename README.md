# ClientSphere - Mini CRM (Client Lead Management System)

A polished, production-ready, and feature-rich Web-based Mini CRM designed to help small business owners, agencies, and freelancers track and manage incoming client leads, follow-up interactions, and pipeline conversion rates in real-time.

---

## 🎨 Theme & Aesthetic

- **Design Tone**: Ultra-polished Swiss-minimal layout styled with a gorgeous **Purple, Slate, and Lavender** palette.
- **Glassmorphic Touch**: UI widgets use frosted transparency, borders, and ambient light shadows to establish a professional look.
- **Micro-interactions**: Clean and smooth transitions for button hover states, row selections, and modal panels.
- **Adaptive Canvas**: Custom dark mode state that toggles the entire container workspace between premium light backgrounds and deep cosmic designs.

---

## ✨ Features Checklist

1. **Secure Admin Authentication**
   - Hashed password validation (with `bcryptjs`)
   - Signed token creation (with `jsonwebtoken`) and protection middleware
   - Session persistence on browser reloads

2. **Performance Dashboard Overview**
   - KPI metrics: Total leads, new inbox status counts, contacted leads, converted clients
   - Primary Conversion Rate percentage gauge
   - Recente lead lists with 1-click controls
   - Quick launch panel to create inquiries instantly

3. **Lead Management Directory**
   - Standard CRUD: Add, edit core details, and delete lead folder profiles
   - Advanced filtering: Status, traffic acquisition channels, query searching
   - Dynamic sorting (Latest vs Oldest submission dates)
   - Built-in pagination controls

4. **Timeline Activity Logs**
   - Multiple follow-up log histories per client
   - Action timestamps
   - Notes CRUD: create, edit contents, and delete activity logs

5. **Analytics and Visualizations**
   - Responsive **Pie Chart** tracing acquisition proportions
   - Vertical **Bar Chart** mapping funnel status loads
   - Custom **Area Chart** plotting historical submissions frequency

6. **Bonus Utilities**
   - **CSV Exporter**: Fetch current loaded records and download them instantly in formatted CSV spreadsheets.
   - **Dynamic Theme Engine**: Persistent Dark Mode toggler.
   - **Admin Profile Setup**: Demonstrates how data moves between secure folders.

---

## 📁 Folder Structure

```text
/
├── data/                    # JSON simulated database directory (seeded initially)
│   ├── admins.json
│   └── leads.json
├── server/                  # Fullstack backend logic
│   └── db.ts                # Database transaction controller & analytics engine
├── src/                     # React Single Page Application
│   ├── components/          # Modularized view widgets
│   │   ├── AnalyticsView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── LeadDetailsView.tsx
│   │   ├── LeadsView.tsx
│   │   ├── LoginView.tsx
│   │   ├── RegisterView.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopNavbar.tsx
│   ├── utils/
│   │   └── api.ts           # Axios-like unified fetch client wrapping JWT injection
│   ├── types.ts             # Consolidated TypeScript structures
│   ├── App.tsx              # Main orchestrator & routing gates
│   ├── index.css            # Tailwind stylesheets
│   └── main.tsx             # React entry mountpoint
├── server.ts                # Express server entry hosting API routes & Vite middleware
├── package.json             # Build script instructions
└── tsconfig.json            # TypeScript specifications
```

---

## 🛠️ Getting Started & Installation

### Prerequisite Environment

Ensure you have **Node.js (v18+)** installed.

Configure environment variables in `.env` (refer to `.env.example`):
```env
# Required Express session authentication key
JWT_SECRET="mini_crm_lavender_secret_xyz"
```

### Installation Steps

1. Install required packages:
   ```bash
   npm install
   ```

2. Run development mode:
   ```bash
   npm run dev
   ```
   Open your browser to the designated URL. Access using the seeded evaluation credentials:
   - **Email**: `admin@crm.com`
   - **Password**: `admin123`

3. Compile production bundle:
   ```bash
   npm run build
   ```

4. Boot compiled server:
   ```bash
   npm start
   ```

---

## 🛢️ MongoDB Schema Design

The datastore in `server/db.ts` mimics a standard MongoDB Mongoose architecture. To connect to an active MongoDB instance, replace `server/db.ts` file operations with standard Mongoose models:

### 1. Admin Model
```javascript
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
```

### 2. Lead Model
```javascript
const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  company: { type: String, default: "" },
  source: { 
    type: String, 
    enum: ['Website', 'Portfolio', 'LinkedIn', 'Referral', 'Facebook', 'Instagram', 'Other'],
    default: 'Other' 
  },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Converted'], 
    default: 'New' 
  },
  notes: [NoteSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

---

## 📡 REST APIs Documentation

All data paths require a signed header token `Authorization: Bearer <JWT_TOKEN>`.

### Authentication Endpoints
- `POST /api/auth/register` : Create a secure administrator profile.
- `POST /api/auth/login` : Confirm admin secrets and return JWT.
- `GET /api/auth/profile` : Read secure token profiles.

### Lead Records CRUD Endpoints
- `GET /api/leads` : Filter and search leads with pagination handles.
- `GET /api/leads/:id` : Fetch detailed single file information.
- `POST /api/leads` : Log an incoming enquiry profile.
- `PUT /api/leads/:id` : Update core identity credentials.
- `DELETE /api/leads/:id` : Evict lead folders.

### Timeline Notes Endpoints
- `POST /api/leads/:id/notes` : Commit an activity follow-up.
- `PUT /api/leads/:id/notes/:noteId` : Edit logged note contents.
- `DELETE /api/leads/:id/notes/:noteId` : Erase note logs.

### Aggregate Performance Endpoints
- `GET /api/analytics` : Retrieve pipeline calculations, percentages and counts.

---

## 🚀 Deploying to GitHub Pages (Both Ways)

Since the React SPA frontend operates directly with Firebase (Auth, Firestore, and Storage) client-side, you can host your application's user interface completely for free on **GitHub Pages**. 

You can deploy the app to GitHub Pages using **two convenient methods**:

### Method A: Directly from the Terminal (Manual Deploy)

This method lets you deploy the application to GitHub Pages instantly from your local development environment using your terminal.

1. **Host Configuration Check**:
   Make sure you have specified your repository URL correctly in `package.json` if needed, or that your remote `origin` is set.
2. **Run Deploy Command**:
   Execute the following command in your terminal:
   ```bash
   npm run deploy
   ```
3. **What is happening under the hood**:
   - `npm run deploy` triggers `predeploy` which runs `npm run build` to compile the production-ready static assets into the `/dist` directory.
   - It then invokes `gh-pages -d dist` to automatically create/verify a `gh-pages` branch, push the static built assets there, and trigger GitHub's hosting container.

---

### Method B: Automatically via GitHub Actions (Continuous Delivery)

A custom workflow is already pre-configured in `.github/workflows/deploy.yml`. This automatically rebuilds and deploys your application on every push to your repository branches.

1. **Commit and Push Your Code**:
   Commit your changes and push them to your repository:
   ```bash
   git add .
   git commit -m "Deploy update"
   git push origin main
   ```
2. **Enable GitHub Pages settings in your repository**:
   - Go to your GitHub repository in your web browser.
   - Click on **Settings** -> **Pages**.
   - Under **Build and deployment** -> **Source**, select **GitHub Actions** (instead of Deploy from a branch).
3. **Monitor with Actions Tab**:
   Click on the **Actions** tab in your repository. You will see the **Deploy React App to GitHub Pages** workflow compiling and deploying your site automatically!

