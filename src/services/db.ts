// src/services/db.ts
// Relational Store with ACID-like transactional operations & business rule enforcement
import {
  Customer,
  SalesOrder,
  SalesOrderItem,
  Cylinder,
  WorkOrder,
  MachineShift,
  ProductionRun,
  QCInspection,
  DispatchNote,
  Invoice,
  Supplier,
  Item,
  PurchaseOrder,
  PurchaseOrderItem,
  StockLedgerEntry,
  MaterialIssue,
  StockValuationMethod,
  UserRole,
  UserProfile,
} from '../types/erp.ts';

const STORAGE_KEY = 'elite_packages_erp_data_v1';

export interface ERPDatabaseState {
  customers: Customer[];
  sales_orders: SalesOrder[];
  sales_order_items: SalesOrderItem[];
  cylinders: Cylinder[];
  work_orders: WorkOrder[];
  machine_shifts: MachineShift[];
  production_runs: ProductionRun[];
  qc_inspections: QCInspection[];
  dispatch_notes: DispatchNote[];
  invoices: Invoice[];
  suppliers: Supplier[];
  items: Item[];
  purchase_orders: PurchaseOrder[];
  purchase_order_items: PurchaseOrderItem[];
  stock_ledger: StockLedgerEntry[];
  material_issues: MaterialIssue[];
  valuation_method: StockValuationMethod;
}

// Initial realistic industry seed data for Elite Packages (Pakistan)
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'Shan Foods (Pvt) Ltd',
    contact_person: 'Tariq Mehmood (Head of Procurement)',
    phone: '+92 21 3505 3111',
    address: 'Plot 29, Sector 23, Korangi Industrial Area, Karachi',
    tax_number: 'NTN: 0819204-7 / STRN: 12-00-9999-011-82',
    credit_terms: '30 Days Net',
    created_at: '2026-01-10',
  },
  {
    id: 2,
    name: 'National Foods Limited',
    contact_person: 'Bilal Farooq (Packaging Sourcing)',
    phone: '+92 21 3501 5530',
    address: '12/CL-6, Claremont House, Abdullah Haroon Road, Karachi',
    tax_number: 'NTN: 0710342-1 / STRN: 11-00-8432-044-19',
    credit_terms: '45 Days Net',
    created_at: '2026-01-15',
  },
  {
    id: 3,
    name: 'English Biscuit Manufacturers (EBM)',
    contact_person: 'Farhan Zaidi (Supply Chain Manager)',
    phone: '+92 21 3506 1761',
    address: 'Plot 1-4, Sector 23, Korangi Industrial Area, Karachi',
    tax_number: 'NTN: 0698124-5 / STRN: 17-00-5541-002-33',
    credit_terms: '30 Days Net',
    created_at: '2026-02-01',
  },
  {
    id: 4,
    name: "Mitchell's Fruit Farms Ltd",
    contact_person: 'Kamran Ashraf (Production Planning)',
    phone: '+92 44 266 1111',
    address: 'Renala Khurd, District Okara, Punjab',
    tax_number: 'NTN: 0789123-9 / STRN: 03-00-1122-334-55',
    credit_terms: 'Advance 50%, Balance on Dispatch',
    created_at: '2026-02-18',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Tri-Pack Films Limited',
    contact: 'Irfan Sheikh (+92 21 3506 3121)',
    lead_time_days: 7,
    email: 'sales@tripack.com.pk',
    city: 'Karachi / Hattar',
  },
  {
    id: 2,
    name: 'DIC Pakistan Limited (Packages Group)',
    contact: 'Asad Niazi (+92 42 3581 1071)',
    lead_time_days: 4,
    email: 'info@dic.com.pk',
    city: 'Lahore',
  },
  {
    id: 3,
    name: 'Sitara Chemical Industries Ltd',
    contact: 'Naveed Akhtar (+92 41 878 1111)',
    lead_time_days: 5,
    email: 'solvents@sitara.com.pk',
    city: 'Faisalabad',
  },
  {
    id: 4,
    name: 'Henkel Pakistan (Pvt) Ltd',
    contact: 'Shahid Butt (+92 21 3563 0501)',
    lead_time_days: 6,
    email: 'adhesives.pk@henkel.com',
    city: 'Karachi',
  },
];

const INITIAL_ITEMS: Item[] = [
  // Films
  {
    id: 1,
    item_type: 'film',
    name: 'BOPP Plain 20 Micron (Corona Treated)',
    uom: 'kg',
    reorder_level: 1500,
    current_stock: 3200,
    standard_cost: 680,
  },
  {
    id: 2,
    item_type: 'film',
    name: 'Metallized PET 12 Micron (Barrier Film)',
    uom: 'kg',
    reorder_level: 1000,
    current_stock: 2450,
    standard_cost: 890,
  },
  {
    id: 3,
    item_type: 'film',
    name: 'LDPE Natural Polyethylene 35 Micron (Heat Sealable)',
    uom: 'kg',
    reorder_level: 2000,
    current_stock: 4100,
    standard_cost: 540,
  },
  {
    id: 4,
    item_type: 'film',
    name: 'Plain Polyester Film (PET) 12 Micron',
    uom: 'kg',
    reorder_level: 800,
    current_stock: 650, // Low stock trigger!
    standard_cost: 620,
  },
  // Inks
  {
    id: 5,
    item_type: 'ink',
    name: 'Gravure Process Cyan Ink (NT Series)',
    uom: 'kg',
    reorder_level: 300,
    current_stock: 580,
    standard_cost: 1450,
  },
  {
    id: 6,
    item_type: 'ink',
    name: 'Gravure Process Magenta Ink (NT Series)',
    uom: 'kg',
    reorder_level: 300,
    current_stock: 420,
    standard_cost: 1520,
  },
  {
    id: 7,
    item_type: 'ink',
    name: 'Gravure Process Yellow Ink (NT Series)',
    uom: 'kg',
    reorder_level: 300,
    current_stock: 490,
    standard_cost: 1480,
  },
  {
    id: 8,
    item_type: 'ink',
    name: 'Gravure Titanium White Opaque Ink',
    uom: 'kg',
    reorder_level: 800,
    current_stock: 1850,
    standard_cost: 1100,
  },
  {
    id: 9,
    item_type: 'ink',
    name: 'Gravure Process Black Ink',
    uom: 'kg',
    reorder_level: 250,
    current_stock: 210, // Low stock trigger!
    standard_cost: 1250,
  },
  // Solvents
  {
    id: 10,
    item_type: 'solvent',
    name: 'Ethyl Acetate 99% Pure (Primary Reducer)',
    uom: 'L',
    reorder_level: 1000,
    current_stock: 2800,
    standard_cost: 390,
  },
  {
    id: 11,
    item_type: 'solvent',
    name: 'Toluene Technical Grade (Gravure Retarder)',
    uom: 'L',
    reorder_level: 600,
    current_stock: 1200,
    standard_cost: 360,
  },
  {
    id: 12,
    item_type: 'solvent',
    name: 'Isopropyl Alcohol (IPA) 99.8%',
    uom: 'L',
    reorder_level: 500,
    current_stock: 950,
    standard_cost: 410,
  },
  // Adhesives
  {
    id: 13,
    item_type: 'adhesive',
    name: 'Solventless Polyurethane Adhesive Liofol Part A',
    uom: 'kg',
    reorder_level: 400,
    current_stock: 820,
    standard_cost: 1850,
  },
  {
    id: 14,
    item_type: 'adhesive',
    name: 'Hardener for Solventless Adhesive Liofol Part B',
    uom: 'kg',
    reorder_level: 100,
    current_stock: 220,
    standard_cost: 2100,
  },
];

const INITIAL_CYLINDERS: Cylinder[] = [
  {
    id: 1,
    design_ref: 'Shan Biryani Masala 50g (Triplex Rev 4)',
    customer_id: 1,
    colors_count: 7,
    status: 'available',
    circumference_mm: 520,
    width_mm: 1050,
    storage_location: 'Rack A-04',
    notes: 'Engraved at Precision Gravure Lahore, steel core with chrome plating',
  },
  {
    id: 2,
    design_ref: 'National Bombay Biryani 65g (Foil Replacement)',
    customer_id: 2,
    colors_count: 8,
    status: 'available',
    circumference_mm: 560,
    width_mm: 1100,
    storage_location: 'Rack B-02',
    notes: '8 Colors: Cyan, Magenta, Yellow, Black, White, Spot Orange, Gold, Matt Varnish',
  },
  {
    id: 3,
    design_ref: 'EBM Sooper Biscuits Family Pouch 112g',
    customer_id: 3,
    colors_count: 6,
    status: 'available',
    circumference_mm: 480,
    width_mm: 1000,
    storage_location: 'Rack C-01',
    notes: 'High speed run profile tested up to 250 m/min',
  },
  {
    id: 4,
    design_ref: "Mitchell's Mixed Fruit Jam Sachet 25g",
    customer_id: 4,
    colors_count: 5,
    status: 'available',
    circumference_mm: 450,
    width_mm: 950,
    storage_location: 'Rack D-03',
    notes: 'Gloss OPV required on last station',
  },
  {
    id: 5,
    design_ref: 'Shan Haleem Mix 50g 2-Up Pouch',
    customer_id: 1,
    colors_count: 7,
    status: 'at_engraver',
    circumference_mm: 520,
    width_mm: 1050,
    storage_location: 'Offsite',
    notes: 'Re-chroming at engraver after 450,000 meters run',
  },
];

const INITIAL_MACHINE_SHIFTS: MachineShift[] = [
  {
    id: 1,
    machine_name: 'Rotomec 8-Color Gravure Press Line 1',
    shift_date: '2026-03-24',
    shift_no: 'Shift A (08:00 - 16:00)',
    operator: 'Muhammad Akram (Sr. Gravure Pressman)',
  },
  {
    id: 2,
    machine_name: 'Nordmeccanica Solventless Laminator',
    shift_date: '2026-03-24',
    shift_no: 'Shift B (16:00 - 00:00)',
    operator: 'Rashid Minhas (Lamination Specialist)',
  },
  {
    id: 3,
    machine_name: 'Titan SR800 Dual Turret Slitter',
    shift_date: '2026-03-25',
    shift_no: 'Shift A (08:00 - 16:00)',
    operator: 'Zahid Iqbal (Slitter Operator)',
  },
];

const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 1,
    customer_id: 1,
    order_date: '2026-03-10',
    status: 'dispatched',
    po_reference: 'SF-PO-9941',
    delivery_deadline: '2026-03-26',
    notes: 'Export standard triplex packaging. High barrier against moisture.',
  },
  {
    id: 2,
    customer_id: 2,
    order_date: '2026-03-14',
    status: 'in_production',
    po_reference: 'NFL-2026-8802',
    delivery_deadline: '2026-03-30',
    notes: 'Match exact Pantone 151C Orange for National brand identity.',
  },
  {
    id: 3,
    customer_id: 3,
    order_date: '2026-03-20',
    status: 'confirmed',
    po_reference: 'EBM-PKG-4411',
    delivery_deadline: '2026-04-05',
    notes: 'Duplex structure with cold seal compatibility.',
  },
];

const INITIAL_SALES_ORDER_ITEMS: SalesOrderItem[] = [
  {
    id: 1,
    sales_order_id: 1,
    product_spec: 'Shan Biryani 50g — 20µ BOPP / 12µ Met PET / 35µ LDPE Triplex Pouch',
    quantity_kg: 1200,
    unit_rate: 980,
    requires_lamination: true,
    cylinder_code: 'CYL-01',
  },
  {
    id: 2,
    sales_order_id: 2,
    product_spec: 'National Bombay Biryani 65g — 12µ PET / 12µ Met PET / 40µ Poly',
    quantity_kg: 1500,
    unit_rate: 1040,
    requires_lamination: true,
    cylinder_code: 'CYL-02',
  },
  {
    id: 3,
    sales_order_id: 3,
    product_spec: 'EBM Sooper 112g Wrapper — 20µ BOPP Printed / 20µ Metallized BOPP Duplex',
    quantity_kg: 2000,
    unit_rate: 890,
    requires_lamination: true,
    cylinder_code: 'CYL-03',
  },
];

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 1,
    sales_order_item_id: 1,
    cylinder_id: 1,
    status: 'completed',
    planned_date: '2026-03-12',
    artwork_approved_date: '2026-03-11',
    artwork_approved_by: 'Shan Quality Team (Ms. Ayesha)',
    artwork_notes: 'Proof approved without changes. Barcode readability verified at Grade A.',
    priority: 'high',
    notes: 'Urgent delivery for retail promotional run.',
  },
  {
    id: 2,
    sales_order_item_id: 2,
    cylinder_id: 2,
    status: 'in_production',
    planned_date: '2026-03-18',
    artwork_approved_date: '2026-03-16',
    artwork_approved_by: 'National Brand Team (Mr. Hamza)',
    artwork_notes: 'Spot orange density approved at 1.45 D. Reverse printing on 12u PET.',
    priority: 'normal',
    notes: 'Slitting width 320mm +/- 1mm.',
  },
  {
    id: 3,
    sales_order_item_id: 3,
    cylinder_id: 3,
    status: 'material_issued',
    planned_date: '2026-03-24',
    artwork_approved_date: '2026-03-22',
    artwork_approved_by: 'EBM QA (Mr. Imran)',
    artwork_notes: 'Artwork proof rev 2 signed off. Cylinder inspected on proof press.',
    priority: 'normal',
    notes: 'Ready for printing stage on Shift A.',
  },
];

const INITIAL_MATERIAL_ISSUES: MaterialIssue[] = [
  {
    id: 1,
    work_order_id: 1,
    item_id: 1, // BOPP
    qty_issued: 650,
    unit_cost: 680,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-12 09:30:00',
    notes: 'Primary printing substrate',
  },
  {
    id: 2,
    work_order_id: 1,
    item_id: 2, // Met PET
    qty_issued: 380,
    unit_cost: 890,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-12 09:35:00',
    notes: 'Middle barrier layer',
  },
  {
    id: 3,
    work_order_id: 1,
    item_id: 3, // LDPE
    qty_issued: 420,
    unit_cost: 540,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-12 09:40:00',
    notes: 'Sealant layer for lamination',
  },
  {
    id: 4,
    work_order_id: 1,
    item_id: 8, // White ink
    qty_issued: 85,
    unit_cost: 1100,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-12 10:00:00',
    notes: 'Full backing white ink',
  },
  {
    id: 5,
    work_order_id: 1,
    item_id: 10, // Ethyl Acetate
    qty_issued: 120,
    unit_cost: 390,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-12 10:05:00',
    notes: 'Press viscosity solvent',
  },
  {
    id: 6,
    work_order_id: 1,
    item_id: 13, // Adhesive A
    qty_issued: 35,
    unit_cost: 1850,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-12 10:10:00',
    notes: 'Solventless lamination',
  },
  // For WO #2
  {
    id: 7,
    work_order_id: 2,
    item_id: 2, // Met PET
    qty_issued: 700,
    unit_cost: 890,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-18 08:30:00',
  },
  {
    id: 8,
    work_order_id: 2,
    item_id: 3, // LDPE
    qty_issued: 600,
    unit_cost: 540,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-18 08:35:00',
  },
  // For WO #3
  {
    id: 9,
    work_order_id: 3,
    item_id: 1, // BOPP
    qty_issued: 1100,
    unit_cost: 680,
    issued_by: 'Saeed Anwar (Store Keeper)',
    issue_time: '2026-03-24 11:00:00',
  },
];

const INITIAL_PRODUCTION_RUNS: ProductionRun[] = [
  // WO #1 Runs (Printing -> Lamination -> Slitting)
  {
    id: 1,
    work_order_id: 1,
    machine_shift_id: 1,
    stage: 'printing',
    qty_produced: 630,
    wastage: 20,
    start_time: '2026-03-12 10:30',
    end_time: '2026-03-12 15:45',
    operator_notes: 'Smooth run at 190 m/min. Web tension stable at 14 N.',
  },
  {
    id: 2,
    work_order_id: 1,
    machine_shift_id: 2,
    stage: 'lamination',
    qty_produced: 1220, // Multi-layer combined output
    wastage: 28,
    start_time: '2026-03-13 16:30',
    end_time: '2026-03-13 22:30',
    operator_notes: 'Solventless lamination at 280 m/min. Coat weight 1.7 g/m2.',
  },
  {
    id: 3,
    work_order_id: 1,
    machine_shift_id: 3,
    stage: 'slitting',
    qty_produced: 1200,
    wastage: 20,
    start_time: '2026-03-14 09:00',
    end_time: '2026-03-14 13:30',
    operator_notes: 'Reels slit to 410mm width. 76mm cardboard cores used.',
  },
  // WO #2 Runs (Printing currently finished)
  {
    id: 4,
    work_order_id: 2,
    machine_shift_id: 1,
    stage: 'printing',
    qty_produced: 720,
    wastage: 32,
    start_time: '2026-03-18 10:00',
    end_time: '2026-03-18 16:00',
    operator_notes: 'Pantone orange color density verified every 10,000 meters.',
  },
];

const INITIAL_QC_INSPECTIONS: QCInspection[] = [
  {
    id: 1,
    production_run_id: 1,
    result: 'pass',
    defect_notes: 'Gravure registration within 0.1mm tolerance. Ink adhesion tape test 100% pass.',
    inspector_name: 'Zeeshan Qureshi (Lead QC Chemist)',
    inspection_time: '2026-03-12 16:00',
    corona_treatment_dyne: 42,
    ink_adhesion_pass: true,
  },
  {
    id: 2,
    production_run_id: 2,
    result: 'pass',
    defect_notes: 'Bond strength tested after 24hr curing: 380 g/15mm (spec min 250 g/15mm). No optical tunneling.',
    inspector_name: 'Zeeshan Qureshi (Lead QC Chemist)',
    inspection_time: '2026-03-14 08:30',
    bond_strength_g_15mm: 380,
    ink_adhesion_pass: true,
  },
  {
    id: 3,
    production_run_id: 3,
    result: 'pass',
    defect_notes: 'Core concentricity, roll edge alignment and eye-mark sensor spacing verified.',
    inspector_name: 'Zeeshan Qureshi (Lead QC Chemist)',
    inspection_time: '2026-03-14 14:00',
    ink_adhesion_pass: true,
  },
  {
    id: 4,
    production_run_id: 4,
    result: 'pass',
    defect_notes: 'Print quality approved. Ready for lamination stage.',
    inspector_name: 'Zeeshan Qureshi (Lead QC Chemist)',
    inspection_time: '2026-03-18 16:30',
    corona_treatment_dyne: 40,
    ink_adhesion_pass: true,
  },
];

const INITIAL_DISPATCH_NOTES: DispatchNote[] = [
  {
    id: 1,
    work_order_id: 1,
    dispatch_date: '2026-03-15',
    qty_dispatched: 1200,
    vehicle_no: 'LES-26-8942 (Mazda Truck)',
    driver_name: 'Ghulam Rasool (+92 300 4421980)',
    delivery_challan_no: 'DC-2026-0811',
    received_by: 'Shan Central Warehouse Gate 2 (Receiver: Asim)',
    notes: '48 rolls palletized and stretch-wrapped with moisture desiccant bags.',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 1,
    dispatch_note_id: 1,
    invoice_number: 'INV-2026-0194',
    amount: 1176000, // 1200 kg * 980 PKR
    sales_tax_rate: 18, // 18% standard GST
    sales_tax_amount: 211680,
    total_amount: 1387680,
    amount_paid: 1387680,
    payment_status: 'paid',
    due_date: '2026-04-14',
    payment_date: '2026-03-22',
    notes: 'Paid via Meezan Bank Online Transfer ref FT2608104432.',
  },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 1,
    supplier_id: 1, // Tri-Pack
    po_number: 'PO-2026-0045',
    order_date: '2026-03-01',
    status: 'completed',
    expected_delivery: '2026-03-07',
    notes: 'Corona treatment guaranteed for 6 months. Minimum 42 dynes/cm.',
  },
  {
    id: 2,
    supplier_id: 2, // DIC Inks
    po_number: 'PO-2026-0046',
    order_date: '2026-03-05',
    status: 'completed',
    expected_delivery: '2026-03-09',
    notes: 'Non-toluene non-ketone (NTNK) gravure ink series for food contact.',
  },
  {
    id: 3,
    supplier_id: 3, // Sitara Solvents
    po_number: 'PO-2026-0047',
    order_date: '2026-03-21',
    status: 'partially_received',
    expected_delivery: '2026-03-26',
    notes: 'Delivered in clean 200L MS drums with manufacturer test certificates.',
  },
  {
    id: 4,
    supplier_id: 1, // Tri-Pack
    po_number: 'PO-2026-0048',
    order_date: '2026-03-23',
    status: 'open',
    expected_delivery: '2026-03-30',
    notes: 'Urgent film replenishment for EBM family pouch contract.',
  },
];

const INITIAL_PURCHASE_ORDER_ITEMS: PurchaseOrderItem[] = [
  {
    id: 1,
    purchase_order_id: 1,
    item_id: 1, // BOPP
    qty_ordered: 2500,
    qty_received: 2500,
    rate: 680,
  },
  {
    id: 2,
    purchase_order_id: 1,
    item_id: 2, // Met PET
    qty_ordered: 1500,
    qty_received: 1500,
    rate: 890,
  },
  {
    id: 3,
    purchase_order_id: 2,
    item_id: 8, // White ink
    qty_ordered: 1000,
    qty_received: 1000,
    rate: 1100,
  },
  {
    id: 4,
    purchase_order_id: 3,
    item_id: 10, // Ethyl Acetate
    qty_ordered: 2000,
    qty_received: 1000, // Partial receipt
    rate: 390,
  },
  {
    id: 5,
    purchase_order_id: 4,
    item_id: 4, // PET film (low stock)
    qty_ordered: 1200,
    qty_received: 0,
    rate: 620,
  },
];

// Initial stock ledger entries mapping precisely to transactions
const INITIAL_STOCK_LEDGER: StockLedgerEntry[] = [
  {
    id: 1,
    item_id: 1,
    txn_type: 'receipt',
    qty: 2500,
    balance_after: 4500,
    ref_type: 'purchase_order_item',
    ref_id: 1,
    unit_cost: 680,
    notes: 'GRN from Tri-Pack Films PO-2026-0045',
    txn_date: '2026-03-07 11:20:00',
  },
  {
    id: 2,
    item_id: 2,
    txn_type: 'receipt',
    qty: 1500,
    balance_after: 3530,
    ref_type: 'purchase_order_item',
    ref_id: 2,
    unit_cost: 890,
    notes: 'GRN from Tri-Pack Films PO-2026-0045',
    txn_date: '2026-03-07 11:45:00',
  },
  {
    id: 3,
    item_id: 8,
    txn_type: 'receipt',
    qty: 1000,
    balance_after: 1935,
    ref_type: 'purchase_order_item',
    ref_id: 3,
    unit_cost: 1100,
    notes: 'GRN from DIC Pakistan PO-2026-0046',
    txn_date: '2026-03-09 14:15:00',
  },
  {
    id: 4,
    item_id: 1,
    txn_type: 'issue',
    qty: -650,
    balance_after: 3850,
    ref_type: 'material_issue',
    ref_id: 1,
    unit_cost: 680,
    notes: 'Material issued against Work Order #1 (Shan Biryani)',
    txn_date: '2026-03-12 09:30:00',
  },
  {
    id: 5,
    item_id: 2,
    txn_type: 'issue',
    qty: -380,
    balance_after: 3150,
    ref_type: 'material_issue',
    ref_id: 2,
    unit_cost: 890,
    notes: 'Material issued against Work Order #1 (Shan Biryani)',
    txn_date: '2026-03-12 09:35:00',
  },
  {
    id: 6,
    item_id: 3,
    txn_type: 'issue',
    qty: -420,
    balance_after: 4700,
    ref_type: 'material_issue',
    ref_id: 3,
    unit_cost: 540,
    notes: 'Material issued against Work Order #1 (Shan Biryani)',
    txn_date: '2026-03-12 09:40:00',
  },
  {
    id: 7,
    item_id: 8,
    txn_type: 'issue',
    qty: -85,
    balance_after: 1850,
    ref_type: 'material_issue',
    ref_id: 4,
    unit_cost: 1100,
    notes: 'Material issued against Work Order #1 (Shan Biryani)',
    txn_date: '2026-03-12 10:00:00',
  },
  {
    id: 8,
    item_id: 2,
    txn_type: 'issue',
    qty: -700,
    balance_after: 2450,
    ref_type: 'material_issue',
    ref_id: 7,
    unit_cost: 890,
    notes: 'Material issued against Work Order #2 (National Foods)',
    txn_date: '2026-03-18 08:30:00',
  },
  {
    id: 9,
    item_id: 3,
    txn_type: 'issue',
    qty: -600,
    balance_after: 4100,
    ref_type: 'material_issue',
    ref_id: 8,
    unit_cost: 540,
    notes: 'Material issued against Work Order #2 (National Foods)',
    txn_date: '2026-03-18 08:35:00',
  },
  {
    id: 10,
    item_id: 10,
    txn_type: 'receipt',
    qty: 1000,
    balance_after: 2800,
    ref_type: 'purchase_order_item',
    ref_id: 4,
    unit_cost: 390,
    notes: 'Partial receipt batch 1 (5 x 200L drums) PO-2026-0047',
    txn_date: '2026-03-22 15:30:00',
  },
  {
    id: 11,
    item_id: 1,
    txn_type: 'issue',
    qty: -1100,
    balance_after: 2750, // Reconciled
    ref_type: 'material_issue',
    ref_id: 9,
    unit_cost: 680,
    notes: 'Material issued against Work Order #3 (EBM Sooper)',
    txn_date: '2026-03-24 11:00:00',
  },
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user_admin',
    name: 'Mian Tariq (General Manager)',
    role: 'admin',
    department: 'Executive Management',
    email: 'gm@elitepackages.com.pk',
  },
  {
    id: 'user_sales',
    name: 'Kashif Naseem (Sales Director)',
    role: 'sales',
    department: 'Sales & Client Relations',
    email: 'sales@elitepackages.com.pk',
  },
  {
    id: 'user_production',
    name: 'Engr. Junaid Malik (Plant Engineer)',
    role: 'production',
    department: 'Rotogravure & Converting',
    email: 'plant@elitepackages.com.pk',
  },
  {
    id: 'user_store',
    name: 'Saeed Anwar (Store In-Charge)',
    role: 'store',
    department: 'Raw Materials & Warehouse',
    email: 'stores@elitepackages.com.pk',
  },
  {
    id: 'user_accounts',
    name: 'Salman Raza (Chief Accountant)',
    role: 'accounts',
    department: 'Finance & Costing',
    email: 'accounts@elitepackages.com.pk',
  },
];

class ERPDatabase {
  private state: ERPDatabaseState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.state = this.loadInitialState();
    this.reconcileAllItemBalances();
  }

  private loadInitialState(): ERPDatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.customers && parsed.items && parsed.stock_ledger) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored ERP data, loading defaults', e);
    }

    return {
      customers: INITIAL_CUSTOMERS,
      sales_orders: INITIAL_SALES_ORDERS,
      sales_order_items: INITIAL_SALES_ORDER_ITEMS,
      cylinders: INITIAL_CYLINDERS,
      work_orders: INITIAL_WORK_ORDERS,
      machine_shifts: INITIAL_MACHINE_SHIFTS,
      production_runs: INITIAL_PRODUCTION_RUNS,
      qc_inspections: INITIAL_QC_INSPECTIONS,
      dispatch_notes: INITIAL_DISPATCH_NOTES,
      invoices: INITIAL_INVOICES,
      suppliers: INITIAL_SUPPLIERS,
      items: INITIAL_ITEMS,
      purchase_orders: INITIAL_PURCHASE_ORDERS,
      purchase_order_items: INITIAL_PURCHASE_ORDER_ITEMS,
      stock_ledger: INITIAL_STOCK_LEDGER,
      material_issues: INITIAL_MATERIAL_ISSUES,
      valuation_method: 'weighted_average',
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Storage error', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
    this.reconcileAllItemBalances();
    this.persist();
  }

  // --- ATOMIC RECONCILIATION ENGINE ---
  // Business Rule: stock_ledger.balance_after must always reconcile with the sum of prior transactions for that item
  public reconcileItemBalance(itemId: number): number {
    const itemEntries = this.state.stock_ledger
      .filter((e) => e.item_id === itemId)
      .sort((a, b) => new Date(a.txn_date).getTime() - new Date(b.txn_date).getTime());

    let running = 0;
    for (const entry of itemEntries) {
      running += entry.qty;
      entry.balance_after = running;
    }

    // Update item current_stock in item master
    const item = this.state.items.find((i) => i.id === itemId);
    if (item) {
      item.current_stock = running;
    }

    return running;
  }

  private reconcileAllItemBalances() {
    const itemIds = this.state.items.map((i) => i.id);
    for (const id of itemIds) {
      this.reconcileItemBalance(id);
    }
  }

  // Getters
  public getState(): ERPDatabaseState {
    return this.state;
  }

  public getValuationMethod(): StockValuationMethod {
    return this.state.valuation_method;
  }

  public setValuationMethod(method: StockValuationMethod) {
    this.state.valuation_method = method;
    this.persist();
  }

  // --- CUSTOMER OPERATIONS ---
  public addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Customer {
    const newId = this.state.customers.length > 0 ? Math.max(...this.state.customers.map((c) => c.id)) + 1 : 1;
    const newCustomer: Customer = {
      ...customer,
      id: newId,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.state.customers.push(newCustomer);
    this.persist();
    return newCustomer;
  }

  public updateCustomer(id: number, data: Partial<Customer>): Customer {
    const index = this.state.customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Customer ${id} not found`);
    this.state.customers[index] = { ...this.state.customers[index], ...data };
    this.persist();
    return this.state.customers[index];
  }

  // --- SALES ORDER OPERATIONS ---
  public createSalesOrder(
    orderData: {
      customer_id: number;
      order_date: string;
      po_reference?: string;
      delivery_deadline?: string;
      notes?: string;
    },
    itemsData: Array<{
      product_spec: string;
      quantity_kg: number;
      unit_rate: number;
      requires_lamination: boolean;
      cylinder_code?: string;
    }>
  ): { order: SalesOrder; items: SalesOrderItem[] } {
    const newOrderId =
      this.state.sales_orders.length > 0 ? Math.max(...this.state.sales_orders.map((o) => o.id)) + 1 : 1;

    const newOrder: SalesOrder = {
      id: newOrderId,
      customer_id: orderData.customer_id,
      order_date: orderData.order_date,
      status: 'draft',
      po_reference: orderData.po_reference,
      delivery_deadline: orderData.delivery_deadline,
      notes: orderData.notes,
    };

    let startItemId =
      this.state.sales_order_items.length > 0 ? Math.max(...this.state.sales_order_items.map((i) => i.id)) + 1 : 1;

    const createdItems: SalesOrderItem[] = [];
    for (const item of itemsData) {
      const newItem: SalesOrderItem = {
        id: startItemId++,
        sales_order_id: newOrderId,
        product_spec: item.product_spec,
        quantity_kg: Number(item.quantity_kg),
        unit_rate: Number(item.unit_rate),
        requires_lamination: item.requires_lamination,
        cylinder_code: item.cylinder_code,
      };
      this.state.sales_order_items.push(newItem);
      createdItems.push(newItem);
    }

    this.state.sales_orders.push(newOrder);
    this.persist();
    return { order: newOrder, items: createdItems };
  }

  public updateSalesOrderStatus(orderId: number, status: SalesOrder['status']) {
    const order = this.state.sales_orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    order.status = status;
    this.persist();
    return order;
  }

  // --- CYLINDER REGISTER OPERATIONS ---
  public addCylinder(data: Omit<Cylinder, 'id'>): Cylinder {
    const newId = this.state.cylinders.length > 0 ? Math.max(...this.state.cylinders.map((c) => c.id)) + 1 : 1;
    const newCylinder: Cylinder = { ...data, id: newId };
    this.state.cylinders.push(newCylinder);
    this.persist();
    return newCylinder;
  }

  public updateCylinder(id: number, data: Partial<Cylinder>): Cylinder {
    const index = this.state.cylinders.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Cylinder ${id} not found`);
    this.state.cylinders[index] = { ...this.state.cylinders[index], ...data };
    this.persist();
    return this.state.cylinders[index];
  }

  // --- WORK ORDER OPERATIONS ---
  public createWorkOrder(data: {
    sales_order_item_id: number;
    cylinder_id: number;
    planned_date: string;
    priority?: 'normal' | 'urgent' | 'high';
    notes?: string;
  }): WorkOrder {
    const newId = this.state.work_orders.length > 0 ? Math.max(...this.state.work_orders.map((w) => w.id)) + 1 : 1;
    const newWorkOrder: WorkOrder = {
      id: newId,
      sales_order_item_id: data.sales_order_item_id,
      cylinder_id: data.cylinder_id,
      status: 'planned',
      planned_date: data.planned_date,
      priority: data.priority || 'normal',
      notes: data.notes,
    };

    // Mark cylinder as in_use
    const cylinder = this.state.cylinders.find((c) => c.id === data.cylinder_id);
    if (cylinder) {
      cylinder.status = 'in_use';
    }

    this.state.work_orders.push(newWorkOrder);
    this.persist();
    return newWorkOrder;
  }

  public signArtworkApproval(
    workOrderId: number,
    data: { approved_by: string; approval_date: string; notes?: string }
  ): WorkOrder {
    const wo = this.state.work_orders.find((w) => w.id === workOrderId);
    if (!wo) throw new Error(`Work Order ${workOrderId} not found`);
    wo.artwork_approved_by = data.approved_by;
    wo.artwork_approved_date = data.approval_date;
    wo.artwork_notes = data.notes;
    this.persist();
    return wo;
  }

  // Business Rule: A work order cannot move to "in production" until material has been issued against it
  public startWorkOrderProduction(workOrderId: number): WorkOrder {
    const wo = this.state.work_orders.find((w) => w.id === workOrderId);
    if (!wo) throw new Error(`Work Order ${workOrderId} not found`);

    const issues = this.state.material_issues.filter((m) => m.work_order_id === workOrderId);
    if (issues.length === 0) {
      throw new Error(
        `Business Rule Violation: Work order #${workOrderId} cannot move to "in production" until material has been issued against it from the store.`
      );
    }

    wo.status = 'in_production';

    // Also update parent sales order status
    const soItem = this.state.sales_order_items.find((i) => i.id === wo.sales_order_item_id);
    if (soItem) {
      const so = this.state.sales_orders.find((s) => s.id === soItem.sales_order_id);
      if (so && so.status !== 'in_production') {
        so.status = 'in_production';
      }
    }

    this.persist();
    return wo;
  }

  // --- MATERIAL ISSUE OPERATION (Atomic Stock Ledger + Balance After) ---
  public issueMaterial(data: {
    work_order_id: number;
    item_id: number;
    qty_issued: number;
    issued_by: string;
    notes?: string;
  }): { issue: MaterialIssue; ledger: StockLedgerEntry } {
    const item = this.state.items.find((i) => i.id === data.item_id);
    if (!item) throw new Error(`Item #${data.item_id} not found`);

    const wo = this.state.work_orders.find((w) => w.id === data.work_order_id);
    if (!wo) throw new Error(`Work order #${data.work_order_id} not found`);

    if (item.current_stock < data.qty_issued) {
      throw new Error(
        `Insufficient Stock: Cannot issue ${data.qty_issued} ${item.uom} of "${item.name}". Current available stock is only ${item.current_stock} ${item.uom}.`
      );
    }

    const newIssueId =
      this.state.material_issues.length > 0 ? Math.max(...this.state.material_issues.map((m) => m.id)) + 1 : 1;

    const unitCost = item.standard_cost;
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const issue: MaterialIssue = {
      id: newIssueId,
      work_order_id: data.work_order_id,
      item_id: data.item_id,
      qty_issued: Number(data.qty_issued),
      unit_cost: unitCost,
      issued_by: data.issued_by,
      issue_time: nowIso,
      notes: data.notes,
    };
    this.state.material_issues.push(issue);

    // Create Stock Ledger Entry with atomic balance_after calculation
    const newLedgerId =
      this.state.stock_ledger.length > 0 ? Math.max(...this.state.stock_ledger.map((s) => s.id)) + 1 : 1;

    const ledgerEntry: StockLedgerEntry = {
      id: newLedgerId,
      item_id: data.item_id,
      txn_type: 'issue',
      qty: -Number(data.qty_issued),
      balance_after: 0, // Will be computed atomically
      ref_type: 'material_issue',
      ref_id: newIssueId,
      unit_cost: unitCost,
      notes: data.notes || `Issued to Work Order #${data.work_order_id}`,
      txn_date: nowIso,
    };

    this.state.stock_ledger.push(ledgerEntry);

    // Atomically recalculate balance_after
    this.reconcileItemBalance(data.item_id);

    // Update work order status if currently 'planned'
    if (wo.status === 'planned') {
      wo.status = 'material_issued';
    }

    this.persist();
    return { issue, ledger: ledgerEntry };
  }

  // --- MACHINE SHIFTS & PRODUCTION RUNS ---
  public addMachineShift(data: Omit<MachineShift, 'id'>): MachineShift {
    const newId =
      this.state.machine_shifts.length > 0 ? Math.max(...this.state.machine_shifts.map((m) => m.id)) + 1 : 1;
    const newShift: MachineShift = { ...data, id: newId };
    this.state.machine_shifts.push(newShift);
    this.persist();
    return newShift;
  }

  // Business Rule: Lamination is optional per order — stage sequence should skip it cleanly when not ordered
  public recordProductionRun(data: {
    work_order_id: number;
    machine_shift_id: number;
    stage: ProductionRun['stage'];
    qty_produced: number;
    wastage: number;
    start_time: string;
    end_time: string;
    operator_notes?: string;
  }): ProductionRun {
    const wo = this.state.work_orders.find((w) => w.id === data.work_order_id);
    if (!wo) throw new Error(`Work order #${data.work_order_id} not found`);

    const soItem = this.state.sales_order_items.find((i) => i.id === wo.sales_order_item_id);
    if (data.stage === 'lamination' && soItem && !soItem.requires_lamination) {
      throw new Error(
        `Business Rule Violation: This work order (${soItem.product_spec}) does not require lamination. Lamination must be skipped.`
      );
    }

    const newId =
      this.state.production_runs.length > 0 ? Math.max(...this.state.production_runs.map((p) => p.id)) + 1 : 1;

    const run: ProductionRun = {
      id: newId,
      work_order_id: data.work_order_id,
      machine_shift_id: data.machine_shift_id,
      stage: data.stage,
      qty_produced: Number(data.qty_produced),
      wastage: Number(data.wastage),
      start_time: data.start_time,
      end_time: data.end_time,
      operator_notes: data.operator_notes,
    };

    this.state.production_runs.push(run);

    // If slitting is complete (the final stage) and work order is in_production, mark completed
    if (data.stage === 'slitting') {
      wo.status = 'completed';
    }

    this.persist();
    return run;
  }

  // --- QC INSPECTIONS & REWORK LOOP ---
  public recordQCInspection(data: {
    production_run_id: number;
    result: QCInspection['result'];
    defect_notes?: string;
    inspector_name: string;
    corona_treatment_dyne?: number;
    bond_strength_g_15mm?: number;
    ink_adhesion_pass?: boolean;
  }): QCInspection {
    const run = this.state.production_runs.find((p) => p.id === data.production_run_id);
    if (!run) throw new Error(`Production run #${data.production_run_id} not found`);

    const newId =
      this.state.qc_inspections.length > 0 ? Math.max(...this.state.qc_inspections.map((q) => q.id)) + 1 : 1;

    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const inspection: QCInspection = {
      id: newId,
      production_run_id: data.production_run_id,
      result: data.result,
      defect_notes: data.defect_notes,
      inspector_name: data.inspector_name,
      inspection_time: nowIso,
      corona_treatment_dyne: data.corona_treatment_dyne,
      bond_strength_g_15mm: data.bond_strength_g_15mm,
      ink_adhesion_pass: data.ink_adhesion_pass,
    };

    this.state.qc_inspections.push(inspection);

    // If rework or fail, flag work order back to in_production for correction
    if (data.result === 'rework' || data.result === 'fail') {
      const wo = this.state.work_orders.find((w) => w.id === run.work_order_id);
      if (wo) {
        wo.status = 'in_production';
      }
    }

    this.persist();
    return inspection;
  }

  // --- DISPATCH & INVOICING ---
  public createDispatchNote(data: {
    work_order_id: number;
    dispatch_date: string;
    qty_dispatched: number;
    vehicle_no?: string;
    driver_name?: string;
    notes?: string;
  }): DispatchNote {
    const wo = this.state.work_orders.find((w) => w.id === data.work_order_id);
    if (!wo) throw new Error(`Work order #${data.work_order_id} not found`);

    const newId =
      this.state.dispatch_notes.length > 0 ? Math.max(...this.state.dispatch_notes.map((d) => d.id)) + 1 : 1;

    const challanNo = `DC-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;

    const dispatchNote: DispatchNote = {
      id: newId,
      work_order_id: data.work_order_id,
      dispatch_date: data.dispatch_date,
      qty_dispatched: Number(data.qty_dispatched),
      vehicle_no: data.vehicle_no,
      driver_name: data.driver_name,
      delivery_challan_no: challanNo,
      notes: data.notes,
    };

    this.state.dispatch_notes.push(dispatchNote);

    // Mark sales order as dispatched
    const soItem = this.state.sales_order_items.find((i) => i.id === wo.sales_order_item_id);
    if (soItem) {
      const so = this.state.sales_orders.find((s) => s.id === soItem.sales_order_id);
      if (so) {
        so.status = 'dispatched';
      }
    }

    // Release cylinder back to available
    const cylinder = this.state.cylinders.find((c) => c.id === wo.cylinder_id);
    if (cylinder) {
      cylinder.status = 'available';
    }

    this.persist();
    return dispatchNote;
  }

  public createInvoiceFromDispatch(dispatchNoteId: number): Invoice {
    const dn = this.state.dispatch_notes.find((d) => d.id === dispatchNoteId);
    if (!dn) throw new Error(`Dispatch note #${dispatchNoteId} not found`);

    // Check if invoice already exists for this dispatch note
    const existing = this.state.invoices.find((inv) => inv.dispatch_note_id === dispatchNoteId);
    if (existing) {
      return existing;
    }

    const wo = this.state.work_orders.find((w) => w.id === dn.work_order_id);
    const soItem = wo ? this.state.sales_order_items.find((i) => i.id === wo.sales_order_item_id) : null;
    const rate = soItem ? soItem.unit_rate : 900;

    const netAmount = Math.round(dn.qty_dispatched * rate);
    const taxRate = 18; // 18% standard GST in Pakistan
    const taxAmount = Math.round((netAmount * taxRate) / 100);
    const totalAmount = netAmount + taxAmount;

    const newId = this.state.invoices.length > 0 ? Math.max(...this.state.invoices.map((i) => i.id)) + 1 : 1;

    const invNumber = `INV-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;

    // Due in 30 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice: Invoice = {
      id: newId,
      dispatch_note_id: dispatchNoteId,
      invoice_number: invNumber,
      amount: netAmount,
      sales_tax_rate: taxRate,
      sales_tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: 0,
      payment_status: 'unpaid',
      due_date: dueDate.toISOString().split('T')[0],
    };

    this.state.invoices.push(invoice);
    this.persist();
    return invoice;
  }

  public recordInvoicePayment(
    invoiceId: number,
    data: { amount_paying: number; payment_date: string; notes?: string }
  ): Invoice {
    const inv = this.state.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error(`Invoice #${invoiceId} not found`);

    const paying = Number(data.amount_paying);
    inv.amount_paid = (inv.amount_paid || 0) + paying;
    inv.payment_date = data.payment_date;
    inv.notes = data.notes;

    if (inv.amount_paid >= inv.total_amount) {
      inv.payment_status = 'paid';
    } else if (inv.amount_paid > 0) {
      inv.payment_status = 'partially_paid';
    }

    this.persist();
    return inv;
  }

  // --- PROCUREMENT & INVENTORY ---
  public addItem(item: Omit<Item, 'id' | 'current_stock'>): Item {
    const newId = this.state.items.length > 0 ? Math.max(...this.state.items.map((i) => i.id)) + 1 : 1;
    const newItem: Item = {
      ...item,
      id: newId,
      current_stock: 0,
    };
    this.state.items.push(newItem);
    this.persist();
    return newItem;
  }

  public updateItem(id: number, data: Partial<Item>): Item {
    const index = this.state.items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);
    this.state.items[index] = { ...this.state.items[index], ...data };
    this.persist();
    return this.state.items[index];
  }

  public addSupplier(supplier: Omit<Supplier, 'id'>): Supplier {
    const newId = this.state.suppliers.length > 0 ? Math.max(...this.state.suppliers.map((s) => s.id)) + 1 : 1;
    const newSupplier: Supplier = { ...supplier, id: newId };
    this.state.suppliers.push(newSupplier);
    this.persist();
    return newSupplier;
  }

  public createPurchaseOrder(
    poData: { supplier_id: number; order_date: string; expected_delivery?: string; notes?: string },
    itemsData: Array<{ item_id: number; qty_ordered: number; rate: number }>
  ): PurchaseOrder {
    const newPoId =
      this.state.purchase_orders.length > 0 ? Math.max(...this.state.purchase_orders.map((p) => p.id)) + 1 : 1;

    const poNumber = `PO-${new Date().getFullYear()}-${String(newPoId).padStart(4, '0')}`;

    const po: PurchaseOrder = {
      id: newPoId,
      supplier_id: poData.supplier_id,
      po_number: poNumber,
      order_date: poData.order_date,
      status: 'open',
      expected_delivery: poData.expected_delivery,
      notes: poData.notes,
    };

    let startItemId =
      this.state.purchase_order_items.length > 0
        ? Math.max(...this.state.purchase_order_items.map((i) => i.id)) + 1
        : 1;

    for (const item of itemsData) {
      this.state.purchase_order_items.push({
        id: startItemId++,
        purchase_order_id: newPoId,
        item_id: item.item_id,
        qty_ordered: Number(item.qty_ordered),
        qty_received: 0,
        rate: Number(item.rate),
      });
    }

    this.state.purchase_orders.push(po);
    this.persist();
    return po;
  }

  // Partial or Full Receipt against Purchase Order with Atomic Stock Ledger write
  public receivePurchaseOrderItems(
    poId: number,
    receipts: Array<{ po_item_id: number; qty_to_receive: number }>,
    receiptDate: string,
    notes?: string
  ): PurchaseOrder {
    const po = this.state.purchase_orders.find((p) => p.id === poId);
    if (!po) throw new Error(`PO #${poId} not found`);

    let startLedgerId =
      this.state.stock_ledger.length > 0 ? Math.max(...this.state.stock_ledger.map((s) => s.id)) + 1 : 1;

    for (const receipt of receipts) {
      if (receipt.qty_to_receive <= 0) continue;

      const poItem = this.state.purchase_order_items.find((p) => p.id === receipt.po_item_id);
      if (!poItem) continue;

      poItem.qty_received = Number(poItem.qty_received || 0) + Number(receipt.qty_to_receive);

      // Write Stock Ledger entry with atomic calculation
      const ledgerEntry: StockLedgerEntry = {
        id: startLedgerId++,
        item_id: poItem.item_id,
        txn_type: 'receipt',
        qty: Number(receipt.qty_to_receive),
        balance_after: 0, // Computed atomically below
        ref_type: 'purchase_order_item',
        ref_id: poItem.id,
        unit_cost: poItem.rate,
        notes: notes || `Goods Receipt from ${po.po_number}`,
        txn_date: receiptDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      this.state.stock_ledger.push(ledgerEntry);
      this.reconcileItemBalance(poItem.item_id);
    }

    // Determine new status for PO
    const allPoItems = this.state.purchase_order_items.filter((p) => p.purchase_order_id === poId);
    const allCompleted = allPoItems.every((item) => item.qty_received >= item.qty_ordered);
    const anyReceived = allPoItems.some((item) => item.qty_received > 0);

    if (allCompleted) {
      po.status = 'completed';
    } else if (anyReceived) {
      po.status = 'partially_received';
    }

    this.persist();
    return po;
  }

  // Manual stock adjustments
  public recordManualStockAdjustment(data: {
    item_id: number;
    qty: number; // positive or negative
    reason: string;
    notes?: string;
  }) {
    const item = this.state.items.find((i) => i.id === data.item_id);
    if (!item) throw new Error(`Item ${data.item_id} not found`);

    const newLedgerId =
      this.state.stock_ledger.length > 0 ? Math.max(...this.state.stock_ledger.map((s) => s.id)) + 1 : 1;

    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const ledgerEntry: StockLedgerEntry = {
      id: newLedgerId,
      item_id: data.item_id,
      txn_type: data.qty >= 0 ? 'adjustment' : 'adjustment',
      qty: Number(data.qty),
      balance_after: 0,
      ref_type: 'manual',
      ref_id: 0,
      unit_cost: item.standard_cost,
      notes: `Manual Adjustment: ${data.reason}. ${data.notes || ''}`.trim(),
      txn_date: nowIso,
    };

    this.state.stock_ledger.push(ledgerEntry);
    this.reconcileItemBalance(data.item_id);
    this.persist();
    return ledgerEntry;
  }

  // --- VALUATION & COSTING CALCULATIONS ---
  // Calculates inventory valuation comparing Weighted Average vs. FIFO
  public calculateInventoryValuation(): {
    methodUsed: StockValuationMethod;
    itemsValuation: Array<{
      item: Item;
      quantity: number;
      weightedAverageUnitRate: number;
      weightedAverageTotal: number;
      fifoUnitRate: number;
      fifoTotal: number;
      variancePercent: number;
    }>;
    totalWeightedAverage: number;
    totalFIFO: number;
  } {
    const results = [];
    let totalWA = 0;
    let totalFIFO = 0;

    for (const item of this.state.items) {
      const currentQty = Math.max(0, item.current_stock);

      // Receipts for this item
      const receipts = this.state.stock_ledger
        .filter((l) => l.item_id === item.id && l.txn_type === 'receipt' && l.qty > 0)
        .sort((a, b) => new Date(a.txn_date).getTime() - new Date(b.txn_date).getTime());

      // Weighted Average Calculation
      let sumReceiptsValue = 0;
      let sumReceiptsQty = 0;
      for (const r of receipts) {
        const cost = r.unit_cost || item.standard_cost;
        sumReceiptsValue += r.qty * cost;
        sumReceiptsQty += r.qty;
      }
      const waRate = sumReceiptsQty > 0 ? sumReceiptsValue / sumReceiptsQty : item.standard_cost;
      const waTotal = currentQty * waRate;

      // FIFO Calculation (remaining stock comes from newest receipts backwards)
      let fifoRemaining = currentQty;
      let fifoValue = 0;
      // Newest receipts first to value remaining on-hand stock
      const newestReceipts = [...receipts].reverse();

      for (const r of newestReceipts) {
        if (fifoRemaining <= 0) break;
        const take = Math.min(fifoRemaining, r.qty);
        const cost = r.unit_cost || item.standard_cost;
        fifoValue += take * cost;
        fifoRemaining -= take;
      }

      // If stock exceeds receipts, fill with standard cost
      if (fifoRemaining > 0) {
        fifoValue += fifoRemaining * item.standard_cost;
      }

      const fifoRate = currentQty > 0 ? fifoValue / currentQty : item.standard_cost;
      const variance = waTotal > 0 ? ((fifoValue - waTotal) / waTotal) * 100 : 0;

      totalWA += waTotal;
      totalFIFO += fifoValue;

      results.push({
        item,
        quantity: currentQty,
        weightedAverageUnitRate: Math.round(waRate * 100) / 100,
        weightedAverageTotal: Math.round(waTotal),
        fifoUnitRate: Math.round(fifoRate * 100) / 100,
        fifoTotal: Math.round(fifoValue),
        variancePercent: Math.round(variance * 10) / 10,
      });
    }

    return {
      methodUsed: this.state.valuation_method,
      itemsValuation: results,
      totalWeightedAverage: Math.round(totalWA),
      totalFIFO: Math.round(totalFIFO),
    };
  }

  // Material cost per work order
  public getWorkOrderMaterialCost(workOrderId: number) {
    const issues = this.state.material_issues.filter((m) => m.work_order_id === workOrderId);
    let totalCost = 0;
    const details = issues.map((issue) => {
      const item = this.state.items.find((i) => i.id === issue.item_id);
      const cost = issue.qty_issued * issue.unit_cost;
      totalCost += cost;
      return {
        ...issue,
        item_name: item ? item.name : 'Unknown Item',
        item_uom: item ? item.uom : 'kg',
        total_cost: cost,
      };
    });

    return {
      workOrderId,
      totalCost,
      details,
    };
  }

  // Production Wastage statistics
  public getWastageReport() {
    let totalProduced = 0;
    let totalWastage = 0;
    const stageBreakdown: Record<string, { produced: number; wastage: number; percentage: number }> = {
      printing: { produced: 0, wastage: 0, percentage: 0 },
      lamination: { produced: 0, wastage: 0, percentage: 0 },
      slitting: { produced: 0, wastage: 0, percentage: 0 },
    };

    for (const run of this.state.production_runs) {
      totalProduced += run.qty_produced;
      totalWastage += run.wastage;

      if (stageBreakdown[run.stage]) {
        stageBreakdown[run.stage].produced += run.qty_produced;
        stageBreakdown[run.stage].wastage += run.wastage;
      }
    }

    for (const stage in stageBreakdown) {
      const data = stageBreakdown[stage];
      const sum = data.produced + data.wastage;
      data.percentage = sum > 0 ? Math.round((data.wastage / sum) * 1000) / 10 : 0;
    }

    const overallPercentage =
      totalProduced + totalWastage > 0 ? Math.round((totalWastage / (totalProduced + totalWastage)) * 1000) / 10 : 0;

    return {
      totalProduced,
      totalWastage,
      overallPercentage,
      stageBreakdown,
    };
  }

  // Desktop Offline Database Management
  public exportDatabaseJSON(): string {
    return JSON.stringify(
      {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        appName: 'Elite Packages ERP - Desktop Edition',
        state: this.state,
      },
      null,
      2
    );
  }

  public importDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      const incomingState = parsed.state || parsed;

      // Validate core tables
      if (
        !Array.isArray(incomingState.customers) ||
        !Array.isArray(incomingState.sales_orders) ||
        !Array.isArray(incomingState.items) ||
        !Array.isArray(incomingState.stock_ledger)
      ) {
        return { success: false, message: 'Invalid database backup structure. Required tables are missing.' };
      }

      this.state = {
        ...this.state,
        ...incomingState,
      };
      this.persist();
      return { success: true, message: 'Database successfully restored from backup.' };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to parse database backup file.',
      };
    }
  }

  public resetToFactoryDefaults(): void {
    this.resetToDefault();
  }

  public getStorageStats(): { totalRecords: number; estimatedSizeKb: number; lastSaved: string } {
    let count = 0;
    count += this.state.customers.length;
    count += this.state.sales_orders.length;
    count += this.state.sales_order_items.length;
    count += this.state.cylinders.length;
    count += this.state.work_orders.length;
    count += this.state.machine_shifts.length;
    count += this.state.production_runs.length;
    count += this.state.qc_inspections.length;
    count += this.state.dispatch_notes.length;
    count += this.state.invoices.length;
    count += this.state.suppliers.length;
    count += this.state.items.length;
    count += this.state.purchase_orders.length;
    count += this.state.purchase_order_items.length;
    count += this.state.stock_ledger.length;
    count += this.state.material_issues.length;

    let sizeKb = 0;
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY) || '';
      sizeKb = Math.round((raw.length * 2) / 1024 * 10) / 10;
    }

    return {
      totalRecords: count,
      estimatedSizeKb: sizeKb,
      lastSaved: new Date().toLocaleTimeString(),
    };
  }
}

export const dbService = new ERPDatabase();
