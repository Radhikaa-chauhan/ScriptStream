import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Upload, Camera, Maximize2, Target, CheckCircle, AlertCircle } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Footer from "../components/layout/Footer";
import { useApp } from "../context/AppContext";
import { useUpload } from "../hooks/useUpload";

const guidelines = [
  {
    icon: <Camera size={18} className="text-brand-600" />,
    title: "Bright Lighting",
    desc: "Ensure the prescription is well-lit without heavy shadows or glare on the surface.",
  },
  {
    icon: <Maximize2 size={18} className="text-brand-600" />,
    title: "Full Visibility",
    desc: "Align all four corners of the document within the frame. Don't crop out doctor signatures.",
  },
  {
    icon: <Target size={18} className="text-brand-600" />,
    title: "Steady Focus",
    desc: "Hold the camera flat over the document. Blurry text reduces AI extraction accuracy.",
  },
];

const ACCEPTED_TYPES = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "application/pdf": [".pdf"] };
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export default function UploadIdle() {
  const navigate = useNavigate();
  const { setUploadedFile, setPrescriptionId } = useApp();
  const { upload, uploading, uploadProgress, error: uploadError } = useUpload();
  const [dropError, setDropError] = useState(null);
  const [fileReady, setFileReady] = useState(null);

  const error = dropError || uploadError;

  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        setDropError(err.code === "file-too-large" ? "File exceeds 15MB limit." : "Invalid file type. Use JPG, PNG, or PDF.");
        return;
      }
      if (accepted.length > 0) {
        setDropError(null);
        setFileReady(accepted[0]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const handleProceed = async () => {
    if (!fileReady || uploading) return;
    setUploadedFile(fileReady);
    const rxId = await upload(fileReady);
    if (rxId) {
      setPrescriptionId(rxId);
      navigate("/processing");
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 max-w-4xl mx-auto w-full">
          {/* Breadcrumb + header */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
              STEP 01 · INITIALIZATION
            </span>
          </div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink mt-2">New Digitization</h1>
              <p className="text-sm text-ink-secondary mt-1">
                Capture and validate handwritten medical prescriptions using real-time RAG processing.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 text-xs font-semibold text-green-700">
              <span className="live-dot" />
              ENGINE READY: V2.4.0
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-200 mb-6 ${
              isDragActive
                ? "border-brand-500 bg-brand-50 scale-[1.01]"
                : fileReady
                ? "border-green-400 bg-green-50"
                : "border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/40"
            }`}
          >
            <input {...getInputProps()} />

            {fileReady ? (
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div>
                  <p className="font-display font-semibold text-lg text-ink">{fileReady.name}</p>
                  <p className="text-sm text-ink-muted mt-1">
                    {(fileReady.size / 1024 / 1024).toFixed(2)} MB · Ready to process
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFileReady(null); }}
                  className="text-xs text-ink-muted underline hover:text-ink mt-1"
                >
                  Remove and choose another
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200">
                  <Upload size={28} className="text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-ink">
                    {isDragActive ? "Release to Upload" : "Drop Prescription Image"}
                  </p>
                  <p className="text-sm text-ink-secondary mt-1">
                    Drag your file here or click to browse from your device
                  </p>
                </div>
                <button className="btn-primary text-sm mt-1" onClick={(e) => e.stopPropagation()}>
                  <Upload size={15} />
                  Select Image File
                </button>
                <p className="text-xs text-ink-muted font-medium tracking-wide">
                  SUPPORTED: JPG, PNG, PDF (MAX 15MB)
                </p>
              </div>
            )}

            {/* Corner badge */}
            <div className="absolute bottom-3 right-4 text-xs text-ink-muted font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              RAG V2.4.0 ACTIVE
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 animate-fade-in">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Proceed button */}
          {fileReady && (
            <div className="flex justify-center mb-6 animate-fade-in">
              <button onClick={handleProceed} disabled={uploading} className="btn-primary text-base px-8 py-3 disabled:opacity-60 disabled:cursor-not-allowed">
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading... {uploadProgress}%
                  </span>
                ) : (
                  "Start Processing →"
                )}
              </button>
            </div>
          )}

          {/* Guidelines */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">
                📷 Capture Guidelines
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {guidelines.map((g, i) => (
                <div key={i} className="card flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    {g.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{g.title}</p>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
