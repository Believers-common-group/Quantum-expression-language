import React, { useState, useEffect, useRef } from 'react';
import Layout from "@/components/layout";
import { 
  Calculator, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Database,
  QrCode,
  Layers,
  Zap,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function DevKit() {
  const [systemLoad, setSystemLoad] = useState(35);
  const [entropy, setEntropy] = useState(12);
  const [stability, setStability] = useState(100);
  const [feedbackLoopActive, setFeedbackLoopActive] = useState(false);
  const [generatedResolutions, setGeneratedResolutions] = useState<any[]>([]);
  const [activeResolution, setActiveResolution] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [oracleAdvice, setOracleAdvice] = useState<string | null>(null);
  const [isOracleThinking, setIsOracleThinking] = useState(false);

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setEntropy(prev => {
        const naturalDecay = 0.5;
        const loadFactor = systemLoad > 70 ? 1.5 : 0;
        let newEntropy = prev + naturalDecay + loadFactor;
        if (feedbackLoopActive) {
          if (newEntropy > 50) return newEntropy - 5; 
        }
        return Math.min(newEntropy, 100);
      });

      setStability(prev => {
        const targetStability = 100 - entropy;
        const diff = targetStability - prev;
        return prev + (diff * 0.1);
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [systemLoad, entropy, feedbackLoopActive]);

  const handleResolve = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', 
        hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
      });

      const inputVal = Math.floor(systemLoad);
      const outputVal = Math.floor(systemLoad * (stability/100));
      const technobabble = [
        "Flushing quantum buffer capacitors",
        "Re-aligning heuristic core matrix",
        "Dumping static memory cache",
        "Recalibrating entropy dampeners",
        "Synchronizing parallel state registers"
      ];

      const newRes = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        timestamp,
        operation: `${inputVal} → ${outputVal}`,
        status: 'RESOLVE GENERATED',
        aiLog: technobabble[Math.floor(Math.random() * technobabble.length)],
        systemState: { load: inputVal, entropy: Math.floor(entropy) }
      };

      setActiveResolution(newRes);
      setGeneratedResolutions(prev => [newRes, ...prev].slice(0, 5));
      setEntropy(prev => Math.max(0, prev - 30));
      setIsProcessing(false);
    }, 800);
  };

  const handleConsultOracle = async () => {
    if (isOracleThinking) return;
    setIsOracleThinking(true);
    setOracleAdvice(null);

    setTimeout(() => {
      const advices = entropy > 60 
        ? ["⚠️ CRITICAL: Entropy cascade imminent. Initiate resolve sequence.", "🔴 WARNING: System coherence degrading. Immediate intervention required."]
        : ["✅ Systems nominal. Continue monitoring for drift.", "🔵 Observing stable state. Proceed with caution."];
      setOracleAdvice(advices[Math.floor(Math.random() * advices.length)]);
      setIsOracleThinking(false);
    }, 1200);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <header className="flex justify-between items-center border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/30">
              <Layers className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Developer Framework <span className="text-primary">///</span> OS</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Mechanics of Situations</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${feedbackLoopActive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></span>
              LOOP: {feedbackLoopActive ? 'ENGAGED' : 'IDLE'}
            </span>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-muted'}`}></span>
              PROC: {isProcessing ? 'BUSY' : 'READY'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-card/50 rounded-xl border border-border p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Activity size={120} className="text-primary" />
              </div>
              
              <h2 className="text-sm font-semibold text-muted-foreground mb-6 flex items-center gap-2">
                <Database size={16} /> SYSTEM VARIABLES
              </h2>

              <div className="space-y-8 relative z-10">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-mono text-muted-foreground">SYSTEM LOAD (INPUT)</label>
                    <span className="text-xs font-mono text-primary">{systemLoad}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={systemLoad} 
                    onChange={(e) => setSystemLoad(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    data-testid="slider-system-load"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-mono text-muted-foreground">ENTROPY (DISORDER)</label>
                    <span className={`text-xs font-mono ${entropy > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {Math.floor(entropy)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-lg overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${entropy > 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${entropy}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    High load accelerates entropy. Use the Resolver Widget to restore order.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-mono text-muted-foreground">SYSTEM STABILITY</label>
                    <span className="text-xs font-mono text-accent">{Math.floor(stability)}%</span>
                  </div>
                  <div className="flex gap-1 h-8">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className={`flex-1 rounded-sm transition-all duration-500 ${
                          i < (stability / 5) 
                            ? 'bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.5)]' 
                            : 'bg-secondary/30'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap gap-4">
                 <button 
                  onClick={() => setFeedbackLoopActive(!feedbackLoopActive)}
                  data-testid="button-toggle-loop"
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                    ${feedbackLoopActive 
                      ? 'bg-green-500/10 border-green-500 text-green-400' 
                      : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary'
                    }`}
                >
                  <RefreshCw size={16} className={feedbackLoopActive ? 'animate-spin' : ''} />
                  {feedbackLoopActive ? 'Loop: ACTIVE' : 'Loop: DISABLED'}
                </button>

                <button 
                  onClick={handleResolve}
                  disabled={isProcessing}
                  data-testid="button-execute-resolve"
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.3)] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {isProcessing ? <Zap size={16} className="animate-pulse"/> : <Sparkles size={16} />}
                  {isProcessing ? 'COMPUTING...' : 'EXECUTE RESOLVE'}
                </button>
              </div>
            </div>

            <div className="bg-card/30 rounded-xl border border-border/50 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                  <MessageSquare size={14} /> System Oracle
                </h3>
                <button 
                  onClick={handleConsultOracle}
                  disabled={isOracleThinking}
                  data-testid="button-consult-oracle"
                  className="text-[10px] bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded-full border border-accent/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isOracleThinking ? 'THINKING...' : '✨ CONSULT CORE AI'}
                </button>
              </div>
              
              <div className="min-h-[40px] flex items-center">
                {oracleAdvice ? (
                  <p className="text-sm text-accent animate-in fade-in slide-in-from-top-2 italic">
                    "{oracleAdvice}"
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">
                    {isOracleThinking ? "Querying neural subsystem..." : "The Oracle is silent. Request consultation for strategic advice."}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-background rounded-xl border border-border p-4 h-48 overflow-y-auto">
              <h3 className="text-xs font-mono text-muted-foreground mb-2 uppercase">System Log</h3>
              <div className="space-y-2 font-mono text-xs">
                {generatedResolutions.length === 0 && (
                  <p className="text-muted-foreground/50 italic">No resolutions yet. Execute a resolve to populate the log.</p>
                )}
                {generatedResolutions.map((res) => (
                  <div key={res.id} className="flex flex-col gap-1 text-muted-foreground border-b border-border/50 pb-2">
                    <div className="flex justify-between">
                      <span className="text-primary">[{res.id}]</span>
                      <span className="text-muted-foreground/50">{res.timestamp}</span>
                    </div>
                    <div className="text-foreground">{res.aiLog}</div>
                    <div className="text-[10px] text-muted-foreground/50">Load: {res.systemState.load}% | Entropy: {res.systemState.entropy}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card/50 rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <ShieldCheck size={16} /> ACTIVE RESOLUTION
              </h2>
              {activeResolution ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-xs font-mono text-muted-foreground mb-1">ID</div>
                    <div className="font-mono text-lg text-primary">{activeResolution.id}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-[10px] font-mono text-muted-foreground">OPERATION</div>
                      <div className="font-mono text-sm">{activeResolution.operation}</div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-[10px] font-mono text-muted-foreground">STATUS</div>
                      <div className="font-mono text-sm text-emerald-400">{activeResolution.status}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1">AI LOG</div>
                    <div className="font-mono text-xs text-foreground/80 italic">"{activeResolution.aiLog}"</div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground/50 text-sm">Execute a resolve to generate output.</p>
                </div>
              )}
            </div>

            <div className="bg-card/30 rounded-xl border border-border/50 p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> System Alerts
              </h3>
              <div className="space-y-2">
                {entropy > 60 && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 animate-pulse">
                    HIGH ENTROPY: Immediate resolution recommended.
                  </div>
                )}
                {systemLoad > 80 && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
                    WARNING: System load exceeds safe threshold.
                  </div>
                )}
                {entropy <= 60 && systemLoad <= 80 && (
                   <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400">
                     ALL SYSTEMS NOMINAL
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
