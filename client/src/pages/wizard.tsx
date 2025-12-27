import Layout from "@/components/layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checklistSteps } from "@/lib/mockData";
import { CheckCircle, Circle, ArrowRight, Upload, Database, Shield, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: "edge", title: "Edge Registration", icon: Upload },
  { id: "schema", title: "Schema Bootstrap", icon: Database },
  { id: "license", title: "License Silo", icon: Shield },
  { id: "erp", title: "ERP Backfill", icon: FileSpreadsheet },
];

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }, 1000);
  };

  const renderStepContent = (stepIndex: number) => {
    switch(stepIndex) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Edge Node ID</Label>
              <Input placeholder="E.g., NODE-X99-ALPHA" className="font-mono bg-secondary/50 border-primary/20" />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input placeholder="us-east-quantum-1" className="font-mono bg-secondary/50 border-primary/20" />
            </div>
            <div className="p-4 rounded border border-dashed border-primary/30 bg-primary/5 text-center text-sm text-muted-foreground">
              Drag & Drop RSA-4096 Key Pair here
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Schema Namespace</Label>
              <Input placeholder="com.company.quantum" className="font-mono bg-secondary/50 border-primary/20" />
            </div>
            <div className="space-y-4">
              <Label>Validation Mode</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="border-primary bg-primary/10 text-primary">Strict</Button>
                <Button variant="outline" className="border-border opacity-50">Permissive</Button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>License Key</Label>
              <Input placeholder="XXXX-XXXX-XXXX-XXXX" className="font-mono bg-secondary/50 border-primary/20" />
            </div>
            <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
              Warning: Silo provisioning is irreversible once confirmed.
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Legacy ERP Endpoint</Label>
              <Input placeholder="https://sap.internal/api/v1" className="font-mono bg-secondary/50 border-primary/20" />
            </div>
            <div className="space-y-2">
              <Label>Sync Schedule</Label>
              <Input placeholder="cron(0 0 * * *)" className="font-mono bg-secondary/50 border-primary/20" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">Deployment Wizard</h1>
        <p className="text-muted-foreground mt-1">Configure your QEL environment step-by-step.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Steps Sidebar */}
        <div className="lg:col-span-3 space-y-1">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const StepIcon = step.icon;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded transition-all duration-300 ${
                  isActive ? "bg-primary/10 border-l-2 border-primary" : "opacity-60"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  isActive ? "bg-primary text-primary-foreground border-primary" : 
                  isCompleted ? "bg-primary/20 text-primary border-primary" : 
                  "bg-secondary text-muted-foreground border-transparent"
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <div className="text-sm font-medium">{step.title}</div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <Card className="lg:col-span-9 bg-card border-primary/20 relative overflow-hidden min-h-[500px] flex flex-col">
           {/* Tech background element */}
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-1 h-8 bg-primary animate-pulse" style={{ animationDelay: `${i * 100}ms`}} />
                ))}
              </div>
           </div>

          <CardContent className="p-8 flex-1 flex flex-col">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="text-primary font-mono">0{currentStep + 1}.</span> {steps[currentStep].title}
              </h2>
              <div className="h-1 w-20 bg-primary/50 rounded-full" />
            </div>
            
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between pt-8 border-t border-border mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : (
                  currentStep === steps.length - 1 ? "Finish Deployment" : "Next Step"
                )}
                {!isProcessing && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 pt-8 border-t border-border">
        <h3 className="text-lg font-bold mb-4">Pilot to Production Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklistSteps.map((item) => (
             <div key={item.id} className="p-4 rounded border border-border bg-secondary/20 flex items-start gap-3">
               <div className={`mt-1 w-2 h-2 rounded-full ${
                  item.status === 'completed' ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]' : 
                  item.status === 'in-progress' ? 'bg-amber-400 animate-pulse' : 
                  'bg-muted'
               }`} />
               <div>
                 <div className="text-sm font-bold">{item.title}</div>
                 <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
               </div>
             </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
