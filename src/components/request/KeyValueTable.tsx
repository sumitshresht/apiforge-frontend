"use client";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  initialData: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}

export default function KeyValueTable({ initialData, onChange }: Props) {
  const entries = Object.entries(initialData);

  const updateKey = (oldKey: string, newKey: string, value: string) => {
    const newData = { ...initialData };
    if (newKey !== oldKey) {
      delete newData[oldKey];
      newData[newKey] = value;
    }
    onChange(newData);
  };

  const updateValue = (key: string, newValue: string) => {
    onChange({ ...initialData, [key]: newValue });
  };

  const addRow = () => {
    onChange({ ...initialData, "": "" });
  };

  const removeRow = (key: string) => {
    const newData = { ...initialData };
    delete newData[key];
    onChange(newData);
  };

  return (
    <div className="w-full border rounded-md overflow-hidden bg-background shadow-sm">
      {/* Header */}
      <div className="flex border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <div className="flex-1 px-3 py-2 border-r">Key</div>
        <div className="flex-1 px-3 py-2 border-r">Value</div>
        <div className="w-10"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {entries.map(([key, value], index) => (
          <div 
            key={index} 
            className="group flex items-center hover:bg-muted/30 transition-colors duration-150 odd:bg-background even:bg-muted/[0.15]"
          >
            <div className="flex-1 border-r border-border/40">
              <input
                className="w-full px-3 py-2 bg-transparent text-sm font-mono text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                placeholder="Key"
                value={key}
                onChange={(e) => updateKey(key, e.target.value, value)}
              />
            </div>
            <div className="flex-1 border-r border-border/40">
              <input
                className="w-full px-3 py-2 bg-transparent text-sm font-mono text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                placeholder="Value"
                value={value}
                onChange={(e) => updateValue(key, e.target.value)}
              />
            </div>
            <div className="w-10 flex justify-center">
              <button
                onClick={() => removeRow(key)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-red-500 p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Empty / Add Row State */}
        <div className="flex items-center p-1 bg-muted/5 hover:bg-muted/20 transition-colors cursor-pointer" onClick={addRow}>
            <div className="flex-1 px-2 py-1.5 text-xs text-muted-foreground/60 flex items-center gap-2">
                <Plus className="h-3 w-3" /> Add parameter
            </div>
        </div>
      </div>
    </div>
  );
}