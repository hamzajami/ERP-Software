// src/types/erp.ts
// Direct mapping to the PostgreSQL DDL schema with enterprise application extensions

export type UserRole = 'admin' | 'sales' | 'production' | 'store' | 'accounts';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  avatar?: string;
}

export interface Customer {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  tax_number: string; // NTN or STRN in Pakistan
  credit_terms: string; // e.g., "30 Days Net", "Advance 50%, Balance on Dispatch"
  created_at?: string;
}

export type SalesOrderStatus = 'draft' | 'confirmed' | 'in_production' | 'dispatched' | 'closed';

export interface SalesOrder {
  id: number;
  customer_id: number;
  order_date: string; // YYYY-MM-DD
  status: SalesOrderStatus;
  po_reference?: string;
  delivery_deadline?: string;
  notes?: string;
}

export interface SalesOrderItem {
  id: number;
  sales_order_id: number;
  product_spec: string; // e.g. "Shan Biryani 50g - 20u BOPP / 12u Met PET / 35u Poly"
  quantity_kg: number;
  unit_rate: number; // PKR per kg
  requires_lamination: boolean; // Rotogravure specification flag
  cylinder_code?: string;
}

export type CylinderStatus = 'available' | 'in_use' | 'at_engraver' | 'damaged' | 'retired';

export interface Cylinder {
  id: number;
  design_ref: string;
  customer_id?: number;
  colors_count: number;
  status: CylinderStatus;
  circumference_mm?: number;
  width_mm?: number;
  storage_location?: string;
  notes?: string;
}

export type WorkOrderStatus = 'planned' | 'material_issued' | 'in_production' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: number;
  sales_order_item_id: number;
  cylinder_id: number;
  status: WorkOrderStatus;
  planned_date: string;
  artwork_approved_date?: string;
  artwork_approved_by?: string;
  artwork_notes?: string;
  priority?: 'normal' | 'urgent' | 'high';
  notes?: string;
}

export interface MachineShift {
  id: number;
  machine_name: string; // e.g. "Rotomec 8-Color Gravure Line 1", "Nordmeccanica Solventless Laminator", "Titan SR800 Slitter"
  shift_date: string;
  shift_no: string; // "Shift A (08:00 - 16:00)", "Shift B (16:00 - 00:00)", "Shift C (00:00 - 08:00)"
  operator: string;
}

export type ProductionStage = 'printing' | 'lamination' | 'slitting';

export interface ProductionRun {
  id: number;
  work_order_id: number;
  machine_shift_id: number;
  stage: ProductionStage;
  qty_produced: number; // kg
  wastage: number; // kg
  start_time: string;
  end_time: string;
  operator_notes?: string;
}

export type QCResult = 'pass' | 'fail' | 'rework';

export interface QCInspection {
  id: number;
  production_run_id: number;
  result: QCResult;
  defect_notes?: string;
  inspector_name: string;
  inspection_time: string;
  corona_treatment_dyne?: number;
  bond_strength_g_15mm?: number;
  ink_adhesion_pass?: boolean;
}

export interface DispatchNote {
  id: number;
  work_order_id: number;
  dispatch_date: string;
  qty_dispatched: number; // kg
  vehicle_no?: string;
  driver_name?: string;
  delivery_challan_no: string;
  received_by?: string;
  notes?: string;
}

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface Invoice {
  id: number;
  dispatch_note_id: number;
  invoice_number: string; // e.g. "INV-2026-0042"
  amount: number; // PKR
  sales_tax_rate: number; // e.g., 18% standard GST in Pakistan
  sales_tax_amount: number;
  total_amount: number; // amount + sales_tax_amount
  amount_paid: number;
  payment_status: PaymentStatus;
  due_date: string;
  payment_date?: string;
  notes?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  lead_time_days: number;
  email?: string;
  city?: string;
}

export type PurchaseOrderStatus = 'open' | 'partially_received' | 'completed' | 'cancelled';

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  po_number: string; // e.g. "PO-2026-101"
  order_date: string;
  status: PurchaseOrderStatus;
  expected_delivery?: string;
  notes?: string;
}

export type ItemType = 'film' | 'ink' | 'solvent' | 'adhesive';

export interface Item {
  id: number;
  item_type: ItemType;
  name: string;
  uom: string; // kg, L, rolls
  reorder_level: number;
  current_stock: number;
  standard_cost: number; // PKR
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  qty_ordered: number;
  qty_received: number;
  rate: number; // PKR per UOM
}

export type StockTxnType = 'receipt' | 'issue' | 'return' | 'adjustment';
export type StockRefType = 'purchase_order_item' | 'material_issue' | 'manual' | 'rework_return';

export interface StockLedgerEntry {
  id: number;
  item_id: number;
  txn_type: StockTxnType;
  qty: number; // positive for additions, negative for deductions
  balance_after: number;
  ref_type: StockRefType;
  ref_id: number;
  unit_cost?: number; // Cost at transaction time for FIFO / Weighted Average
  notes?: string;
  txn_date: string;
}

export interface MaterialIssue {
  id: number;
  work_order_id: number;
  item_id: number;
  qty_issued: number;
  unit_cost: number; // unit cost recorded at time of issue
  issued_by: string;
  issue_time: string;
  notes?: string;
}

// Valuation Methods for Accounting
export type StockValuationMethod = 'weighted_average' | 'fifo';

export interface ValuationBatch {
  purchase_order_item_id: number;
  item_id: number;
  date: string;
  remaining_qty: number;
  unit_rate: number;
}
