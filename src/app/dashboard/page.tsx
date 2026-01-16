"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, Server, FolderGit2, Zap, ArrowRight, Plus 
} from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    collections: 0,
    mocks: 0,
    historyCount: 0
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Loading...");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1. Get Workspace
      const wsRes = await api.get("/workspaces/my-workspaces");
      if (wsRes.data.length > 0) {
        const ws = wsRes.data[0];
        setWorkspaceName(ws.name);

        // 2. Load Counts (You can optimize this with a single 'stats' endpoint later)
        const colRes = await api.get(`/collections/workspace/${ws.id}`);
        const mockRes = await api.get(`/mocks/servers/workspace/${ws.id}`);
        
        // 3. Load Recent History
        const historyRes = await api.get("/history/me");
        
        setStats({
            collections: colRes.data.length,
            mocks: mockRes.data.length,
            historyCount: historyRes.data.length
        });
        setRecentHistory(historyRes.data.slice(0, 5)); // Top 5
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (s: number) => {
    if (s >= 500) return "text-red-600";
    if (s >= 400) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      
      {/* 1. Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Good morning, Admin</h1>
            <p className="text-muted-foreground mt-1">
                Here is what&apos;s happening in <span className="font-semibold text-foreground">{workspaceName}</span> today.
            </p>
        </div>
        <div className="flex gap-2">
            <Link href="/dashboard/request-hub">
                <Button className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" /> New Request
                </Button>
            </Link>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                <FolderGit2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.collections}</div>
                <p className="text-xs text-muted-foreground">API Projects organized</p>
            </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Mock Servers</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.mocks}</div>
                <p className="text-xs text-muted-foreground">Virtual backends running</p>
            </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests Sent</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.historyCount}</div>
                <p className="text-xs text-muted-foreground">Across all environments</p>
            </CardContent>
        </Card>
      </div>

      {/* 3. Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent History List */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Link href="/dashboard/history" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            
            <Card>
                <div className="divide-y">
                    {recentHistory.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/40 text-sm">
                             <div className="flex items-center gap-3">
                                <span className={`font-bold font-mono text-xs w-12 ${getStatusColor(item.status)}`}>
                                    {item.method}
                                </span>
                                <span className="font-mono text-muted-foreground truncate max-w-[250px] md:max-w-[300px]">
                                    {item.url}
                                </span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{item.durationMs}ms</span>
                                <span className={`font-bold ${getStatusColor(item.status)}`}>{item.status}</span>
                             </div>
                        </div>
                    ))}
                    {recentHistory.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            No recent activity found.
                        </div>
                    )}
                </div>
            </Card>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid gap-3">
                <Link href="/dashboard/mock-server">
                    <Card className="p-4 hover:bg-muted/40 cursor-pointer transition-colors flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="font-medium text-sm">Create Mock API</div>
                            <div className="text-xs text-muted-foreground">Simulate backend endpoints</div>
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/environments">
                    <Card className="p-4 hover:bg-muted/40 cursor-pointer transition-colors flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Server className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-medium text-sm">Manage Environments</div>
                            <div className="text-xs text-muted-foreground">Configure global variables</div>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}