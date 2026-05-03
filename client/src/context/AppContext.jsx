import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [notifications, setNotifications] = useState(0);

  return (
    <AppContext.Provider
      value={{
        uploadedFile,
        setUploadedFile,
        prescriptionId,
        setPrescriptionId,
        analysisResult,
        setAnalysisResult,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
