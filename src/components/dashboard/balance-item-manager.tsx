"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { BalanceItemDetail } from "@/types/dashboard";

interface BalanceItemManagerProps {
  items: BalanceItemDetail[];
  onChanged: () => void;
}

export function BalanceItemManager({ items, onChanged }: BalanceItemManagerProps) {
  const [entity, setEntity] = useState("COMPANY");
  const [type, setType] = useState("PAYABLE");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("SGD");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineAmounts, setInlineAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const item of items) {
      next[item.id] = String(item.amount);
    }
    setInlineAmounts(next);
  }, [items]);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/balance-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          type,
          name,
          currency,
          amount: parseFloat(amount),
          dueDate: dueDate || null,
          note: note || null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error || "Failed to create item.");
        return;
      }
      setName("");
      setAmount("");
      setDueDate("");
      setNote("");
      onChanged();
    } catch (createError) {
      console.error("Failed to create balance item:", createError);
      setError("Network error while creating balance item.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAmount(item: BalanceItemDetail) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/balance-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          amount: parseFloat(inlineAmounts[item.id]),
          dueDate: item.dueDate,
          note: item.note,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error || "Failed to update item.");
        return;
      }
      onChanged();
    } catch (updateError) {
      console.error("Failed to update balance item:", updateError);
      setError("Network error while updating item.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/balance-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error || "Failed to delete item.");
        return;
      }
      onChanged();
    } catch (deleteError) {
      console.error("Failed to delete balance item:", deleteError);
      setError("Network error while deleting item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liabilities / Receivables Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={createItem} className="space-y-4 rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="FAMILY">Family</option>
              <option value="COMPANY">Company</option>
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="LIABILITY">Liability</option>
              <option value="PAYABLE">Payable</option>
              <option value="RECEIVABLE">Receivable</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Item name (e.g. Supplier Payable)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="number"
              step="any"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Item"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No balance items yet.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={item.entity === "FAMILY" ? "info" : "warning"}>{item.entity}</Badge>
                  <Badge variant="default">{item.type}</Badge>
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  SGD {formatNumber(item.valueSGD, 0)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input
                  type="number"
                  step="any"
                  value={inlineAmounts[item.id] ?? String(item.amount)}
                  onChange={(e) =>
                    setInlineAmounts((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                />
                <div className="flex items-center text-sm text-muted-foreground">
                  {formatCurrency(item.amount, item.currency)}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => saveAmount(item)} disabled={loading}>
                    Save
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => deleteItem(item.id)} disabled={loading}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
