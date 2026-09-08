import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Key, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Check, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Hash,
  Crown
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';

interface UserManagementSectionProps {
  users: AppUser[];
  currentUser: AppUser;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: AppUser) => void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'seller'>('seller');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [active, setActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate password strength
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'Vacía', color: 'bg-slate-700 text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-rose-500 text-rose-400' };
    if (score <= 3) return { score: 2, label: 'Media', color: 'bg-amber-500 text-amber-400' };
    if (score === 4) return { score: 3, label: 'Segura', color: 'bg-emerald-500 text-emerald-400' };
    return { score: 4, label: 'Muy Segura', color: 'bg-indigo-500 text-indigo-400' };
  };

  const strength = getPasswordStrength(password);

  const resetForm = () => {
    setName('');
    setUsername('');
    setRole('seller');
    setPassword('');
    setConfirmPassword('');
    setPin('');
    setActive(true);
    setShowPassword(false);
    setErrorMsg(null);
    setIsAddingUser(false);
    setEditingUser(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddingUser(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setRole(user.role);
    setPassword(user.password || '');
    setConfirmPassword(user.password || '');
    setPin(user.pin || '');
    setActive(user.active);
    setShowPassword(false);
    setErrorMsg(null);
    setIsAddingUser(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('El nombre de usuario es obligatorio.');
      return;
    }

    // Check duplicate username
    const duplicate = users.find(u => 
      u.username.toLowerCase() === cleanUsername && 
      (!editingUser || u.id !== editingUser.id)
    );

    if (duplicate) {
      setErrorMsg(`El nombre de usuario "${cleanUsername}" ya está registrado.`);
      return;
    }

    if (!editingUser || password) {
      if (password.length < 4) {
        setErrorMsg('La contraseña debe tener al menos 4 caracteres (se recomiendan 6+ para mayor seguridad).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      setErrorMsg('El PIN rápido debe contener exactamente 4 dígitos numéricos.');
      return;
    }

    // Safety: ensure at least one active admin remains
    if (editingUser && editingUser.role === 'admin' && (role !== 'admin' || !active)) {
      const otherAdmins = users.filter(u => u.id !== editingUser.id && u.role === 'admin' && u.active);
      if (otherAdmins.length === 0) {
        setErrorMsg('No puedes desactivar ni cambiar el rol del único Administrador activo del sistema.');
        return;
      }
    }

    const userData: AppUser = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      role,
      password: password || editingUser?.password || '123456',
      pin: pin || editingUser?.pin || undefined,
      active,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      lastLogin: editingUser?.lastLogin
    };

    onSaveUser(userData);
    setSuccessMsg(editingUser ? 'Usuario actualizado exitosamente' : 'Nuevo usuario creado exitosamente');
    setTimeout(() => setSuccessMsg(null), 3000);
    resetForm();
  };

  const handleDelete = (userToDelete: AppUser) => {
    if (userToDelete.id === currentUser.id) {
      setErrorMsg('No puedes eliminar tu propia cuenta mientras tienes la sesión activa.');
      return;
    }

    if (userToDelete.role === 'admin') {
      const activeAdmins = users.filter(u => u.role === 'admin' && u.active);
      if (activeAdmins.length <= 1) {
        setErrorMsg('Debe existir al menos un Administrador activo en el sistema.');
        return;
      }
    }

    if (window.confirm(`¿Estás seguro de eliminar el usuario "${userToDelete.name}" (${userToDelete.username})?`)) {
      onDeleteUser(userToDelete.id);
      setSuccessMsg('Usuario eliminado correctamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const totalAdmins = users.filter(u => u.role === 'admin' && u.active).length;
  const totalSellers = users.filter(u => u.role === 'seller' && u.active).length;

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Gestión de Cuentas, Usuarios & Roles de Acceso</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Crea y administra credenciales seguras para Vendedores y Administradores con control granular de permisos.
            </p>
          </div>

          {!isAddingUser && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Nuevo Usuario</span>
            </button>
          )}
        </div>

        {/* Status messages */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-700/80 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Roles overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Total de Usuarios</span>
              <p className="text-lg font-black text-white">{(users?.length || 0)}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-purple-900/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-purple-300 font-bold">Administradores</span>
                <Crown className="w-3 h-3 text-purple-400" />
              </div>
              <p className="text-lg font-black text-purple-300">{totalAdmins}</p>
              <span className="text-[10px] text-purple-400/80">Acceso Total & Finanzas</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-blue-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-blue-300 font-bold">Vendedores</span>
              <p className="text-lg font-black text-blue-300">{totalSellers}</p>
              <span className="text-[10px] text-blue-400/80">Bloqueo Finanzas/Reportes</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/50">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal / Box */}
      {isAddingUser && (
        <div className="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-indigo-500/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {editingUser ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </span>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {editingUser ? `Editar Usuario: ${editingUser.name}` : 'Crear Nueva Cuenta de Usuario'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Establece credenciales seguras y define el nivel de permisos en el sistema.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nombre y Apellido:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nombre de Usuario (Login):</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: carlos.ventas"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Role Selection with clear permission explanation */}
            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold">Rol y Nivel de Acceso:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Admin Option */}
                <div
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    role === 'admin'
                      ? 'bg-purple-950/50 border-purple-500 ring-1 ring-purple-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                      <Crown className="w-4 h-4 text-purple-400" />
                      <span>Administrador</span>
                    </div>
                    {role === 'admin' && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>Acceso Total:</strong> POS, Inventario, Fiados, <span className="text-emerald-400">Finanzas (Gastos/Proveedores)</span>, <span className="text-purple-400">Reportes de Ventas Diarios/Mensuales</span> y Configuración.
                  </p>
                </div>

                {/* Seller Option */}
                <div
                  onClick={() => setRole('seller')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    role === 'seller'
                      ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300">
                      <User className="w-4 h-4 text-blue-400" />
                      <span>Vendedor (Cajero)</span>
                    </div>
                    {role === 'seller' && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>Acceso Operativo:</strong> POS Mostrador, Cotizaciones, Inventario y Libreta de Clientes. <span className="text-rose-400 font-semibold">Restringido de Finanzas y Reportes.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Password and PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    {editingUser ? 'Nueva Contraseña (opcional):' : 'Contraseña Segura:'}
                  </label>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />

                {/* Password strength meter */}
                {password && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 4 ? strength.color.split(' ')[0] : 'bg-transparent'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${strength.color.split(' ')[1]}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Confirmar Contraseña:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">PIN Rápido (4 dígitos opcional):</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 1234"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs text-center tracking-widest focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Active status */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <span className="text-xs font-semibold">Cuenta de usuario activa</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Listado de Usuarios Registrados ({(users?.length || 0)})
          </span>
          <span className="text-[10px] text-slate-400">
            {(users || []).filter(u => u.active).length} activos
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {(users || []).map((user) => {
            const isCurrent = user.id === currentUser.id;
            const isAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className="p-3.5 hover:bg-slate-900/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left info */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    isAdmin 
                      ? 'bg-purple-950 text-purple-300 border-purple-700/60' 
                      : 'bg-blue-950 text-blue-300 border-blue-700/60'
                  }`}>
                    {isAdmin ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{user.name}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          Tu Sesión Actual
                        </span>
                      )}
                      {!user.active && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap font-mono">
                      <span>Usuario: <strong className="text-slate-200">@{user.username}</strong></span>
                      {user.pin && <span>PIN: ••••</span>}
                      <span className="text-[10px] text-slate-500">Creado: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right badge & actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {/* Role Badge */}
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                    isAdmin
                      ? 'bg-purple-950/60 text-purple-300 border-purple-800/80'
                      : 'bg-blue-950/60 text-blue-300 border-blue-800/80'
                  }`}>
                    {isAdmin ? <Crown className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-blue-400" />}
                    <span>{isAdmin ? 'Administrador' : 'Vendedor'}</span>
                  </span>

                  {/* Switch to user button */}
                  {onSwitchUser && !isCurrent && user.active && (
                    <button
                      type="button"
                      onClick={() => onSwitchUser(user)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition flex items-center gap-1"
                      title="Cambiar sesión a este usuario"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden md:inline text-[11px]">Iniciar</span>
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Editar usuario y contraseña"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    disabled={isCurrent || (isAdmin && totalAdmins <= 1)}
                    onClick={() => handleDelete(user)}
                    className={`p-1.5 rounded-lg border transition ${
                      isCurrent || (isAdmin && totalAdmins <= 1)
                        ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                        : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border-rose-800/60 hover:text-rose-200'
                    }`}
                    title={
                      isCurrent 
                        ? 'No puedes eliminar la cuenta en uso' 
                        : (isAdmin && totalAdmins <= 1) 
                        ? 'Debe quedar al menos un administrador' 
                        : 'Eliminar usuario'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
