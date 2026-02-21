"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const ASSET_OPTIONS: Record<string, { label: string; ticker?: string; currency: string }[]> = {
  FAMILY: [
    { label: "VOO", ticker: "VOO", currency: "USD" },
    { label: "QQQ", ticker: "QQQ", currency: "USD" },
    { label: "Gold ETF", ticker: "GLD", currency: "USD" },
    { label: "USD Cash", currency: "USD" },
    { label: "CNY Cash", currency: "CNY" },
  ],
  COMPANY: [
    { label: "Company Bank Balance", currency: "SGD" },
  ],
};

export function TransactionForm({ open, onClose, onSubmit }: TransactionFormProps) {
  const [entity, setEntity] = useState("FAMILY");
  const [type, setType] = useState("BUY");
  const [assetIndex, setAssetIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const assets = ASSET_OPTIONS[entity] || [];
  const selectedAsset = assets[assetIndex] || assets[0];
  const isTradeType = type === "BUY" || type === "SELL";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        date,
        entity,
        asset: selectedAsset.label,
        ticker: selectedAsset.ticker || selectedAsset.label,
        currency: selectedAsset.currency,
        amount: parseFloat(amount),
        type,
        note: note || null,
      };
      if (isTradeType && units && price) {
        body.units = parseFloat(units);
        body.price = parseFloat(price);
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setAmount("");
        setUnits("");
        setPrice("");
        setNote("");
        onSubmit();
        onClose();
      }
    } catch (err) {
      console.error("Failed to submit transaction:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <Card className="max-h-[90vh] w-full overflow-y-auto rounded-b-none rounded-t-xl sm:max-w-lg sm:rounded-xl">
        <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between bg-card">
          <CardTitle className="text-base font-semibold text-foreground">Log Capital Flow</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Entity</label>
                <Select value={entity} onChange={(e) => { setEntity(e.target.value); setAssetIndex(0); }}>
                  <option value="FAMILY">Family</option>
                  <option value="COMPANY">Company</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAW">Withdraw</option>
                  <option value="TRANSFER">Transfer</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Asset</label>
                <Select value={assetIndex} onChange={(e) => setAssetIndex(Number(e.target.value))}>
                  {assets.map((a, i) => (
                    <option key={a.label} value={i}>{a.label} ({a.currency})</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {isTradeType && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Shares / Units</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={units}
                    onChange={(e) => {
                      setUnits(e.target.value);
                      if (price && e.target.value) {
                        setAmount(String(parseFloat(e.target.value) * parseFloat(price)));
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Price per Unit</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 450.00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (units && e.target.value) {
                        setAmount(String(parseFloat(units) * parseFloat(e.target.value)));
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Total Amount ({selectedAsset.currency})
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Note (optional)</label>
              <Input
                placeholder="e.g. Monthly salary deposit"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Log Transaction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
