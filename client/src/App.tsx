import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import { SimpleBusinessConfigPage } from "@/pages/simple-business-config";
import { SimpleTestPage } from "@/pages/simple-test";
import BusinessConfigurationPage from "@/pages/business-configuration";
import OfferingsManagementPage from "@/pages/offerings-management";
import TransactionsManagementPage from "@/pages/transactions-management";
import DebugBusinessConfigPage from "@/pages/debug-business-config";
import CustomerLandingPage from "@/pages/customer-landing";
import BusinessDashboardPage from "@/pages/business-dashboard";
import BusinessTypeDemoPage from "@/pages/business-type-demo";
import BotFlowsListPage from "@/pages/bot-flows-list";
import BotFlowBuilderPage from "@/pages/bot-flow-builder";
import TestRoutingPage from "@/pages/test-routing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BusinessDashboardPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/business-config" component={SimpleBusinessConfigPage} />
      <Route path="/business-config-full" component={BusinessConfigurationPage} />
      <Route path="/debug-config" component={DebugBusinessConfigPage} />
      <Route path="/offerings" component={OfferingsManagementPage} />
      <Route path="/transactions" component={TransactionsManagementPage} />
      <Route path="/customer" component={CustomerLandingPage} />
      <Route path="/demo" component={BusinessTypeDemoPage} />
      <Route path="/bot-flows" component={BotFlowsListPage} />
      <Route path="/bot-flows/:flowId" component={BotFlowBuilderPage} />
      <Route path="/test" component={SimpleTestPage} />
      <Route path="/test-routing" component={TestRoutingPage} />
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
