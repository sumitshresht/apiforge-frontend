"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Play, Clock, Wifi, AlertCircle, Copy, Terminal } from "lucide-react";
import api from "@/lib/api";
import KeyValueTable from "@/components/request/KeyValueTable";
import AuthEditor, { AuthConfig } from "@/components/request/AuthEditor";
import { Badge } from "@/components/ui/badge";

interface RequestItem {
  id: number;
  name: string;
  method: string;
  url: string;
  headers?: string;
  body?: string;
  authConfig?: string;
}

interface RequestEditorProps {
  requestId: number;
}

export default function RequestEditor({ requestId }: RequestEditorProps) {
      const [request, setRequest] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("params");
  
  // Data States
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ type: "none" });

  // Response States
  const [response, setResponse] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/requests/${requestId}`);
        const data = res.data;
        setRequest(data);
        setMethod(data.method);
        setUrl(data.url || "");
        setBody(data.body || "");
        setHeaders(data.headers ? JSON.parse(data.headers) : {});
        setAuthConfig(data.authConfig ? JSON.parse(data.authConfig) : { type: "none" });
        
        if (data.url && data.url.includes("?")) {
            const searchPart = data.url.split("?")[1];
            const params = new URLSearchParams(searchPart);
            const paramObj: Record<string, string> = {};
            params.forEach((val, key) => { paramObj[key] = val; });
            setQueryParams(paramObj);
        }
      } catch (error) {
        console.error("Error loading request", error);
      } finally {
        setLoading(false);
      }
    };
    if (requestId) fetchRequest();
  }, [requestId]);

  
  // Logic functions (Syncing, Sending, Saving) remain the same...
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    try {
        if (newUrl.includes("?")) {
            const searchPart = newUrl.split("?")[1];
            const params = new URLSearchParams(searchPart);
            const paramObj: Record<string, string> = {};
            params.forEach((val, key) => { paramObj[key] = val; });
            setQueryParams(paramObj);
        } else {
            setQueryParams({});
        }
    } catch (e) { }
  };

  const handleParamsChange = (newParams: Record<string, string>) => {
    setQueryParams(newParams);
    const baseUrl = url.split("?")[0];
    const searchParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
        if (key) searchParams.append(key, value);
    });
    const queryString = searchParams.toString();
    setUrl(queryString ? `${baseUrl}?${queryString}` : baseUrl);
  };

  const resolveVariables = (text: string, vars: Record<string, string>) => {
    if (!text) return "";
    return text.replace(/\{\{(.+?)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);
    
    try {
      const storedVars = localStorage.getItem("activeEnvVars");
      const activeVars = storedVars ? JSON.parse(storedVars) : {};
      const resolvedUrl = resolveVariables(url, activeVars);
      const finalHeaders: Record<string, string> = {};
      Object.keys(headers).forEach(key => {
        finalHeaders[key] = resolveVariables(headers[key], activeVars);
      });

      if (authConfig.type === "bearer" && authConfig.token) {
          finalHeaders["Authorization"] = `Bearer ${resolveVariables(authConfig.token, activeVars)}`;
      }
      else if (authConfig.type === "basic" && authConfig.username && authConfig.password) {
          const u = resolveVariables(authConfig.username, activeVars);
          const p = resolveVariables(authConfig.password, activeVars);
          finalHeaders["Authorization"] = `Basic ${btoa(`${u}:${p}`)}`;
      }

      const res = await api.post("/proxy/execute", {
        url: resolvedUrl, method, headers: finalHeaders, body
      });
      setResponse(res.data.body);
      setResponseStatus(res.data.status);
      setResponseTime(res.data.timeMs);
    } catch (error) {
      setResponse("Error: Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!request) return;
    setSaving(true);
    try {
      await api.put(`/requests/${request.id}`, {
        name: request.name, method, url, body,
        headers: JSON.stringify(headers),
        authConfig: JSON.stringify(authConfig)
      });
    } catch (error) { console.error("Failed to save", error); } finally { setSaving(false); }
  };

  const getMethodColor = (m: string) => {
    switch(m) {
        case "GET": return "text-emerald-600 font-extrabold";
        case "POST": return "text-blue-600 font-extrabold";
        case "PUT": return "text-orange-600 font-extrabold";
        case "DELETE": return "text-red-600 font-extrabold";
        default: return "text-foreground font-bold";
    }
  };

  if (!request) return <div className="p-8 text-center">Select a request</div>;

 return (
    <div className="h-full flex flex-col bg-background">
      
      {/* 🟢 TOP BAR: Cockpit Style */}
      <div className="h-16 border-b flex items-center px-4 gap-4 bg-background/80 backdrop-blur z-20">
        
        {/* URL Input Group */}
        <div className="flex-1 flex items-center shadow-sm border rounded-lg bg-muted/20 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200 overflow-hidden">
             
             {/* Method Selector */}
             <div className="border-r border-border/60 bg-muted/30 px-1">
                 <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className={`w-[105px] border-0 bg-transparent focus:ring-0 h-11 ${getMethodColor(method)} tracking-wide`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET" className="font-bold text-emerald-600">GET</SelectItem>
                    <SelectItem value="POST" className="font-bold text-blue-600">POST</SelectItem>
                    <SelectItem value="PUT" className="font-bold text-orange-600">PUT</SelectItem>
                    <SelectItem value="DELETE" className="font-bold text-red-600">DELETE</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             {/* URL Input */}
             <Input 
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 h-11 rounded-none font-mono text-sm px-4 placeholder:text-muted-foreground/50 text-foreground" 
                placeholder="https://api.example.com/v1/resource" 
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)} 
            />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
            <Button 
                onClick={handleSend} 
                disabled={loading} 
                className="h-11 px-8 gap-2 font-semibold tracking-wide shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all duration-100 ease-in-out"
            >
                {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                SEND
            </Button>
            
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={saving} className="h-11 w-11 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Save className="h-5 w-5" />
            </Button>
        </div>
      </div>

      {/* 🟠 MAIN CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* TABS - Refined Active State */}
        <div className="border-b px-2 bg-background/50 backdrop-blur sticky top-0 z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-11 bg-transparent p-0 gap-6 w-full justify-start px-2">
                    {["params", "auth", "headers", "body"].map(tab => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab} 
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold px-1 capitalize text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
                        >
                            {tab}
                            {/* Dot indicators */}
                            {(tab === "params" && Object.keys(queryParams).length > 0) || 
                             (tab === "headers" && Object.keys(headers).length > 0) ? 
                             <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary/70"></span> : null}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>

        {/* EDITOR AREA */}
        <div className="flex-1 bg-background overflow-y-auto">
             <Tabs value={activeTab} className="h-full">
                 <TabsContent value="params" className="m-0 h-full p-6">
                    <KeyValueTable initialData={queryParams} onChange={handleParamsChange} />
                 </TabsContent>

                 <TabsContent value="auth" className="m-0 h-full p-6">
                     <AuthEditor config={authConfig} onChange={setAuthConfig} />
                 </TabsContent>

                 <TabsContent value="headers" className="m-0 h-full p-6">
                    <KeyValueTable initialData={headers} onChange={setHeaders} />
                 </TabsContent>

                 <TabsContent value="body" className="m-0 h-full p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Raw JSON</span>
                        <Badge variant="outline" className="text-[10px] h-5 border-border/60 text-muted-foreground font-mono">application/json</Badge>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-muted/20 border border-border/60 rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-foreground leading-relaxed transition-all"
                        placeholder="{ 'key': 'value' }"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        spellCheck={false}
                    />
                 </TabsContent>
             </Tabs>
        </div>
      </div>
      
      {/* 🔵 RESPONSE SECTION */}
      <div className="h-[40%] border-t bg-muted/5 flex flex-col relative z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Status Bar */}
        <div className="h-10 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur select-none">
            <div className="flex items-center gap-2">
                 <Terminal className="h-3.5 w-3.5 text-muted-foreground/70" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Console</span>
            </div>
            
            {responseStatus ? (
                <div className="flex items-center gap-4 text-xs">
                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded-md ${responseStatus < 300 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${responseStatus < 300 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="font-mono font-bold">{responseStatus} {responseStatus < 300 ? "OK" : "Error"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                        <Clock className="h-3 w-3" />
                        <span>{responseTime}ms</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                         <Wifi className="h-3 w-3" />
                         <span>{(JSON.stringify(response).length / 1024).toFixed(2)} KB</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
                     <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                     <span>Ready</span>
                </div>
            )}
        </div>
        
        {/* Response Content */}
        <div className="flex-1 overflow-auto bg-background relative">
            {response ? (
                <div className="relative group h-full">
                    <Button 
                        variant="secondary" size="icon" 
                        className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm z-10" 
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(response, null, 2))}
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <pre className="p-6 text-xs font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {typeof response === 'object' || (typeof response === 'string' && response.startsWith('{')) 
                            ? JSON.stringify(typeof response === 'string' ? JSON.parse(response) : response, null, 2) 
                            : response
                        }
                    </pre>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-4">
                     <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-border">
                        <Play className="h-5 w-5 opacity-40 fill-current" />
                    </div>
                    <p className="text-sm font-medium">Response output</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}