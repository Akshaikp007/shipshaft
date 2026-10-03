'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

/**
 * QRScannerUI Component
 * Production-ready camera scanner with html5-qrcode, permission handling,
 * laser animation HUD, torch controls, file upload fallback, and manual entry.
 */
export default function QRScannerUI({
  onScan,
  onScanError,
  isResolving = false,
  verifiedShipment = null,
  onReset,
  className = '',
}) {
  const [torchOn, setTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('initializing'); // 'initializing' | 'active' | 'denied' | 'unavailable' | 'error'
  const [cameraMessage, setCameraMessage] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleCodeScanned = useCallback(
    (code) => {
      if (!code) return;
      const cleanCode = code.trim();
      setScannedResult(cleanCode);
      setIsScanning(false);

      // Stop active camera hardware stream
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {}
      }

      onScan?.(cleanCode);
    },
    [onScan]
  );

  useEffect(() => {
    let html5QrCode = null;
    let isMounted = true;

    async function initCamera() {
      if (typeof window === 'undefined') return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const readerElem = document.getElementById('qr-reader-viewport');
        if (!readerElem) return;

        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraStatus('unavailable');
          setCameraMessage('Camera API is not supported in this browser or environment.');
          return;
        }

        html5QrCode = new Html5Qrcode('qr-reader-viewport');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              handleCodeScanned(decodedText);
            }
          },
          () => {
            // Frame decode attempt without QR - ignore normal scan ticks
          }
        );

        if (isMounted) {
          setCameraStatus('active');
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('[Camera Scanner Init]:', err?.message || err);
        setCameraStatus('denied');
        setCameraMessage(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please enable camera access in your browser settings, or use manual entry below.'
            : 'Camera unavailable or not detected on this system. You can enter the tracking number manually below.'
        );
      }
    }

    if (isScanning && !scannedResult) {
      initCamera();
    }

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, [isScanning, scannedResult, handleCodeScanned]);

  const handleResetScanner = () => {
    setScannedResult(null);
    setIsScanning(true);
    setManualCode('');
    onReset?.();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('qr-file-dummy-slot');
      const decoded = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      handleCodeScanned(decoded);
    } catch {
      onScanError?.('Could not detect a readable QR code from the selected image file.');
    }
  };

  const toggleTorch = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        const capabilities = scannerRef.current.getRunningTrackCapabilities?.();
        if (capabilities?.torch) {
          await scannerRef.current.applyVideoConstraints({
            advanced: [{ torch: !torchOn }],
          });
          setTorchOn(!torchOn);
          return;
        }
      }
      setTorchOn(!torchOn);
    } catch {
      setTorchOn(false);
    }
  };

  return (
    <div
      className={`relative w-full max-w-lg mx-auto bg-inverse-surface rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col items-center text-white ${className}`}
    >
      {/* Viewfinder Viewport */}
      <div className="relative w-full aspect-square max-h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Background Ambient Dark Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 z-0" />

        {/* Real HTML5 QR Video Element */}
        <div
          id="qr-reader-viewport"
          className="absolute inset-0 w-full h-full object-cover z-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Dummy hidden element for file scanning */}
        <div id="qr-file-dummy-slot" className="hidden" />

        {/* Viewfinder Bounding Box */}
        <div className="relative w-64 h-64 border-2 border-white/20 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
          {/* HUD Glowing Corner Brackets */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl shadow-[0_0_10px_#004ac6]" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl shadow-[0_0_10px_#004ac6]" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl shadow-[0_0_10px_#004ac6]" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl shadow-[0_0_10px_#004ac6]" />

          {/* Animated Laser Scanning Beam */}
          {isScanning && !scannedResult && (
            <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scanLaser_2.5s_ease-in-out_infinite]" />
          )}

          {/* Scanned Success Feedback */}
          {scannedResult ? (
            <div className="flex flex-col items-center gap-2 bg-slate-900/90 p-5 rounded-2xl border border-primary/40 text-center animate-scale-up pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-cyan-400 flex items-center justify-center">
                <Icon name={isResolving ? 'sync' : 'check_circle'} size={32} className={isResolving ? 'animate-spin' : ''} />
              </div>
              <span className="font-mono text-sm font-bold text-white truncate max-w-[200px]">
                {scannedResult}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {isResolving ? 'Authorizing with Registry...' : 'Code Detected'}
              </span>
            </div>
          ) : cameraStatus === 'denied' || cameraStatus === 'unavailable' ? (
            <div className="text-center px-4 pointer-events-auto">
              <Icon name="videocam_off" size={42} className="text-amber-400/80 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {cameraMessage}
              </p>
            </div>
          ) : (
            <div className="text-center px-4 pointer-events-none">
              <Icon name="qr_code_2" size={48} className="text-white/20 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">
                Align waybill QR code within frame
              </p>
            </div>
          )}
        </div>

        {/* Viewport Overlay Controls */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
          <div className="bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isScanning && cameraStatus === 'active'
                  ? 'bg-emerald-400 animate-pulse'
                  : cameraStatus === 'denied' || cameraStatus === 'unavailable'
                  ? 'bg-amber-400'
                  : 'bg-primary'
              }`}
            />
            <span className="text-[11px] font-mono tracking-wide text-slate-200">
              {scannedResult
                ? 'SCAN COMPLETE'
                : cameraStatus === 'active'
                ? 'CAMERA ACTIVE'
                : 'MANUAL / UPLOAD READY'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* File Upload trigger button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full bg-slate-900/70 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all"
              title="Upload QR Image"
            >
              <Icon name="upload_file" size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Flashlight toggle */}
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                torchOn
                  ? 'bg-amber-400 text-slate-900 shadow-[0_0_12px_#fbbf24]'
                  : 'bg-slate-900/70 text-slate-300 hover:text-white border border-white/10'
              }`}
              title="Toggle Torch / Flashlight"
            >
              <Icon name={torchOn ? 'flash_on' : 'flash_off'} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel / Actions */}
      <div className="w-full p-6 bg-slate-900 border-t border-white/10 flex flex-col gap-4">
        {scannedResult ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              className="flex-1 bg-slate-800 text-white border-white/20 hover:bg-slate-700"
              onClick={handleResetScanner}
            >
              Scan Another
            </Button>
            {verifiedShipment && (
              <a href={`/agent/deliveries/${verifiedShipment.id}`} className="flex-1">
                <Button variant="primary" size="md" className="w-full">
                  Open Delivery
                </Button>
              </a>
            )}
          </div>
        ) : (
          /* Manual Code Input fallback */
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualCode.trim()) {
                  handleCodeScanned(manualCode);
                }
              }}
              placeholder="Or enter tracking ID manually (e.g. TRK-ABC123XYZ)..."
              className="flex-1 bg-slate-800/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-primary"
            />
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-800 text-white border-white/20 hover:bg-slate-700 shrink-0"
              onClick={() => manualCode.trim() && handleCodeScanned(manualCode)}
              disabled={!manualCode.trim()}
            >
              Verify
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scanLaser {
          0% {
            top: 5%;
          }
          50% {
            top: 92%;
          }
          100% {
            top: 5%;
          }
        }
      `}</style>
    </div>
  );
}
