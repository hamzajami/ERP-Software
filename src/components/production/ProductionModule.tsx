// src/components/production/ProductionModule.tsx
import React, { useState } from 'react';
import {
  WorkOrder,
  Cylinder,
  MachineShift,
  ProductionRun,
  QCInspection,
  MaterialIssue,
  Item,
  SalesOrderItem,
  Customer,
} from '../../types/erp.ts';
import { dbService } from '../../services/db.ts';
import { formatPKR, formatDate, formatNumber, formatDateTime } from '../../utils/formatters.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  Factory,
  CheckCircle,
  AlertCircle,
  Plus,
  Layers,
  Sparkles,
  ClipboardList,
  Wrench,
  Clock,
  ArrowRight,
  ShieldCheck,
  Disc,
  Play,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface ProductionModuleProps {
  workOrders: WorkOrder[];
  cylinders: Cylinder[];
  machineShifts: MachineShift[];
  productionRuns: ProductionRun[];
  qcInspections: QCInspection[];
  materialIssues: MaterialIssue[];
  items: Item[];
  salesOrderItems: SalesOrderItem[];
  customers: Customer[];
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  workOrders,
  cylinders,
  machineShifts,
  productionRuns,
  qcInspections,
  materialIssues,
  items,
  salesOrderItems,
  customers,
}) => {
  const [activeTab, setActiveTab] = useState<'work_orders' | 'runs' | 'cylinders' | 'shifts'>(
    'work_orders'
  );

  // Selected Work Order for detail view / actions
  const [selectedWoId, setSelectedWoId] = useState<number | null>(workOrders[0]?.id || null);

  // Artwork Approval Modal
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const [artworkWoId, setArtworkWoId] = useState<number>(workOrders[0]?.id || 1);
  const [artworkApprovedBy, setArtworkApprovedBy] = useState('');
  const [artworkDate, setArtworkDate] = useState(new Date().toISOString().split('T')[0]);
  const [artworkNotes, setArtworkNotes] = useState('');

  // Material Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueWoId, setIssueWoId] = useState<number>(workOrders[0]?.id || 1);
  const [issueItemId, setIssueItemId] = useState<number>(items[0]?.id || 1);
  const [issueQty, setIssueQty] = useState<number>(100);
  const [issueOperator, setIssueOperator] = useState('Saeed Anwar (Store Keeper)');
  const [issueRemarks, setIssueRemarks] = useState('');

  // Production Run Modal
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [runWoId, setRunWoId] = useState<number>(workOrders[0]?.id || 1);
  const [runShiftId, setRunShiftId] = useState<number>(machineShifts[0]?.id || 1);
  const [runStage, setRunStage] = useState<'printing' | 'lamination' | 'slitting'>('printing');
  const [runQtyProduced, setRunQtyProduced] = useState<number>(500);
  const [runWastage, setRunWastage] = useState<number>(15);
  const [runStartTime, setRunStartTime] = useState(new Date().toISOString().replace('T', ' ').substring(0, 16));
  const [runEndTime, setRunEndTime] = useState(new Date().toISOString().replace('T', ' ').substring(0, 16));
  const [runOperatorNotes, setRunOperatorNotes] = useState('');

  // QC Inspection Modal
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [qcRunId, setQcRunId] = useState<number>(productionRuns[0]?.id || 1);
  const [qcResult, setQcResult] = useState<'pass' | 'fail' | 'rework'>('pass');
  const [qcInspector, setQcInspector] = useState('Zeeshan Qureshi (Lead QC Chemist)');
  const [qcDefectNotes, setQcDefectNotes] = useState('');
  const [qcCoronaDyne, setQcCoronaDyne] = useState<number>(42);
  const [qcBondStrength, setQcBondStrength] = useState<number>(350);
  const [qcInkAdhesion, setQcInkAdhesion] = useState<boolean>(true);

  // Cylinder Modal
  const [isCylinderModalOpen, setIsCylinderModalOpen] = useState(false);
  const [newCylinder, setNewCylinder] = useState<{
    design_ref: string;
    customer_id: number;
    colors_count: number;
    circumference_mm: number;
    width_mm: number;
    storage_location: string;
    notes: string;
  }>({
    design_ref: '',
    customer_id: customers[0]?.id || 1,
    colors_count: 6,
    circumference_mm: 520,
    width_mm: 1050,
    storage_location: 'Rack A-01',
    notes: '',
  });

  // Machine Shift Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [newShift, setNewShift] = useState<{
    machine_name: string;
    shift_date: string;
    shift_no: string;
    operator: string;
  }>({
    machine_name: 'Rotomec 8-Color Gravure Press Line 1',
    shift_date: new Date().toISOString().split('T')[0],
    shift_no: 'Shift A (08:00 - 16:00)',
    operator: '',
  });

  const selectedWo = workOrders.find((w) => w.id === selectedWoId) || workOrders[0];
  const selectedSoItem = selectedWo
    ? salesOrderItems.find((i) => i.id === selectedWo.sales_order_item_id)
    : null;
  const selectedCylinder = selectedWo
    ? cylinders.find((c) => c.id === selectedWo.cylinder_id)
    : null;
  const woIssues = selectedWo
    ? materialIssues.filter((m) => m.work_order_id === selectedWo.id)
    : [];
  const woRuns = selectedWo
    ? productionRuns.filter((p) => p.work_order_id === selectedWo.id)
    : [];

  // Handlers
  const handleSignArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkApprovedBy) return;
    dbService.signArtworkApproval(artworkWoId, {
      approved_by: artworkApprovedBy,
      approval_date: artworkDate,
      notes: artworkNotes,
    });
    setIsArtworkModalOpen(false);
  };

  const handleIssueMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dbService.issueMaterial({
        work_order_id: issueWoId,
        item_id: issueItemId,
        qty_issued: issueQty,
        issued_by: issueOperator,
        notes: issueRemarks,
      });
      setIsIssueModalOpen(false);
      setIssueRemarks('');
    } catch (err: any) {
      alert(err.message || 'Failed to issue material');
    }
  };

  const handleStartProduction = (woId: number) => {
    try {
      dbService.startWorkOrderProduction(woId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveProductionRun = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dbService.recordProductionRun({
        work_order_id: runWoId,
        machine_shift_id: runShiftId,
        stage: runStage,
        qty_produced: runQtyProduced,
        wastage: runWastage,
        start_time: runStartTime,
        end_time: runEndTime,
        operator_notes: runOperatorNotes,
      });
      setIsRunModalOpen(false);
      setRunOperatorNotes('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveQc = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dbService.recordQCInspection({
        production_run_id: qcRunId,
        result: qcResult,
        defect_notes: qcDefectNotes,
        inspector_name: qcInspector,
        corona_treatment_dyne: qcCoronaDyne,
        bond_strength_g_15mm: qcBondStrength,
        ink_adhesion_pass: qcInkAdhesion,
      });
      setIsQcModalOpen(false);
      setQcDefectNotes('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveCylinder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCylinder.design_ref.trim()) return;
    dbService.addCylinder({
      ...newCylinder,
      status: 'available',
    });
    setIsCylinderModalOpen(false);
    setNewCylinder({
      design_ref: '',
      customer_id: customers[0]?.id || 1,
      colors_count: 6,
      circumference_mm: 520,
      width_mm: 1050,
      storage_location: 'Rack A-01',
      notes: '',
    });
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.operator.trim()) return;
    dbService.addMachineShift(newShift);
    setIsShiftModalOpen(false);
    setNewShift({
      machine_name: 'Rotomec 8-Color Gravure Press Line 1',
      shift_date: new Date().toISOString().split('T')[0],
      shift_no: 'Shift A (08:00 - 16:00)',
      operator: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Factory className="w-6 h-6 text-amber-500" />
            Rotogravure Production & Quality Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cylinder sets, work orders, material issues, machine shift runs, and QC pass/rework loops
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('work_orders')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'work_orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Work Orders ({workOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'runs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Production Runs ({productionRuns.length})
            </button>
            <button
              onClick={() => setActiveTab('cylinders')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'cylinders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cylinder Register ({cylinders.length})
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'shifts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Machine Shifts ({machineShifts.length})
            </button>
          </div>

          {activeTab === 'cylinders' && (
            <button
              onClick={() => setIsCylinderModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Cylinder Set</span>
            </button>
          )}

          {activeTab === 'shifts' && (
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Machine Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* WORK ORDERS TAB */}
      {activeTab === 'work_orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Work Orders List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>Active Job Cards ({workOrders.length})</span>
              <span>Click to view floor details</span>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {workOrders.map((wo) => {
                const soItem = salesOrderItems.find((i) => i.id === wo.sales_order_item_id);
                const isSelected = selectedWoId === wo.id;
                const issues = materialIssues.filter((m) => m.work_order_id === wo.id);

                return (
                  <div
                    key={wo.id}
                    onClick={() => setSelectedWoId(wo.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-xs text-slate-900">
                          WO-{String(wo.id).padStart(4, '0')}
                        </span>
                        <Badge status={wo.status} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        Planned: {formatDate(wo.planned_date)}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mt-2 line-clamp-2">
                      {soItem?.product_spec}
                    </h4>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Batch: <strong>{formatNumber(soItem?.quantity_kg || 0, 0)} kg</strong></span>
                      <span
                        className={`font-semibold ${
                          issues.length > 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {issues.length > 0
                          ? `✓ ${issues.length} Materials Issued`
                          : '⚠ No Material Issued'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Work Order Detailed Job Card */}
          <div className="lg:col-span-7">
            {selectedWo && selectedSoItem ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        WO-{String(selectedWo.id).padStart(4, '0')}
                      </span>
                      <Badge status={selectedWo.status} size="md" />
                      {selectedWo.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          Urgent Priority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Job Spec: <strong className="text-slate-900">{selectedSoItem.product_spec}</strong>
                    </p>
                  </div>

                  {/* Flow Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Material Issue Button */}
                    <button
                      onClick={() => {
                        setIssueWoId(selectedWo.id);
                        setIsIssueModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Issue Material</span>
                    </button>

                    {/* Start Production Button (Business Rule Enforcer) */}
                    {selectedWo.status === 'material_issued' && (
                      <button
                        onClick={() => handleStartProduction(selectedWo.id)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Production</span>
                      </button>
                    )}

                    {/* Planned warning if trying to start without materials */}
                    {selectedWo.status === 'planned' && (
                      <button
                        onClick={() => handleStartProduction(selectedWo.id)}
                        title="Enforces Business Rule: Cannot start until material issued"
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Production</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Technical Specs & Cylinder Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assigned Cylinder
                    </span>
                    <div className="font-bold text-xs text-slate-900 mt-1">
                      {selectedCylinder?.design_ref || 'None'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedCylinder?.colors_count} Color Stations • {selectedCylinder?.storage_location}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Lamination Requirement
                    </span>
                    <div className="font-bold text-xs text-slate-900 mt-1">
                      {selectedSoItem.requires_lamination ? (
                        <span className="text-indigo-700">Multi-Layer Lamination</span>
                      ) : (
                        <span className="text-slate-600">Monolayer Only (Skipped)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedSoItem.requires_lamination
                        ? 'Solventless 2K Polyurethane'
                        : 'Single layer barrier film'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Artwork Sign-Off
                    </span>
                    <div className="font-bold text-xs text-slate-900 mt-1 flex items-center gap-1.5">
                      {selectedWo.artwork_approved_date ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-800">Approved</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-amber-800">Pending Proof</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setArtworkWoId(selectedWo.id);
                        setIsArtworkModalOpen(true);
                      }}
                      className="text-[10px] text-amber-700 font-bold hover:underline mt-0.5 block"
                    >
                      {selectedWo.artwork_approved_date ? 'View / Update Proof' : 'Sign-Off Artwork'}
                    </button>
                  </div>
                </div>

                {/* Materials Issued Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-500" />
                      Materials Issued Against this Order ({woIssues.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Deducted atomically from Stock Ledger
                    </span>
                  </div>

                  {woIssues.length === 0 ? (
                    <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl text-center">
                      <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                      <p className="text-xs font-bold text-amber-900">
                        No materials issued from store yet.
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Business Rule: Work order cannot start until raw film, ink, or solvent is issued.
                      </p>
                      <button
                        onClick={() => {
                          setIssueWoId(selectedWo.id);
                          setIsIssueModalOpen(true);
                        }}
                        className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                      >
                        Issue Material Now
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Material</th>
                            <th className="px-3 py-2 text-right">Quantity</th>
                            <th className="px-3 py-2 text-right">Unit Rate</th>
                            <th className="px-3 py-2 text-right">Total Cost</th>
                            <th className="px-3 py-2">Issued By & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60">
                          {woIssues.map((issue) => {
                            const itm = items.find((i) => i.id === issue.item_id);
                            return (
                              <tr key={issue.id}>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  {itm?.name}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                                  {formatNumber(issue.qty_issued, 1)} {itm?.uom}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  {formatPKR(issue.unit_cost)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                  {formatPKR(issue.qty_issued * issue.unit_cost)}
                                </td>
                                <td className="px-3 py-2 text-[10px] text-slate-500">
                                  {issue.issued_by} • {formatDateTime(issue.issue_time)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Production Runs for this Work Order */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Production Runs by Stage ({woRuns.length})
                    </h4>
                    <button
                      onClick={() => {
                        setRunWoId(selectedWo.id);
                        // default next stage
                        if (!woRuns.some((r) => r.stage === 'printing')) {
                          setRunStage('printing');
                        } else if (
                          selectedSoItem.requires_lamination &&
                          !woRuns.some((r) => r.stage === 'lamination')
                        ) {
                          setRunStage('lamination');
                        } else {
                          setRunStage('slitting');
                        }
                        setIsRunModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Log Stage Run</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Stage Progress indicators: Printing -> [Lamination if required] -> Slitting */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            woRuns.some((r) => r.stage === 'printing')
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          1
                        </div>
                        <span className="font-semibold text-slate-800">1. Rotogravure Printing</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />

                      {selectedSoItem.requires_lamination ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                woRuns.some((r) => r.stage === 'lamination')
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              2
                            </div>
                            <span className="font-semibold text-slate-800">2. Lamination</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </>
                      ) : (
                        <>
                          <div className="text-slate-400 italic text-[11px]">
                            Lamination Skipped (Monolayer)
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </>
                      )}

                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            woRuns.some((r) => r.stage === 'slitting')
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {selectedSoItem.requires_lamination ? 3 : 2}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {selectedSoItem.requires_lamination ? '3. Slitting & Core Winding' : '2. Slitting'}
                        </span>
                      </div>
                    </div>

                    {/* Table of completed runs */}
                    {woRuns.map((run) => {
                      const shift = machineShifts.find((s) => s.id === run.machine_shift_id);
                      const qc = qcInspections.find((q) => q.production_run_id === run.id);

                      return (
                        <div
                          key={run.id}
                          className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 uppercase">
                                Stage: {run.stage}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {shift?.machine_name} ({shift?.shift_no})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1">
                              Output: <strong>{formatNumber(run.qty_produced, 1)} kg</strong> | Wastage:{' '}
                              <strong className="text-rose-600">{formatNumber(run.wastage, 1)} kg</strong> (
                              {Math.round((run.wastage / (run.qty_produced + run.wastage)) * 100)}%)
                            </div>
                            {run.operator_notes && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">
                                "{run.operator_notes}"
                              </p>
                            )}
                          </div>

                          <div className="text-right flex items-center gap-3">
                            {qc ? (
                              <div>
                                <Badge status={qc.result} />
                                <div className="text-[9px] text-slate-400 mt-0.5">
                                  QC by {qc.inspector_name.split(' ')[0]}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setQcRunId(run.id);
                                  setIsQcModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded text-xs transition-colors flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Inspect QC</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                Select a work order on the left to view floor job specs
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTION RUNS TAB */}
      {activeTab === 'runs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Run #</th>
                  <th className="px-4 py-3">Work Order & Job Spec</th>
                  <th className="px-4 py-3">Machine & Shift</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Good Output (kg)</th>
                  <th className="px-4 py-3 text-right">Wastage (kg)</th>
                  <th className="px-4 py-3">Run Window</th>
                  <th className="px-4 py-3 text-center">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionRuns.map((run) => {
                  const wo = workOrders.find((w) => w.id === run.work_order_id);
                  const soItem = wo ? salesOrderItems.find((i) => i.id === wo.sales_order_item_id) : null;
                  const shift = machineShifts.find((s) => s.id === run.machine_shift_id);
                  const qc = qcInspections.find((q) => q.production_run_id === run.id);

                  return (
                    <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        RUN-{String(run.id).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          WO-{String(run.work_order_id).padStart(4, '0')}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">{soItem?.product_spec}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{shift?.machine_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {shift?.shift_no} • {shift?.operator}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                          {run.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatNumber(run.qty_produced, 1)} kg
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">
                        {formatNumber(run.wastage, 1)} kg
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 whitespace-nowrap">
                        {run.start_time} - {run.end_time}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {qc ? (
                          <Badge status={qc.result} />
                        ) : (
                          <button
                            onClick={() => {
                              setQcRunId(run.id);
                              setIsQcModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px]"
                          >
                            Perform QC
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CYLINDERS TAB */}
      {activeTab === 'cylinders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cylinders.map((cyl) => {
            const customer = customers.find((c) => c.id === cyl.customer_id);
            return (
              <div
                key={cyl.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        <Disc className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          CYL-{String(cyl.id).padStart(2, '0')}: {cyl.design_ref}
                        </h4>
                        <span className="text-[10px] text-slate-500">{customer?.name}</span>
                      </div>
                    </div>
                    <Badge status={cyl.status} />
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Color Stations:</span>{' '}
                      <strong className="text-slate-800">{cyl.colors_count} Colors</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Dimensions:</span>{' '}
                      <span className="font-mono text-slate-700">
                        Circumference {cyl.circumference_mm}mm × Width {cyl.width_mm}mm
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Factory Location:</span>{' '}
                      <span className="font-semibold text-slate-800">{cyl.storage_location}</span>
                    </div>
                    {cyl.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 p-2 rounded">
                        {cyl.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Durable Gravure Asset</span>
                  <select
                    value={cyl.status}
                    onChange={(e) => dbService.updateCylinder(cyl.id, { status: e.target.value as any })}
                    className="text-[10px] font-bold px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use on Press</option>
                    <option value="at_engraver">At Engraver (Re-chroming)</option>
                    <option value="damaged">Damaged</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MACHINE SHIFTS TAB */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Shift ID</th>
                  <th className="px-4 py-3">Machine Name</th>
                  <th className="px-4 py-3">Shift Date</th>
                  <th className="px-4 py-3">Shift Timing</th>
                  <th className="px-4 py-3">Machine Operator</th>
                  <th className="px-4 py-3 text-center">Runs Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {machineShifts.map((shift) => {
                  const runs = productionRuns.filter((r) => r.machine_shift_id === shift.id);
                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                        SHF-{String(shift.id).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{shift.machine_name}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(shift.shift_date)}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">{shift.shift_no}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{shift.operator}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{runs.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ARTWORK APPROVAL MODAL */}
      <Modal
        isOpen={isArtworkModalOpen}
        onClose={() => setIsArtworkModalOpen(false)}
        title="Artwork Proof & Cylinder Sign-Off"
        subtitle="Log pre-press approval from brand manager and QA prior to production"
      >
        <form onSubmit={handleSignArtwork} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Approved By (Client/QA) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Shan Foods Quality Team (Ms. Ayesha) & Lead Chemist"
              value={artworkApprovedBy}
              onChange={(e) => setArtworkApprovedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sign-Off Date</label>
            <input
              type="date"
              value={artworkDate}
              onChange={(e) => setArtworkDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Proofing & Registration Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Master color swatch approved. Barcode grade checked on Epson proof printer."
              value={artworkNotes}
              onChange={(e) => setArtworkNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsArtworkModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
            >
              Confirm Artwork Sign-Off
            </button>
          </div>
        </form>
      </Modal>

      {/* MATERIAL ISSUE MODAL */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Material from Store to Work Order"
        subtitle="Checks available stock on-hand and atomically creates stock ledger deduction"
      >
        <form onSubmit={handleIssueMaterial} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Raw Material *</label>
            <select
              value={issueItemId}
              onChange={(e) => setIssueItemId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — Current Stock: {formatNumber(i.current_stock, 1)} {i.uom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Quantity *</label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={issueQty}
                onChange={(e) => setIssueQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Controller</label>
              <input
                type="text"
                value={issueOperator}
                onChange={(e) => setIssueOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Floor Purpose / Notes</label>
            <input
              type="text"
              placeholder="e.g. Primary printing film reels or solvent dilution blend"
              value={issueRemarks}
              onChange={(e) => setIssueRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Post Material Issue
            </button>
          </div>
        </form>
      </Modal>

      {/* PRODUCTION RUN MODAL */}
      <Modal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        title="Record Production Stage Run"
        subtitle="Log machine output, operator shift, and process wastage for rotogravure conversion"
      >
        <form onSubmit={handleSaveProductionRun} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Production Stage *</label>
              <select
                value={runStage}
                onChange={(e) => setRunStage(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="printing">1. Rotogravure Printing</option>
                <option value="lamination">2. Solventless Lamination (if ordered)</option>
                <option value="slitting">3. Slitting & Core Rewinding</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Machine & Shift Log *</label>
              <select
                value={runShiftId}
                onChange={(e) => setRunShiftId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {machineShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.machine_name} — {s.shift_no} ({s.operator})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Produced (kg) *</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={runQtyProduced}
                onChange={(e) => setRunQtyProduced(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Wastage / Trim Loss (kg) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={runWastage}
                onChange={(e) => setRunWastage(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-rose-700 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pressman Notes</label>
            <input
              type="text"
              placeholder="e.g. Line speed 210 m/min, web tension steady, viscosity maintained at 15s Zahn 2"
              value={runOperatorNotes}
              onChange={(e) => setRunOperatorNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRunModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
            >
              Save Production Run
            </button>
          </div>
        </form>
      </Modal>

      {/* QC INSPECTION MODAL */}
      <Modal
        isOpen={isQcModalOpen}
        onClose={() => setIsQcModalOpen(false)}
        title="Quality Control (QC) Inspection"
        subtitle="Validate registration, corona treatment, ink adhesion, and bond strength"
      >
        <form onSubmit={handleSaveQc} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">QC Decision *</label>
              <select
                value={qcResult}
                onChange={(e) => setQcResult(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="pass">PASS — Meets All ISO & Customer Specs</option>
                <option value="rework">REWORK — Trigger Correction Loop Back to Press</option>
                <option value="fail">FAIL — Scrap Run</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspector Chemist</label>
              <input
                type="text"
                value={qcInspector}
                onChange={(e) => setQcInspector(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corona Dyne Level (dynes/cm)</label>
              <input
                type="number"
                value={qcCoronaDyne}
                onChange={(e) => setQcCoronaDyne(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bond Strength (g/15mm)</label>
              <input
                type="number"
                value={qcBondStrength}
                onChange={(e) => setQcBondStrength(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">QC Observations & Defect Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Registration check +/- 0.1mm pass. No ink flaking on scotch tape adhesion test."
              value={qcDefectNotes}
              onChange={(e) => setQcDefectNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsQcModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Sign QC Record
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE CYLINDER MODAL */}
      <Modal
        isOpen={isCylinderModalOpen}
        onClose={() => setIsCylinderModalOpen(false)}
        title="Add Cylinder to Register"
        subtitle="Durable engraved gravure cylinder set reusable across repeat customer orders"
      >
        <form onSubmit={handleSaveCylinder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Design Reference / Brand Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mitchell's Lemon Squash Sachet 30g"
              value={newCylinder.design_ref}
              onChange={(e) => setNewCylinder({ ...newCylinder, design_ref: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
              <select
                value={newCylinder.customer_id}
                onChange={(e) => setNewCylinder({ ...newCylinder, customer_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Colors</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newCylinder.colors_count}
                onChange={(e) => setNewCylinder({ ...newCylinder, colors_count: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Circumference (mm)</label>
              <input
                type="number"
                value={newCylinder.circumference_mm}
                onChange={(e) => setNewCylinder({ ...newCylinder, circumference_mm: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Storage Location</label>
              <input
                type="text"
                placeholder="e.g. Rack B-04"
                value={newCylinder.storage_location}
                onChange={(e) => setNewCylinder({ ...newCylinder, storage_location: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCylinderModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Save Cylinder Set
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE SHIFT MODAL */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title="Log Machine Shift"
        subtitle="Log machine and operator details to enable multi-shift reporting"
      >
        <form onSubmit={handleSaveShift} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Machine Name *</label>
            <select
              value={newShift.machine_name}
              onChange={(e) => setNewShift({ ...newShift, machine_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="Rotomec 8-Color Gravure Press Line 1">Rotomec 8-Color Gravure Press Line 1</option>
              <option value="Nordmeccanica Solventless Laminator">Nordmeccanica Solventless Laminator</option>
              <option value="Titan SR800 Dual Turret Slitter">Titan SR800 Dual Turret Slitter</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Date</label>
              <input
                type="date"
                value={newShift.shift_date}
                onChange={(e) => setNewShift({ ...newShift, shift_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Hours</label>
              <select
                value={newShift.shift_no}
                onChange={(e) => setNewShift({ ...newShift, shift_no: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Shift A (08:00 - 16:00)">Shift A (08:00 - 16:00)</option>
                <option value="Shift B (16:00 - 00:00)">Shift B (16:00 - 00:00)</option>
                <option value="Shift C (00:00 - 08:00)">Shift C (00:00 - 08:00)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Operator Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Akram (Sr. Pressman)"
              value={newShift.operator}
              onChange={(e) => setNewShift({ ...newShift, operator: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Record Shift Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
