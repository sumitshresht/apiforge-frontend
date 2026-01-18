"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command, Github, CheckCircle2, Loader2, Eye, EyeOff, ServerCrash, Coffee } from "lucide-react";
import { setCookie } from "cookies-next"; 
import { toast } from "sonner"; // Assuming you have sonner installed, otherwise use alert

// --- MICRO-COMPONENT: Typewriter ---
const Typewriter = ({ text, delay = 500 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText((prev) => prev + text.charAt(currentIndex));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          setIsFinished(true);
        }
      }, 40);

      return () => clearInterval(intervalId);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, delay]);

  return (
    <span className="inline-flex items-center">
      {displayedText}
      {!isFinished && (
        <span className={`ml-[2px] h-[1em] w-[3px] bg-white/50 ${isStarted ? "animate-none" : "animate-pulse"}`}></span>
      )}
    </span>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  
  // 🆕 State to track if the server is likely sleeping
  const [serverWakingUp, setServerWakingUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerWakingUp(false); // Reset error state on new attempt

    try {
      // NOTE: Ensure this points to your PROD url in production, not localhost
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        
        setCookie("token", data.token, { maxAge: 60 * 60 * 24 });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        
        router.push("/dashboard");
      } else {
        // Handle explicit errors (401, 400)
        if (res.status === 401 || res.status === 400) {
            alert("Invalid credentials. Please try again.");
        } else {
            // 500 errors might also mean server issues
            setServerWakingUp(true);
        }
      }
    } catch (error) {
      console.error("Login connection error", error);
      // 🆕 Network Error caught here (fetch failed completely)
      setServerWakingUp(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      {/* LEFT SIDE - AUTH FORM */}
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          
          <div className="grid gap-2 text-left">
            <div className="flex items-center gap-2 font-bold mb-2">
               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Command className="h-4 w-4" />
               </div>
               APIForge
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your workspace.
            </p>
          </div>

          <form onSubmit={handleLogin} className="grid gap-4">
            
            {/* 🆕 SERVER WAKE UP MESSAGE */}
            {serverWakingUp && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-900 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full shrink-0">
                        <Coffee className="h-4 w-4 text-orange-600 dark:text-orange-200" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">Server is Waking Up</h4>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
                            Our backend runs on eco-mode to save resources. It may take <strong>30-50 seconds</strong> to spin up from a cold start. Please wait a moment and click "Sign In" again.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/5 focus-visible:ring-1"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-xs underline text-muted-foreground hover:text-primary"
                   onClick={(e) => {
                     e.preventDefault();
                     window.open("mailto:helpdesk.apiforge@gmail.com?subject=Forgot Password&body=Help me reset my password");
                   }}
                >
                  Forgot password?
                </Link>
              </div>
              
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-muted/5 focus-visible:ring-1 pr-10" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    {serverWakingUp ? "Retrying..." : "Sign In"}
                  </>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full h-11" type="button" disabled>
            <Github className="mr-2 h-4 w-4" /> GitHub
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - VALUE PROP */}
      <div className="hidden bg-zinc-950 lg:flex flex-col justify-center p-12 relative overflow-hidden text-white border-l border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black opacity-80"></div>
        
        <div className="relative z-10 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-4 min-h-[80px] lg:min-h-[auto]">
              <Typewriter text=" Stop waiting for the backend." delay={500} />
            </h2>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
              APIForge gives frontend teams instant, realistic APIs. Simulate latency, errors, and edge cases without writing server code.
            </p>
            
            <ul className="space-y-4">
              {[
                "Instant mock generation from JSON",
                "Network latency simulation (Slow 3G, etc)",
                "Collaborative workspaces for teams"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${800 + (i * 100)}ms`, animationFillMode: 'backwards' }}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500/80" />
                  {item}
                </li>
              ))}
            </ul>
        </div>
      </div>
    </div>
  );
}