import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/40 p-6 text-center">
      <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4"><ShieldCheck className="h-6 w-6 text-primary-foreground" /></div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">The page you’re looking for doesn’t exist.</p>
      <Button asChild><Link to="/">Back home</Link></Button>
    </div>
  );
}
