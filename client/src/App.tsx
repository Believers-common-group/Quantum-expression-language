import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Wizard from "@/pages/wizard";
import Observability from "@/pages/observability";
import Calculators from "@/pages/calculators";
import SpectatorView from "@/pages/spectator";
import Reference from "@/pages/reference";
import Warden from "@/pages/warden";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/spectator" component={SpectatorView} />
      <Route path="/warden" component={Warden} />
      <Route path="/reference" component={Reference} />
      <Route path="/wizard" component={Wizard} />
      <Route path="/observability" component={Observability} />
      <Route path="/calculators" component={Calculators} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
