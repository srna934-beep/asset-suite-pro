import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type Props = {
  table: string;
  id: string;
  field?: string;
  approveValue?: string;
  rejectValue?: string;
  invalidate: string[][];
  current?: string;
};

export function ApprovalButtons({
  table, id, field = "status",
  approveValue = "موافق عليها", rejectValue = "مرفوضة",
  invalidate, current,
}: Props) {
  const qc = useQueryClient();
  async function setStatus(value: string) {
    const { error } = await (supabase.from(table as any).update({ [field]: value }).eq("id", id));
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث الحالة");
    invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  }
  const isApproved = current === approveValue;
  const isRejected = current === rejectValue;
  return (
    <div className="flex gap-1">
      <Button
        size="sm" variant="outline"
        className={isApproved ? "border-emerald-500 text-emerald-700" : ""}
        onClick={() => setStatus(approveValue)}
        title="موافقة"
      ><Check className="h-4 w-4" /></Button>
      <Button
        size="sm" variant="outline"
        className={isRejected ? "border-rose-500 text-rose-700" : ""}
        onClick={() => setStatus(rejectValue)}
        title="رفض"
      ><X className="h-4 w-4" /></Button>
    </div>
  );
}
