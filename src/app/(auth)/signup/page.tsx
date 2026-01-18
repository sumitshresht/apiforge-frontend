"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command, Github, Terminal, Zap, Layers, Loader2, Eye, EyeOff, Coffee } from "lucide-react";

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
      }, 35);

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

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🆕 Server Cold Start State
  const [serverWakingUp, setServerWakingUp] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerWakingUp(false); // Reset error state

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Success: Redirect to login
        router.push("/login");
      } else {
        // Handle specific API errors vs Server Errors
        if (res.status >= 500) {
             setServerWakingUp(true);
        } else {
             const err = await res.text();
             alert("Signup failed: " + err);
        }
      }
    } catch (error) {
      console.error("Signup network error", error);
      // 🆕 Network Error caught here
      setServerWakingUp(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      
      {/* LEFT SIDE - SIGNUP FORM */}
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          
          <div className="grid gap-2 text-left">
            <div className="flex items-center gap-2 font-bold mb-2">
               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Command className="h-4 w-4" />
               </div>
               APIForge
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your developer workspace.
            </p>
          </div>

          <form onSubmit={handleSignup} className="grid gap-4">
            
            {/* 🆕 SERVER WAKE UP MESSAGE */}
            {serverWakingUp && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-900 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full shrink-0">
                        <Coffee className="h-4 w-4 text-orange-600 dark:text-orange-200" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">Server is Waking Up</h4>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
                            Our free-tier backend is spinning up from a cold start. This may take <strong>30-50 seconds</strong>. Please wait a moment and try again.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                className="h-11 bg-muted/5 focus-visible:ring-1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="h-11 bg-muted/5 focus-visible:ring-1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
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

              <p className="text-[10px] text-muted-foreground">
                Must be at least 8 characters long.
              </p>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {serverWakingUp ? "Retrying..." : "Create Account"}
                  </>
              ) : "Create Account"}
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
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
              Log in
            </Link>
          </div>

          <p className="px-8 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - VISUAL */}
      <div className="hidden bg-zinc-950 lg:flex flex-col justify-center p-12 relative overflow-hidden text-white border-l border-zinc-800">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black opacity-80"></div>
         <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

         <div className="relative z-10 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-4 min-h-[80px] lg:min-h-[auto] leading-tight">
              <Typewriter text=" Accelerate your development workflow." delay={400} />
            </h2>
            
            <p className="text-zinc-400 mb-10 leading-relaxed">
              Join thousands of developers using APIForge to decouple frontend and backend development.
            </p>

            <div className="grid gap-6">
                {[
                    { icon: Zap, title: "Zero-config Mocks", desc: "Generate realistic APIs from JSON in seconds." },
                    { icon: Terminal, title: "Developer Native", desc: "CLI support, Environment variables, and CORS control." },
                    { icon: Layers, title: "Scenario Testing", desc: "Simulate complex states like 404s, 500s, and timeouts." }
                ].map((item, i) => (
                    <div 
                        key={i} 
                        className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-3 duration-700" 
                        style={{ animationDelay: `${800 + (i * 150)}ms`, animationFillMode: 'backwards' }}
                    >
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
                            <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-200 text-sm">{item.title}</h3>
                            <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
}