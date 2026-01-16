"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; 
import { 
    Search, Bell, Moon, Sun, ChevronDown, Eye, LogOut, User, Settings, Check, Plus, Briefcase 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import CreateWorkspaceDialog from "@/components/workspace/CreateWorkspaceDialog"; 

export default function TopBar() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  
  // Environment State
  const [envs, setEnvs] = useState<any[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string>("none");
  
  // Workspace State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);

  // User State
  const [currentUser, setCurrentUser] = useState({ 
    name: "Guest", role: "User", initials: "G" 
  });

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to ContextDesk v1.0", time: "Just now" }
  ]);

  useEffect(() => {
    initializeDashboard();
    loadUserProfile();
  }, []);

  const initializeDashboard = async () => {
    try {
        // 1. Fetch Workspaces
        const wsRes = await api.get("/workspaces/my-workspaces");
        setWorkspaces(wsRes.data);
        
        if (wsRes.data.length > 0) {
            // 2. Determine Active Workspace (Load from LocalStorage or Default to First)
            const savedWsId = localStorage.getItem("activeWorkspaceId");
            let targetWs = wsRes.data[0];

            if (savedWsId) {
                const found = wsRes.data.find((w: any) => w.id.toString() === savedWsId);
                if (found) targetWs = found;
            }

            // 3. Set Active State & Persist
            setActiveWorkspace(targetWs);
            localStorage.setItem("activeWorkspaceId", targetWs.id.toString());

            // 4. Fetch Environments for THIS workspace
            loadEnvironments(targetWs.id);
        }
    } catch(e) { console.error(e); }
  };

  const loadEnvironments = async (workspaceId: number) => {
    try {
        const envRes = await api.get(`/environments/workspace/${workspaceId}`);
        setEnvs(envRes.data);

        // Restore active environment selection if it belongs to this workspace
        const savedEnvId = localStorage.getItem("activeEnvId");
        if (savedEnvId && envRes.data.some((e: any) => e.id.toString() === savedEnvId)) {
            setActiveEnvId(savedEnvId);
        } else {
            setActiveEnvId("none"); // Reset if switching workspaces
        }
    } catch (e) { console.error(e); }
  };

  const loadUserProfile = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            const displayName = u.firstName || u.email || "User";
            const initials = displayName.substring(0, 2).toUpperCase();
            setCurrentUser({
                name: displayName,
                role: u.roles && u.roles.includes("ROLE_ADMIN") ? "Admin" : "Member",
                initials: initials
            });
        } catch (e) {}
    }
  };

  // --- ACTIONS ---

  const handleSwitchWorkspace = async (ws: any) => {
    // 1. Immediate UI Update
    setActiveWorkspace(ws);
    
    // 2. Persist to Storage
    localStorage.setItem("activeWorkspaceId", ws.id.toString());

    try {
        // 3. Fetch Data for new Workspace (Prevent Abort Error)
        await loadEnvironments(ws.id);
        
        // 4. Reload page to ensure all child components (RequestHub, Collections) refresh
        // Since we aren't using a complex Global Store yet, reload is the safest way to consistency.
        window.location.reload(); 
    } catch (error) {
        console.error("Error switching workspace", error);
    }
  };

  const handleEnvChange = (val: string) => {
    setActiveEnvId(val);
    localStorage.setItem("activeEnvId", val);
    
    const env = envs.find(e => e.id.toString() === val);
    localStorage.setItem("activeEnvVars", env ? env.variables : "{}");
    
    // Dispatch event for RequestEditor to pick up
    window.dispatchEvent(new Event("env-change"));
  };

  const handleLogout = () => {
    localStorage.clear(); // Clear all data
    router.push("/login"); 
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur z-50 sticky top-0 px-4 flex items-center justify-between gap-4">
      
      {/* 1. Left: Branding & Workspace Selector */}
      <div className="flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground select-none">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            ContextDesk
        </div>
        
        <div className="h-4 w-[1px] bg-border mx-2"></div>
        
        {/* WORKSPACE DROPDOWN */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    className="h-8 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground px-2 max-w-[200px]"
                >
                    <span className="truncate">{activeWorkspace?.name || "Select Workspace"}</span>
                    <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    My Workspaces
                </DropdownMenuLabel>
                
                {workspaces.map(ws => (
                    <DropdownMenuItem 
                        key={ws.id} 
                        onClick={() => handleSwitchWorkspace(ws)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <span className="truncate">{ws.name}</span>
                        {activeWorkspace?.id === ws.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                    className="cursor-pointer gap-2 text-primary focus:text-primary font-medium"
                    onClick={() => setShowWorkspaceDialog(true)}
                >
                    <Plus className="h-3.5 w-3.5" /> Create Workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Center: Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <input type="text" placeholder="Search..." className="w-full h-9 pl-9 pr-10 rounded-md border border-input/60 bg-muted/20 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all" />
          <kbd className="absolute right-2.5 top-2.5 pointer-events-none inline-flex h-4 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">⌘K</kbd>
        </div>
      </div>

      {/* 3. Right: Actions */}
      <div className="flex items-center gap-2">
        
        {/* Environment Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-muted/20 p-1 rounded-md border border-input/20 mr-2">
             <div className="flex items-center px-2 text-xs font-medium text-muted-foreground gap-2"><Eye className="h-3.5 w-3.5" /></div>
             <Select value={activeEnvId} onValueChange={handleEnvChange}>
                <SelectTrigger className="h-7 w-[140px] text-xs border-0 bg-transparent shadow-none focus:ring-0"><SelectValue placeholder="No Environment" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Environment</SelectItem>
                    {envs.map(env => (<SelectItem key={env.id} value={env.id.toString()}>{env.name}</SelectItem>))}
                </SelectContent>
             </Select>
        </div>

        {/* Notifications */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative"><Bell className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]"><DropdownMenuLabel>Notifications</DropdownMenuLabel><DropdownMenuSeparator />{notifications.map(n => (<DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer"><span className="font-medium text-sm">{n.text}</span><span className="text-xs text-muted-foreground">{n.time}</span></DropdownMenuItem>))}</DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <div className="h-4 w-[1px] bg-border mx-2"></div>
        
        {/* User Profile */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block leading-tight">
                        <p className="text-sm font-medium">{currentUser.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{currentUser.role}</p>
                    </div>
                    <Avatar className="h-8 w-8 border shadow-sm">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary">{currentUser.initials}</AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push("/dashboard/profile")}><User className="h-4 w-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2"><Settings className="h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RENDER WORKSPACE DIALOG */}
      <CreateWorkspaceDialog 
        open={showWorkspaceDialog} 
        onOpenChange={setShowWorkspaceDialog} 
        onSuccess={() => { initializeDashboard(); }} 
      />
    </header>
  );
}