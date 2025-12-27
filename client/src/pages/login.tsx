import { useState } from "react";
import { useLocation } from "wouter";
import { Zap, Lock, ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import generatedImage from '@assets/generated_images/abstract_quantum_data_visualization_background.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Asset */}
      <div className="absolute inset-0 z-0">
        <img 
          src={generatedImage} 
          alt="Quantum Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="bg-black/40 backdrop-blur-xl border-primary/20 shadow-[0_0_40px_-10px_rgba(0,255,255,0.15)]">
          <CardContent className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded bg-primary/20 border border-primary flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter text-white">
                QEL<span className="text-primary">.OS</span>
              </h1>
              <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                Quantum Expression Language
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="text-xs font-mono uppercase text-primary/80">Operative ID</Label>
                <div className="relative">
                  <ScanLine className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="id" 
                    placeholder="QEL-8842-X" 
                    className="pl-10 bg-white/5 border-primary/20 text-white placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    defaultValue="ADMIN-01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key" className="text-xs font-mono uppercase text-primary/80">Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="key" 
                    type="password" 
                    className="pl-10 bg-white/5 border-primary/20 text-white focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    defaultValue="password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⟳</span> AUTHENTICATING...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    INITIATE SESSION <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-white/10 flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>SYSTEM: ONLINE</span>
              <span>ENC: AES-256-GCM</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
