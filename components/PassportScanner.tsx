
import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine, Smartphone, AlertTriangle, CameraOff } from 'lucide-react';

interface PassportScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: { name: string; id: string; country: string }) => void;
}

export const PassportScanner: React.FC<PassportScannerProps> = ({ isOpen, onClose, onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scannedText, setScannedText] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Matrix-style MRZ Character Simulation
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";

  useEffect(() => {
    if (isOpen) {
      setError(null); // Reset error on open
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanning(true);
      simulateScanning();
    } catch (err: any) {
      console.error("Camera access denied", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera permission was denied. Please allow camera access in your browser settings to use this feature.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No camera device found on this system.");
      } else {
          setError("Unable to access camera. " + (err.message || "Unknown error."));
      }
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
    setProgress(0);
    setScannedText('');
  };

  const simulateScanning = () => {
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setProgress(p);
      
      // Generate random MRZ-like text
      let txt = "P<TUR";
      for(let i=0; i<30; i++) {
          txt += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setScannedText(txt);

      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
            finishScan();
        }, 500);
      }
    }, 50);
  };

  const finishScan = () => {
      // Simulated extraction result
      onScanComplete({
          name: "AHMET ENGIN",
          id: "U12345678",
          country: "TUR"
      });
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
            <ScanLine className="text-emerald-500 animate-pulse" />
            <span className="font-mono font-bold tracking-widest text-sm">IDENTITY SCANNER v2.0</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
            <X size={20} />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900 flex items-center justify-center">
        {error ? (
            <div className="max-w-md p-6 bg-zinc-800 rounded-xl border border-red-500/30 text-center mx-4">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <CameraOff size={32} className="text-red-500" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
                <p className="text-sm text-zinc-400 mb-6">{error}</p>
                <button 
                    onClick={() => { setError(null); startCamera(); }}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Retry Access
                </button>
            </div>
        ) : (
            <>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                
                {/* Scanning Overlay (The "Kare Alan") */}
                <div className="relative w-[85%] max-w-md aspect-[1.58/1] border-2 border-white/30 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                    {/* Scanning Laser Line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>

                    {/* Live OCR Text Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-[10px] font-mono text-emerald-500/70 mb-1 uppercase tracking-widest">Detecting MRZ Zone...</div>
                        <div className="font-mono text-lg text-white font-bold tracking-widest drop-shadow-md whitespace-nowrap overflow-hidden">
                            {scannedText}
                        </div>
                    </div>
                </div>

                {/* Guidelines */}
                <div className="absolute bottom-24 text-center w-full px-10">
                    <p className="text-white/80 text-sm font-medium bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        Align document within the frame
                    </p>
                </div>
            </>
        )}
      </div>

      {/* Footer / Status */}
      <div className="h-20 bg-black border-t border-zinc-800 flex items-center px-6 justify-between">
         <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full ${error ? 'bg-red-500/20' : 'bg-emerald-500/20'} flex items-center justify-center`}>
                 {error ? <AlertTriangle size={20} className="text-red-500" /> : <Smartphone size={20} className="text-emerald-500" />}
             </div>
             <div>
                 <div className="text-xs text-zinc-400 font-mono uppercase">Status</div>
                 <div className={`text-sm font-bold tracking-wider ${error ? 'text-red-500' : 'text-white'}`}>
                     {error ? 'ERROR' : 'SEARCHING...'}
                 </div>
             </div>
         </div>
         <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
             <div className={`h-full ${error ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-100`} style={{ width: `${error ? 100 : progress}%` }}></div>
         </div>
      </div>

      <style>{`
        @keyframes scan {
            0% { top: 5%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 95%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
