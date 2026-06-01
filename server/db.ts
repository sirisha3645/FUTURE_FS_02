import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Lead, Admin, LeadSource, LeadStatus, Note, CRMAnalytics } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

// Ensure database directory and files exist
function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Create admins file if it doesn't exist
  if (!fs.existsSync(ADMINS_FILE)) {
    // Seed with a default admin (admin@crm.com / admin123) for easy evaluation
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    const defaultAdmin: Admin & { passwordHash: string } = {
      id: 'default-admin-1',
      name: 'Demo Admin',
      email: 'admin@crm.com',
      createdAt: new Date().toISOString(),
      passwordHash: defaultPasswordHash
    };
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([defaultAdmin], null, 2), 'utf8');
    console.log('Seeded default admin (admin@crm.com / admin123)');
  }

  // Create leads file if it doesn't exist
  if (!fs.existsSync(LEADS_FILE)) {
    const dummyLeads: Lead[] = [
      {
        id: 'lead-1',
        name: 'Sarah Jenkins',
        email: 'sarah@apexdesigns.co',
        phone: '+1 555-0199',
        company: 'Apex Designs',
        source: 'LinkedIn',
        status: 'Converted',
        notes: [
          {
            id: 'note-1-1',
            content: 'Initial contact made via inbound LinkedIn message.',
            createdAt: '2026-05-10T10:00:00.000Z'
          },
          {
            id: 'note-1-2',
            content: 'Sent high-level blueprint options & standard pricing proposal.',
            createdAt: '2026-05-12T14:30:00.000Z'
          },
          {
            id: 'note-1-3',
            content: 'Proposal approved! Kickoff set for next Monday. Payment received.',
            createdAt: '2026-05-15T16:45:00.000Z'
          }
        ],
        createdAt: '2026-05-10T09:12:00.000Z',
        updatedAt: '2026-05-15T16:45:00.000Z'
      },
      {
        id: 'lead-2',
        name: 'David Chen',
        email: 'dchen@techtonic.io',
        phone: '+1 555-0142',
        company: 'TechTonic Enterprises',
        source: 'Website',
        status: 'Contacted',
        notes: [
          {
            id: 'note-2-1',
            content: 'Submitted contact form from landing page.',
            createdAt: '2026-05-18T11:05:00.000Z'
          },
          {
            id: 'note-2-2',
            content: 'Conducted 15-minute discovery call. Needs responsive web app and database integration.',
            createdAt: '2026-05-20T15:00:00.000Z'
          }
        ],
        createdAt: '2026-05-18T11:05:00.000Z',
        updatedAt: '2026-05-20T15:00:00.000Z'
      },
      {
        id: 'lead-3',
        name: 'Emily Rodriguez',
        email: 'emily@bloomfloral.com',
        phone: '+1 555-0188',
        company: 'Bloom Floral',
        source: 'Referral',
        status: 'New',
        notes: [
          {
            id: 'note-3-1',
            content: 'Referred by Sarah Jenkins. Interested in digital shop design and e-commerce configuration.',
            createdAt: '2026-05-28T14:00:00.000Z'
          }
        ],
        createdAt: '2026-05-28T13:40:00.000Z',
        updatedAt: '2026-05-28T14:00:00.000Z'
      },
      {
        id: 'lead-4',
        name: 'Marcus Vance',
        email: 'm.vance@vancemedia.com',
        phone: '+1 555-0125',
        company: 'Vance Media Group',
        source: 'Facebook',
        status: 'New',
        notes: [
          {
            id: 'note-4-1',
            content: 'Interested in bespoke Facebook Ad integrations and SEO booster packages.',
            createdAt: '2026-05-30T09:20:00.000Z'
          }
        ],
        createdAt: '2026-05-30T08:55:00.000Z',
        updatedAt: '2026-05-30T09:20:00.000Z'
      },
      {
        id: 'lead-5',
        name: 'Siddharth Mehta',
        email: 'sid@mehtaconsulting.com',
        phone: '+91 98765 43210',
        company: 'Mehta Consulting',
        source: 'Instagram',
        status: 'Contacted',
        notes: [
          {
            id: 'note-5-1',
            content: 'Exchanged contact numbers on Instagram DM. Sent standard pricing matrix.',
            createdAt: '2026-05-26T12:00:00.000Z'
          }
        ],
        createdAt: '2026-05-25T11:00:00.000Z',
        updatedAt: '2026-05-26T12:00:00.000Z'
      },
      {
        id: 'lead-6',
        name: 'Jessica Taylor',
        email: 'jess@healthfit.co',
        phone: '+1 555-0322',
        company: 'HealthFit Labs',
        source: 'Other',
        status: 'Converted',
        notes: [
          {
            id: 'note-6-1',
            content: 'Met at Bangalore startup convention. Exchanged visiting cards.',
            createdAt: '2026-05-12T18:00:00.000Z'
          },
          {
            id: 'note-6-2',
            content: 'Signed 3-month consulting agreement for lead gen system setup.',
            createdAt: '2026-05-19T10:00:00.000Z'
          }
        ],
        createdAt: '2026-05-12T18:00:00.000Z',
        updatedAt: '2026-05-19T10:00:00.000Z'
      }
    ];
    fs.writeFileSync(LEADS_FILE, JSON.stringify(dummyLeads, null, 2), 'utf8');
    console.log('Seeded initial leads.');
  }
}

initDb();

// Read operations helper
function getAdminsRaw(): any[] {
  try {
    return JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeAdminsRaw(admins: any[]) {
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), 'utf8');
}

export function getLeadsRaw(): Lead[] {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

export function writeLeadsRaw(leads: Lead[]) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

// Data Store / Service Implementation mimicking mongoose queries
export const DB = {
  // Admin Operations
  admins: {
    async findByEmail(email: string): Promise<(Admin & { passwordHash: string }) | null> {
      const admins = getAdminsRaw();
      const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
      return admin || null;
    },

    async findById(id: string): Promise<Admin | null> {
      const admins = getAdminsRaw();
      const admin = admins.find(a => a.id === id);
      if (!admin) return null;
      const { passwordHash, ...safeAdmin } = admin;
      return safeAdmin;
    },

    async create(name: string, email: string, passwordHash: string): Promise<Admin> {
      const admins = getAdminsRaw();
      const newAdmin = {
        id: 'admin-' + Math.random().toString(36).substr(2, 9),
        name,
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
        passwordHash
      };
      admins.push(newAdmin);
      writeAdminsRaw(admins);
      const { passwordHash: _, ...safeAdmin } = newAdmin;
      return safeAdmin;
    }
  },

  // Lead Operations
  leads: {
    async findMany(filters: {
      search?: string;
      source?: string;
      status?: string;
      sortBy?: 'latest' | 'oldest';
    } = {}): Promise<Lead[]> {
      let leads = getLeadsRaw();

      // Search matching name, email, company
      if (filters.search) {
        const query = filters.search.toLowerCase();
        leads = leads.filter(
          l =>
            l.name.toLowerCase().includes(query) ||
            l.email.toLowerCase().includes(query) ||
            l.company.toLowerCase().includes(query)
        );
      }

      // Filter by source
      if (filters.source && filters.source !== 'All') {
        leads = leads.filter(l => l.source === filters.source);
      }

      // Filter by status
      if (filters.status && filters.status !== 'All') {
        leads = leads.filter(l => l.status === filters.status);
      }

      // Sort
      if (filters.sortBy === 'oldest') {
        leads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        // default latest first
        leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return leads;
    },

    async findById(id: string): Promise<Lead | null> {
      const leads = getLeadsRaw();
      return leads.find(l => l.id === id) || null;
    },

    async create(leadData: Omit<Lead, 'id' | 'notes' | 'createdAt' | 'updatedAt'> & { notes?: Note[] }): Promise<Lead> {
      const leads = getLeadsRaw();
      const newLead: Lead = {
        id: 'lead-' + Math.random().toString(36).substr(2, 9),
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || '',
        company: leadData.company || '',
        source: leadData.source || 'Other',
        status: leadData.status || 'New',
        notes: leadData.notes || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      leads.push(newLead);
      writeLeadsRaw(leads);
      return newLead;
    },

    async update(id: string, updates: Partial<Omit<Lead, 'id' | 'notes' | 'createdAt' | 'updatedAt'>>): Promise<Lead | null> {
      const leads = getLeadsRaw();
      const leasIndex = leads.findIndex(l => l.id === id);
      if (leasIndex === -1) return null;

      const updatedLead: Lead = {
        ...leads[leasIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      leads[leasIndex] = updatedLead;
      writeLeadsRaw(leads);
      return updatedLead;
    },

    async delete(id: string): Promise<boolean> {
      const leads = getLeadsRaw();
      const initialLength = leads.length;
      const filteredLeads = leads.filter(l => l.id !== id);
      writeLeadsRaw(filteredLeads);
      return filteredLeads.length < initialLength;
    },

    // Note operations
    async addNote(leadId: string, content: string): Promise<Note | null> {
      const leads = getLeadsRaw();
      const leadIndex = leads.findIndex(l => l.id === leadId);
      if (leadIndex === -1) return null;

      const newNote: Note = {
        id: 'note-' + Math.random().toString(36).substr(2, 9),
        content,
        createdAt: new Date().toISOString()
      };

      leads[leadIndex].notes.push(newNote);
      leads[leadIndex].updatedAt = new Date().toISOString();
      writeLeadsRaw(leads);
      return newNote;
    },

    async updateNote(leadId: string, noteId: string, content: string): Promise<Note | null> {
      const leads = getLeadsRaw();
      const leadIndex = leads.findIndex(l => l.id === leadId);
      if (leadIndex === -1) return null;

      const noteIndex = leads[leadIndex].notes.findIndex(n => n.id === noteId);
      if (noteIndex === -1) return null;

      leads[leadIndex].notes[noteIndex].content = content;
      // We don't overwrite its legacy createdAt timestamp but update the lead's update time
      leads[leadIndex].updatedAt = new Date().toISOString();
      writeLeadsRaw(leads);
      return leads[leadIndex].notes[noteIndex];
    },

    async deleteNote(leadId: string, noteId: string): Promise<boolean> {
      const leads = getLeadsRaw();
      const leadIndex = leads.findIndex(l => l.id === leadId);
      if (leadIndex === -1) return false;

      const initialLength = leads[leadIndex].notes.length;
      leads[leadIndex].notes = leads[leadIndex].notes.filter(n => n.id !== noteId);
      leads[leadIndex].updatedAt = new Date().toISOString();
      writeLeadsRaw(leads);
      return leads[leadIndex].notes.length < initialLength;
    },

    // Analytics Generator
    async getAnalytics(): Promise<CRMAnalytics> {
      const leads = getLeadsRaw();
      const totalLeads = leads.length;
      const newLeads = leads.filter(l => l.status === 'New').length;
      const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
      const convertedLeads = leads.filter(l => l.status === 'Converted').length;

      const conversionRate = totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

      // Group by Source
      const sources: Record<LeadSource, number> = {
        Website: 0,
        Portfolio: 0,
        LinkedIn: 0,
        Referral: 0,
        Facebook: 0,
        Instagram: 0,
        Other: 0
      };
      leads.forEach(l => {
        if (l.source in sources) {
          sources[l.source]++;
        } else {
          sources['Other']++;
        }
      });
      const leadsBySource = Object.entries(sources).map(([name, value]) => ({ name, value }));

      // Group by Status
      const statuses: Record<LeadStatus, number> = {
        New: 0,
        Contacted: 0,
        Converted: 0
      };
      leads.forEach(l => {
        if (l.status in statuses) {
          statuses[l.status]++;
        }
      });
      const leadsByStatus = Object.entries(statuses).map(([name, value]) => ({ name, value }));

      // Historical Growth (Group leads by creation date)
      // Map to 'YYYY-MM-DD'
      const dateMap: Record<string, number> = {};
      leads.forEach(l => {
        const dateStr = l.createdAt.split('T')[0];
        dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
      });
      const historicalGrowth = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalLeads,
        newLeads,
        contactedLeads,
        convertedLeads,
        conversionRate,
        leadsBySource,
        leadsByStatus,
        historicalGrowth
      };
    }
  }
};
