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
import { Save, Wand2, Clock, Zap, AlertTriangle } from "lucide-react";
import KeyValueTable from "@/components/request/KeyValueTable";

interface Props {
  routeId: number;
  onUpdate: () => void;
}

export default function MockRouteEditor({ routeId, onUpdate }: Props) {
  const [route, setRoute] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("body");
  
  // Settings States
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState(0);
  
  // New Chaos States
  const [chaosEnabled, setChaosEnabled] = useState(false);
  const [failureRate, setFailureRate] = useState(0.0);

  useEffect(() => {
    loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    try {
        const res = await api.get(`/mocks/routes/${routeId}`);
        setRoute(res.data);
        setBody(res.data.responseBody || "");
        setDelay(res.data.delayMs || 0);
        setHeaders(res.data.responseHeaders ? JSON.parse(res.data.responseHeaders) : { "Content-Type": "application/json" });
        
        // Load Chaos Settings
        setChaosEnabled(res.data.chaosEnabled || false);
        setFailureRate(res.data.failureRate || 0.0);
    } catch(e) { console.error(e); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/mocks/routes/${routeId}`, {
        ...route, // Keeps existing fields including method, path, statusCode, mockServer
        responseBody: body,
        responseHeaders: JSON.stringify(headers),
        delayMs: delay,
        chaosEnabled,
        failureRate,
        // Ensure mockServerId is passed if your DTO requires it explicitly, 
        // though `...route` usually covers it if the GET response included it.
        // If GET response has `mockServer: {id: 1}`, we might need to flat map it:
        mockServerId: route.mockServer?.id || route.mockServerId
      });
      onUpdate(); 
    } catch (e) { 
        console.error(e); 
        alert("Failed to save route");
    } finally { 
        setSaving(false); 
    }
  };

  const formatJSON = () => {
    try {
        const parsed = JSON.parse(body);
        setBody(JSON.stringify(parsed, null, 2));
    } catch (e) { alert("Invalid JSON"); }
  };

  if (!route) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* 1. TOP SETTINGS BAR */}
      <div className="h-16 border-b flex items-center px-6 gap-4 bg-muted/5">
         <Select value={route.method} onValueChange={(v) => setRoute({...route, method: v})}>
            <SelectTrigger className="w-[100px] font-bold"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="GET" className="text-emerald-600 font-bold">GET</SelectItem>
                <SelectItem value="POST" className="text-blue-600 font-bold">POST</SelectItem>
                <SelectItem value="PUT" className="text-orange-600 font-bold">PUT</SelectItem>
                <SelectItem value="DELETE" className="text-red-600 font-bold">DELETE</SelectItem>
                <SelectItem value="PATCH" className="text-yellow-600 font-bold">PATCH</SelectItem>
            </SelectContent>
         </Select>

         <Input 
            className="flex-1 font-mono text-sm" 
            value={route.path} 
            onChange={(e) => setRoute({...route, path: e.target.value})} 
            placeholder="/path"
         />

         <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <Input 
                className="w-[60px] border-0 h-8 font-mono text-sm text-center font-bold focus-visible:ring-0 p-0" 
                value={route.statusCode} 
                onChange={(e) => setRoute({...route, statusCode: parseInt(e.target.value) || 200})} 
            />
         </div>

         <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[100px]">
            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="h-4 w-4" />}
            Save
         </Button>
      </div>

      {/* 2. MAIN TABS */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 bg-background/50 backdrop-blur sticky top-0 z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-12 bg-transparent p-0 gap-6">
                    <TabsTrigger value="body" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0">Response Body</TabsTrigger>
                    <TabsTrigger value="headers" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0">Headers <span className="ml-2 text-xs bg-muted px-1.5 rounded-full">{Object.keys(headers).length}</span></TabsTrigger>
                    <TabsTrigger value="behavior" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0">Delay & Chaos</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto bg-background">
            <Tabs value={activeTab} className="h-full">
                
                {/* BODY TAB */}
                <TabsContent value="body" className="h-full m-0 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <Label className="text-xs text-muted-foreground uppercase">JSON Response Content</Label>
                        <Button variant="ghost" size="sm" onClick={formatJSON} className="h-6 text-xs gap-1">
                            <Wand2 className="h-3 w-3" /> Prettify
                        </Button>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-muted/20 border rounded-md p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 leading-relaxed"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="{ 'message': 'Hello World' }"
                        spellCheck={false}
                    />
                </TabsContent>

                {/* HEADERS TAB */}
                <TabsContent value="headers" className="h-full m-0 p-6">
                    <div className="max-w-3xl">
                        <h3 className="text-sm font-medium mb-4">Response Headers</h3>
                        <KeyValueTable initialData={headers} onChange={setHeaders} />
                    </div>
                </TabsContent>

                {/* BEHAVIOR TAB (Chaos + Delay) */}
                <TabsContent value="behavior" className="h-full m-0 p-6">
                    <div className="max-w-xl space-y-8">
                        
                        {/* 1. Delay Section */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                <h3 className="font-medium">Network Latency</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">Add a fixed delay to simulate slow APIs.</p>
                            
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex-1">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Delay (ms)</Label>
                                    <Input 
                                        type="number" 
                                        value={delay} 
                                        onChange={(e) => setDelay(parseInt(e.target.value) || 0)} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div className="flex gap-2 pt-7">
                                    {[0, 500, 1000, 3000].map(ms => (
                                        <Button 
                                            key={ms} 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setDelay(ms)}
                                            className={delay === ms ? "border-primary text-primary bg-primary/5" : ""}
                                        >
                                            {ms === 0 ? "None" : `${ms}ms`}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Chaos Monkey Section */}
                        <div className={`space-y-4 p-4 border rounded-lg transition-colors ${chaosEnabled ? 'bg-red-500/5 border-red-200 dark:border-red-900' : 'bg-muted/5'}`}>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className={`h-5 w-5 ${chaosEnabled ? 'text-red-500' : 'text-muted-foreground'}`} />
                                    <div>
                                        <h3 className="font-medium">Chaos Monkey</h3>
                                        <p className="text-xs text-muted-foreground">Randomly fail requests with 500 Errors</p>
                                    </div>
                                </div>
                                <Switch checked={chaosEnabled} onCheckedChange={setChaosEnabled} />
                             </div>

                             {chaosEnabled && (
                                <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Failure Rate</span>
                                        <span className="font-bold text-red-600">{(failureRate * 100).toFixed(0)}%</span>
                                    </div>
                                    <Slider 
                                        value={[failureRate * 100]} 
                                        max={100} step={5} 
                                        onValueChange={(vals) => setFailureRate(vals[0] / 100)}
                                        className="py-2"
                                    />
                                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-100 dark:bg-red-900/20 p-2 rounded">
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