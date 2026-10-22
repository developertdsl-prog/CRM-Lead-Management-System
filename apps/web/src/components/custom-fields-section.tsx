'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  CheckSquare,
  Hash,
  Type,
  List,
  Layers,
  Save,
  Loader2,
  Settings,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export type CustomFieldType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'SELECT' | 'MULTI_SELECT';
export type EntityType = 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL';

export interface CustomFieldDefinition {
  id: string;
  entityType: EntityType;
  fieldName: string;
  fieldLabel: string;
  fieldType: CustomFieldType;
  isRequired: boolean;
  options?: string[] | null;
  defaultValue?: string | null;
}

interface CustomFieldsSectionProps {
  entityType: EntityType;
  entityId?: string;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  allowManageDefinitions?: boolean;
  readOnly?: boolean;
  title?: string;
}

export function CustomFieldsSection({
  entityType,
  entityId,
  values: externalValues,
  onChange,
  allowManageDefinitions = true,
  readOnly = false,
  title = 'Custom Fields & Dynamic Metadata',
}: CustomFieldsSectionProps) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [internalValues, setInternalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDefModal, setShowAddDefModal] = useState(false);
  const [creatingDef, setCreatingDef] = useState(false);

  // New definition form
  const [newDef, setNewDef] = useState({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'TEXT' as CustomFieldType,
    isRequired: false,
    optionsStr: '',
    defaultValue: '',
  });

  const activeValues = externalValues !== undefined ? externalValues : internalValues;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const defs = await apiRequest<CustomFieldDefinition[]>(
        `/custom-fields/definitions?entityType=${entityType}`
      );
      setDefinitions(defs);

      if (entityId && externalValues === undefined) {
        const valMap = await apiRequest<Record<string, any>>(
          `/custom-fields/values/${entityType}/${entityId}`
        );
        setInternalValues(valMap || {});
      }
    } catch {
      // definitions might be empty
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, externalValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFieldChange = (fieldName: string, val: any) => {
    const updated = { ...activeValues, [fieldName]: val };
    if (externalValues === undefined) {
      setInternalValues(updated);
    }
    onChange?.(updated);
  };

  const handleSaveValues = async () => {
    if (!entityId) return;
    setSaving(true);
    try {
      await apiRequest(`/custom-fields/values/${entityType}/${entityId}`, {
        method: 'POST',
        body: JSON.stringify({ fields: activeValues }),
      });
      toast.success('Custom fields saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save custom fields');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDef.fieldName || !newDef.fieldLabel) {
      toast.error('Field key and label are required');
      return;
    }
    setCreatingDef(true);
    try {
      const options =
        newDef.fieldType === 'SELECT' || newDef.fieldType === 'MULTI_SELECT'
          ? newDef.optionsStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      await apiRequest('/custom-fields/definitions', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          fieldName: newDef.fieldName.trim(),
          fieldLabel: newDef.fieldLabel.trim(),
          fieldType: newDef.fieldType,
          isRequired: newDef.isRequired,
          options,
          defaultValue: newDef.defaultValue || undefined,
        }),
      });

      toast.success(`Custom field "${newDef.fieldLabel}" defined!`);
      setShowAddDefModal(false);
      setNewDef({
        fieldName: '',
        fieldLabel: '',
        fieldType: 'TEXT',
        isRequired: false,
        optionsStr: '',
        defaultValue: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create definition');
    } finally {
      setCreatingDef(false);
    }
  };

  const handleDeleteDefinition = async (defId: string, label: string) => {
    if (!confirm(`Delete custom field definition "${label}"? This will delete all stored values.`)) {
      return;
    }
    try {
      await apiRequest(`/custom-fields/definitions/${defId}`, {
        method: 'DELETE',
      });
      toast.success(`Custom field "${label}" removed`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete definition');
    }
  };

  const getTypeIcon = (type: CustomFieldType) => {
    switch (type) {
      case 'TEXT':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'NUMBER':
        return <Hash className="w-3.5 h-3.5 text-emerald-400" />;
      case 'BOOLEAN':
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'DATE':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'SELECT':
        return <List className="w-3.5 h-3.5 text-purple-400" />;
      case 'MULTI_SELECT':
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        Loading custom fields engine...
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
            {title}
          </h4>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {definitions.length} {definitions.length === 1 ? 'Field' : 'Fields'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {allowManageDefinitions && (
            <button
              type="button"
              onClick={() => setShowAddDefModal(true)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3 text-indigo-400" />
              Add Field
            </button>
          )}

          {entityId && !readOnly && definitions.length > 0 && (
            <button
              type="button"
              onClick={handleSaveValues}
              disabled={saving}
              className="px-3 py-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
        </div>
      </div>

      {/* Fields List */}
      {definitions.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-lg bg-slate-950/40 border border-dashed border-slate-800/80">
          <p className="text-xs text-slate-400 mb-2">
            No dynamic custom fields configured for this {entityType.toLowerCase()}.
          </p>
          {allowManageDefinitions && (
            <button
              type="button"
              onClick={() => setShowAddDefModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Define New Field
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {definitions.map((def) => {
            const val = activeValues[def.fieldName];

            return (
              <div
                key={def.id}
                className="group relative p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 truncate">
                    {getTypeIcon(def.fieldType)}
                    <span className="truncate">{def.fieldLabel}</span>
                    {def.isRequired && <span className="text-rose-400">*</span>}
                  </label>

                  {allowManageDefinitions && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDefinition(def.id, def.fieldLabel)}
                      title="Delete field definition"
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Input Controls */}
                {def.fieldType === 'TEXT' && (
                  <input
                    type="text"
                    disabled={readOnly}
                    value={val !== undefined && val !== null ? String(val) : ''}
                    onChange={(e) => handleFieldChange(def.fieldName, e.target.value)}
                    placeholder={def.defaultValue || `Enter ${def.fieldLabel}...`}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                )}

                {def.fieldType === 'NUMBER' && (
                  <input
                    type="number"
                    disabled={readOnly}
                    value={val !== undefined && val !== null ? String(val) : ''}
                    onChange={(e) =>
                      handleFieldChange(
                        def.fieldName,
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    placeholder={def.defaultValue || '0.00'}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                )}

                {def.fieldType === 'BOOLEAN' && (
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={Boolean(val)}
                      onChange={(e) => handleFieldChange(def.fieldName, e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-400 select-none">
                      {Boolean(val) ? 'True / Yes' : 'False / No'}
                    </span>
                  </label>
                )}

                {def.fieldType === 'DATE' && (
                  <input
                    type="date"
                    disabled={readOnly}
                    value={
                      val
                        ? new Date(val).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleFieldChange(def.fieldName, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                )}

                {def.fieldType === 'SELECT' && (
                  <select
                    disabled={readOnly}
                    value={val !== undefined && val !== null ? String(val) : ''}
                    onChange={(e) => handleFieldChange(def.fieldName, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  >
                    <option value="">Select option...</option>
                    {Array.isArray(def.options) &&
                      def.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                )}

                {def.fieldType === 'MULTI_SELECT' && (
                  <div className="space-y-1 mt-1">
                    {Array.isArray(def.options) &&
                      def.options.map((opt) => {
                        const currentArr = Array.isArray(val) ? val : [];
                        const isChecked = currentArr.includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              disabled={readOnly}
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...currentArr, opt]
                                  : currentArr.filter((item: string) => item !== opt);
                                handleFieldChange(def.fieldName, next);
                              }}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Definition Modal */}
      {showAddDefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Add Dynamic Field ({entityType})
                </h3>
              </div>
              <button
                onClick={() => setShowAddDefModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDefinition} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Field Key (alphanumeric identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. linkedin_url, contract_tier"
                  value={newDef.fieldName}
                  onChange={(e) =>
                    setNewDef({ ...newDef, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Field Label (display title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LinkedIn Profile URL"
                  value={newDef.fieldLabel}
                  onChange={(e) => setNewDef({ ...newDef, fieldLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Field Type *
                  </label>
                  <select
                    value={newDef.fieldType}
                    onChange={(e) =>
                      setNewDef({ ...newDef, fieldType: e.target.value as CustomFieldType })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="BOOLEAN">Boolean (Yes/No)</option>
                    <option value="DATE">Date</option>
                    <option value="SELECT">Single Select</option>
                    <option value="MULTI_SELECT">Multi Select</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDef.isRequired}
                      onChange={(e) => setNewDef({ ...newDef, isRequired: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300">Required field</span>
                  </label>
                </div>
              </div>

              {(newDef.fieldType === 'SELECT' || newDef.fieldType === 'MULTI_SELECT') && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise, Mid-Market, SMB"
                    value={newDef.optionsStr}
                    onChange={(e) => setNewDef({ ...newDef, optionsStr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Value (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. N/A"
                  value={newDef.defaultValue}
                  onChange={(e) => setNewDef({ ...newDef, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDefModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDef}
                  className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1 shadow-sm"
                >
                  {creatingDef && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
