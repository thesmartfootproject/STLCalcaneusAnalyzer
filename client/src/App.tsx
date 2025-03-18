import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import FileUpload from "@/pages/FileUpload";
import Results from "@/pages/Results";
import Visualization from "@/pages/Visualization";
import Settings from "@/pages/Settings";
import Logs from "@/pages/Logs";

export type AppContext = {
  sessionId: string;
  setSessionId: (id: string) => void;
};

function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Create a new session if none exists
    if (!sessionId) {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          setSessionId(data.sessionId);
        })
        .catch(err => console.error("Error creating session:", err));
    }
  }, [sessionId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Layout sessionId={sessionId}>
        <Switch>
          <Route path="/" component={() => <Home sessionId={sessionId} />} />
          <Route path="/upload" component={() => <FileUpload sessionId={sessionId} />} />
          <Route path="/results" component={() => <Results sessionId={sessionId} />} />
          <Route path="/visualization" component={() => <Visualization sessionId={sessionId} />} />
          <Route path="/settings" component={() => <Settings sessionId={sessionId} />} />
          <Route path="/logs" component={() => <Logs sessionId={sessionId} />} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
