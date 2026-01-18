"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Server, ExternalLink, Copy, Trash2, Loader2, RefreshCw, Check } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function MockServerEditor({ serverId }: { serverId: number }) {
  const { setActiveEditor, setActiveEntityId } = useDashboard();
  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  
  // Feedback States
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if(serverId) loadData();
  }, [serverId]);

  const loadData = async () => {
    setLoading(true);
    try {
        const res = await api.get(`/mocks/servers/${serverId}`);
        setServer(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/mocks/servers/${serverId}`, server);
      
      // ✅ Success Feedback
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

    } catch(e) { 
        alert("Failed to save"); 
    } finally { 
        setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this server and all its routes?")) return;
    try {
        await api.delete(`/mocks/servers/${serverId}`);
        setActiveEditor("empty");
        setActiveEntityId(null);
        window.location.reload(); 
    } catch(e) { alert("Failed to delete"); }
  };

  const handleCopyUrl = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const url = `${API_BASE_URL}/api/mock/simulator/${server.pathPrefix}`;
      navigator.clipboard.writeText(url);
      
      // ✅ Copy Feedback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  if(loading) return <div className="h-full flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2"/> Loading Server...</div>;
  if(!server) return <div className="p-8 text-muted-foreground">Server not found.</div>;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fullUrl = `${API_BASE_URL}/api/mock/simulator/${server.pathPrefix}`;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-muted/5">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center">
                <Server className="h-4 w-4 text-orange-600" />
            </div>
            <div>
                <div className="font-bold text-sm">Server Configuration</div>
                <div className="text-[10px] text-muted-foreground">ID: {server.id}</div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </Button>
            <div className="w-[1px] h-4 bg-border mx-1" />
            
            {/* SAVE BUTTON WITH FEEDBACK */}
            <Button 
                onClick={handleSave} 
                disabled={saving} 
                size="sm" 
                variant={isSaved ? "outline" : "default"}
                className={`gap-2 min-w-[130px] transition-all duration-300 ${isSaved ? "bg-green-50 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50" : ""}`}
            >
                {saving ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin"/>
                ) : isSaved ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <Check className="h-3.5 w-3.5" />
                        <span className="font-bold">Saved</span>
                    </div>
                ) : (
                    <>
                        <Save className="h-3.5 w-3.5" />
                        Save Changes
                    </>
                )}
            </Button>
        </div>
      </div>

      {/* Content - CENTERED */}
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
         {/* Name */}
         <div className="space-y-2">
            <label className="text-sm font-medium">Server Name</label>
            <Input 
                value={server.name} 
                onChange={e => setServer({...server, name: e.target.value})} 
                className="max-w-md"
            />
         </div>
         
         {/* URL Config */}
         <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
            <div>
                <label className="text-sm font-medium">Public Base URL</label>
                <p className="text-[11px] text-muted-foreground mb-2">
                    All routes in this server will be prefixed with this URL.
                </p>
                <div className="flex items-center gap-2 p-2 bg-background border rounded-md font-mono text-xs shadow-sm">
                    <span className="flex-1 truncate select-all">{fullUrl}</span>
                    
                    {/* COPY BUTTON WITH FEEDBACK */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-6 w-6 transition-colors duration-200 ${isCopied ? "text-green-600 bg-green-50" : ""}`}
                        onClick={handleCopyUrl}
                    >
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(fullUrl, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Path Prefix</label>
                    <Input 
                        className="font-mono text-xs bg-background" 
                        value={server.pathPrefix} 
                        onChange={e => setServer({...server, pathPrefix: e.target.value})} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                    <div className="h-9 flex items-center px-3 border rounded bg-green-500/10 text-green-600 text-xs font-bold">
                        Active
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}