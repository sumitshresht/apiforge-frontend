"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, Trash2, Globe } from "lucide-react";
import KeyValueTable from "@/components/request/KeyValueTable";

export default function EnvironmentsPage() {
  const [envs, setEnvs] = useState<any[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<any>(null);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    loadEnvs();
  }, []);

  const loadEnvs = async () => {
    try {
        const wsRes = await api.get("/workspaces/my-workspaces");
        if (wsRes.data.length > 0) {
            const wId = wsRes.data[0].id;
            setWorkspaceId(wId);
            const res = await api.get(`/environments/workspace/${wId}`);
            setEnvs(res.data);
            if (res.data.length > 0 && !selectedEnv) {
                // Select first one by default
                setSelectedEnv(res.data[0]);
                setVars(JSON.parse(res.data[0].variables || "{}"));
            }
        }
    } catch(e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!workspaceId) return;
    const name = prompt("Environment Name (e.g. Production):");
    if (!name) return;

    await api.post("/environments/create", {
        name,
        variables: "{}",
        workspaceId
    });
    loadEnvs();
  };

const handleSave = async () => {
    if (!selectedEnv) return;
    
    try {
        await api.put(`/environments/${selectedEnv.id}`, {
            name: selectedEnv.name,
            variables: JSON.stringify(vars),
            workspaceId: workspaceId // Optional, backend ignores it on update usually
        });
        alert("Environment saved!");
        loadEnvs(); // Refresh list to reflect name changes if any
    } catch (e) {
        console.error("Failed to save", e);
        alert("Failed to save environment");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-8 bg-background/50 backdrop-blur">
         <h1 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" /> Environments
         </h1>
         <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Environment
         </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar List */}
         <div className="w-64 border-r bg-muted/5 p-4 flex flex-col gap-2 overflow-y-auto">
            {envs.map(env => (
                <div 
                    key={env.id}
                    onClick={() => {
                        setSelectedEnv(env);
                        setVars(JSON.parse(env.variables || "{}"));
                    }}
                    className={`p-3 rounded-md cursor-pointer text-sm font-medium transition-all ${
                        selectedEnv?.id === env.id 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {env.name}
                </div>
            ))}
            {envs.length === 0 && (
                <div className="text-xs text-center text-muted-foreground mt-10">
                    No environments yet.
                </div>
            )}
         </div>

         {/* Editor Area */}
         <div className="flex-1 p-8 overflow-y-auto">
            {selectedEnv ? (
                <Card className="max-w-4xl mx-auto">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                        <CardTitle className="text-lg">Edit {selectedEnv.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="text-red-500/70 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Global Variables</label>
                            <div className="border rounded-md overflow-hidden">
                                <KeyValueTable initialData={vars} onChange={setVars} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Use these variables in requests like <code className="bg-muted px-1 rounded">{"{{variableName}}"}</code>
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSave} className="gap-2 min-w-[120px]">
                                <Save className="h-4 w-4" /> Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <Globe className="h-12 w-12 mb-4 stroke-1" />
                    <p>Select an environment to manage variables</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}