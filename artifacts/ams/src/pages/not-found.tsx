import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-muted-foreground">
      <p className="text-6xl font-bold text-muted-foreground/20">404</p>
      <p className="font-medium text-foreground">Page not found</p>
      <Button size="sm" onClick={() => setLocation("/dashboard")}>
        <Home className="w-3.5 h-3.5 mr-1.5" /> Go to Dashboard
      </Button>
    </div>
  );
}
