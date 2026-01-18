"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Save, Wand2, Clock, Zap, AlertTriangle, Check, Loader2, RefreshCw, Copy, Globe 
} from "lucide-react";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import KeyValueTable from "@/components/request/KeyValueTable";
import { Badge } from "@/components/ui/badge";

interface Props {
  routeId: number;
  onUpdate: () => void;
}

export default function MockRouteEditor({ routeId, onUpdate }: Props) {
  const [route, setRoute] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("body");
  const [loading, setLoading] = useState(true);

  // Feedback States
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // ✅ New state for Save feedback
  const [formatted, setFormatted] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Settings States
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState(0);
  const [chaosEnabled, setChaosEnabled] = useState(false);
  const [failureRate, setFailureRate] = useState(0.0);

  useEffect(() => {
    if (routeId) loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    setLoading(true);
    try {
        const res = await api.get(`/mocks/routes/${routeId}`);
        let routeData = { ...res.data };

        if (!routeData.mockServer && routeData.mockServerId) {
            try {
                const serverRes = await api.get(`/mocks/servers/${routeData.mockServerId}`);
                routeData.mockServer = serverRes.data;
            } catch (err) {
                console.warn("Could not load parent server details", err);
            }
        }

        setRoute(routeData);
        setBody(routeData.responseBody || "");
        setDelay(routeData.delayMs || 0);
        
        try {
            setHeaders(routeData.responseHeaders ? JSON.parse(routeData.responseHeaders) : { "Content-Type": "application/json" });
        } catch(e) {
            setHeaders({ "Content-Type": "application/json" });
        }

        setChaosEnabled(routeData.chaosEnabled || false);
        setFailureRate(routeData.failureRate || 0.0);
    } catch(e) { 
        console.error("Failed to load route:", e); 
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/mocks/routes/${routeId}`, {
        ...route,
        responseBody: body,
        responseHeaders: JSON.stringify(headers),
        delayMs: delay,
        chaosEnabled,
        failureRate,
        mockServerId: route.mockServer?.id || route.mockServerId
      });
      onUpdate();
      
      // ✅ Success Feedback
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

    } catch (e) { 
        alert("Failed to save route"); 
    } finally { 
        setSaving(false); 
    }
  };

  const formatJSON = () => {
    try {
        const parsed = JSON.parse(body);
        setBody(JSON.stringify(parsed, null, 2));
        setFormatted(true);
        setTimeout(() => setFormatted(false), 2000);
    } catch (e) { alert("Invalid JSON"); }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const fullUrl = (route && route.mockServer) 
    ? `${API_BASE_URL}/api/mock/simulator/${route.mockServer.pathPrefix}${route.path}`
    : "Loading endpoint...";

  const handleCopyUrl = () => {
    if (fullUrl.startsWith("http")) {
        navigator.clipboard.writeText(fullUrl);
        
        // ✅ Copy Feedback
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMethodColor = (m: string) => {
    switch(m) {
        case "GET": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        case "POST": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
        case "PUT": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
        case "DELETE": return "text-red-500 bg-red-500/10 border-red-500/20";
        default: return "text-foreground bg-muted";
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground/50"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  
  if (!route) return <div className="h-full flex items-center justify-center text-muted-foreground">Route not found</div>;

  return (
    <div className="h-full flex flex-col bg-background text-sm">
      
      {/* 1. Header Toolbar */}
      <div className="h-14 border-b flex items-center px-6 gap-4 bg-background shrink-0">
         
         {/* Method Selector */}
         <Select value={route.method} onValueChange={(v) => setRoute({...route, method: v})}>
            <SelectTrigger className={`w-[100px] h-8 font-mono font-bold border-transparent hover:bg-muted/50 transition-colors ${getMethodColor(route.method)}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => (
                    <SelectItem key={m} value={m} className="font-mono text-xs font-semibold">{m}</SelectItem>
                ))}
            </SelectContent>
         </Select>

         {/* Path Input */}
         <Input 
            className="flex-1 font-mono text-sm h-8 border-transparent hover:border-border focus-visible:border-primary bg-transparent px-2 transition-all" 
            value={route.path} 
            onChange={(e) => setRoute({...route, path: e.target.value})} 
            placeholder="/path"
         />

         {/* Status Code */}
         <div className="flex items-center gap-2 bg-muted/20 border border-transparent hover:border-border rounded-md px-2 h-8 transition-colors">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
            <Input 
                className="w-[50px] border-0 h-6 font-mono text-sm text-center font-bold focus-visible:ring-0 p-0 bg-transparent" 
                value={route.statusCode} 
                onChange={(e) => setRoute({...route, statusCode: parseInt(e.target.value) || 200})} 
            />
         </div>

         <div className="w-[1px] h-5 bg-border/40 mx-1" />

         {/* SAVE BUTTON WITH FEEDBACK */}
         <Button 
            onClick={handleSave} 
            disabled={saving} 
            size="sm" 
            variant={isSaved ? "outline" : "default"}
            className={`h-8 gap-2 min-w-[100px] font-medium transition-all duration-300 ${isSaved ? "bg-green-50 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50" : "shadow-sm active:scale-[0.98]"}`}
         >
            {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin"/>
            ) : isSaved ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <Check className="h-3.5 w-3.5" />
                    <span>Saved</span>
                </div>
            ) : (
                <>
                    <Save className="h-3.5 w-3.5" />
                    Save
                </>
            )}
         </Button>
      </div>

      {/* 2. Endpoint Info Bar */}
      <div className="px-6 py-2 bg-muted/10 border-b flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Endpoint</span>
            </div>
            <code className="text-xs font-mono text-foreground/80 truncate select-all" title={fullUrl}>
                {fullUrl}
            </code>
         </div>
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* COPY BUTTON WITH FEEDBACK */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCopyUrl} 
                        className={`h-6 w-6 transition-colors duration-200 ${copied ? "text-green-600 bg-green-50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Copy URL</p></TooltipContent>
            </Tooltip>
         </TooltipProvider>
      </div>

      {/* 3. Main Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 bg-background sticky top-0 z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-12 bg-transparent p-0 gap-6 w-full justify-start">
                    {["body", "headers", "behavior"].map(tab => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab} 
                            className="
                                h-full rounded-none border-b-2 border-transparent px-1 
                                data-[state=active]:border-primary data-[state=active]:text-foreground 
                                text-muted-foreground hover:text-foreground transition-all duration-200 capitalize
                            "
                        >
                            {tab === "behavior" ? "Delay & Chaos" : tab === "body" ? "Response Body" : tab}
                            {tab === "headers" && Object.keys(headers).length > 0 && 
                                <span className="ml-2 w-1.5 h-1.5 rounded-full bg-primary/60" />
                            }
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto bg-background/50">
            <Tabs value={activeTab} className="h-full">
                
                {/* BODY TAB */}
                <TabsContent value="body" className="h-full m-0 p-0 flex flex-col">
                    <div className="flex justify-between items-center px-6 py-3 border-b bg-muted/5">
                        <Label className="text-xs text-muted-foreground font-medium">Response Body (JSON)</Label>
                        
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={formatJSON} 
                                        className="h-7 text-xs gap-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                                    >
                                        {formatted ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Wand2 className="h-3.5 w-3.5" />}
                                        {formatted ? "Formatted" : "Prettify"}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Auto-format JSON</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    
                    <textarea 
                        className="
                            flex-1 w-full p-6 
                            bg-background dark:bg-[#09090b] 
                            font-mono text-[13px] leading-relaxed 
                            resize-none focus:outline-none 
                            selection:bg-primary/20
                            text-foreground/90
                        "
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="{ 'message': 'Hello World' }"
                        spellCheck={false}
                    />
                </TabsContent>

                {/* HEADERS TAB - CENTERED */}
                <TabsContent value="headers" className="h-full m-0 p-8">
                    <div className="max-w-5xl mx-auto w-full">
                        <h3 className="text-sm font-medium mb-4 text-foreground/80">Response Headers</h3>
                        <KeyValueTable initialData={headers} onChange={setHeaders} />
                    </div>
                </TabsContent>

                {/* BEHAVIOR TAB - CENTERED */}
                <TabsContent value="behavior" className="h-full m-0 p-8">
                    <div className="max-w-3xl mx-auto w-full space-y-8">
                        
                        {/* Delay */}
                        <div className="space-y-4 p-5 border rounded-lg bg-background shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Network Latency</h3>
                                        <p className="text-xs text-muted-foreground">Simulate slow API responses</p>
                                    </div>
                                </div>
                                <Input 
                                    type="number" 
                                    className="w-20 text-right font-mono"
                                    value={delay} 
                                    onChange={(e) => setDelay(parseInt(e.target.value) || 0)} 
                                />
                            </div>
                            
                            <div className="pt-2">
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold mb-2">
                                    <span>Presets</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0, 200, 500, 1000, 3000].map(ms => (
                                        <Button 
                                            key={ms} 
                                            variant={delay === ms ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setDelay(ms)}
                                            className="h-7 text-xs flex-1"
                                        >
                                            {ms === 0 ? "None" : `${ms}ms`}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chaos */}
                        <div className={`space-y-4 p-5 border rounded-lg transition-colors ${chaosEnabled ? 'bg-red-500/5 border-red-200 dark:border-red-900/50' : 'bg-background shadow-sm'}`}>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${chaosEnabled ? 'bg-red-500/10' : 'bg-muted'}`}>
                                        <Zap className={`h-4 w-4 ${chaosEnabled ? 'text-red-500' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Chaos Monkey</h3>
                                        <p className="text-xs text-muted-foreground">Randomly fail requests (500 Error)</p>
                                    </div>
                                </div>
                                <Switch checked={chaosEnabled} onCheckedChange={setChaosEnabled} />
                             </div>

                             {chaosEnabled && (
                                <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs">Failure Rate</Label>
                                        <Badge variant="outline" className="font-mono text-red-500 border-red-200 bg-red-50">{Math.round(failureRate * 100)}%</Badge>
                                    </div>
                                    <Slider 
                                        value={[failureRate * 100]} 
                                        max={100} step={5} 
                                        onValueChange={(vals) => setFailureRate(vals[0] / 100)}
                                        className="py-2"
                                    />
                                    <div className="flex items-center gap-2 text-xs text-red-600/80 bg-red-100/50 p-2 rounded border border-red-100 dark:border-red-900/20">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Warning: This will cause random 500 Internal Server Errors.</span>
                                    </div>
                                </div>
                             )}
                        </div>

                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}