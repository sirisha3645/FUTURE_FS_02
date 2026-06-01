/**
 * Client API Client powered by Firebase Auth & Firestore
 * Client Lead Management System (Mini CRM)
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Lead, CRMAnalytics, Admin, Note, LeadSource, LeadStatus, UserFile } from '../types';

// Helper to wait for Firebase Auth to initialize before resolving profile status
const waitForAuthInit = (): Promise<any> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
    // Fallback timeout in case auth takes longer to reply
    setTimeout(() => {
      resolve(auth.currentUser);
    }, 1500);
  });
};

const DUMMY_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Sarah Jenkins',
    email: 'sarah@apexdesigns.co',
    phone: '+1 555-0199',
    company: 'Apex Designs',
    source: 'LinkedIn' as LeadSource,
    status: 'Converted' as LeadStatus,
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
    source: 'Website' as LeadSource,
    status: 'Contacted' as LeadStatus,
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
    source: 'Referral' as LeadSource,
    status: 'New' as LeadStatus,
    notes: [
      {
        id: 'note-3-1',
        content: 'Referred by Sarah Jenkins. Interested in digital shop design and e-commerce configuration.',
        createdAt: '2026-05-28T14:00:00.000Z'
      }
    ],
    createdAt: '2026-05-28T13:40:00.000Z',
    updatedAt: '2026-05-28T14:00:00.000Z'
  }
];

// Helper to auto-seed database if empty
async function checkAndSeedLeads() {
  try {
    const collRef = collection(db, 'leads');
    const qSnapshot = await getDocs(collRef);
    if (qSnapshot.empty) {
      console.log('Firestore leads collection is empty. Auto-seeding default leads...');
      for (const lead of DUMMY_LEADS) {
        await setDoc(doc(db, 'leads', lead.id), lead);
      }
    }
  } catch (err) {
    console.error('Error checking/seeding leads:', err);
  }
}

export const API = {
  auth: {
    async register(name: string, email: string, password: string) {
      try {
        // 1. Create firebase auth user
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const user = credentials.user;

        // 2. Set profile displayName
        await updateProfile(user, { displayName: name });

        // 3. Store admin document in Firestore
        const adminData: Admin = {
          id: user.uid,
          name,
          email,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'admins', user.uid), adminData);

        // 4. Save sign-in token identifier locally
        const token = await user.getIdToken();
        localStorage.setItem('crm_token', token);

        // Try to trigger auto-seed so database has active values
        await checkAndSeedLeads();

        return { token, admin: adminData };
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Registration failed');
      }
    },

    async login(email: string, password: string) {
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (authErr) {
          // Fallback Auto-Registration for evaluation convenience (admin@crm.com / admin123)
          if (email === 'admin@crm.com' && password === 'admin123') {
            console.log('Pre-seeded admin logging in for the first time. Registering in Firebase Auth...');
            return await this.register('Demo Admin', 'admin@crm.com', 'admin123');
          }
          throw authErr;
        }

        const user = userCredential.user;
        const token = await user.getIdToken();
        localStorage.setItem('crm_token', token);

        // Fetch display profile from admins collection (or fallback if empty)
        let name = user.displayName || 'Demo Admin';
        try {
          const docSnap = await getDoc(doc(db, 'admins', user.uid));
          if (docSnap.exists()) {
            const adminDoc = docSnap.data();
            name = adminDoc.name || name;
          } else {
            // Self-repair admin document
            const selfAdmin: Admin = {
              id: user.uid,
              name,
              email: user.email || email,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'admins', user.uid), selfAdmin);
          }
        } catch (docErr) {
          console.warn('Could not verify existing admin profile document:', docErr);
        }

        // Try to trigger auto-seed so database has active values
        await checkAndSeedLeads();

        const adminInfo: Admin = {
          id: user.uid,
          name,
          email: user.email || email,
          createdAt: new Date().toISOString()
        };

        return { token, admin: adminInfo };
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Authentication failed');
      }
    },

    async getProfile() {
      const user = await waitForAuthInit();
      if (!user) {
        throw new Error('Not authenticated');
      }

      let name = user.displayName || 'Demo Admin';
      try {
        const docSnap = await getDoc(doc(db, 'admins', user.uid));
        if (docSnap.exists()) {
          const adminDoc = docSnap.data();
          name = adminDoc.name || name;
        }
      } catch (err) {
        // silent ignore
      }

      return {
        admin: {
          id: user.uid,
          name,
          email: user.email || '',
          createdAt: new Date().toISOString()
        }
      };
    },

    async logout() {
      try {
        await signOut(auth);
        localStorage.removeItem('crm_token');
      } catch (err) {
        console.error('Firebase signOut error:', err);
      }
    }
  },

  leads: {
    async list(params: {
      search?: string;
      source?: string;
      status?: string;
      sortBy?: string;
      page?: number;
      limit?: number;
    } = {}) {
      const page = params.page || 1;
      const limit = params.limit || 10;

      // Make sure sample data is pre-seeded
      await checkAndSeedLeads();

      try {
        const qSnapshot = await getDocs(collection(db, 'leads'));
        const allFetchedLeads: Lead[] = [];
        
        qSnapshot.forEach((docSnap) => {
          allFetchedLeads.push(docSnap.data() as Lead);
        });

        // 1. Apply Filtering in memory for robust query resolution
        let filteredLeads = [...allFetchedLeads];

        if (params.status) {
          filteredLeads = filteredLeads.filter(l => l.status === params.status);
        }

        if (params.source) {
          filteredLeads = filteredLeads.filter(l => l.source === params.source);
        }

        if (params.search) {
          const keyword = params.search.toLowerCase();
          filteredLeads = filteredLeads.filter(l => 
            l.name.toLowerCase().includes(keyword) ||
            l.email.toLowerCase().includes(keyword) ||
            l.company.toLowerCase().includes(keyword) ||
            (l.phone || '').toLowerCase().includes(keyword)
          );
        }

        // 2. Sorting
        if (params.sortBy === 'oldest') {
          filteredLeads.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        } else {
          // Default: latest created leads first
          filteredLeads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }

        // 3. Paginate
        const totalLeads = filteredLeads.length;
        const totalPages = Math.ceil(totalLeads / limit);
        const startIndex = (page - 1) * limit;
        const paginatedLeads = filteredLeads.slice(startIndex, startIndex + limit);

        return {
          leads: paginatedLeads,
          pagination: {
            totalLeads,
            totalPages,
            page,
            limit
          }
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'leads');
        throw err;
      }
    },

    async get(id: string) {
      const pathStr = `leads/${id}`;
      try {
        const docRef = doc(db, 'leads', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Lead not found');
        }
        return docSnap.data() as Lead;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, pathStr);
        throw err;
      }
    },

    async create(leadData: Omit<Lead, 'id' | 'notes' | 'createdAt' | 'updatedAt'> & { notes?: string }) {
      const newId = 'lead-' + Math.random().toString(36).substr(2, 9);
      const currentTime = new Date().toISOString();
      const pathStr = `leads/${newId}`;

      const leadRecord: Lead = {
        id: newId,
        name: leadData.name,
        email: leadData.email || '',
        phone: leadData.phone || '',
        company: leadData.company || '',
        source: leadData.source,
        status: leadData.status,
        notes: leadData.notes ? [{
          id: 'note-' + Math.random().toString(36).substr(2, 9),
          content: leadData.notes,
          createdAt: currentTime
        }] : [],
        createdAt: currentTime,
        updatedAt: currentTime
      };

      try {
        await setDoc(doc(db, 'leads', newId), leadRecord);
        return leadRecord;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, pathStr);
        throw err;
      }
    },

    async update(id: string, leadData: Partial<Lead>) {
      const pathStr = `leads/${id}`;
      try {
        const docRef = doc(db, 'leads', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Lead document does not exist.');
        }

        const existingData = docSnap.data() as Lead;
        const updatedRecord: Lead = {
          ...existingData,
          ...leadData,
          id: existingData.id, // Immutable ID
          createdAt: existingData.createdAt, // Immutable createdAt metadata
          updatedAt: new Date().toISOString()
        };

        const cleanRecord = JSON.parse(JSON.stringify(updatedRecord)) as Lead;

        await setDoc(docRef, cleanRecord);
        return cleanRecord;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, pathStr);
        throw err;
      }
    },

    async delete(id: string) {
      const pathStr = `leads/${id}`;
      try {
        await deleteDoc(doc(db, 'leads', id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, pathStr);
        throw err;
      }
    },

    // Notes management
    async addNote(id: string, content: string) {
      const pathStr = `leads/${id}`;
      try {
        const docRef = doc(db, 'leads', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Lead not found');
        }

        const leadData = docSnap.data() as Lead;
        const newNote: Note = {
          id: 'note-' + Math.random().toString(36).substr(2, 9),
          content,
          createdAt: new Date().toISOString()
        };

        const updatedNotes = [...leadData.notes, newNote];
        await updateDoc(docRef, {
          notes: updatedNotes,
          updatedAt: new Date().toISOString()
        });

        return newNote;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, pathStr);
        throw err;
      }
    },

    async updateNote(id: string, noteId: string, content: string) {
      const pathStr = `leads/${id}`;
      try {
        const docRef = doc(db, 'leads', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Lead not found');
        }

        const leadData = docSnap.data() as Lead;
        const noteIndex = leadData.notes.findIndex((n: Note) => n.id === noteId);
        if (noteIndex === -1) {
          throw new Error('Note not found');
        }

        const updatedNotes = [...leadData.notes];
        updatedNotes[noteIndex] = {
          ...updatedNotes[noteIndex],
          content
        };

        await updateDoc(docRef, {
          notes: updatedNotes,
          updatedAt: new Date().toISOString()
        });

        return updatedNotes[noteIndex];
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, pathStr);
        throw err;
      }
    },

    async deleteNote(id: string, noteId: string) {
      const pathStr = `leads/${id}`;
      try {
        const docRef = doc(db, 'leads', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Lead not found');
        }

        const leadData = docSnap.data() as Lead;
        const updatedNotes = leadData.notes.filter((n: Note) => n.id !== noteId);

        await updateDoc(docRef, {
          notes: updatedNotes,
          updatedAt: new Date().toISOString()
        });

        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, pathStr);
        throw err;
      }
    }
  },

  analytics: {
    async get() {
      // Ensure leads are seeded
      await checkAndSeedLeads();

      try {
        const qSnapshot = await getDocs(collection(db, 'leads'));
        const leads: Lead[] = [];
        qSnapshot.forEach((docSnap) => {
          leads.push(docSnap.data() as Lead);
        });

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

        // Historical Growth
        const dateMap: Record<string, number> = {};
        leads.forEach(l => {
          const dateStr = l.createdAt.split('T')[0];
          dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
        });
        const historicalGrowth = Object.entries(dateMap)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const analyticsData: CRMAnalytics = {
          totalLeads,
          newLeads,
          contactedLeads,
          convertedLeads,
          conversionRate,
          leadsBySource,
          leadsByStatus,
          historicalGrowth
        };

        return analyticsData;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'leads');
        throw err;
      }
    }
  },

  admins: {
    async list() {
      try {
        const qSnapshot = await getDocs(collection(db, 'admins'));
        const usersList: Admin[] = [];
        qSnapshot.forEach((docSnap) => {
          usersList.push(docSnap.data() as Admin);
        });
        return usersList;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'admins');
        throw err;
      }
    }
  },

  files: {
    async list(targetUserId?: string) {
      try {
        const filesRef = collection(db, 'files');
        let qSnapshot;
        if (targetUserId) {
          const q = query(filesRef, where('userId', '==', targetUserId));
          qSnapshot = await getDocs(q);
        } else {
          const currentUid = auth.currentUser?.uid;
          if (!currentUid) throw new Error('Not authenticated');
          const q = query(filesRef, where('userId', '==', currentUid));
          qSnapshot = await getDocs(q);
        }
        const fileList: UserFile[] = [];
        qSnapshot.forEach((docSnap) => {
          fileList.push(docSnap.data() as UserFile);
        });
        fileList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return fileList;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'files');
        throw err;
      }
    },

    async listAllForAdmin() {
      try {
        const qSnapshot = await getDocs(collection(db, 'files'));
        const fileList: UserFile[] = [];
        qSnapshot.forEach((docSnap) => {
          fileList.push(docSnap.data() as UserFile);
        });
        return fileList;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'files');
        throw err;
      }
    },

    async create(name: string, sizeLabel: string, type: string, fileDataOrContent?: File | Blob | { name: string; size: number; type: string } | string) {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) throw new Error('Not authenticated');
      const newId = 'file-' + Math.random().toString(36).substr(2, 9);

      let uploadPayload: File | Blob;
      if (fileDataOrContent instanceof File || fileDataOrContent instanceof Blob) {
        uploadPayload = fileDataOrContent;
      } else {
        // Fallback for mock templates or string content
        const text = typeof fileDataOrContent === 'string' ? fileDataOrContent : `Mock content representing the uploaded file: ${name}`;
        uploadPayload = new Blob([text], { type });
      }

      let downloadUrl = '';
      const storagePath = `users/${currentUid}/${newId}_${name}`;
      try {
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, uploadPayload);
        downloadUrl = await getDownloadURL(uploadResult.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed, attempting database fallback:', storageErr);
        // Fallback: Read small files as Base64 Data URL so they remain fully functional
        // Firestore 1MB document limit means we only do this for files under 800KB
        if (uploadPayload && uploadPayload.size < 800 * 1024) {
          try {
            downloadUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('FileReader error'));
              reader.readAsDataURL(uploadPayload);
            });
          } catch (readErr) {
            console.warn('Fallback base64 reading failed:', readErr);
          }
        }
      }

      if (!downloadUrl) {
        if (uploadPayload && uploadPayload.size >= 800 * 1024) {
          throw new Error(`Upload failed because Firebase Storage permissions are restricted, and the file size (${sizeLabel}) is over the 750 KB database storage fallback limit. Please select a smaller file.`);
        } else {
          throw new Error('Upload failed. The storage channel returned unauthorized, and the local fallback failed to encode the file payload.');
        }
      }

      const fileRecord: UserFile = {
        id: newId,
        userId: currentUid,
        name,
        size: sizeLabel,
        type,
        content: downloadUrl,
        downloadUrl,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'files', newId), fileRecord);
        return fileRecord;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `files/${newId}`);
        throw err;
      }
    },

    async delete(id: string) {
      try {
        const docRef = doc(db, 'files', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fileData = docSnap.data() as UserFile;
          const currentUid = auth.currentUser?.uid;
          if (currentUid) {
            const storagePath = `users/${currentUid}/${id}_${fileData.name}`;
            const storageRef = ref(storage, storagePath);
            try {
              await deleteObject(storageRef);
            } catch (storageDelErr) {
              console.warn('Could not delete file from Firebase Storage:', storageDelErr);
            }
          }
        }
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `files/${id}`);
        throw err;
      }
    }
  }
};
