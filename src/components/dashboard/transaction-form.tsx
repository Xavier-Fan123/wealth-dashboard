"use client";

import { useEffect, useMemo, useState } from "react";
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

interface HoldingRecord {
  entity: string;
  asset: string;
  ticker: string;
  currency: string;
}

interface ManualAssetRecord {
  entity: string;
  name: string;
  currency: string;
}

interface AssetOption {
  label: string;
  ticker?: string;
  currency: string;
}

interface TransferDestinationOption extends AssetOption {
  entity: string;
  accountName: string;
}

const DEFAULT_TRADE_OPTIONS: Record<string, AssetOption[]> = {
  FAMILY: [
    { label: "VOO", ticker: "VOO", currency: "USD" },
    { label: "QQQ", ticker: "QQQ", currency: "USD" },
    { label: "Gold ETF", ticker: "GLD", currency: "USD" },
  ],
  COMPANY: [],
};

const CASH_ACCOUNT_TEMPLATES: Record<string, AssetOption[]> = {
  FAMILY: [
    { label: "USD Cash", currency: "USD" },
    { label: "CNY Cash", currency: "CNY" },
    { label: "SGD Cash", currency: "SGD" },
  ],
  COMPANY: [
    { label: "Company USD Cash", currency: "USD" },
    { label: "Company Bank Balance", currency: "SGD" },
    { label: "Company CNY Cash", currency: "CNY" },
  ],
};

function dedupeOptions(options: AssetOption[]): AssetOption[] {
  const seen = new Set<string>();
  const deduped: AssetOption[] = [];
  for (const option of options) {
    const key = `${option.label}|${option.ticker || ""}|${option.currency}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(option);
    }
  }
  return deduped;
}

export function TransactionForm({ open, onClose, onSubmit }: TransactionFormProps) {
  const [entity, setEntity] = useState("FAMILY");
  const [type, setType] = useState("BUY");
  const [assetIndex, setAssetIndex] = useState(0);
  const [toAccountIndex, setToAccountIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<{
    holdings: HoldingRecord[];
    manualAssets: ManualAssetRecord[];
  }>({
    holdings: [],
    manualAssets: [],
  });

  const isTradeType = type === "BUY" || type === "SELL";
  const isTransfer = type === "TRANSFER";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function fetchCatalog() {
      setLoadingCatalog(true);
      try {
        const [holdingsRes, manualAssetsRes] = await Promise.all([
          fetch("/api/holdings"),
          fetch("/api/manual-assets"),
        ]);
        if (!holdingsRes.ok || !manualAssetsRes.ok) {
          throw new Error("Failed to load asset catalog.");
        }

        const [holdingsJson, manualAssetsJson] = await Promise.all([
          holdingsRes.json(),
          manualAssetsRes.json(),
        ]);

        if (!cancelled) {
          setCatalog({
            holdings: (holdingsJson as HoldingRecord[]).map((item) => ({
              entity: item.entity,
              asset: item.asset,
              ticker: item.ticker,
              currency: item.currency,
            })),
            manualAssets: (manualAssetsJson as ManualAssetRecord[]).map((item) => ({
              entity: item.entity,
              name: item.name,
              currency: item.currency,
            })),
          });
        }
      } catch (fetchError) {
        console.error("Failed to load transaction catalog:", fetchError);
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      }
    }

    fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const assets = useMemo(() => {
    if (isTradeType) {
      const defaultOptions = DEFAULT_TRADE_OPTIONS[entity] ?? [];
      const holdingOptions = catalog.holdings
        .filter((holding) => holding.entity === entity)
        .map((holding) => ({
          label: holding.asset,
          ticker: holding.ticker,
          currency: holding.currency,
        }));
      return dedupeOptions([...defaultOptions, ...holdingOptions]);
    }

    const existingCashAccounts = catalog.manualAssets
      .filter((asset) => asset.entity === entity)
      .map((asset) => ({
        label: asset.name,
        currency: asset.currency,
      }));

    if (type === "DEPOSIT") {
      return dedupeOptions([...existingCashAccounts, ...(CASH_ACCOUNT_TEMPLATES[entity] ?? [])]);
    }

    return dedupeOptions(existingCashAccounts);
  }, [catalog.holdings, catalog.manualAssets, entity, isTradeType, type]);

  const transferDestinations = useMemo(() => {
    if (!isTransfer) return [];
    const selectedSource = assets[assetIndex];
    if (!selectedSource) return [];
    const existingDestinations = catalog.manualAssets.map((asset) => ({
      entity: asset.entity,
      accountName: asset.name,
      label: `${asset.entity} - ${asset.name}`,
      currency: asset.currency,
    }));
    const templateDestinations = Object.entries(CASH_ACCOUNT_TEMPLATES).flatMap(([templateEntity, options]) =>
      options.map((option) => ({
        entity: templateEntity,
        accountName: option.label,
        label: `${templateEntity} - ${option.label}`,
        currency: option.currency,
      }))
    );
    const seen = new Set<string>();
    return [...existingDestinations, ...templateDestinations].filter((destination): destination is TransferDestinationOption => {
      if (destination.currency !== selectedSource.currency) return false;
      if (destination.entity === entity && destination.accountName === selectedSource.label) return false;

      const key = `${destination.entity}|${destination.accountName}|${destination.currency}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [catalog.manualAssets, isTransfer, assets, assetIndex, entity]);

  useEffect(() => {
    setAssetIndex(0);
    setToAccountIndex(0);
  }, [entity, type]);

  useEffect(() => {
    if (assetIndex >= assets.length) {
      setAssetIndex(0);
    }
  }, [assetIndex, assets.length]);

  useEffect(() => {
    if (toAccountIndex >= transferDestinations.length) {
      setToAccountIndex(0);
    }
  }, [toAccountIndex, transferDestinations.length]);

  if (!open) return null;

  const selectedAsset = assets[assetIndex];
  const selectedDest = transferDestinations[toAccountIndex];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedAsset) {
      setError("No valid account/asset available for this transaction type.");
      return;
    }
    if (isTransfer && !selectedDest) {
      setError("No matching destination account is available for this transfer.");
      return;
    }

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
      if (isTransfer && selectedDest) {
        body.toEntity = selectedDest.entity;
        body.toAccount = selectedDest.accountName;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        setError(errorBody?.error || "Failed to log transaction.");
        return;
      }

      setAmount("");
      setUnits("");
      setPrice("");
      setNote("");
      setError(null);
      onSubmit();
      onClose();
    } catch (err) {
      console.error("Failed to submit transaction:", err);
      setError("Network error. Please try again.");
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
                <Select
                  value={entity}
                  onChange={(e) => {
                    setEntity(e.target.value);
                  }}
                >
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
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  {isTransfer ? "From Account" : "Asset / Account"}
                </label>
                <Select
                  value={String(assetIndex)}
                  onChange={(e) => setAssetIndex(Number(e.target.value))}
                  disabled={loadingCatalog || assets.length === 0}
                >
                  {assets.length === 0 && <option value="0">No option available</option>}
                  {assets.map((asset, i) => (
                    <option key={`${asset.label}-${asset.currency}-${i}`} value={i}>
                      {asset.label} ({asset.currency})
                    </option>
                  ))}
                </Select>
              </div>
              {isTransfer ? (
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">To Account</label>
                  <Select
                    value={String(toAccountIndex)}
                    onChange={(e) => setToAccountIndex(Number(e.target.value))}
                    disabled={loadingCatalog || transferDestinations.length === 0}
                  >
                    {transferDestinations.length === 0 && (
                      <option value="0">No matching account</option>
                    )}
                    {transferDestinations.map((dest, i) => (
                      <option key={`${dest.label}-${i}`} value={i}>
                        {dest.label} ({dest.currency})
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              )}
            </div>

            {isTransfer && (
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            )}

            {isTradeType && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">Shares / Units</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={units}
                    required={isTradeType}
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
                    required={isTradeType}
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
                Total Amount ({selectedAsset?.currency ?? "-"})
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

            {assets.length === 0 && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                No valid asset/account found for this entity and transaction type.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingCatalog || assets.length === 0 || (isTransfer && transferDestinations.length === 0)}
              >
                {loading ? "Submitting..." : "Log Transaction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
