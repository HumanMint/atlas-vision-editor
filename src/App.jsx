import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  AlertCircle,
  Copy,
  ChevronRight,
  ChevronDown,
  Camera,
  Layers,
  FolderOpen,
  X,
  Circle,
  Zap,
  SortAsc,
  GripVertical,
  Globe,
  Info
} from 'lucide-react';

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COMMON_SQUEEZES = ['1.25', '1.3', '1.33', '1.5', '1.6', '1.65', '1.66', '1.8', '2.0'];

const INITIAL_MODE = {
  id: '', 
  Mode: 'New Mode',
  Width: '0.00',
  Height: '0.00',
  Resolution: '0 x 0',
  NativeAnamorphic: 'False',
  SupportedSqueezes: ''
};

// --- Sub-components ---

const SimpleTooltip = ({ text, children }) => {
  return (
    <div className="group/tooltip relative flex items-center">
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-[10px] rounded shadow-xl whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 border border-zinc-700">
        {text}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-800"></div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, icon: Icon, label, description, primary = false, disabled = false, component = 'button', ...props }) => {
  const baseClass = `flex items-center gap-2 px-4 py-2 rounded transition-all text-sm font-bold uppercase tracking-widest shadow-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
  const styleClass = primary 
    ? 'bg-atlas-gold text-zinc-950 hover:bg-atlas-gold/90 ring-2 ring-atlas-gold/20 ring-offset-2 ring-offset-zinc-950' 
    : 'bg-zinc-900 border border-zinc-800 hover:border-atlas-gold/50 hover:text-atlas-gold text-zinc-300';

  const content = (
    <>
      <Icon size={16} />
      <span>{label}</span>
    </>
  );

  return (
    <SimpleTooltip text={description}>
      {component === 'label' ? (
        <label className={`${baseClass} ${styleClass}`} {...props}>
          {content}
          {props.children}
        </label>
      ) : (
        <button onClick={onClick} disabled={disabled} className={`${baseClass} ${styleClass}`} {...props}>
          {content}
        </button>
      )}
    </SimpleTooltip>
  );
};

const SqueezeSelector = ({ value, onChange }) => {
  const [customValue, setCustomValue] = useState('');
  const currentSqueezes = value ? value.split(';').filter(s => s.trim() !== '') : [];

  const toggleSqueeze = (val) => {
    let newSqueezes;
    if (currentSqueezes.includes(val)) {
      newSqueezes = currentSqueezes.filter(s => s !== val);
    } else {
      newSqueezes = [...currentSqueezes, val].sort((a, b) => parseFloat(a) - parseFloat(b));
    }
    onChange(newSqueezes.join(';'));
  };

  const addCustom = (e) => {
    if (e.key === 'Enter' && customValue) {
      e.preventDefault();
      if (!currentSqueezes.includes(customValue)) {
        toggleSqueeze(customValue);
      }
      setCustomValue('');
    }
  };

  return (
    <div className="flex flex-wrap gap-1 items-center min-w-[140px] md:min-w-[180px]">
      {currentSqueezes.map(s => (
        <button 
          key={s}
          onClick={() => toggleSqueeze(s)}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-atlas-gold/20 border border-atlas-gold/30 text-atlas-gold rounded text-[10px] hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-all"
        >
          {s}x <X size={8} />
        </button>
      ))}
      
      <div className="relative group/add">
        <button className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors" title="Add Squeeze Ratio">
          <Plus size={12} />
        </button>
        <div className="absolute right-0 top-full mt-1 hidden group-focus-within/add:block group-hover/add:block z-[100] bg-zinc-900 border border-zinc-700 p-2 rounded shadow-2xl min-w-[180px]">
          <div className="grid grid-cols-3 gap-1 mb-2">
            {COMMON_SQUEEZES.map(s => (
              <button 
                key={s}
                onClick={() => toggleSqueeze(s)}
                className={`px-1 py-1 rounded text-[10px] border transition-colors ${currentSqueezes.includes(s) ? 'bg-atlas-gold border-atlas-gold text-zinc-950' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
              >
                {s}x
              </button>
            ))}
          </div>
          <input 
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={addCustom}
            placeholder="Custom (Enter)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] outline-none focus:border-atlas-gold"
          />
        </div>
      </div>
    </div>
  );
};

const SortableRow = ({ mode, bIdx, mIdx, modeIdx, updateMode, updateResolution, duplicateMode, removeMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: mode.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative'
  };

  const resParts = (mode.Resolution || '0 x 0').split('x').map(p => p.trim());

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`group/row transition-colors flex flex-col md:table-row w-full border-b border-zinc-800/50 md:border-b-0 mb-4 md:mb-0 pb-4 md:pb-0 ${isDragging ? 'bg-atlas-gold/10 shadow-2xl ring-1 ring-atlas-gold/20' : 'hover:bg-atlas-gold/5'}`}
    >
      {/* Mobile Grip & Actions Header */}
      <td className="p-2 md:pl-4 md:w-8 flex items-center justify-between md:table-cell bg-zinc-900/50 md:bg-transparent">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 text-zinc-700 hover:text-zinc-400 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <div className="md:hidden flex gap-2">
           <button onClick={() => duplicateMode(bIdx, mIdx, modeIdx)} className="text-zinc-600 hover:text-atlas-gold"><Copy size={14}/></button>
           <button onClick={() => removeMode(bIdx, mIdx, modeIdx)} className="text-zinc-700 hover:text-red-500"><Trash2 size={14}/></button>
        </div>
      </td>

      {/* Inputs */}
      <td className="p-2 md:w-auto">
        <label className="md:hidden text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Mode Name</label>
        <input value={mode.Mode} onChange={e => updateMode(bIdx, mIdx, modeIdx, 'Mode', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-atlas-gold rounded px-2 py-1 text-sm md:text-xs outline-none font-medium" placeholder="Mode Name" />
      </td>
      
      <td className="p-2 md:w-20 flex md:table-cell flex-col">
        <label className="md:hidden text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Width (mm)</label>
        <input type="text" inputMode="decimal" value={mode.Width} onChange={e => updateMode(bIdx, mIdx, modeIdx, 'Width', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-atlas-gold rounded px-2 py-1 text-sm md:text-xs outline-none font-mono md:text-center text-zinc-300" />
      </td>
      
      <td className="p-2 md:w-20 flex md:table-cell flex-col">
        <label className="md:hidden text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Height (mm)</label>
        <input type="text" inputMode="decimal" value={mode.Height} onChange={e => updateMode(bIdx, mIdx, modeIdx, 'Height', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-atlas-gold rounded px-2 py-1 text-sm md:text-xs outline-none font-mono md:text-center text-zinc-300" />
      </td>
      
      <td className="p-2 md:w-40 flex md:table-cell flex-col">
        <label className="md:hidden text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Resolution</label>
        <div className="flex items-center md:justify-center gap-1 font-mono text-xs text-zinc-500">
          <input 
            value={resParts[0]} 
            onChange={e => updateResolution(bIdx, mIdx, modeIdx, 'w', e.target.value)}
            className="w-16 bg-zinc-950/50 border border-zinc-800 focus:border-atlas-gold rounded px-1 py-0.5 text-center text-zinc-200 outline-none"
          />
          <span className="px-1 text-[10px] opacity-30">x</span>
          <input 
            value={resParts[1]} 
            onChange={e => updateResolution(bIdx, mIdx, modeIdx, 'h', e.target.value)}
            className="w-16 bg-zinc-950/50 border border-zinc-800 focus:border-atlas-gold rounded px-1 py-0.5 text-center text-zinc-200 outline-none"
          />
        </div>
      </td>

      <td className="p-2 md:text-center flex items-center md:table-cell gap-2 md:gap-0">
        <label className="md:hidden text-[9px] uppercase tracking-widest text-zinc-600">Native Anamorphic</label>
        <input 
          type="checkbox"
          checked={mode.NativeAnamorphic === 'True'}
          onChange={e => updateMode(bIdx, mIdx, modeIdx, 'NativeAnamorphic', e.target.checked ? 'True' : 'False')}
          className="accent-atlas-gold w-4 h-4 md:w-3 md:h-3 bg-zinc-950 border-zinc-800 rounded cursor-pointer"
        />
      </td>
      
      <td className="p-2 overflow-visible relative flex md:table-cell flex-col">
        <label className="md:hidden text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Squeezes</label>
        <SqueezeSelector 
          value={mode.SupportedSqueezes} 
          onChange={(newVal) => updateMode(bIdx, mIdx, modeIdx, 'SupportedSqueezes', newVal)} 
        />
      </td>
      
      <td className="p-2 text-right pr-6 hidden md:table-cell">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all">
          <button onClick={() => duplicateMode(bIdx, mIdx, modeIdx)} className="text-zinc-600 hover:text-atlas-gold transition-colors" title="Duplicate Mode"><Copy size={12}/></button>
          <button onClick={() => removeMode(bIdx, mIdx, modeIdx)} className="text-zinc-700 hover:text-red-500 transition-colors" title="Delete Mode"><Trash2 size={12}/></button>
        </div>
      </td>
    </tr>
  );
};

// --- Main App ---

export default function App() {
  const [groupedData, setGroupedData] = useState([]);
  const [fileName, setFileName] = useState('cameras.csv');
  const [error, setError] = useState(null);
  const [expandedBrands, setExpandedBrands] = useState({});
  const [expandedModels, setExpandedModels] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes in the database. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const groupData = (flatData) => {
    const brands = {};
    flatData.forEach(row => {
      const bName = row.Brand || 'Unknown Brand';
      const mName = row.Model || 'Unknown Model';
      
      if (!brands[bName]) brands[bName] = {};
      if (!brands[bName][mName]) brands[bName][mName] = [];
      
      brands[bName][mName].push({
        id: generateId(), 
        Mode: row.Mode,
        Width: row.Width,
        Height: row.Height,
        Resolution: row.Resolution,
        NativeAnamorphic: row.NativeAnamorphic,
        SupportedSqueezes: row.SupportedSqueezes
      });
    });

    return Object.entries(brands).map(([brand, models]) => ({
      brand,
      models: Object.entries(models).map(([model, modes]) => ({
        name: model,
        modes
      }))
    }));
  };

  const flattenData = () => {
    const flat = [];
    groupedData.forEach(b => {
      b.models.forEach(m => {
        m.modes.forEach(mode => {
          const { id, ...modeData } = mode; 
          flat.push({
            Brand: b.brand,
            Model: m.name,
            ...modeData
          });
        });
      });
    });
    return flat;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
        } else {
          setGroupedData(groupData(results.data));
          setHasUnsavedChanges(false);
          setError(null);
        }
      }
    });
  };

  const handleLoadDefault = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/HumanMint/atlas-vision/main/public/data/cameras.csv');
      if (!response.ok) throw new Error('Failed to fetch default database.');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Error parsing default CSV: ${results.errors[0].message}`);
          } else {
            setGroupedData(groupData(results.data));
            setFileName('cameras.csv');
            setHasUnsavedChanges(false);
            setError(null);
          }
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleBrand = (brand) => {
    setExpandedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  const toggleModel = (id) => {
    setExpandedModels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addBrand = () => {
    const newBrand = { brand: 'New Brand', models: [{ name: 'New Model', modes: [{ ...INITIAL_MODE, id: generateId() }] }] };
    setGroupedData([newBrand, ...groupedData]);
    setExpandedBrands(prev => ({ ...prev, ['New Brand']: true }));
    setHasUnsavedChanges(true);
  };

  const addModel = (brandIdx) => {
    const newData = [...groupedData];
    const brandName = newData[brandIdx].brand;
    newData[brandIdx].models.push({ name: 'New Model', modes: [{ ...INITIAL_MODE, id: generateId() }] });
    setGroupedData(newData);
    setExpandedModels(prev => ({ ...prev, [`${brandName}-New Model`]: true }));
    setHasUnsavedChanges(true);
  };

  const addMode = (brandIdx, modelIdx) => {
    const newData = [...groupedData];
    newData[brandIdx].models[modelIdx].modes.push({ ...INITIAL_MODE, id: generateId() });
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const duplicateMode = (brandIdx, modelIdx, modeIdx) => {
    const newData = [...groupedData];
    const modeToDuplicate = { 
      ...newData[brandIdx].models[modelIdx].modes[modeIdx],
      id: generateId() 
    };
    newData[brandIdx].models[modelIdx].modes.splice(modeIdx + 1, 0, modeToDuplicate);
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = (event, bIdx, mIdx) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const newData = [...groupedData];
      const modes = newData[bIdx].models[mIdx].modes;
      const oldIndex = modes.findIndex(m => m.id === active.id);
      const newIndex = modes.findIndex(m => m.id === over.id);
      
      newData[bIdx].models[mIdx].modes = arrayMove(modes, oldIndex, newIndex);
      setGroupedData(newData);
      setHasUnsavedChanges(true);
    }
  };

  const sortModesByArea = (bIdx, mIdx) => {
    const newData = [...groupedData];
    const modes = newData[bIdx].models[mIdx].modes;
    modes.sort((a, b) => {
      const areaA = parseFloat(a.Width || 0) * parseFloat(a.Height || 0);
      const areaB = parseFloat(b.Width || 0) * parseFloat(b.Height || 0);
      return areaB - areaA;
    });
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const syncSettings = (brandIdx, modelIdx, field) => {
    const newData = [...groupedData];
    const model = newData[brandIdx].models[modelIdx];
    const sourceValue = model.modes[0][field];
    
    model.modes = model.modes.map(mode => ({
      ...mode,
      [field]: sourceValue
    }));
    
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const updateMode = (bIdx, mIdx, modeIdx, field, value) => {
    const newData = [...groupedData];
    newData[bIdx].models[mIdx].modes[modeIdx][field] = value;
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const updateResolution = (bIdx, mIdx, modeIdx, part, value) => {
    const currentRes = groupedData[bIdx].models[mIdx].modes[modeIdx].Resolution || '0 x 0';
    const parts = currentRes.split('x').map(p => p.trim());
    if (part === 'w') parts[0] = value || '0';
    else parts[1] = value || '0';
    
    updateMode(bIdx, mIdx, modeIdx, 'Resolution', `${parts[0]} x ${parts[1]}`);
  };

  const updateModelName = (bIdx, mIdx, value) => {
    const newData = [...groupedData];
    newData[bIdx].models[mIdx].name = value;
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const updateBrandName = (bIdx, value) => {
    const newData = [...groupedData];
    newData[bIdx].brand = value;
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const removeMode = (bIdx, mIdx, modeIdx) => {
    const newData = [...groupedData];
    newData[bIdx].models[mIdx].modes.splice(modeIdx, 1);
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const removeModel = (bIdx, mIdx) => {
    const newData = [...groupedData];
    newData[bIdx].models.splice(mIdx, 1);
    setGroupedData(newData);
    setHasUnsavedChanges(true);
  };

  const removeBrand = (bIdx) => {
    setGroupedData(groupedData.filter((_, i) => i !== bIdx));
    setHasUnsavedChanges(true);
  };

  const exportCSV = () => {
    const flat = flattenData();
    const csv = Papa.unparse(flat);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    link.click();
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8 tracking-tight">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-atlas-gold mb-2 italic tracking-wider uppercase text-shadow-glow">Vision Tool <span className="font-bold not-italic">Data Editor</span></h1>
          <div className="flex items-center gap-3">
            <p className="text-zinc-500 text-xs md:text-sm tracking-wide uppercase font-medium">Hierarchical Camera & Sensor Management</p>
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-atlas-gold/10 border border-atlas-gold/20 text-atlas-gold text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse">
                <Circle size={8} fill="currentColor" /> Unsaved Changes
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Only show Save button here when data is active. Load buttons live in empty state. */}
          <ActionButton 
            onClick={exportCSV} 
            icon={Download} 
            label="Save Database" 
            description="Download your changes as a .csv file."
            primary 
            disabled={groupedData.length === 0} 
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto pb-64">
        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {groupedData.length > 0 && (
            <button 
              onClick={addBrand}
              className="w-full py-4 border-2 border-dashed border-zinc-800 text-zinc-600 hover:text-atlas-gold hover:border-atlas-gold/50 rounded-lg transition-all text-xs font-bold uppercase tracking-[0.3em] bg-zinc-900/10"
            >
              + Add New Brand Group
            </button>
          )}

          {groupedData.map((brand, bIdx) => (
            <div key={bIdx} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl font-sans">
              <div 
                className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between group cursor-pointer"
                onClick={() => toggleBrand(brand.brand)}
              >
                <div className="flex items-center gap-4">
                  {expandedBrands[brand.brand] ? <ChevronDown size={18} className="text-atlas-gold" /> : <ChevronRight size={18} className="text-zinc-600" />}
                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    <FolderOpen size={16} className="text-zinc-600" />
                    <input 
                      value={brand.brand} 
                      onChange={e => updateBrandName(bIdx, e.target.value)}
                      className="bg-transparent border-none focus:ring-1 focus:ring-atlas-gold rounded px-2 py-1 text-lg font-bold text-atlas-gold outline-none w-48 transition-all"
                    />
                  </div>
                  <span className="text-xs text-zinc-600 font-mono hidden md:inline">({brand.models.length} Models)</span>
                </div>
                <div className="flex items-center gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); removeBrand(bIdx); }} className="text-zinc-600 hover:text-red-500 transition-colors" title="Delete Brand Group"><Trash2 size={16}/></button>
                </div>
              </div>

              {expandedBrands[brand.brand] && (
                <div className="p-2 md:p-4 space-y-4 bg-black/20 font-sans text-sm">
                  <button 
                    onClick={() => addModel(bIdx)}
                    className="w-full py-3 border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 rounded transition-all text-[10px] font-bold uppercase tracking-widest bg-zinc-900/30"
                  >
                    + Add New Camera Model
                  </button>

                  {brand.models.map((model, mIdx) => {
                    const modelId = `${brand.brand}-${model.name}`;
                    return (
                      <div key={mIdx} className="border border-zinc-800 rounded bg-zinc-900/50">
                        <div 
                          className="p-3 bg-zinc-900 flex items-center justify-between group/model cursor-pointer rounded-t"
                          onClick={() => toggleModel(modelId)}
                        >
                          <div className="flex items-center gap-3">
                            {expandedModels[modelId] ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-600" />}
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Camera size={14} className="text-zinc-500" />
                              <input 
                                value={model.name} 
                                onChange={e => updateModelName(bIdx, mIdx, e.target.value)}
                                className="bg-transparent border-none focus:ring-1 focus:ring-atlas-gold rounded px-2 py-1 text-sm font-semibold text-zinc-200 outline-none w-48 md:w-64 transition-all"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 opacity-100 md:opacity-0 md:group-hover/model:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); removeModel(bIdx, mIdx); }} className="text-zinc-700 hover:text-red-500 transition-colors" title="Delete Model"><Trash2 size={14}/></button>
                          </div>
                        </div>

                        {expandedModels[modelId] && (
                          <div className="overflow-visible">
                            <DndContext 
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleDragEnd(event, bIdx, mIdx)}
                            >
                              <table className="w-full text-left border-collapse table-auto md:table-fixed block md:table">
                                <thead className="hidden md:table-header-group">
                                  <tr className="bg-black/40 text-[9px] uppercase tracking-widest text-zinc-600">
                                    <th className="p-3 w-8"></th> 
                                    <th className="p-3 font-bold w-1/4">
                                      <div className="flex items-center gap-2">
                                        <span>Mode Name</span>
                                        <button 
                                          onClick={() => sortModesByArea(bIdx, mIdx)}
                                          className="p-1 hover:text-atlas-gold transition-colors"
                                          title="Sort by Sensor Size (Largest First)"
                                        >
                                          <SortAsc size={10} />
                                        </button>
                                      </div>
                                    </th>
                                    <th className="p-3 font-bold w-20 text-center">W (mm)</th>
                                    <th className="p-3 font-bold w-20 text-center">H (mm)</th>
                                    <th className="p-3 font-bold w-40 text-center">Resolution</th>
                                    <th className="p-3 font-bold w-24 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="text-atlas-gold/60">Native Ana</span>
                                        <button 
                                          onClick={() => syncSettings(bIdx, mIdx, 'NativeAnamorphic')}
                                          className="p-1 hover:text-atlas-gold transition-colors"
                                          title="Apply first mode's setting to all"
                                        >
                                          <Zap size={10} fill="currentColor" />
                                        </button>
                                      </div>
                                    </th>
                                    <th className="p-3 font-bold w-1/3">
                                      <div className="flex items-center gap-2">
                                        <span>Squeezes</span>
                                        <button 
                                          onClick={() => syncSettings(bIdx, mIdx, 'SupportedSqueezes')}
                                          className="p-1 hover:text-atlas-gold transition-colors"
                                          title="Apply first mode's setting to all"
                                        >
                                          <Zap size={10} fill="currentColor" />
                                        </button>
                                      </div>
                                    </th>
                                    <th className="p-3 w-20 text-right pr-6 text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50 font-sans block md:table-row-group">
                                  <SortableContext 
                                    items={model.modes.map(m => m.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {model.modes.map((mode, modeIdx) => (
                                      <SortableRow 
                                        key={mode.id}
                                        mode={mode}
                                        bIdx={bIdx}
                                        mIdx={mIdx}
                                        modeIdx={modeIdx}
                                        updateMode={updateMode}
                                        updateResolution={updateResolution}
                                        duplicateMode={duplicateMode}
                                        removeMode={removeMode}
                                      />
                                    ))}
                                  </SortableContext>
                                </tbody>
                              </table>
                            </DndContext>
                            <button 
                              onClick={() => addMode(bIdx, mIdx)}
                              className="w-full py-2 bg-zinc-950/50 hover:bg-atlas-gold/10 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 hover:text-atlas-gold transition-all flex items-center justify-center gap-2 border-t border-zinc-800"
                            >
                              <Plus size={10} /> Add Sensor Mode
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {groupedData.length === 0 && (
            <div className="p-8 md:p-20 text-center border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 shadow-inner">
              <Layers size={48} strokeWidth={1} className="mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500 uppercase tracking-widest text-sm mb-6 font-light underline-offset-8 decoration-1 decoration-zinc-800">Database is currently empty</p>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <ActionButton 
                  onClick={handleLoadDefault} 
                  icon={Globe} 
                  label="Load Default" 
                  description="Fetch the official cameras.csv from GitHub."
                />
                
                <ActionButton 
                  component="label"
                  icon={Upload} 
                  label="Upload CSV" 
                  description="Edit a local CSV file from your computer."
                >
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </ActionButton>
              </div>
            </div>
          )}
        </div>
        <footer className="mt-12 text-center pb-8 border-t border-zinc-900 pt-8">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.4em]">Atlas Lens Co. | Internal Vision Database Tool</p>
        </footer>
      </main>
    </div>
  );
}
