import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import About from "@/pages/about";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense, useEffect, useState } from "react";

function decodeUserId(token: string): string | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.sub || payload.user_id || payload.userId || null;
  } catch {
    return null;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("authToken");
    if (existing) {
      const id = decodeUserId(existing);
      if (id) {
        localStorage.setItem("userId", id);
      }
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://auth.util.repl.co/script.js";
    script.onload = async () => {
      const token = await (window as any).auth?.("flashcards-app");
      if (token) {
        localStorage.setItem("authToken", token);
        const id = decodeUserId(token);
        if (id) {
          localStorage.setItem("userId", id);
        }
        setReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  if (!ready) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading...</div>}>
            <Router />
          </Suspense>
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
