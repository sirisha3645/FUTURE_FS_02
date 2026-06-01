import { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { Admin, UserFile } from '../types';
import { getFriendlyErrorMessage } from '../utils/firebase';
import { 
  Users, 
  FileText, 
  Calendar, 
  Mail, 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  Trash2, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface AdminDashboardViewProps {
  currentAdmin: Admin;
}

export default function AdminDashboardView({ currentAdmin }: AdminDashboardViewProps) {
  const [users, setUsers] = useState<Admin[]>([]);
  const [allFiles, setAllFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drill-down inspection state
  const [selectedUser, setSelectedUser] = useState<Admin | null>(null);
  const [selectedUserFiles, setSelectedUserFiles] = useState<UserFile[]>([]);
  const [loadingSelectedUserFiles, setLoadingSelectedUserFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Main list fetch
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all registered users (admins collection)
      const fetchedUsers = await API.admins.list();
      setUsers(fetchedUsers);

      // 2. Fetch all files from across the ecosystem to aggregate counts
      const fetchedFiles = await API.files.listAllForAdmin();
      setAllFiles(fetchedFiles);
    } catch (err) {
      console.error('Error fetching admin system metrics:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch target user's files on selection
  const handleSelectUser = async (user: Admin) => {
    setSelectedUser(user);
    setLoadingSelectedUserFiles(true);
    try {
      const userFiles = await API.files.list(user.id);
      setSelectedUserFiles(userFiles);
    } catch (err) {
      console.error('Error listing user files:', err);
      setSelectedUserFiles([]);
    } finally {
      setLoadingSelectedUserFiles(false);
    }
  };

  // Delete a user's file from admin role
  const handleDeleteUserFile = async (fileId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this file as Admin?')) {
      return;
    }
    try {
      await API.files.delete(fileId);
      // Update local states
      setAllFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedUserFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      alert(getFriendlyErrorMessage(err));
    }
  };

  // Calculate file count for a user ID
  const getUserFileCount = (userId: string) => {
    return allFiles.filter(f => f.userId === userId).length;
  };

  // Filtered users matching search string
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="admin-dashboard-viewport" className="space-y-6 font-sans">
      
      {/* Header Banner with Indicator Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-full animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Super User Controls
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full">
              System Admin Active
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
            Central Registry Dashboard
          </h2>
          <p className="text-sm text-slate-400">
            Audit panel for {currentAdmin.name} ({currentAdmin.email}). Overriding Firestore rules to fetch master accounts.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 md:self-end px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          Force Sync Database
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100/10 border border-red-500/20 text-red-400 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Registry Fetch Conflict</p>
            <p className="text-xs opacity-90">{error}</p>
            <p className="text-[10px] opacity-70">
              Ensure you have confirmed Firebase rules setup and deployed final rules to unlock access.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: User List Left, Inspection Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* User Card Registry Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-150 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 text-base">
                <Users className="w-5 h-5 text-violet-500" />
                Active Database Users
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500 bg-slate-150 dark:bg-slate-950 px-2 py-0.5 rounded-md">
                  {users.length} total
                </span>
              </h3>
            </div>

            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Lookup user by full name, email address, or Unique ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-slate-100 rounded-xl transition placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[550px] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-3" />
                <p className="text-sm">Synchronizing profiles from Firestore...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm font-medium">No system users found matching filters.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                const userFileCount = getUserFileCount(u.id);

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-5 flex items-center justify-between cursor-pointer transition duration-150 ${
                      isSelected 
                        ? 'bg-violet-50/40 dark:bg-violet-950/20 border-l-4 border-violet-500 pl-4' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {u.name || 'Anonymous User'}
                        </span>
                        {u.id === currentAdmin.id && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 border border-indigo-500/10 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {u.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate dark:text-slate-600">
                        UID: {u.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg ${
                          userFileCount > 0 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-slate-100 dark:bg-slate-950 text-slate-400'
                        }`}>
                          <FileText className="w-3.5 h-3.5" />
                          {userFileCount} files
                        </span>
                      </div>
                      <ExternalLink className={`w-4 h-4 text-slate-400 ${isSelected ? 'text-violet-500' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected User Files Inspector on the Right */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
              <FolderOpen className="w-5 h-5 text-indigo-500" />
              Client File Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedUser 
                ? `Locking user view context: ${selectedUser.name}` 
                : 'Select an active registry user to audit their files portfolio.'}
            </p>
          </div>

          <div className="flex-1 p-5 min-h-[300px] flex flex-col justify-center">
            {!selectedUser ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 stroke-1 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-sm font-medium">No Account Selected</p>
                <p className="text-xs mt-1 max-w-sm mx-auto">
                  Click on an active user to retrieve their associated files synchronized directly via the Firestore rules query override.
                </p>
              </div>
            ) : loadingSelectedUserFiles ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
                <p className="text-sm text-slate-400">Querying user file assets...</p>
              </div>
            ) : selectedUserFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 stroke-1 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">No Files Uploaded</p>
                <p className="text-xs mt-1">
                  This user has not queued any CRM files or media assets to their private cloud folders yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[450px] w-full self-start">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <span>File Details</span>
                  <span>Action</span>
                </div>

                {selectedUserFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 transition"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{file.size}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="truncate max-w-[120px]">{file.type}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Uploaded: {new Date(file.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteUserFile(file.id)}
                      className="p-2 text-rose-400 hover:text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
                      title="Delete file as Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
