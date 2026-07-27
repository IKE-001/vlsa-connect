"use client";
import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React, { useState, useEffect, useRef } from "react";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";

type DocCategory = "all" | "minutes" | "ledger" | "loan" | "reports";

interface DocRecord {
  id: string;
  name: string;
  date: string;
  type: string;
  size: string;
  description?: string;
  url?: string;
}

const typeColor: Record<string, "green" | "blue" | "purple" | "orange"> = {
  minutes: "green",
  ledger:  "blue",
  loan:    "orange",
  reports: "purple",
};

const DOC_TYPES = [
  { value: "minutes",  label: "Meeting Minutes",    desc: "Notes or minutes from a group meeting" },
  { value: "ledger",   label: "Ledger / Finance",   desc: "Financial records, statements or ledger exports" },
  { value: "loan",     label: "Loan Document",       desc: "Loan agreements, repayment schedules" },
  { value: "reports",  label: "General Report",      desc: "Any other group document or report" },
];

export const MemberDocumentsTemplate: React.FC = () => {
  const [category, setCategory] = useState<DocCategory>("all");
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload modal state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState("reports");
  const [uploading, setUploading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const categories: { key: DocCategory; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "minutes", label: "Minutes" },
    { key: "ledger",  label: "Ledger" },
    { key: "loan",    label: "Loan Docs" },
    { key: "reports", label: "Reports" },
  ];

  const fetchDocs = async () => {
    try {
      const groupId = typeof window !== "undefined" ? localStorage.getItem("vsla_active_group_id") ?? "" : "";
      const params = groupId ? `?groupId=${groupId}` : "";
      const res = await fetch(`/api/member/documents${params}`);
      if (res.ok) {
        const json = await res.json();
        setDocs(json.data ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  // Step 1: user picks a file → show type selector modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setSelectedDocType("reports");
    setShowTypeModal(true);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Step 2: user confirms type → upload
  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError(null);
    setShowTypeModal(false);

    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      const uploadRes = await fetch("/api/media/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || "Upload failed");
      }

      const groupId = typeof window !== "undefined" ? localStorage.getItem("vsla_active_group_id") ?? "" : "";
      await fetch("/api/member/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pendingFile.name,
          url: uploadJson.url,
          type: selectedDocType,
          groupId,
          size: `${(pendingFile.size / 1024).toFixed(1)} KB`,
        }),
      });

      await fetchDocs();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const filtered = category === "all" ? docs : docs.filter(d => d.type === category);

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><MemberSidebar activePath="/documents" /></div>
      <div className="flex-1 min-w-0 flex flex-col pb-12">

        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Documents</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Group records, minutes &amp; financial documents</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
          <Button
            theme="green"
            leftIcon={<Icon name="arrow-down-circle" className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload Document"}
          </Button>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-[12px] px-4 py-3 text-[13px] font-medium">
              {uploadError}
            </div>
          )}

          {uploading && (
            <div className="bg-[#E3F3EA] border border-[#2D7A52]/30 text-[#2D7A52] rounded-[12px] px-4 py-3 text-[13px] font-medium flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#2D7A52] border-t-transparent rounded-full animate-spin" />
              Uploading document to Cloudinary…
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-bold border transition-all ${category === c.key ? "bg-[#2D7A52] text-white border-[#2D7A52]" : "bg-white text-[#5B6B65] border-[#E9EDEA] hover:border-[#2D7A52]/40"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#2D7A52] border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-[#5B6B65] font-medium">Loading documents...</p>
            </div>
          )}

          {!isLoading && (
            <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] overflow-hidden">
              {filtered.map((doc, i) => (
                <div key={doc.id ?? i} className="flex items-center gap-4 px-5 py-4 border-b border-[#F1F4F2] last:border-0 hover:bg-[#F7F9F8] transition-colors group">
                  <div className="w-10 h-10 rounded-[12px] bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center shrink-0">
                    <Icon name="doc" className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-[#1B2321] truncate">{doc.name}</div>
                    <div className="text-[11.5px] text-[#94A29C] mt-0.5">
                      {doc.date}{doc.size !== "–" ? ` · ${doc.size}` : ""}
                      {doc.description && <span className="block text-[11px] text-[#5B6B65] mt-0.5 truncate">{doc.description}</span>}
                    </div>
                  </div>
                  <Badge variant={typeColor[doc.type] ?? "green"} size="sm">{doc.type}</Badge>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2D7A52] hover:text-[#1B5E3F] ml-1 p-1">
                      <Icon name="arrow-down-circle" className="w-4.5 h-4.5" />
                    </a>
                  ) : (
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2D7A52] hover:text-[#1B5E3F] ml-1 p-1">
                      <Icon name="arrow-down-circle" className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-5 py-12 text-center text-[#94A29C] text-[13px] font-medium">
                  No documents found in this category.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Document type selector modal */}
      {showTypeModal && pendingFile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="text-[17px] font-extrabold text-[#1B2321]">What is this document?</h3>
              <p className="text-[12.5px] text-[#5B6B65] mt-1">
                File: <span className="font-semibold text-[#1B2321]">{pendingFile.name}</span>
                {" · "}{(pendingFile.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setSelectedDocType(dt.value)}
                  className={`w-full text-left px-4 py-3 rounded-[12px] border transition-all ${
                    selectedDocType === dt.value
                      ? "bg-[#E3F3EA] border-[#2D7A52]"
                      : "border-[#E9EDEA] hover:border-[#2D7A52]/50"
                  }`}
                >
                  <div className={`text-[13.5px] font-bold ${selectedDocType === dt.value ? "text-[#2D7A52]" : "text-[#1B2321]"}`}>
                    {dt.label}
                  </div>
                  <div className="text-[11.5px] text-[#94A29C] mt-0.5">{dt.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-end mt-1">
              <Button variant="outline" theme="green" onClick={() => { setShowTypeModal(false); setPendingFile(null); }}>
                Cancel
              </Button>
              <Button theme="green" onClick={handleConfirmUpload}>
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};
