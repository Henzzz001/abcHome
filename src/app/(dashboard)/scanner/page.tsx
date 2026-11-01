"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  connectScannerByCode,
  lookupStudentByBarcode,
  recordEventAttendance,
} from "@/features/attendance/actions";

export default function EventScannerPage() {
  // 6-digit connection state
  const [inputCode, setInputCode] = useState("");
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Scanner & Verification state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle 6-Digit Code Submission
  async function handleConnectCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeError(null);

    const res = await connectScannerByCode(inputCode.trim());
    if (!res.success) {
      setCodeError(res.error || "Connection failed.");
    } else {
      setActiveSheet(res.sheet);
    }
  }

  // Barcode Scanner Loop
  useEffect(() => {
    let codeReader: BrowserMultiFormatReader | null = null;

    if (activeSheet && scanning && !scannedStudent) {
      codeReader = new BrowserMultiFormatReader();
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current!, async (result) => {
          if (result) {
            const rawCode = result.getText().trim();
            setScanning(false);
            setScanMessage(null);

            // Lookup Student
            const lookup = await lookupStudentByBarcode(rawCode);
            if (!lookup.success) {
              setScanMessage({ type: "error", text: lookup.error || "Student not found." });
            } else {
              setScannedStudent(lookup.student);
            }
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setScanMessage({ type: "error", text: "Camera error or permission denied." });
          setScanning(false);
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeSheet, scanning, scannedStudent]);

  // Click PROCEED to mark present
  async function handleProceed() {
    if (!activeSheet || !scannedStudent) return;
    setIsSubmitting(true);

    const res = await recordEventAttendance(activeSheet.id, scannedStudent.id);
    setIsSubmitting(false);

    if (!res.success) {
      setScanMessage({ type: "error", text: res.error || "Failed to mark attendance." });
    } else {
      setScanMessage({
        type: "success",
        text: `SUCCESS: ${scannedStudent.full_name} marked PRESENT!`,
      });
      setScannedStudent(null); // Clear for next student
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      {/* STEP 1: CONNECT TO SHEET WITH 6-DIGIT CODE */}
      {!activeSheet ? (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-900 text-center">
            Connect Attendance Scanner
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Enter the 6-Digit Code generated for your Event Attendance Sheet.
          </p>

          {codeError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
              {codeError}
            </div>
          )}

          <form onSubmit={handleConnectCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. 123056"
                className="mt-1 block w-full px-4 py-3 border rounded-md text-center text-2xl font-mono tracking-widest focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow"
            >
              Connect to Event
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: ACTIVE SCANNER SESSION */
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                CONNECTED CODE: {activeSheet.access_code}
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-1">{activeSheet.title}</h2>
              <p className="text-xs text-gray-500">
                {activeSheet.program?.department?.name} — {activeSheet.program?.name}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveSheet(null);
                setScannedStudent(null);
                setScanning(false);
              }}
              className="text-xs text-red-600 hover:underline"
            >
              Disconnect
            </button>
          </div>

          {/* Messages */}
          {scanMessage && (
            <div
              className={`p-3 rounded text-sm ${
                scanMessage.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {scanMessage.text}
            </div>
          )}

          {/* Camera View / Start Button */}
          {!scannedStudent && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {scanning ? (
                  <video ref={videoRef} className="w-full h-full object-cover" />
                ) : (
                  <p className="text-gray-400 text-sm">Camera inactive</p>
                )}
              </div>

              {!scanning && (
                <button
                  onClick={() => {
                    setScanMessage(null);
                    setScanning(true);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                >
                  Scan Student Barcode
                </button>
              )}
            </div>
          )}

          {/* Student Verification & "PROCEED" Step */}
          {scannedStudent && (
            <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900 text-center border-b pb-2">
                Student Verified
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Name:</span> {scannedStudent.full_name}</p>
                <p><span className="font-medium">Student ID:</span> {scannedStudent.student_number}</p>
                <p><span className="font-medium">Program:</span> {scannedStudent.program?.name}</p>
                <p><span className="font-medium">Year Level:</span> {scannedStudent.year_level || "N/A"}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setScannedStudent(null)}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceed}
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "PROCEED"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}