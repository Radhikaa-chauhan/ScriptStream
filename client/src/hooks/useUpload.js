import { useState } from "react";
import { analyzePrescription } from "../services/api";

/**
 * useUpload — converts a file to base64 and sends it to the
 * backend POST /api/analyze endpoint for AI processing.
 *
 * Usage:
 *   const { upload, uploading, prescriptionId, error } = useUpload();
 *   await upload(file);  // then use prescriptionId for tracking
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const upload = async (file) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Convert file to base64
      setUploadProgress(30);
      const base64 = await fileToBase64(file);

      // Step 2: Send to backend /api/analyze
      setUploadProgress(60);
      const { data } = await analyzePrescription(base64);

      setUploadProgress(100);
      setPrescriptionId(data.prescriptionId);
      return data.prescriptionId;
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, uploadProgress, prescriptionId, error };
}
