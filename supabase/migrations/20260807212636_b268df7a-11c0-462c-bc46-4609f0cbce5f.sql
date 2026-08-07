-- 1) asset_types
CREATE TABLE public.asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('property','land','vehicle')),
  key text NOT NULL,
  name text NOT NULL,
  category text,
  is_farm boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_types TO authenticated;
GRANT ALL ON public.asset_types TO service_role;
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_types_select" ON public.asset_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "asset_types_insert" ON public.asset_types FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "asset_types_update" ON public.asset_types FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "asset_types_delete" ON public.asset_types FOR DELETE TO authenticated
  USING (NOT system AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')));

CREATE TRIGGER set_updated_at_asset_types BEFORE UPDATE ON public.asset_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) property_nodes (Property -> Building -> Block -> Floor)
CREATE TABLE public.property_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.property_nodes(id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (node_type IN ('مبنى','بلوك','دور')),
  name text NOT NULL,
  code text,
  floor_number integer,
  area_sqm numeric,
  status text NOT NULL DEFAULT 'نشط',
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_nodes_property ON public.property_nodes(property_id);
CREATE INDEX idx_property_nodes_parent ON public.property_nodes(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_nodes TO authenticated;
GRANT ALL ON public.property_nodes TO service_role;
ALTER TABLE public.property_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_nodes_select" ON public.property_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "property_nodes_insert" ON public.property_nodes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "property_nodes_update" ON public.property_nodes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "property_nodes_delete" ON public.property_nodes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER set_updated_at_property_nodes BEFORE UPDATE ON public.property_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_property_nodes AFTER INSERT OR UPDATE OR DELETE ON public.property_nodes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- 3) optional new columns on existing assets
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS type_id uuid REFERENCES public.asset_types(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE public.lands ADD COLUMN IF NOT EXISTS type_id uuid REFERENCES public.asset_types(id) ON DELETE SET NULL;
ALTER TABLE public.lands ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS type_id uuid REFERENCES public.asset_types(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS node_id uuid REFERENCES public.property_nodes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_units_node ON public.units(node_id);

-- 4) seed system types
INSERT INTO public.asset_types (scope, key, name, category, is_farm, display_order, system) VALUES
('property','residential','سكني','عقار',false,1,true),
('property','commercial','تجاري','عقار',false,2,true),
('property','industrial','صناعي','عقار',false,3,true),
('property','hotel','فنادق','عقار',false,4,true),
('property','hospital','مستشفيات','عقار',false,5,true),
('property','warehouse','مستودعات','عقار',false,6,true),
('property','office','مكاتب','عقار',false,7,true),
('property','mixed','متعدد الاستخدام','عقار',false,8,true),
('land','land_residential','أرض سكنية','أرض',false,1,true),
('land','land_commercial','أرض تجارية','أرض',false,2,true),
('land','land_industrial','أرض صناعية','أرض',false,3,true),
('land','land_agricultural','أرض زراعية','أرض',true,4,true),
('land','land_investment','أرض استثمارية','أرض',false,5,true),
('land','land_government','أرض حكومية','أرض',false,6,true),
('land','land_leased','أرض مؤجرة','أرض',false,7,true),
('land','farm','مزرعة','مزرعة',true,8,true),
('land','orchard','بستان','مزرعة',true,9,true),
('land','plantation','مشاتل','مزرعة',true,10,true),
('land','greenhouse','بيوت محمية','مزرعة',true,11,true),
('land','ranch','مراعي','مزرعة',true,12,true),
('vehicle','car','سيارة','مركبة',false,1,true),
('vehicle','truck','شاحنة','مركبة',false,2,true),
('vehicle','bus','باص','مركبة',false,3,true),
('vehicle','trailer','مقطورة','مركبة',false,4,true),
('vehicle','excavator','حفّار','معدة',false,5,true),
('vehicle','bulldozer','بلدوزر','معدة',false,6,true),
('vehicle','crane','رافعة','معدة',false,7,true),
('vehicle','forklift','رافعة شوكية','معدة',false,8,true),
('vehicle','tractor','تراكتور','معدة',false,9,true),
('vehicle','generator','مولّد','معدة',false,10,true),
('vehicle','boat','قارب','مركبة',false,11,true),
('vehicle','agri_equipment','معدات زراعية','معدة',false,12,true),
('vehicle','industrial_machine','آلات صناعية','معدة',false,13,true)
ON CONFLICT (scope, key) DO NOTHING;