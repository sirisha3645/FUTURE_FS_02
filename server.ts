import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { DB } from './server/db';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mini_crm_lavender_secret_xyz';

// Middleware for parsing JSON data
app.use(express.json());

// Logger middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required (Unauthorized)' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token is expired or invalid (Forbidden)' });
    }
    req.user = decoded;
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION APIs
// ==========================================

// POST /api/auth/register
app.post('/api/auth/register', async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingAdmin = await DB.admins.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newAdmin = await DB.admins.create(name, email, passwordHash);

    // Sign jwt token
    const token = jwt.sign({ id: newAdmin.id, email: newAdmin.email, name: newAdmin.name }, JWT_SECRET, {
      expiresIn: '24h',
    });

    return res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: newAdmin
    });
  } catch (error: any) {
    console.error('Error during register:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const adminWithHash = await DB.admins.findByEmail(email);
    if (!adminWithHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, adminWithHash.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const secureAdmin = {
      id: adminWithHash.id,
      name: adminWithHash.name,
      email: adminWithHash.email,
      createdAt: adminWithHash.createdAt
    };

    const token = jwt.sign({ id: secureAdmin.id, email: secureAdmin.email, name: secureAdmin.name }, JWT_SECRET, {
      expiresIn: '24h',
    });

    return res.json({
      message: 'Login successful',
      token,
      admin: secureAdmin
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const admin = await DB.admins.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }
    return res.json({ admin });
  } catch (error: any) {
    console.error('Error fetching admin profile:', error);
    return res.status(500).json({ error: 'Internal server error fetching profile' });
  }
});

// ==========================================
// 2. LEAD APIs
// ==========================================

// GET /api/leads
app.get('/api/leads', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const search = req.query.search as string;
    const source = req.query.source as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as 'latest' | 'oldest';

    const leads = await DB.leads.findMany({ search, source, status, sortBy });

    // Pagination
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const totalLeads = leads.length;
    const totalPages = Math.ceil(totalLeads / limit);

    const paginatedLeads = leads.slice((page - 1) * limit, page * limit);

    return res.json({
      leads: paginatedLeads,
      pagination: {
        totalLeads,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error retrieving leads:', error);
    return res.status(500).json({ error: 'Failed to retrieve leads' });
  }
});

// GET /api/leads/:id
app.get('/api/leads/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const lead = await DB.leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    return res.json({ lead });
  } catch (error) {
    console.error(`Error retrieving lead ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve lead details' });
  }
});

// POST /api/leads
app.post('/api/leads', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, phone, company, source, status, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Lead name is required' });
    }

    const noteObjects = notes ? [{ id: 'note-' + Math.random().toString(36).substr(2, 9), content: notes, createdAt: new Date().toISOString() }] : [];

    const newLead = await DB.leads.create({
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      source: source || 'Other',
      status: status || 'New',
      notes: noteObjects
    });

    return res.status(211).json({
      message: 'Lead created successfully',
      lead: newLead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT /api/leads/:id
app.put('/api/leads/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, phone, company, source, status } = req.body;

    const lead = await DB.leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updatedLead = await DB.leads.update(req.params.id, {
      name: name !== undefined ? name : lead.name,
      email: email !== undefined ? email : lead.email,
      phone: phone !== undefined ? phone : lead.phone,
      company: company !== undefined ? company : lead.company,
      source: source !== undefined ? source : lead.source,
      status: status !== undefined ? status : lead.status
    });

    return res.json({
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error(`Error updating lead ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE /api/leads/:id
app.delete('/api/leads/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const success = await DB.leads.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    return res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error(`Error deleting lead ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// ==========================================
// 3. NOTES APIs
// ==========================================

// POST /api/leads/:id/notes
app.post('/api/leads/:id/notes', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    const newNote = await DB.leads.addNote(req.params.id, content);
    if (!newNote) {
      return res.status(404).json({ error: 'Lead not found to add note' });
    }

    return res.status(201).json({
      message: 'Note added successfully',
      note: newNote
    });
  } catch (error) {
    console.error(`Error adding note to lead ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to add note' });
  }
});

// PUT /api/leads/:id/notes/:noteId
app.put('/api/leads/:id/notes/:noteId', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    const updatedNote = await DB.leads.updateNote(req.params.id, req.params.noteId, content);
    if (!updatedNote) {
      return res.status(404).json({ error: 'Lead or note not found' });
    }

    return res.json({
      message: 'Note updated successfully',
      note: updatedNote
    });
  } catch (error) {
    console.error(`Error editing note ${req.params.noteId} on lead ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/leads/:id/notes/:noteId
app.delete('/api/leads/:id/notes/:noteId', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const success = await DB.leads.deleteNote(req.params.id, req.params.noteId);
    if (!success) {
      return res.status(404).json({ error: 'Lead or note not found' });
    }
    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(`Error deleting note ${req.params.noteId} from lead ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ==========================================
// 4. ANALYTICS APIs
// ==========================================

// GET /api/analytics
app.get('/api/analytics', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const analytics = await DB.leads.getAnalytics();
    return res.json({ analytics });
  } catch (error) {
    console.error('Error generating metrics analytics:', error);
    return res.status(500).json({ error: 'Failed to generate CRM analytics' });
  }
});

// ==========================================
// VITE DEV SERVER & PRODUCTION ASSETS ROUTING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    // Use Vite's connect instance as middleware in Express
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serves compiled production application assets
    app.use(express.static(distPath));
    // SPA fallback handling
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CRM fullstack server online on port ${PORT}`);
    console.log(`📡 Access through port 3000 mapping.`);
  });
}

startServer().catch((err) => {
  console.error('Fatal dev server initialization failure:', err);
});
