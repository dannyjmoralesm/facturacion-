import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  User, 
  Crown, 
  Key, 
  Check, 
  X, 
  AlertCircle, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppUser } from '../../types';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
  requiredRole?: 'admin';
  title?: string;
  subtitle?: string;
  onSuccessOverride?: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  requiredRole,
  title = 'Cambiar de Usuario / Iniciar Sesión',
  subtitle = 'Selecciona la cuenta e ingresa la contraseña o PIN de seguridad para continuar.',
  onSuccessOverride
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    requiredRole === 'admin'
      ? (users.find(u => u.role === 'admin' && u.active)?.id || users[0]?.id || '')
      : currentUser.id
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedUser) {
      setErrorMsg('Selecciona un usuario válido.');
      return;
    }

    if (!selectedUser.active) {
      setErrorMsg('Esta cuenta de usuario se encuentra inactiva. Contacte al Administrador.');
      return;
    }

    // If a specific role is required (like Admin for accessing Finance/Reports)
    if (requiredRole && selectedUser.role !== requiredRole) {
      setErrorMsg(`Se requiere una cuenta con rol de ${requiredRole === 'admin' ? 'Administrador' : requiredRole}.`);
      return;
    }

    // Verify Password or PIN
    const trimmedInput = password.trim();
    const isPassMatch = selectedUser.password && (selectedUser.password === trimmedInput || selectedUser.password === password);
    const isPinMatch = selectedUser.pin && selectedUser.pin === trimmedInput;

    // If no password set on user, allow direct
    if (!selectedUser.password && !selectedUser.pin) {
      onSwitchUser(selectedUser);
      if (onSuccessOverride) onSuccessOverride();
      onClose();
      return;
    }

    if (isPassMatch || isPinMatch) {
      onSwitchUser(selectedUser);
      if (onSuccessOverride) onSuccessOverride();
      onClose();
    } else {
      setErrorMsg('Contraseña o PIN incorrecto. Intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col text-slate-100 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSwitch} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-700/80 text-rose-300 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Seleccionar Usuario:</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1">
              {users.filter(u => u.active).map(u => {
                const isSelected = u.id === selectedUserId;
                const isAdmin = u.role === 'admin';
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setErrorMsg(null);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? (isAdmin 
                            ? 'bg-purple-950/70 border-purple-500 ring-1 ring-purple-500/40 text-white'
                            : 'bg-blue-950/70 border-blue-500 ring-1 ring-blue-500/40 text-white')
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAdmin ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
                      }`}>
                        {isAdmin ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isAdmin 
                        ? 'bg-purple-950 text-purple-300 border-purple-700/60'
                        : 'bg-blue-950 text-blue-300 border-blue-700/60'
                    }`}>
                      {isAdmin ? 'Admin' : 'Vendedor'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">Contraseña o PIN de 4 dígitos:</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña o PIN"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:border-indigo-500 focus:outline-none tracking-wider"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-950 transition"
            >
              <Check className="w-4 h-4" />
              <span>Autenticar & Entrar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
