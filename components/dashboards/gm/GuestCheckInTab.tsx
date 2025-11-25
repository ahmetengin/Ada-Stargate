
import React, { useState } from 'react';
import { ScanLine, ShieldCheck, Smartphone, UserCheck, Siren, UploadCloud, CheckCircle2 } from 'lucide-react';
import { GuestProfile } from '../../../types';

export const GuestCheckInTab: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedData, setScannedData] = useState<Partial<GuestProfile> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInComplete, setCheckInComplete] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate OCR Process
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScannedData({
            id: "U12345678",
            fullName: "AHMET ENGIN",
            nationality: "TUR",
            dob: "1980-06-15",
            vesselName: "S/Y Phisedelia"
          });
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleCheckIn = () => {
    setIsSubmitting(true);
    
    // Simulate API call to KBS (Kolluk Bildirim Sistemi)
    setTimeout(() => {
        setIsSubmitting(false);
        setCheckInComplete(true);
    }, 2000);
  };

  const reset = () => {
      setScannedData(null);
      setCheckInComplete(false);
      setScanProgress(0);
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in duration-300 h-full flex flex-col overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-2 sm:gap-0">
        <div>
          <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter flex items-center gap-2">
            <UserCheck size={20} className="text-indigo-500" /> Guest Entry Protocol
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Mandatory Identity Reporting (Law No. 1774)</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold bg-red-500/10 text-red-500 px-3 py-1 rounded border border-red-500/20">
            <Siren size={12} className="animate-pulse" />
            LAW ENFORCEMENT LINK ACTIVE
        </div>
      </div>

      {/* Main Content Area - Stacks vertically on mobile, horizontal on large screens */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: SCANNER & FORM */}
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center relative overflow-hidden min-h-[300px]">
              
              {!scannedData && !isScanning && (
                  <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                          <ScanLine size={32} className="text-zinc-400" />
                      </div>
                      <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Scan ID Document</h4>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                          Place Passport or ID card on the reader. OCR system will automatically extract MRZ data.
                      </p>
                      <button 
                        onClick={handleScan}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20"
                      >
                          Initiate Scan
                      </button>
                  </div>
              )}

              {isScanning && (
                  <div className="text-center w-full max-w-sm mx-auto">
                      <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">OCR Processing</div>
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-indigo-500 transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono animate-pulse">Reading MRZ... Verifying Hologram...</p>
                  </div>
              )}

              {scannedData && !checkInComplete && (
                  <div className="space-y-4 animate-in zoom-in duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase">Full Name</label>
                              <input type="text" value={scannedData.fullName} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm font-bold" readOnly />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase">ID / Passport No</label>
                              <input type="text" value={scannedData.id} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm font-mono" readOnly />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase">Nationality</label>
                              <input type="text" value={scannedData.nationality} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm" readOnly />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase">Host Vessel</label>
                              <input type="text" value={scannedData.vesselName} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm text-indigo-500 font-bold" readOnly />
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button onClick={reset} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              Rescan
                          </button>
                          <button 
                            onClick={handleCheckIn}
                            disabled={isSubmitting}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                              {isSubmitting ? (
                                  <>
                                    <UploadCloud size={14} className="animate-bounce" />
                                    Transmitting to Police...
                                  </>
                              ) : (
                                  <>
                                    <ShieldCheck size={14} />
                                    Confirm & Notify
                                  </>
                              )}
                          </button>
                      </div>
                  </div>
              )}

              {checkInComplete && (
                  <div className="text-center space-y-6 animate-in zoom-in duration-300">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 size={40} className="text-emerald-500" />
                      </div>
                      <div>
                          <h4 className="text-xl font-black text-zinc-800 dark:text-zinc-200">CHECK-IN SUCCESSFUL</h4>
                          <p className="text-xs text-zinc-500 mt-2">Guest registered in Marina DB.</p>
                          <p className="text-xs text-emerald-600 font-bold mt-1">KBS (Police) Notification: SENT [Ref: KBS-9921]</p>
                      </div>
                      <button onClick={reset} className="text-xs text-zinc-400 hover:text-zinc-300 underline">Process Next Guest</button>
                  </div>
              )}
          </div>

          {/* RIGHT: PASSKIT PREVIEW */}
          <div className="w-full lg:w-80 bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col items-center justify-center relative min-h-[300px] flex-shrink-0">
              <div className="absolute top-4 left-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={12} /> Digital Key
              </div>
              
              <div className={`w-64 bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${checkInComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-50 blur-[2px]'}`}>
                  <div className="h-32 bg-indigo-600 p-4 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
                      <div className="flex justify-between items-start text-white relative z-10">
                          <span className="font-bold text-xs">Ada.Marina</span>
                          <span className="font-bold text-xs">GUEST PASS</span>
                      </div>
                      <div className="text-white relative z-10">
                          <div className="text-[10px] opacity-80 uppercase">Host Vessel</div>
                          <div className="font-bold text-lg">S/Y Phisedelia</div>
                      </div>
                  </div>
                  <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                          <div>
                              <div className="text-[10px] text-zinc-400 uppercase">Guest</div>
                              <div className="font-bold text-zinc-800 text-sm">AHMET ENGIN</div>
                          </div>
                          <div className="text-right">
                              <div className="text-[10px] text-zinc-400 uppercase">Valid Until</div>
                              <div className="font-bold text-zinc-800 text-sm">21 NOV</div>
                          </div>
                      </div>
                      <div className="flex justify-center py-2">
                          <div className="w-32 h-32 bg-zinc-900 rounded-lg flex items-center justify-center">
                              {/* Mock QR */}
                              <div className="grid grid-cols-5 gap-1 p-2">
                                  {[...Array(25)].map((_, i) => (
                                      <div key={i} className={`w-1.5 h-1.5 rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="mt-6 text-center">
                  <div className="text-xs text-zinc-500">PassKit Status</div>
                  <div className={`text-sm font-bold ${checkInComplete ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {checkInComplete ? 'READY TO SHARE' : 'WAITING FOR CHECK-IN'}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};
