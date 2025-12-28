import { Link, useLocation } from "wouter";
import { Zap, LayoutDashboard, Settings, Activity, Calculator, LogOut, Menu, Video, BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <a className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group ${
        isActive 
          ? "bg-primary/10 text-primary border border-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}>
        <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
        <span className="font-medium tracking-wide">{label}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
      </a>
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-lg tracking-wider text-foreground">QEL<span className="text-primary">.OS</span></h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Quantum Ops</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Mission Control" />
        <NavItem href="/spectator" icon={Video} label="Spectator View" />
        <NavItem href="/wizard" icon={Settings} label="Setup Wizard" />
        <NavItem href="/reference" icon={BookOpen} label="QEL Reference" />
        <NavItem href="/observability" icon={Activity} label="Observability" />
        <NavItem href="/calculators" icon={Calculator} label="Economic Fit" />
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/">
          <a className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Disconnect</span>
          </a>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-20">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background border-primary/20 text-primary">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-border bg-sidebar">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen relative overflow-y-auto">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
