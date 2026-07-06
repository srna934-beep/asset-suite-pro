import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  /** Field name whose value determines this field's options (dependent select) */
  optionsBy?: string;
  /** Map of depending value → options for this field */
  optionsMap?: Record<string, { value: string; label: string }[]>;
  /** Show this field only when another field equals one of these values */
  showWhen?: { field: string; equals: string[] };
};


type Props = {
  table: string;
  title: string;
  fields: FieldDef[];
  initial?: Record<string, any>;
  invalidate: string[][];
  trigger?: ReactNode;
  defaults?: Record<string, any>;
};

export function RecordDialog({ table, title, fields, initial, invalidate, trigger, defaults }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    fields.forEach((f) => (v[f.name] = initial?.[f.name] ?? defaults?.[f.name] ?? ""));
    return v;
  });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  async function handleSave() {
    setSaving(true);
    const payload: Record<string, any> = {};
    for (const f of fields) {
      const hidden = f.showWhen && !f.showWhen.equals.includes(String(values[f.showWhen.field] ?? ""));
      let v = hidden ? null : values[f.name];
      if (v === "" || v === undefined) v = null;
      if (!hidden && f.required && (v === null || v === "")) {
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
    if (q.error) { toast.error(q.error.message); return; }
    toast.success(initial?.id ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح");

    invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size={initial ? "sm" : "default"} variant={initial ? "outline" : "default"}>
            {initial ? <Pencil className="h-3.5 w-3.5" /> : <><Plus className="h-4 w-4 ml-1" /> إضافة جديد</>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {fields.map((f) => {
            if (f.showWhen && !f.showWhen.equals.includes(String(values[f.showWhen.field] ?? ""))) return null;
            const opts = f.optionsBy
              ? (f.optionsMap?.[String(values[f.optionsBy] ?? "")] ?? [])
              : (f.options ?? []);
            return (
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
                  {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          );})}

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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف بنجاح");
    invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" title={label}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription className="text-right">هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد من الحذف؟</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? "..." : "حذف"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
