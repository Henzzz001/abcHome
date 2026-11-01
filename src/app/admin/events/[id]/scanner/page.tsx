"use client";

import { useEffect, useState, useRef, use } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function MobileCameraScannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
    studentName?: string;
  }>({ type: null, message: "" });
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isProcessingRef = useRef(false);
  const supabase = createClient();

  const processCheckIn = async (studentIdCode: string) => {
    const cleanCode = studentIdCode.trim();
    if (!cleanCode) return;

    setLastScanned(cleanCode);
    setStatus({ type: "info", message: `Checking ID: ${cleanCode}...` });

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, student_id")
        .eq("student_id", cleanCode)
        .single();

      if (profileError || !profile) {
        setStatus({
          type: "error",
          message: `Unrecognized Student ID: "${cleanCode}"`,
        });
        return;
      }

      const { data: existingLog } = await supabase
        .from("attendance_logs")
        .select("id")
        .eq("event_id", eventId)
        .eq("student_id", profile.id)
        .single();

      if (existingLog) {
        setStatus({
          type: "error",
          message: `${profile.full_name} is ALREADY logged!`,
          studentName: profile.full_name,
        });
        return;
      }

      const { error: insertError } = await supabase
        .from("attendance_logs")
        .insert([{ event_id: eventId, student_id: profile.id }]);

      if (insertError) throw insertError;

      setStatus({
        type: "success",
        message: `Check-in successful!`,
        studentName: profile.full_name,
      });
    } catch (err: any) {
      console.error("Scan error:", err);
      setStatus({
        type: "error",
        message: err.message || "Failed to record scan.",
      });
    }
  };

  useEffect(() => {
    const hints = new Map();
    const formats = [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.QR_CODE,
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    const codeReader = new BrowserMultiFormatReader(hints);

    async function startScanner() {
      try {
        setCameraError(null);
        await codeReader.decodeFromVideoDevice(
          null,
          videoRef.current!,
          async (result, err) => {
            if (result && !isProcessingRef.current) {
              isProcessingRef.current = true;
              await processCheckIn(result.getText());

              setTimeout(() => {
                isProcessingRef.current = false;
              }, 2000);
            }
          }
        );
      } catch (err: any) {
        console.error("ZXing Camera Error:", err);
        setCameraError("Unable to access camera. Please check browser camera permissions.");
      }
    }

    startScanner();

    return () => {
      codeReader.reset();
    };
  }, [eventId, supabase]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col p-4 max-w-lg mx-auto space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-base font-bold text-slate-900">Camera Barcode Scanner</h1>
        </div>
        <Link
          href="/admin/connect"
          className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          Disconnect
        </Link>
      </div>

      {/* Video Viewfinder Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-4/3 shadow-sm flex items-center justify-center">
        {/* Added scale-x-[-1] to flip the camera feed back to natural orientation */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />
        {cameraError ? (
          <div className="absolute p-4 text-center text-xs text-red-400 bg-black/80">
            {cameraError}
          </div>
        ) : (
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-28 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none animate-pulse"></div>
        )}
      </div>

      {/* Status Feedback Banner */}
      {status.type && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-col gap-0.5 ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : status.type === "error"
              ? "bg-red-50 border-red-300 text-red-900"
              : "bg-blue-50 border-blue-300 text-blue-900"
          }`}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span>{status.type === "success" ? "✅" : status.type === "error" ? "⚠️" : "ℹ️"}</span>
            <span>{status.message}</span>
          </div>
          {status.studentName && (
            <div className="text-[11px] font-semibold opacity-90 pl-5">
              Student: {status.studentName}
            </div>
          )}
        </div>
      )}

      {lastScanned && (
        <div className="mt-auto pt-2 text-center text-[11px] text-slate-400 font-mono">
          Last Scanned ID: <span className="text-slate-700 font-bold">{lastScanned}</span>
        </div>
      )}
    </div>
  );
}