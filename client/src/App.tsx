import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import { BusinessConfigurationPage } from "@/pages/business-configuration";
import { SimpleBusinessConfigPage } from "@/pages/simple-business-config";
import { SimpleTestPage } from "@/pages/simple-test";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/business-config" component={SimpleBusinessConfigPage} />
      <Route path="/business-config-full" component={BusinessConfigurationPage} />
      <Route path="/test" component={SimpleTestPage} />
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
