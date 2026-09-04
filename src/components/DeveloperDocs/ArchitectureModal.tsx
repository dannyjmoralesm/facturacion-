import React, { useState } from 'react';
import { 
  Code, 
  Database, 
  Layers, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  FileCode,
  X,
  Sparkles
} from 'lucide-react';
import { 
  SQL_DATABASE_SCHEMA, 
  TYPESCRIPT_CHECKOUT_LOGIC, 
  API_ENDPOINTS_DOCS 
} from '../../data/architectureDocs';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'algorithm' | 'api'>('sql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentContent = 
    activeTab === 'sql' 
      ? SQL_DATABASE_SCHEMA 
      : activeTab === 'algorithm' 
      ? TYPESCRIPT_CHECKOUT_LOGIC 
      : API_ENDPOINTS_DOCS;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-100 my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Code className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-white">Arquitectura de Software & Especificación Técnica</h2>
              <p className="text-xs text-slate-400">
                Modelo relacional PostgreSQL, motor de cálculo bimoneda y contratos de API REST.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Tab selector and Copy button */}
        <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>1. Modelo SQL / Supabase</span>
            </button>
            <button
              onClick={() => setActiveTab('algorithm')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'algorithm' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>2. Algoritmo Checkout TypeScript</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'api' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>3. Especificación REST API</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-200">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Diseñado para alta concurrencia, offline-first y cumplimiento fiscal venezolano</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
