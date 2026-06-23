import { useState } from "react";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Paperclip, Upload, Trash2, Download } from "lucide-react";

type Props = { entityType: string; entityId: string; label?: string };

export function AttachmentsButton({ entityType, entityId, label = "المرفقات" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title={label}><Paperclip className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">{label}</DialogTitle></DialogHeader>
        <AttachmentsPanel entityType={entityType} entityId={entityId} />
      </DialogContent>
    </Dialog>
  );
}

export function AttachmentsPanel({ entityType, entityId }: Props) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const key = ["attachments", entityType, entityId];

  const { data = [] } = useQuery(queryOptions({
    queryKey: key,
    queryFn: async () => {
      const { data } = await supabase.from("documents")
        .select("*").eq("entity_type", entityType).eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  }));

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${entityType}/${entityId}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("attachments").upload(path, file);
      if (up.error) throw up.error;
      const ins = await supabase.from("documents").insert({
        entity_type: entityType, entity_id: entityId,
        title: title || file.name, file_url: path, category: file.type || "ملف",
      } as any);
      if (ins.error) throw ins.error;
      toast.success("تم الرفع");
      setTitle("");
      qc.invalidateQueries({ queryKey: key });
    } catch (e: any) {
      toast.error(e.message ?? "تعذر الرفع");
    } finally { setUploading(false); }
  }

  async function handleDelete(doc: any) {
    if (doc.file_url) await supabase.storage.from("attachments").remove([doc.file_url]);
    await supabase.from("documents").delete().eq("id", doc.id);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: key });
  }

  async function handleDownload(doc: any) {
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(doc.file_url, 60);
    if (error || !data) return toast.error("تعذر التحميل");
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <Input placeholder="عنوان المرفق (اختياري)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm font-bold hover:bg-muted">
          <Upload className="h-4 w-4" /> {uploading ? "جارٍ الرفع..." : "اختر ملفاً للرفع"}
          <input type="file" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </label>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {(data as any[]).map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{d.title ?? "بدون عنوان"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{d.category} • {new Date(d.created_at).toLocaleDateString("ar")}</div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleDownload(d)}><Download className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" className="text-rose-600" onClick={() => handleDelete(d)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {(data as any[]).length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">لا توجد مرفقات بعد.</div>}
      </div>
    </div>
  );
}
