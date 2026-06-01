import React, { useState, useEffect, useRef } from 'react';
import { API } from '../utils/api';
import { UserFile, Admin } from '../types';
import { getFriendlyErrorMessage } from '../utils/firebase';
import { 
  File, 
  Upload, 
  Trash2, 
  Folder, 
  Clock, 
  ShieldCheck, 
  CheckCircle,
  AlertCircle,
  FileMinus,
  Paperclip,
  Download
} from 'lucide-react';

interface MyFilesViewProps {
  admin: Admin;
}

export default function MyFilesView({ admin }: MyFilesViewProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drag-and-drop state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const userFiles = await API.files.list();
      setFiles(userFiles);
    } catch (err) {
      console.error('Error listing custom files:', err);
      setError('Could not retrieve uploaded files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [admin.id]);

  const handleFileUpload = async (srcFile: File | { name: string; size: number; type: string }) => {
    setUploading(true);
    setUploadSuccess(false);
    
    // Calculate readable size
    const sizeInKB = srcFile.size / 1024;
    const sizeLabel = sizeInKB > 1024 
      ? `${(sizeInKB / 1024).toFixed(1)} MB` 
      : `${sizeInKB.toFixed(1)} KB`;

    const fileType = srcFile.type || 'application/octet-stream';

    try {
      await API.files.create(srcFile.name, sizeLabel, fileType, srcFile);
      setUploadSuccess(true);
      await fetchUserFiles();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileUpload(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      handleFileUpload(selectedFile);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    try {
      await API.files.delete(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div id="my-files-viewport" className="space-y-6 font-sans">
      
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-950 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
            <Folder className="w-6 h-6 text-violet-500" />
            My Secure Documents
          </h2>
          <p className="text-sm text-slate-500">
            Secure client documents, proposal sheets, and asset files. Locked to your profile.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border border-slate-200/60 dark:border-slate-800 rounded-xl text-center">
            <span className="block text-[10px] text-slate-400 font-bold tracking-wider uppercase">Active Folder</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{files.length} uploads</span>
          </div>
          <div className="bg-emerald-500/5 px-4 py-2 border border-emerald-500/10 rounded-xl text-center flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div className="text-left">
              <span className="block text-[10px] text-emerald-500 font-bold tracking-wider uppercase">Privacy</span>
              <span className="font-bold text-emerald-400 text-xs">Self Restricted</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Grid: Upload Left, Asset List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload Zone Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Upload New Client File
              </h3>
              <p className="text-xs text-slate-400">
                Supports contract proposals, receipts, layouts, or spreadsheets.
              </p>
            </div>

            {/* Drag & Drop Canvas */}
            <div
              id="file-dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
                dragActive 
                  ? 'border-violet-500 bg-violet-500/5 scale-[0.98]' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-violet-400/80 hover:bg-slate-50/50 dark:hover:bg-slate-950/25'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {uploading ? (
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mx-auto text-violet-500 animate-spin">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Processing file payload...</p>
                    <p className="text-xs text-slate-400 mt-1">Uploading document metadata to Firestore...</p>
                  </div>
                </div>
              ) : uploadSuccess ? (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-500">Document Uploaded Successfully</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">Sync completed</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto ring-4 ring-slate-100/50 dark:ring-slate-900/50 text-slate-400 dark:text-slate-600">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Drag & Drop file here or <span className="text-violet-500 hover:underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports PDF, PNG, CSV, or Text (Max 20MB per file)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Creators */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick mock templates</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFileUpload({ name: 'Apex_Project_Blueprint.xlsx', size: 1024 * 342, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })}
                  className="px-2.5 py-1.5 text-left text-xs bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <File className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  Blueprint.xlsx
                </button>
                <button
                  type="button"
                  onClick={() => handleFileUpload({ name: 'Sarah_Proposal_Approved.pdf', size: 1024 * 1150, type: 'application/pdf' })}
                  className="px-2.5 py-1.5 text-left text-xs bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <File className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  Proposal.pdf
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Files Registry list on the Right */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden min-h-[350px]">
          <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Folder className="w-4.5 h-4.5 text-indigo-500" strokeWidth={2} />
              Files Directory
            </h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              Isolated storage profile
            </span>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <Upload className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-2" />
                <p className="text-sm">Synchronizing file folder content...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <FileMinus className="w-12 h-12 stroke-1 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-medium">No uploaded documents</p>
                <p className="text-xs max-w-sm mt-1 mx-auto text-center">
                  You haven't uploaded any receipts, blueprints, or agreements to your CRM portal yet. Drop any file in the box to compile.
                </p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="p-4.5 flex items-center justify-between gap-4 hover:bg-slate-50/55 dark:hover:bg-slate-950/25 transition duration-150"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-[10px]">
                        {file.size}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <span className="truncate max-w-[150px]">{file.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono" title={file.createdAt}>
                      <Clock className="w-3 h-3" />
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                    
                    {(file.downloadUrl || (file.content && file.content.startsWith('http'))) ? (
                      <a
                        href={file.downloadUrl || file.content}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-500/5 border border-slate-200 hover:border-violet-500/10 dark:border-slate-800 rounded-lg text-xs transition flex items-center justify-center cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-slate-200 hover:border-red-500/10 dark:border-slate-800 rounded-lg text-xs transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
