"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogsPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Load available servers to filter logs
  useEffect(() => {
    const loadServers = async () => {
      const wsRes = await api.get("/workspaces/my-workspaces");
      if (wsRes.data.length > 0) {
        const wsId = wsRes.data[0].id;
        const res = await api.get(`/mocks/servers/workspace/${wsId}`);
        setServers(res.data);
        if (res.data.length > 0) {
            setSelectedServer(res.data[0].id.toString());
        }
      }
    };
    loadServers();
  }, []);

  // 2. Load logs when server changes
  useEffect(() => {
    if (selectedServer) fetchLogs();
  }, [selectedServer]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/logs/server/${selectedServer}`);
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return "bg-red-100 text-red-800 hover:bg-red-100";
    if (status >= 400) return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    return "bg-green-100 text-green-800 hover:bg-green-100";
  };

  return (
    <div className="h-full p-8 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Traffic Logs</h1>
            <p className="text-muted-foreground">Monitor incoming requests to your mock servers.</p>
        </div>
        <div className="flex items-center gap-2">
            <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Server" />
                </SelectTrigger>
                <SelectContent>
                    {servers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLogs}>
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-bold text-xs">{log.method}</TableCell>
                      <TableCell className="font-mono text-xs">{log.path}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(log.statusCode)}>
                            {log.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.durationMs}ms</TableCell>
                      <TableCell>
                        {log.isChaosTriggered && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertTriangle className="h-3 w-3" /> Chaos
                            </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No logs found. Hit your mock URL to generate traffic.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}