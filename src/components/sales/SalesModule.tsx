// src/components/sales/SalesModule.tsx
import React, { useState } from 'react';
import { Customer, SalesOrder, SalesOrderItem, Cylinder } from '../../types/erp.ts';
import { dbService } from '../../services/db.ts';
import { formatPKR, formatDate, formatNumber } from '../../utils/formatters.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  Users,
  Plus,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  ArrowRight,
  PackageCheck,
  Building2,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface SalesModuleProps {
  customers: Customer[];
  salesOrders: SalesOrder[];
  salesOrderItems: SalesOrderItem[];
  cylinders: Cylinder[];
  onOpenWorkOrderTab: () => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  customers,
  salesOrders,
  salesOrderItems,
  cylinders,
  onOpenWorkOrderTab,
}) => {
  const [subTab, setSubTab] = useState<'orders' | 'customers'>('orders');

  // Customer Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: '',
    tax_number: '',
    credit_terms: '30 Days Net',
  });

  // Sales Order Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customers[0]?.id || 1);
  const [poRef, setPoRef] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [lineItems, setLineItems] = useState<
    Array<{
      product_spec: string;
      quantity_kg: number;
      unit_rate: number;
      requires_lamination: boolean;
      cylinder_code: string;
    }>
  >([
    {
      product_spec: '',
      quantity_kg: 1000,
      unit_rate: 950,
      requires_lamination: true,
      cylinder_code: '',
    },
  ]);

  // Work Order Generation Modal
  const [isWoGenerateModalOpen, setIsWoGenerateModalOpen] = useState(false);
  const [selectedItemForWo, setSelectedItemForWo] = useState<SalesOrderItem | null>(null);
  const [assignedCylinderId, setAssignedCylinderId] = useState<number>(cylinders[0]?.id || 1);
  const [woPlannedDate, setWoPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [woPriority, setWoPriority] = useState<'normal' | 'urgent' | 'high'>('normal');
  const [woNotes, setWoNotes] = useState('');

  // Handle Customer Creation
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    dbService.addCustomer(newCustomer);
    setIsCustomerModalOpen(false);
    setNewCustomer({
      name: '',
      contact_person: '',
      phone: '',
      address: '',
      tax_number: '',
      credit_terms: '30 Days Net',
    });
  };

  // Handle Order Creation
  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        product_spec: '',
        quantity_kg: 500,
        unit_rate: 900,
        requires_lamination: true,
        cylinder_code: '',
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.some((item) => !item.product_spec.trim() || item.quantity_kg <= 0)) {
      alert('Please fill out valid product specification and quantity for all line items.');
      return;
    }

    dbService.createSalesOrder(
      {
        customer_id: selectedCustomerId,
        order_date: orderDate,
        po_reference: poRef,
        delivery_deadline: deliveryDeadline,
        notes: orderNotes,
      },
      lineItems
    );

    setIsOrderModalOpen(false);
    // Reset
    setPoRef('');
    setLineItems([
      {
        product_spec: '',
        quantity_kg: 1000,
        unit_rate: 950,
        requires_lamination: true,
        cylinder_code: '',
      },
    ]);
  };

  const handleConfirmOrder = (orderId: number) => {
    dbService.updateSalesOrderStatus(orderId, 'confirmed');
  };

  const handleOpenWoModal = (item: SalesOrderItem) => {
    setSelectedItemForWo(item);
    // Select first matching cylinder or available cylinder
    const availableCyl = cylinders.find((c) => c.status === 'available') || cylinders[0];
    if (availableCyl) setAssignedCylinderId(availableCyl.id);
    setIsWoGenerateModalOpen(true);
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForWo) return;

    dbService.createWorkOrder({
      sales_order_item_id: selectedItemForWo.id,
      cylinder_id: assignedCylinderId,
      planned_date: woPlannedDate,
      priority: woPriority,
      notes: woNotes,
    });

    setIsWoGenerateModalOpen(false);
    onOpenWorkOrderTab();
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Sales & Order Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer accounts, commercial contracts, specifications, and work order generation
          </p>
        </div>

        {/* Sub-tab navigation & action */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setSubTab('orders')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Orders ({salesOrders.length})
            </button>
            <button
              onClick={() => setSubTab('customers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'customers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Master ({customers.length})
            </button>
          </div>

          {subTab === 'orders' ? (
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Sales Order</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* SALES ORDERS SUB-TAB */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">PO Reference</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Deadline</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Line Items & Specs</th>
                    <th className="px-4 py-3 text-right">Order Value</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesOrders.map((so) => {
                    const customer = customers.find((c) => c.id === so.customer_id);
                    const items = salesOrderItems.filter((i) => i.sales_order_id === so.id);
                    const orderTotal = items.reduce(
                      (acc, i) => acc + i.quantity_kg * i.unit_rate,
                      0
                    );

                    return (
                      <tr key={so.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          SO-{String(so.id).padStart(4, '0')}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{customer?.name}</div>
                          <div className="text-[11px] text-slate-400">{customer?.credit_terms}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                          {so.po_reference || '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(so.order_date)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-amber-700 font-medium">
                          {formatDate(so.delivery_deadline)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge status={so.status} />
                        </td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <div className="space-y-1.5">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="p-2 bg-slate-50 border border-slate-200/70 rounded-md flex items-center justify-between gap-2"
                              >
                                <div className="truncate">
                                  <div className="font-medium text-slate-900 truncate text-[11px]">
                                    {item.product_spec}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {formatNumber(item.quantity_kg, 0)} kg @ {formatPKR(item.unit_rate)}/kg
                                    {item.requires_lamination ? (
                                      <span className="ml-1 text-indigo-600 font-semibold">• Lamination</span>
                                    ) : (
                                      <span className="ml-1 text-slate-400">• Monolayer</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleOpenWoModal(item)}
                                  title="Generate Work Order for Production"
                                  className="shrink-0 flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px] shadow-2xs transition-colors"
                                >
                                  <span>Make WO</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatPKR(orderTotal)}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {so.status === 'draft' && (
                            <button
                              onClick={() => handleConfirmOrder(so.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] shadow-2xs transition-colors"
                            >
                              Confirm Order
                            </button>
                          )}
                          {so.status !== 'draft' && (
                            <span className="text-[11px] text-slate-400 font-medium">Locked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS SUB-TAB */}
      {subTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const customerOrders = salesOrders.filter((o) => o.customer_id === c.id);
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{c.tax_number}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.credit_terms}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Contact:</span>{' '}
                      <span className="font-semibold text-slate-800">{c.contact_person}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Phone:</span>{' '}
                      <span className="font-mono text-slate-700">{c.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Plant Address:</span>{' '}
                      <p className="text-slate-600 line-clamp-2 mt-0.5">{c.address}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Active Contracts: <strong className="text-slate-800">{customerOrders.length}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    Verified Taxpayer
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add Customer Profile"
        subtitle="Register client entity with tax credentials and credit terms for commercial printing contracts"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Shan Foods (Pvt) Ltd"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person & Title</label>
              <input
                type="text"
                placeholder="e.g. Tariq Mehmood (Procurement)"
                value={newCustomer.contact_person}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact_person: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +92 21 3505 3111"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tax Number (NTN / STRN)</label>
              <input
                type="text"
                placeholder="e.g. NTN: 0819204-7 / STRN: 12-00-9999-011-82"
                value={newCustomer.tax_number}
                onChange={(e) => setNewCustomer({ ...newCustomer, tax_number: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Credit Terms</label>
              <select
                value={newCustomer.credit_terms}
                onChange={(e) => setNewCustomer({ ...newCustomer, credit_terms: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="30 Days Net">30 Days Net</option>
                <option value="45 Days Net">45 Days Net</option>
                <option value="60 Days Net">60 Days Net</option>
                <option value="Advance 50%, Balance on Dispatch">Advance 50%, Balance on Dispatch</option>
                <option value="100% Advance Payment">100% Advance Payment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Delivery & Factory Address</label>
            <textarea
              rows={2}
              placeholder="e.g. Plot 29, Sector 23, Korangi Industrial Area, Karachi"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE SALES ORDER MODAL */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Intake New Sales Order"
        subtitle="Generate commercial make-to-order contract with multiple technical rotogravure line items"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.credit_terms})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer PO Number</label>
              <input
                type="text"
                placeholder="e.g. SF-PO-9950"
                value={poRef}
                onChange={(e) => setPoRef(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Deadline</label>
              <input
                type="date"
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Packaging Instructions</label>
              <input
                type="text"
                placeholder="e.g. Export palletizing with stretch film and core plugs"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Order Line Items (Substrates & Film Specs)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Specify micron structure (e.g. 20u BOPP / 12u Met PET / 35u Poly), batch kg, and rate
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Item #{idx + 1}</span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Product Specification *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shan Korma 50g — 20u BOPP / 12u Met PET / 35u PE"
                        value={item.product_spec}
                        onChange={(e) => handleUpdateLineItem(idx, 'product_spec', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Quantity (kg) *
                      </label>
                      <input
                        type="number"
                        min="10"
                        required
                        value={item.quantity_kg}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, 'quantity_kg', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Unit Rate (PKR/kg) *
                      </label>
                      <input
                        type="number"
                        min="100"
                        required
                        value={item.unit_rate}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, 'unit_rate', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={item.requires_lamination}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, 'requires_lamination', e.target.checked)
                        }
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                      />
                      <span className="font-medium text-[11px]">
                        Requires Lamination (Multi-layer structure: Solventless / Dry Lam)
                      </span>
                    </label>
                    <div className="text-right text-xs font-bold text-slate-800">
                      Subtotal: {formatPKR(item.quantity_kg * item.unit_rate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Order Summary */}
            <div className="pt-2 flex justify-end items-center gap-4 text-xs font-bold text-slate-900">
              <span>Total Batch Quantity: {formatNumber(lineItems.reduce((acc, i) => acc + i.quantity_kg, 0), 0)} kg</span>
              <span className="text-amber-700 text-sm">
                Total Value: {formatPKR(lineItems.reduce((acc, i) => acc + i.quantity_kg * i.unit_rate, 0))}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
            >
              Save Sales Order
            </button>
          </div>
        </form>
      </Modal>

      {/* GENERATE WORK ORDER MODAL */}
      <Modal
        isOpen={isWoGenerateModalOpen}
        onClose={() => setIsWoGenerateModalOpen(false)}
        title="Generate Work Order for Floor Production"
        subtitle="Assign cylinder set and schedule job on the rotogravure line"
      >
        {selectedItemForWo && (
          <form onSubmit={handleCreateWorkOrder} className="space-y-4">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1">
              <div className="font-bold text-amber-950">{selectedItemForWo.product_spec}</div>
              <div className="text-amber-800 flex items-center gap-4">
                <span>Batch Target: <strong>{formatNumber(selectedItemForWo.quantity_kg, 0)} kg</strong></span>
                <span>
                  Lamination:{' '}
                  <strong>{selectedItemForWo.requires_lamination ? 'Required' : 'Skipped (Monolayer)'}</strong>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Cylinder Set from Register *
              </label>
              <select
                value={assignedCylinderId}
                onChange={(e) => setAssignedCylinderId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {cylinders.map((cyl) => (
                  <option key={cyl.id} value={cyl.id}>
                    CYL-{String(cyl.id).padStart(2, '0')}: {cyl.design_ref} ({cyl.colors_count} Colors, Status: {cyl.status})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Cylinders are durable assets reused across repeat production runs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Planned Production Date</label>
                <input
                  type="date"
                  value={woPlannedDate}
                  onChange={(e) => setWoPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Production Priority</label>
                <select
                  value={woPriority}
                  onChange={(e) => setWoPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent Schedule</option>
                  <option value="high">High Emergency (Retail Stockout)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Production Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Slitting tolerance +/- 1mm. Corona treat BOPP substrate immediately prior to ink station 1."
                value={woNotes}
                onChange={(e) => setWoNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWoGenerateModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
              >
                Create Work Order
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
