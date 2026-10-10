// src/components/layout/RoleSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/erp.ts';
import { ChevronDown, Shield, Users, Factory, Warehouse, Calculator } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, setRole, availableUsers } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'sales':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'production':
        return <Factory className="w-4 h-4 text-amber-600" />;
      case 'store':
        return <Warehouse className="w-4 h-4 text-emerald-600" />;
      case 'accounts':
        return <Calculator className="w-4 h-4 text-rose-600" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sales':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'store':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'accounts':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all text-xs font-medium shadow-xs"
      >
        <div className="flex items-center gap-1.5">
          {getRoleIcon(currentUser.role)}
          <span className="font-semibold text-slate-900">{currentUser.name.split(' ')[0]}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeClass(currentUser.role)}`}>
          {currentUser.role}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Switch Factory Persona
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate role-specific permissions & workflows
            </p>
          </div>
          <div className="space-y-1">
            {availableUsers.map((user) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setRole(user.role);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-slate-100/90 text-slate-900 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {getRoleIcon(user.role)}
                    <div>
                      <div className="text-xs font-semibold">{user.name}</div>
                      <div className="text-[10px] text-slate-400">{user.department}</div>
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
