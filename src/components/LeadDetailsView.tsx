import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { Lead, Note, LeadStatus } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit2, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  CheckCircle, 
  Loader, 
  Sparkles,
  PhoneCall,
  X,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Globe2
} from 'lucide-react';

interface LeadDetailsViewProps {
  leadId: string;
  onBackToList: () => void;
  onLeadUpdated: () => void;
}

export default function LeadDetailsView({ leadId, onBackToList, onLeadUpdated }: LeadDetailsViewProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note actions
  const [noteContent, setNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Fetch lead details initially
  const loadLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.leads.get(leadId);
      setLead(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load detail report from server database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      loadLeadDetails();
    }
  }, [leadId]);

  // Handle status update instantly
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    try {
      const updated = await API.leads.update(lead.id, { status: newStatus });
      setLead(updated);
      onLeadUpdated(); // reload stats on parent applet
    } catch (err: any) {
      alert('Failed to update lead status');
    }
  };

  // Add Note handler
  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !lead) return;

    setIsAddingNote(true);
    try {
      const createdNote = await API.leads.addNote(lead.id, noteContent);
      // Append locally to prevent extra API requests
      if (createdNote) {
        setLead(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: [...prev.notes, createdNote],
            updatedAt: new Date().toISOString()
          };
        });
        setNoteContent('');
        onLeadUpdated();
      }
    } catch (err: any) {
      alert('Failed to register follow-up history.');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete note handler
  const executeDeleteNote = async (noteId: string) => {
    if (!lead) return;
    try {
      await API.leads.deleteNote(lead.id, noteId);
      setLead(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: prev.notes.filter(n => n.id !== noteId),
          updatedAt: new Date().toISOString()
        };
      });
      setDeletingNoteId(null);
      onLeadUpdated();
    } catch (err: any) {
      alert('Failed to delete note history record.');
    }
  };

  // Update note content handler
  const handleEditNoteSubmit = async (noteId: string) => {
    if (!lead || !editingContent.trim()) return;
    try {
      const updatedNote = await API.leads.updateNote(lead.id, noteId, editingContent);
      if (updatedNote) {
        setLead(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: prev.notes.map(n => n.id === noteId ? updatedNote : n),
            updatedAt: new Date().toISOString()
          };
        });
        setEditingNoteId(null);
        setEditingContent('');
        onLeadUpdated();
      }
    } catch (err: any) {
      alert('Failed to modify note content.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div id="details-loading" className="flex flex-col items-center justify-center p-24 text-center">
        <Loader className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm text-slate-500">Loading comprehensive lead profile...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div id="details-error-pane" className="p-8 bg-red-400/5 border border-red-500/10 rounded-2xl text-center max-w-xl mx-auto my-12">
        <span className="text-3xl">🧩</span>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md mt-4">Profile is missing</h3>
        <p className="text-xs text-slate-400 mt-2">{error || 'This lead profile was deleted or modified.'}</p>
        <button
          onClick={onBackToList}
          className="mt-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
        >
          Return to List
        </button>
      </div>
    );
  }

  return (
    <div id="lead-details-view" className="space-y-6">
      
      {/* Back button header */}
      <div>
        <button
          id="btn-details-back"
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 text-xs text-violet-605 dark:text-violet-400 hover:text-violet-500 hover:underline underline-offset-4 cursor-pointer font-bold font-sans uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Return to directory
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Core Info Profile Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm p-6 space-y-6 h-fit">
          <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800/80 relative">
            <span className="absolute top-0 right-0 bg-violet-50 dark:bg-violet-955/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/10 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">
              {lead.source}
            </span>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/15 to-indigo-650/10 flex items-center justify-center text-violet-605 dark:text-violet-350 mx-auto text-xl font-bold border border-violet-500/10">
              {lead.name.split(' ').map(n=>n[0]).join('')}
            </div>

            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-4 leading-tight">
              {lead.name}
            </h3>

            {lead.company && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium inline-flex items-center gap-1 mt-1 font-sans">
                <Building className="w-3.5 h-3.5 text-slate-400" /> {lead.company}
              </p>
            )}

            {/* Quick Change Funnel status bar dropdown */}
            <div className="mt-5 space-y-1 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Lead Funnel Status
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(['New', 'Contacted', 'Converted'] as LeadStatus[]).map((st) => {
                  const isActive = lead.status === st;
                  return (
                    <button
                      id={`btn-status-toggle-${st}`}
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold text-center border capitalize transition-all cursor-pointer ${
                        isActive
                          ? st === 'New' 
                            ? 'bg-amber-50 border-amber-250 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30'
                            : st === 'Contacted'
                            ? 'bg-sky-50 border-sky-250 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/30'
                            : 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed directory credentials */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Identity Metadata
            </h4>
            
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <Mail className="w-4 h-4 text-slate-400" />
              <div className="truncate">
                <span className="block text-[9px] text-slate-400 font-semibold tracking-wider font-sans uppercase">Email address</span>
                <span className="block font-medium truncate">{lead.email || '--'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[9px] text-slate-400 font-semibold tracking-wider font-sans uppercase">Phone Contact</span>
                <span className="block font-medium">{lead.phone || '--'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[9px] text-slate-400 font-semibold tracking-wider font-sans uppercase">Form Submitted</span>
                <span className="block font-medium">{formatDate(lead.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[9px] text-slate-400 font-semibold tracking-wider font-sans uppercase">Last File Update</span>
                <span className="block font-medium">{formatDate(lead.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Note follow-up system timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Add quick note box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm inline-flex items-center gap-1.5 mb-1.5">
              <FileText className="w-4 h-4 text-violet-500" /> Log Follow-up Activity
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add multiple follow-up logs regarding calls, proposals, or details from meetings.
            </p>

            <form onSubmit={handleAddNoteSubmit} className="space-y-3">
              <textarea
                id="notes-textarea"
                rows={3}
                placeholder="Type note details here (e.g. Returned discovery callback. Standard pricing sent...)"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850/80 text-slate-800 dark:text-slate-200 placeholder-slate-450 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-sans"
              ></textarea>
              <div className="flex justify-end">
                <button
                  id="btn-submit-note"
                  type="submit"
                  disabled={isAddingNote || !noteContent.trim()}
                  className="px-4 py-2 bg-violet-650 hover:bg-violet-600 text-white font-semibold text-xs rounded-xl disabled:opacity-40 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isAddingNote ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Append Contact Log
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Timeline folder notes list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">
              Follow-Up History Timeline
            </h3>

            {lead.notes.length === 0 ? (
              <div id="no-notes-timeline" className="text-center p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <p className="text-slate-400 text-xs">No follow-up timelines recorded on this file yet.</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Type in the box above to register your discovery callback, quote submission or call results.
                </p>
              </div>
            ) : (
              <div id="notes-timeline" className="relative border-l border-slate-150 dark:border-slate-805 pl-6 ml-3 space-y-6">
                {/* Loop notes list */}
                {lead.notes.slice().reverse().map((note) => {
                  const isEditing = editingNoteId === note.id;
                  return (
                    <div key={note.id} className="relative font-sans text-xs">
                      {/* Circle indicator bullet */}
                      <span className="absolute -left-[30px] top-1 w-3.5 h-3.5 bg-violet-500 border-2 border-white dark:border-slate-900 rounded-full"></span>

                      <div className="flex items-center justify-between gap-4 text-slate-400 text-[10px] font-medium font-sans">
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500">
                          {formatDate(note.createdAt)}
                        </span>
                        
                        <div className="inline-flex items-center gap-2">
                          <button
                            id={`btn-edit-note-${note.id}`}
                            onClick={() => { setEditingNoteId(note.id); setEditingContent(note.content); }}
                            className="text-slate-450 hover:text-violet-500 dark:text-slate-500 dark:hover:text-violet-400 hover:scale-105 transition-all"
                            title="Edit content"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {deletingNoteId === note.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => executeDeleteNote(note.id)}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-bold transition cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingNoteId(null)}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded text-[9px] font-bold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-delete-note-${note.id}`}
                              onClick={() => setDeletingNoteId(note.id)}
                              className="text-slate-450 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:scale-105 transition-all"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-slate-705 dark:text-slate-205 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              id={`textarea-edit-note-${note.id}`}
                              rows={2}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-lg p-2 focus:ring-1 focus:ring-violet-500/20 text-xs font-sans"
                            ></textarea>
                            <div className="flex justify-end gap-2 text-[10px]">
                              <button
                                id={`btn-cancel-edit-${note.id}`}
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-semibold"
                              >
                                Discard
                              </button>
                              <button
                                id={`btn-save-edit-${note.id}`}
                                type="button"
                                onClick={() => handleEditNoteSubmit(note.id)}
                                className="px-3 py-1 bg-violet-600 text-white rounded-md font-semibold"
                              >
                                Update Note
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{note.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
