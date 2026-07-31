import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a real, scannable QR code for a payment payload. */
export function PaymentQr({ value, size = 168 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111318", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) return <div className="animate-pulse rounded-2xl bg-muted" style={{ width: size, height: size }} />;

  return (
    <img
      src={src}
      alt="Payment QR code"
      width={size}
      height={size}
      className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-border"
    />
  );
}
