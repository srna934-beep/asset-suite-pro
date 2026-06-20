import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type Props = {
  table: string;
  title: string;
  fields: FieldDef[];
  initial?: Record<string, any>;
  invalidate: string[][];
  trigger?: ReactNode;
};

export function RecordDialog({ table, title, fields, initial, invalidate, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    fields.forEach((f) => (v[f.name] = initial?.[f.name] ?? ""));
    return v;
  });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  async function handleSave() {
    setSaving(true);
    const payload: Record<string, any> = {};
    for (const f of fields) {
      let v = values[f.name];
      if (v === "" || v === undefined) v = null;
      if (f.required && (v === null || v === "")) {
        toast.error(`الحقل "${f.label}" مطلوب`);
        setSaving(false);
        return;
      }
      if (f.type === "number" && v !== null) v = Number(v);
      payload[f.name] = v;
    }
    const q = initial?.id
      ? await (supabase.from(table as any).update(payload).eq("id", initial.id))
      : await (supabase.from(table as any).insert(payload));
    setSaving(false);
    if (q.error) {
      toast.error(q.error.message);
      return;
    }
    toast.success(initial?.id ? "تم التحديث" : "تمت الإضافة");
    invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size={initial ? "sm" : "default"} variant={initial ? "outline" : "default"}>
            {initial ? <Pencil className="h-3.5 w-3.5" /> : <><Plus className="h-4 w-4" /> إضافة</>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label className="text-right block text-xs font-bold">{f.label}{f.required && <span className="text-rose-600"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                >
                  <option value="">— اختر —</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <Input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteButton({ table, id, invalidate, label = "حذف" }: { table: string; id: string; invalidate: string[][]; label?: string }) {
  const qc = useQueryClient();
  async function handle() {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  }
  return (
    <Button size="sm" variant="outline" onClick={handle} className="text-rose-600 hover:bg-rose-50" title={label}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
