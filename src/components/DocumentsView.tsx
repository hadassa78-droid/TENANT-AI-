import React, { useState, useRef } from 'react';
import { User, Tenant, DocumentItem } from '../types';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Search,
  Check,
  X,
  FileUp,
} from 'lucide-react';

interface DocumentsViewProps {
  user: User;
  tenant: Tenant | null;
  documents: DocumentItem[];
  onUpload: (data: { title: string; fileName: string; content: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  user,
  tenant,
  documents,
  onUpload,
  onDelete,
  onRefresh,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter((d) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q) ||
      (d.preview && d.preview.toLowerCase().includes(q))
    );
  });

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text || '');
      setFileName(file.name);
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.onerror = () => {
      setError('Unable to read file. Please upload a plain-text file (.txt, .md, .json, .csv).');
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Document title and text content are required.');
      return;
    }

    setUploading(true);
    setError(null);
    const success = await onUpload({
      title: title.trim(),
      fileName: fileName.trim() || `${title.replace(/\s+/g, '_')}.txt`,
      content: content.trim(),
    });
    setUploading(false);

    if (success) {
      setTitle('');
      setFileName('');
      setContent('');
      setShowUploadModal(false);
      onRefresh();
      setSuccessToast(
        `Document indexed and isolated to ${tenant ? tenant.name : user.tenantId}.`
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setError('Upload failed. Please verify document content and try again.');
    }
  };

  const loadPreset = (presetType: 'nda' | 'safety' | 'security' | 'travel') => {
    const orgName = tenant ? tenant.name : user.tenantId;
    if (presetType === 'nda') {
      setTitle('Corporate Non-Disclosure & Proprietary IP Directive');
      setFileName('Corporate_NDA_2026.txt');
      setContent(
        `CONFIDENTIAL NON-DISCLOSURE DIRECTIVE 2026\n` +
          `Authorized Organization: ${orgName}\n` +
          `Section 1: All architectural blueprints, R&D telemetry, and internal policy documents are classified as Tier-1 proprietary assets.\n` +
          `Section 2: Unauthorized disclosure incurs a $500,000 contractual penalty and immediate revocation of security credentials.\n` +
          `Section 3: Data retention and AI retrieval must strictly enforce server-side tenant partitioning.`
      );
    } else if (presetType === 'safety') {
      setTitle('Facility Operations & Disaster Recovery Protocol');
      setFileName('Facility_Disaster_Protocol_v2.txt');
      setContent(
        `EMERGENCY OPERATIONS & CONTINUITY PROTOCOL\n` +
          `Organization: ${orgName}\n` +
          `Evacuation Assembly Point: Sector 4 North Courtyard.\n` +
          `Offsite Snapshot Schedule: Encrypted replication every 6 hours to primary cold vault.\n` +
          `Incident Command Desk: Extension 4099.`
      );
    } else if (presetType === 'travel') {
      setTitle('Executive Travel & Reimbursement Schedule');
      setFileName('Travel_Policy_Schedule_2026.txt');
      setContent(
        `CORPORATE TRAVEL AND EXPENSE GUIDELINES 2026\n` +
          `Authorized Entity: ${orgName}\n` +
          `Domestic Meal Allowance: $85 per day standard rate with itemized receipts.\n` +
          `Lodging Cap: $220 per night in standard markets, $310 per night in Tier-1 metropolitan centers.\n` +
          `Approval Threshold: Any single expense exceeding $1,000 requires VP sign-off within 5 business days.`
      );
    } else {
      setTitle('Information Security & Access Control Matrix');
      setFileName('Access_Control_Matrix.txt');
      setContent(
        `ENTERPRISE INFORMATION SECURITY POLICY\n` +
          `Organization: ${orgName}\n` +
          `Control 1: Every API request must pass server-side cryptographic session token validation.\n` +
          `Control 2: Client-supplied tenant headers are ignored; partition identity is derived strictly from the session store.\n` +
          `Control 3: Pre-retrieval document filtering is mandatory prior to keyword or vector scoring.`
      );
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-1.5">
            Isolated Knowledge Repository
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {tenant ? tenant.name : user.tenantId} Document Vault
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Documents uploaded here are bound exclusively to partition <code className="text-slate-900 font-bold">{user.tenantId}</code> and are strictly inaccessible to any other organization account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowUploadModal(true);
          }}
          className="px-4 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter documents by title, filename, or excerpt..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
          <span>
            Indexed Documents: <strong className="text-slate-900">{documents.length}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Partition ID: <strong className="font-mono text-slate-800">{user.tenantId}</strong>
          </span>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-display text-base font-semibold text-slate-900">
            {searchFilter
              ? 'No matching documents found'
              : 'No documents indexed in this organization vault'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload corporate policies, technical specifications, or operating manuals to make them available for grounded AI retrieval.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-medium"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-base text-slate-900">
                      {doc.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{doc.fileName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="p-1.5 text-slate-500 hover:text-[#1E3A8A] rounded-lg hover:bg-slate-50 transition-colors"
                      title="Read document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDoc(doc)}
                      className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {doc.preview && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                    {doc.preview}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>
                  {doc.chunkCount} indexed {doc.chunkCount === 1 ? 'passage' : 'passages'} ·{' '}
                  {doc.fileSize} bytes
                </span>
                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Reader Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {selectedDoc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedDoc.fileName} · Uploaded by {selectedDoc.uploadedBy} · Partition:{' '}
                  {selectedDoc.tenantId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {selectedDoc.content || selectedDoc.preview}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Confirm Document Removal
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>"{deletingDoc.title}"</strong> from the{' '}
              {tenant ? tenant.name : user.tenantId} vault? Its passages will no longer be cited in future queries.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deletingDoc.id;
                  setDeletingDoc(null);
                  await onDelete(id);
                  onRefresh();
                }}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium"
              >
                Remove Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Upload Document to {tenant ? tenant.name : user.tenantId} Vault
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-slate-600 block mb-2">
                Quick-Fill Standard Policy Templates:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset('nda')}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
                >
                  Confidential NDA
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('safety')}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
                >
                  Continuity Protocol
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('travel')}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
                >
                  Travel Schedule
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('security')}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
                >
                  Access Control Matrix
                </button>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#1E3A8A] bg-slate-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                accept=".txt,.md,.json,.csv"
                className="hidden"
              />
              <FileUp className="w-5 h-5 text-[#1E3A8A] mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-800">
                Click to select a text file or drag and drop here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supports .txt, .md, .json, .csv (Max 2MB)
              </p>
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="space-y-3.5 flex-1 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q4 Autonomous Glider Specs"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Glider_Specs_2026.txt"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Text Content *
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type policy or specification text..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#1E3A8A] leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-medium disabled:opacity-50"
                >
                  {uploading ? 'Indexing Passages...' : 'Upload & Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
