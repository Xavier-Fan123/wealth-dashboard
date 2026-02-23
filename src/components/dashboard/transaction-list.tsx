"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { Undo2 } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  entity: string;
  asset: string;
  currency: string;
  amount: number;
  units: number | null;
  price: number | null;
  type: string;
  note: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  onVoid?: () => void;
}

const TYPE_BADGE: Record<string, "success" | "destructive" | "info" | "warning" | "default"> = {
  BUY: "warning",
  SELL: "success",
  DEPOSIT: "info",
  WITHDRAW: "destructive",
  TRANSFER: "default",
};

const INFLOW_TYPES = new Set(["SELL", "DEPOSIT"]);
const OUTFLOW_TYPES = new Set(["BUY", "WITHDRAW"]);

function getAmountClass(type: string): string {
  if (OUTFLOW_TYPES.has(type)) return "text-destructive";
  if (INFLOW_TYPES.has(type)) return "text-success";
  return "text-muted-foreground";
}

function getAmountPrefix(type: string): string {
  if (OUTFLOW_TYPES.has(type)) return "-";
  if (INFLOW_TYPES.has(type)) return "+";
  return "";
}

export function TransactionList({ transactions, onVoid }: TransactionListProps) {
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleVoid(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setVoidingId(id);
    setConfirmId(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error || "Failed to void transaction.");
        return;
      }
      onVoid?.();
    } catch {
      alert("Network error while voiding transaction.");
    } finally {
      setVoidingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Capital Flows</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: Card layout */}
        <div className="space-y-3 md:hidden">
          {transactions.map((t) => (
            <div key={t.id} className="rounded-lg border border-border/50 bg-accent/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_BADGE[t.type] || "default"}>{t.type}</Badge>
                  <Badge variant={t.entity === "FAMILY" ? "info" : "warning"}>{t.entity}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("en-SG", { month: "short", day: "numeric" })}
                  </span>
                  {onVoid && (
                    <button
                      onClick={() => handleVoid(t.id)}
                      disabled={voidingId === t.id}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      title={confirmId === t.id ? "Click again to confirm" : "Void transaction"}
                    >
                      <Undo2 className={`h-3.5 w-3.5 ${confirmId === t.id ? "text-destructive" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t.asset}</span>
                <span className={`font-mono text-sm ${getAmountClass(t.type)}`}>
                  {getAmountPrefix(t.type)}{formatNumber(Math.abs(t.amount), 0)} {t.currency}
                </span>
              </div>
              {t.note && <p className="mt-1 text-xs text-muted-foreground">{t.note}</p>}
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Entity</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Asset</th>
                <th className="pb-3 pr-4 text-right font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Note</th>
                {onVoid && <th className="pb-3 text-center font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50">
                  <td className="py-3 pr-4 font-mono text-xs">
                    {new Date(t.date).toLocaleDateString("en-SG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={t.entity === "FAMILY" ? "info" : "warning"}>
                      {t.entity}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={TYPE_BADGE[t.type] || "default"}>
                      {t.type}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-foreground">{t.asset}</td>
                  <td className="py-3 pr-4 text-right font-mono">
                    <span className={getAmountClass(t.type)}>
                      {getAmountPrefix(t.type)}{formatNumber(Math.abs(t.amount), 0)} {t.currency}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{t.note || "-"}</td>
                  {onVoid && (
                    <td className="py-3 text-center">
                      <Button
                        variant={confirmId === t.id ? "destructive" : "ghost"}
                        size="sm"
                        onClick={() => handleVoid(t.id)}
                        disabled={voidingId === t.id}
                      >
                        {voidingId === t.id
                          ? "Voiding..."
                          : confirmId === t.id
                            ? "Confirm"
                            : "Void"}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
