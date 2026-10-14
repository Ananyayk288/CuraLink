"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, X, AlertCircle, Scan, Sparkles } from "lucide-react";

interface IdScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (scannedId: string) => void;
  onDetected?: (scannedId: string) => void;
}

export function IdScannerModal({ isOpen, onClose, onScanSuccess, onDetected }: IdScannerModalProps) {
  const triggerSuccess = (id: string) => {
    if (onScanSuccess) onScanSuccess(id);
    if (onDetected) onDetected(id);
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    let activeStream: MediaStream | null = null;
    let detector: any = null;
    let intervalId: any = null;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          return;
        }

        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setStream(activeStream);

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.play().catch(() => {});
        }

        // Check if BarcodeDetector API is natively supported
        if ("BarcodeDetector" in window) {
          // @ts-ignore
          detector = new window.BarcodeDetector({
            formats: ["qr_code", "code_128", "code_39", "ean_13"],
          });

          intervalId = setInterval(async () => {
            if (videoRef.current && detector) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawValue = barcodes[0].rawValue;
                  if (rawValue) {
                    triggerSuccess(rawValue.trim().toUpperCase());
                    onClose();
                  }
                }
              } catch {
                // frame processing error, ignore
              }
            }
          }, 300);
        }
      } catch (err) {
        setHasCamera(false);
        setCameraError("Camera access denied or unavailable. You can use manual entry or demo scan.");
      }
    }

    initCamera();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (id: string) => {
    triggerSuccess(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Scan Patient Barcode / QR</h3>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full"
            aria-label="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Viewfinder */}
          <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
            {hasCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">Camera Feed Simulator</p>
                <p className="text-[11px] text-slate-500 mt-1">{cameraError || "Point camera at patient clinic card or token"}</p>
              </div>
            )}

            {/* Scanning Laser Line Animation */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
            <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-xl pointer-events-none" />
          </div>

          {/* Quick Demo Scan shortcuts */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tap to Test Instant Scan:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSimulateScan("AV-000001")}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] font-bold text-slate-800 hover:bg-blue-50 hover:border-blue-300"
              >
                AV-000001 (Suresh)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan("AV-000003")}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] font-bold text-slate-800 hover:bg-blue-50 hover:border-blue-300"
              >
                AV-000003 (Revised)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan("AV-000005")}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] font-bold text-slate-800 hover:bg-blue-50 hover:border-blue-300"
              >
                AV-000005 (Draft)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
