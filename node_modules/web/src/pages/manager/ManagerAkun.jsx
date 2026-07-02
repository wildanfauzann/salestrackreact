import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function ManagerAkun() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales',
    status: 'active'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      // Filter out admin users, just keep sales and manager
      setUsers(res.data.filter(u => u.role !== 'admin'));
    } catch (error) {
      alert('Gagal mengambil daftar akun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      name: '', email: '', password: '', phone: '', role: 'sales', status: 'active'
    });
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode('edit');
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // blank unless changing
      phone: user.phone || '',
      role: user.role || 'sales',
      status: user.status || 'active'
    });
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun ini secara permanen?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert('Gagal menghapus akun');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        if (!formData.password) {
          alert('Kata sandi wajib diisi untuk akun baru!');
          return;
        }
        await api.post('/users', formData);
      } else {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        
        await api.patch(`/users/${selectedUser.id}`, updateData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert(modalMode === 'add' ? 'Gagal membuat akun' : 'Gagal memperbarui akun');
    }
  };

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full flex flex-col">
      
      {/* Header Section */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Manajemen Akun</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola daftar akun pengguna dan hak akses mereka.</p>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-6 py-3 rounded-xl font-label-lg transition-colors shadow-lg self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Tambah Akun
        </button>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-surface/40 backdrop-blur-xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface-container/50">
                <th className="p-4 font-label-lg text-on-surface-variant uppercase tracking-wider">Nama & Email</th>
                <th className="p-4 font-label-lg text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="p-4 font-label-lg text-on-surface-variant uppercase tracking-wider">No. HP</th>
                <th className="p-4 font-label-lg text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="p-4 font-label-lg text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-on-surface-variant">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-2 border-surface-variant border-t-primary rounded-full animate-spin"></div>
                      Memuat daftar akun...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-on-surface-variant font-body-md">Belum ada akun tim.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-surface-container-low/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high border border-white/10 flex flex-shrink-0 items-center justify-center overflow-hidden">
                          {user.image ? (
                            <img src={user.image.startsWith('http') ? user.image : `http://localhost:3000${user.image}`} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary font-bold">{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{user.name}</p>
                          <p className="text-sm text-on-surface-variant">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-surface-container text-on-surface rounded-full text-xs font-bold border border-white/10 capitalize">
                        {user.role || 'Sales'}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">{user.phone || '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'inactive' ? 'bg-error/20 text-error' : 'bg-tertiary/20 text-tertiary'} border border-white/5 capitalize`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(user)} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors" title="Edit Akun">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors" title="Hapus Akun">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <>
          {/* Overlay Background */}
          <div className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[450px] max-h-[90vh] overflow-y-auto bg-surface-container-high rounded-2xl shadow-2xl border border-white/10 flex flex-col z-[100]">
            <div className="sticky top-0 z-10 bg-surface-container-high p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-headline-md text-on-surface">{modalMode === 'add' ? 'Tambah Akun Baru' : 'Edit Akun'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1.5">Nama Lengkap *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors input-float"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1.5">Alamat Email *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors input-float"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block font-label-md text-on-surface-variant mb-1.5">
                  Kata Sandi {modalMode === 'add' ? '*' : '(Opsional)'}
                </label>
                <input 
                  type="password" 
                  required={modalMode === 'add'}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors input-float"
                  placeholder={modalMode === 'add' ? "Minimal 8 karakter" : "Kosongkan jika tak diubah"}
                />
              </div>

              <div>
                <label className="block font-label-md text-on-surface-variant mb-1.5">Nomor HP</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors input-float"
                  placeholder="081234567890"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1.5">Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer input-float"
                  >
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1.5">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer input-float"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors font-label-md"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors font-bold font-label-md glow-btn"
                >
                  {modalMode === 'add' ? 'Buat Akun' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
// force reload
