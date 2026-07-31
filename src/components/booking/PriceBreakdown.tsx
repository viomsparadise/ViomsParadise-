import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatINR } from "@/lib/utils";

export function usePriceBreakdown(pricePerNight: number, nights: number) {
  const { settings } = useSiteSettings();
  const subtotal = pricePerNight * nights;
  const taxAmount = Math.round((subtotal * settings.tax_percent) / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total, taxPercent: settings.tax_percent };
}

export function PriceBreakdown({
  pricePerNight,
  nights,
}: {
  pricePerNight: number;
  nights: number;
}) {
  const { subtotal, taxAmount, total, taxPercent } = usePriceBreakdown(pricePerNight, nights);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between text-forest-900/70">
        <span>{formatINR(pricePerNight)} × {nights} night{nights > 1 ? "s" : ""}</span>
        <span>{formatINR(subtotal)}</span>
      </div>
      <div className="flex justify-between text-forest-900/70">
        <span>Taxes & fees ({taxPercent}%)</span>
        <span>{formatINR(taxAmount)}</span>
      </div>
      <div className="my-1 h-px bg-forest-900/10" />
      <div className="flex justify-between font-display text-lg text-forest-900">
        <span>Grand Total</span>
        <span>{formatINR(total)}</span>
      </div>
    </div>
  );
}
