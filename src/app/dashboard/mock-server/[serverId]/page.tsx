"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Plus, Search, MoreVertical, Copy, ArrowLeft,
  Trash2, Clock, Layers, AlertTriangle, Play, Pause 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter, useParams } from "next/navigation";
import MockRouteEditor from "@/components/mock/MockRouteEditor"; 

export default function MockRouteManager() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [server, setServer] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serverId) loadData();
  }, [serverId]);

  const loadData = async () => {
    try {
      const sRes = await api.get(`/mocks/servers/${serverId}`);
      setServer(sRes.data);
      const rRes = await api.get(`/mocks/routes/server/${serverId}`);
      // Sort routes by ID desc (newest first)
      setRoutes(rRes.data.sort((a: any, b: any) => b.id - a.id));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const toggleRoute = async (route: any) => {
    // 1. Calculate new status
    const newStatus = !route.isEnabled;
    
    // 2. Optimistic Update (Update UI immediately)
    setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, isEnabled: newStatus } : r));
    
    try {
      // 3. Send update to backend
      // IMPORTANT: We explicitly send `isEnabled` matching the DTO
      await api.put(`/mocks/routes/${route.id}`, { 
          mockServerId: server.id, // ID is required
          isEnabled: newStatus 
      });
    } catch (e) {
      console.error("Failed to toggle route", e);
      loadData(); // Revert on error
    }
  };

  const handleDuplicate = async (route: any) => {
    if (!server?.id) return;
    const { id, ...rest } = route; 
    await api.post("/mocks/routes/create", { 
        ...rest, 
        path: `${rest.path}-copy`,
        mockServerId: server.id 
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this route?")) return;
    await api.delete(`/mocks/routes/${id}`);
    if (selectedRouteId === id) setSelectedRouteId(null);
    loadData();
  };

  const handleCreate = async () => {
    if (!server?.id) return;

    try {
        const res = await api.post("/mocks/routes/create", {
            method: "GET", 
            path: "/new-route", 
            statusCode: 200, 
            responseBody: "{}", 
            isEnabled: true, 
            mockServerId: server.id,
            delayMs: 0,
            chaosEnabled: false,
            failureRate: 0.0
        });
        await loadData();
        setSelectedRouteId(res.data.id); // Auto-select new route
    } catch(e) { alert("Failed to create route"); }
  };

  const getMethodColor = (m: string) => {
    switch(m) {
        case "GET": return "text-emerald-500 bg-emerald-500/10";
        case "POST": return "text-blue-500 bg-blue-500/10";
        case "PUT": return "text-orange-500 bg-orange-500/10";
        case "DELETE": return "text-red-500 bg-red-500/10";
        default: return "text-foreground bg-muted";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 🟢 HEADER */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur shrink-0">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${server?.id ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-400"}`} />
                    <h1 className="font-bold text-lg leading-none">{server?.name || "Loading..."}</h1>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] select-all cursor-pointer hover:bg-muted/80 border">
                        {server?.pathPrefix ? `${API_BASE_URL}/api/mock/simulator/${server.pathPrefix}` : "Loading..."}
                    </span>
                    <Copy className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => navigator.clipboard.writeText(`${API_BASE_URL}/api/mock/simulator/${server?.pathPrefix}`)}/>
                </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Button onClick={handleCreate} disabled={!server} className="gap-2 shadow-sm h-9">
                <Plus className="h-4 w-4" /> New Route
            </Button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 🟠 LEFT SIDEBAR: ROUTE LIST */}
        <div className="w-[320px] border-r bg-muted/5 flex flex-col h-full">
            <div className="p-3 border-b shrink-0">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter routes..." className="pl-8 h-9 bg-background" />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {routes.map(r => (
                    <div 
                        key={r.id}
                        onClick={() => setSelectedRouteId(r.id)}
                        className={`group flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-all ${
                            selectedRouteId === r.id 
                            ? "bg-background border-primary/50 shadow-sm" 
                            : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50"
                        } ${!r.isEnabled ? "opacity-50 grayscale" : ""}`}
                    >
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[45px] text-center ${getMethodColor(r.method)}`}>
                            {r.method}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{r.path}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 h-4">
                                <span className={r.statusCode >= 400 ? "text-red-500" : "text-green-600"}>{r.statusCode}</span>
                                {r.delayMs > 0 && <span className="flex items-center gap-0.5 text-blue-500"><Clock className="h-3 w-3" /> {r.delayMs}ms</span>}
                                {r.chaosEnabled && <AlertTriangle className="h-3 w-3 text-red-500" />}
                            </div>
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <div onClick={e => e.stopPropagation()} title={r.isEnabled ? "Disable Route" : "Enable Route"}>
                                <Switch 
                                    checked={!!r.isEnabled} 
                                    onCheckedChange={() => toggleRoute(r)} 
                                    className="scale-75 data-[state=checked]:bg-green-600" 
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDuplicate(r)}><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 🔵 RIGHT: EDITOR PANEL */}
        <div className="flex-1 bg-background h-full overflow-hidden">
            {selectedRouteId ? (
                <MockRouteEditor 
                    routeId={selectedRouteId} 
                    onUpdate={loadData} 
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <Layers className="h-16 w-16 mb-4 stroke-1" />
                    <p>Select a route to configure response</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
