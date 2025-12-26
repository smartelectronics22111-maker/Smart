
import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Key, Trash2, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getAllMockUsers, updateMockUserPassword, deleteMockUser } from '../services/firebase';

const UserManagementScreen: React.FC = () => {
    const [users, setUsers] = useState<{email: string}[]>([]);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [newPass, setNewPass] = useState('');
    const [status, setStatus] = useState({ msg: '', type: '' });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        const list = getAllMockUsers();
        setUsers(list);
    };

    const handleResetPassword = () => {
        if (!selectedUser || !newPass) return;
        if (newPass.length < 6) {
            setStatus({ msg: 'Password must be at least 6 characters.', type: 'error' });
            return;
        }
        updateMockUserPassword(selectedUser, newPass);
        setStatus({ msg: `Password for ${selectedUser} updated!`, type: 'success' });
        setNewPass('');
        setSelectedUser(null);
        setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
    };

    const handleDelete = (email: string) => {
        if (confirm(`Are you sure? This will delete ${email} AND all their associated stock/invoice data permanently from this device.`)) {
            deleteMockUser(email);
            loadUsers();
            setStatus({ msg: 'User and data deleted successfully.', type: 'success' });
            setTimeout(() => setStatus({ msg: '', type: '' }), 3000);
        }
    };

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-indigo-600" />
                        User Management
                    </h1>
                    <p className="text-gray-500 mt-1">Master Console: Manage device-level user access and credentials.</p>
                </div>
            </div>

            {status.msg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border animate-pulse ${status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span className="font-bold">{status.msg}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users by email..." 
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={loadUsers} className="p-2 text-gray-500 hover:bg-white rounded-lg border border-gray-200">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">User Account</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={2} className="p-12 text-center text-gray-400 italic">No sub-users found.</td></tr>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <tr key={u.email} className={`hover:bg-indigo-50/30 transition cursor-pointer ${selectedUser === u.email ? 'bg-indigo-50' : ''}`} onClick={() => setSelectedUser(u.email)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black">
                                                            {u.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{u.email}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Role: Sub-User</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => handleDelete(u.email)}
                                                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete Account"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Password Reset Panel */}
                <div className="space-y-6">
                    <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-indigo-300" />
                            Reset Credentials
                        </h3>
                        
                        {selectedUser ? (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-indigo-300 mb-2">Modifying Account</label>
                                    <p className="font-bold bg-white/10 p-3 rounded-lg border border-white/20 truncate">{selectedUser}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-indigo-300 mb-2">New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder="Min 6 characters"
                                        value={newPass}
                                        onChange={e => setNewPass(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 text-sm font-bold hover:bg-white/10 rounded-xl transition">CANCEL</button>
                                    <button onClick={handleResetPassword} className="flex-2 px-6 py-3 bg-white text-indigo-900 font-black rounded-xl hover:bg-indigo-50 transition shadow-xl">RESET NOW</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 border-2 border-dashed border-white/20 rounded-2xl opacity-60">
                                <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">Select a user from the list to manage their login details.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                        <h4 className="font-black text-amber-800 text-xs uppercase mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Master Admin Rights
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            As the Master Admin, you have full control over local sub-user accounts. resetting a password will take effect immediately. Deleting a user will also wipe their local inventory and invoice logs to save storage.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementScreen;
