"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/history/me");
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (m: string) => {
    if (m === "GET") return "bg-green-100 text-green-700 hover:bg-green-100";
    if (m === "POST") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
    if (m === "DELETE") return "bg-red-100 text-red-700 hover:bg-red-100";
    return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  };

  const getStatusColor = (s: number) => {
    if (s >= 500) return "text-red-600";
    if (s >= 400) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="h-full p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Clock className="h-6 w-6 text-muted-foreground" /> Request History
            </h1>
            <p className="text-muted-foreground">Recent requests you have sent.</p>
        </div>
        <Button variant="outline" onClick={fetchHistory}>Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-0">
            <div className="divide-y">
                {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <Badge variant="secondary" className={`font-mono ${getMethodColor(item.method)}`}>
                                {item.method}
                            </Badge>
                            <span className="font-mono text-sm truncate max-w-[400px]" title={item.url}>
                                {item.url}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <span className={`text-sm font-bold font-mono ${getStatusColor(item.status)}`}>
                                {item.status}
                            </span>
                            <span className="text-xs text-muted-foreground w-16 text-right">
                                {item.durationMs}ms
                            </span>
                            <span className="text-xs text-muted-foreground w-32 text-right">
                                {new Date(item.timestamp).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}

                {history.length === 0 && !loading && (
                    <div className="p-8 text-center text-muted-foreground">
                        No history yet. Go to Request Hub and send a request!
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}