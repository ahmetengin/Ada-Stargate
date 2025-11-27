
import React, { useState } from 'react';
import { ScanLine, ShieldCheck, Smartphone, UserCheck, Siren, UploadCloud, CheckCircle2, Calendar, Clock, Radar, UserPlus, X } from 'lucide-react';
import { GuestProfile } from '../../../types';

export const GuestCheckInTab: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedData, setScannedData] = useState<Partial<GuestProfile> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInComplete, setCheckInComplete] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Mock Expected Arrivals (Merged Live AIS + Future Schedules)
  const [expectedArrivals, setExpectedArrivals] = useState([
      { id: 'EXP-01', type: 'VESSEL', name: 'S/Y Wind Chaser', contact: 'Cpt. Murat', eta: '3.2 nm', status: 'INBOUND', vesselId: 'CH-02' },
      { id: 'EXP-02', type: 'GUEST', name: 'Mr. John Wick', contact: 'Host: M/Y Poseidon', eta: 'Tomorrow 14:00', status: 'SCHEDULED', vesselId: 'TR-POS' },
      { id: 'EXP-03', type: 'GUEST', name: 'VIP Delegation', contact: 'Host: WIM Sales', eta: '22 Nov 09:00', status: 'SCHEDULED', vesselId: 'ADMIN' },
  ]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          handleScan(); // Reuse simulation for file processing
      }
  };

  const handleCheckIn = () => {
    setIsSubmitting(true);
    
    // Simulate API call to KBS (Kolluk Bildirim Sistemi)
    setTimeout(() => {
        setIsSubmitting(false);
        setCheckInComplete(true);
    }, 2000);
  };

  const handleSelectArrival = (arrival: any) => {
      // Auto-fill form based on selection
      setScannedData({
          fullName: arrival.name,
          vesselName: arrival.contact.includes('Host:') ? arrival.contact.split('Host: ')[1] : arrival.name,
          nationality: 'Unknown', // Needs ID scan
          id: '', // Needs ID scan
      });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Add new schedule to list
      const newSchedule = { 
          id: `EXP-${Date.now()}`, 
          type: 'GUEST', 
          name: 'New Guest', 
          contact: 'Host: S/Y Phisedelia', 
          eta: 'Tomorrow 10:00', 
          status: 'SCHEDULED', 
          vesselId: 'TR-PHI' 
      };
      setExpectedArrivals(prev => [...prev, newSchedule]);
      setShowScheduleForm(false);
  };

  const reset = () => {
      setScannedData(null);
      setCheckInComplete(false);
      setScanProgress(0);
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in duration-300 h-full flex flex-col overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 sm:gap-0">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* COLUMN 1: EXPECTED ARRIVALS (The "Proactive List") */}
          <div className="w-full lg:w-1/3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[400px] lg:max-h-none">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} /> Expected Arrivals
                  </div>
                  <button 
                    onClick={() => setShowScheduleForm(true)}
                    className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                  >
                      <UserPlus size={10} /> Schedule
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {showScheduleForm && (
                      <form onSubmit={handleScheduleSubmit} className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded border border-indigo-200 dark:border-indigo-800/30 mb-2 animate-in slide-in-from-top-2">
                          <div className="flex justify-between mb-2"><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">New Appointment</span><button type="button" onClick={() => setShowScheduleForm(false)}><X size={12}/></button></div>
                          <input type="text" placeholder="Guest Name" className="w-full mb-2 text-xs p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700" />
                          <div className="flex gap-2">
                              <input type="date" className="w-full text-xs p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700" />
                              <input type="time" className="w-full text-xs p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700" />
                          </div>
                          <button type="submit" className="w-full mt-2 bg-indigo-500 text-white text-xs font-bold py-1.5 rounded">Confirm</button>
                      </form>
                  )}

                  {expectedArrivals.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleSelectArrival(item)}
                        className="p-3 rounded border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-all group"
                      >
                          <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-400 transition-colors">{item.name}</span>
                              {item.status === 'INBOUND' ? (
                                  <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Radar size={10} className="animate-pulse" /> {item.eta}
                                  </span>
                              ) : (
                                  <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Clock size={10} /> {item.eta}
                                  </span>
                              )}
                          </div>
                          <div className="text-xs text-zinc-500 flex justify-between">
                              <span>{item.contact}</span>
                              {item.type === 'VESSEL' && <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">AIS LOCK</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* COLUMN 2: SCANNER & FORM */}
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
                      <div className="flex gap-3 justify-center">
                        <button 
                            onClick={handleScan}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Live Scan
                        </button>
                        <label className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-4 py-3 rounded-lg text-sm font-bold uppercase cursor-pointer transition-colors flex items-center gap-2">
                            <UploadCloud size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                      </div>
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
                              <input type="text" value={scannedData.id || 'SCANNING...'} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm font-mono" readOnly />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase">Nationality</label>
                              <input type="text" value={scannedData.nationality || 'SCANNING...'} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm" readOnly />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase">Host Vessel</label>
                              <input type="text" value={scannedData.vesselName} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm text-indigo-500 font-bold" readOnly />
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button onClick={reset} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              Reset
                          </button>
                          <button 
                            onClick={handleCheckIn}
                            disabled={!scannedData.id || isSubmitting}
                            className={`flex-[2] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${!scannedData.id ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}
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

          {/* COLUMN 3: PASSKIT PREVIEW */}
          <div className="w-full lg:w-80 bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col items-center justify-center relative min-h-[300px] flex-shrink-0 hidden xl:flex">
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
                          <div className="font-bold text-lg">{scannedData?.vesselName || '...'}</div>
                      </div>
                  </div>
                  <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                          <div>
                              <div className="text-[10px] text-zinc-400 uppercase">Guest</div>
                              <div className="font-bold text-zinc-800 text-sm">{scannedData?.fullName || '...'}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-[10px] text-zinc-400 uppercase">Valid Until</div>
                              <div className="font-bold text-zinc-800 text-sm">24 HOURS</div>
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
