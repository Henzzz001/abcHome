"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { verifyBarcodeAndResetPassword } from "@/features/auth/barcode-recovery-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [scannedId, setScannedId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let codeReader: BrowserMultiFormatReader | null = null;

    if (scanning && !scannedId) {
      codeReader = new BrowserMultiFormatReader();
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result) {
            const text = result.getText().trim();
            setScannedId(text);
            setScanning(false);
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setCameraError("Unable to access camera. Please allow camera permissions.");
          setScanning(false);
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanning, scannedId]);

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!scannedId) return;

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    const res = await verifyBarcodeAndResetPassword(scannedId, newPassword);

    setIsSubmitting(false);

    if (!res.success) {
      setStatusMsg({ type: "error", text: res.error || "Failed to reset password." });
    } else {
      setStatusMsg({ type: "success", text: "Password updated successfully! Redirecting to login..." });
      setTimeout(() => router.push("/login"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg border shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">ID Barcode Recovery</h2>
          <p className="mt-1 text-sm text-gray-500">
            Scan the barcode on your physical Student ID card using your device camera.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded text-sm ${
              statusMsg.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {!scannedId ? (
          <div className="space-y-4 text-center">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {scanning ? (
                <video ref={videoRef} className="w-full h-full object-cover" />
              ) : (
                <p className="text-gray-400 text-sm px-4">
                  {cameraError || "Camera inactive. Tap below to start scanning."}
                </p>
              )}
            </div>

            {!scanning && (
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  setScanning(true);
                }}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow transition-colors"
              >
                Start Camera Scanner
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded text-sm">
              <span className="font-semibold">Scanned Student ID:</span> {scannedId}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium text-sm rounded-md shadow transition-colors"
            >
              {isSubmitting ? "Updating..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setScannedId(null)}
              className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Scan Again
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}