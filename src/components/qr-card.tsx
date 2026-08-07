import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

type Props = {
  /** المسار الداخلي للأصل، مثال: /vehicles/uuid */
  path: string;
  title: string;
  subtitle?: string;
  /** رمز/باركود نصي يظهر أسفل الكود */
  code?: string | null;
};

/** بطاقة QR/باركود لأي أصل — توليد محلي بالكامل + طباعة. */
export function QrButton({ path, title, subtitle, code }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="بطاقة QR">
          <QrCode className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">بطاقة تعريف الأصل</DialogTitle>
        </DialogHeader>
        <QrCard path={path} title={title} subtitle={subtitle} code={code} />
      </DialogContent>
    </Dialog>
  );
}

export function QrCard({ path, title, subtitle, code }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const full = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    setUrl(full);
    if (ref.current) {
      QRCode.toCanvas(ref.current, full, { width: 220, margin: 1 }).catch(() => {});
    }
  }, [path]);

  function print() {
    const canvas = ref.current;
    if (!canvas) return;
    const img = canvas.toDataURL("image/png");
    const w = window.open("", "_blank", "width=420,height=560");
    if (!w) return;
    w.document.write(`<!doctype html><html dir="rtl"><head><title>${title}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px}
      h1{font-size:18px;margin:12px 0 4px}p{font-size:12px;color:#555;margin:2px}
      code{font-size:11px;color:#888;word-break:break-all}</style></head>
      <body><img src="${img}" width="240" /><h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ""}${code ? `<p>${code}</p>` : ""}
      <code>${url}</code>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto grid place-items-center rounded-2xl border border-border bg-white p-3">
        <canvas ref={ref} />
      </div>
      <div>
        <div className="text-base font-extrabold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        {code && <div className="mt-1 font-mono text-[11px] text-muted-foreground">{code}</div>}
      </div>
      <Button onClick={print} className="w-full">طباعة البطاقة</Button>
    </div>
  );
}
