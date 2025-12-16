import React, { useState, useRef, useEffect } from 'react';
import { Branch, HolidaySchedule, SearchLog } from '../types';
import { normalizeString, normalizePhoneNumber } from '../services/geminiService';
import { sheetAPI } from '../services/sheetService';

interface BranchManagerProps {
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
  onReload: () => Promise<boolean>; 
}

const ADMIN_PASSWORD = "TruongBaoNgu2026";

const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now.getTime() - offset)).toISOString().split('T')[0];
};

const calculateStats = (history: HolidaySchedule[]) => {
  const stats: Record<string, { total: number; months: Record<number, number> }> = {};
  if (!Array.isArray(history) || history.length === 0) return stats;
  
  history.forEach(item => {
    if (!item.startTime) return;
    const date = new Date(item.startTime);
    if (isNaN(date.getTime())) return;
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1; 
    if (!stats[year]) stats[year] = { total: 0, months: {} };
    stats[year].total += 1;
    stats[year].months[month] = (stats[year].months[month] || 0) + 1;
  });
  return stats;
};

const TimePicker24h = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
  const [hStr, mStr] = value ? value.split(':') : ['00', '00'];
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 2) val = val.slice(0, 2);
    if (!/^\d*$/.test(val)) return;
    const num = parseInt(val);
    if (num > 23) val = '23';
    onChange(`${val}:${mStr}`);
  };
  const handleHourBlur = () => {
    let num = parseInt(hStr || '0');
    if (isNaN(num)) num = 0; if (num > 23) num = 23;
    onChange(`${num.toString().padStart(2, '0')}:${mStr}`);
  };
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 2) val = val.slice(0, 2);
    if (!/^\d*$/.test(val)) return;
    const num = parseInt(val);
    if (num > 59) val = '59';
    onChange(`${hStr}:${val}`);
  };
  const handleMinuteBlur = () => {
    let num = parseInt(mStr || '0');
    if (isNaN(num)) num = 0; if (num > 59) num = 59;
    onChange(`${hStr}:${num.toString().padStart(2, '0')}`);
  };

  return (
    <div className={`flex items-center border border-gray-300 rounded bg-white px-2 py-2 gap-1 focus-within:border-red-500 w-fit ${disabled ? 'bg-gray-100' : ''}`}>
       <input type="text" inputMode="numeric" value={hStr} onChange={handleHourChange} onBlur={handleHourBlur} disabled={disabled} className="w-8 text-center text-base font-bold outline-none bg-transparent p-0" placeholder="HH" />
       <span className="text-gray-400 font-bold mb-0.5">:</span>
       <input type="text" inputMode="numeric" value={mStr} onChange={handleMinuteChange} onBlur={handleMinuteBlur} disabled={disabled} className="w-8 text-center text-base font-bold outline-none bg-transparent p-0" placeholder="MM" />
    </div>
  );
};

export const BranchManager: React.FC<BranchManagerProps> = ({ branches, setBranches, onReload }) => {
  // --- AUTH STATE & PERSISTENCE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  // Kiểm tra phiên đăng nhập khi load trang
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  // --- NAVIGATION STATE ---
  // list: Danh sách | form: Sửa/Thêm | logs: Nhật ký
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'logs'>('list');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isUrlVisible, setIsUrlVisible] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [now, setNow] = useState(new Date());

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'loading'} | null>(null);
  const [urlCheckStatus, setUrlCheckStatus] = useState<{type: 'success' | 'error' | null, msg: string}>({ type: null, msg: '' });
  
  const [formData, setFormData] = useState({ 
    id: '', name: '', manager: '', address: '', phoneNumber: '', isActive: true, note: '' 
  });
  
  const [holidayUI, setHolidayUI] = useState({
    isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => { setScriptUrl(sheetAPI.getCurrentUrl()); }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (toast && toast.type !== 'loading') {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error' | 'loading') => {
    setToast({ msg, type });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_session', 'active'); // Lưu phiên đăng nhập
      showToast("Đăng nhập thành công!", "success");
    } else {
      showToast("Mật khẩu không đúng!", "error");
      setLoginPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_session');
    setLoginPassword('');
  };

  const handleManualReload = async () => {
    showToast("Đang đồng bộ dữ liệu...", "loading");
    try {
      const success = await onReload();
      if (success) {
        showToast("Đã cập nhật dữ liệu mới nhất!", "success");
      } else {
        showToast("Không thể kết nối Server!", "error");
      }
    } catch (e) {
      showToast("Lỗi kết nối!", "error");
    }
  };

  useEffect(() => {
    if (activeTab === 'logs' && isAuthenticated) {
      const fetchLogs = async () => {
        setLoadingLogs(true);
        let localLogs: SearchLog[] = [];
        try {
          localLogs = JSON.parse(localStorage.getItem('search_logs') || '[]');
        } catch (e) { console.error(e); }

        try {
          const serverLogs = await sheetAPI.getLogs(50);
          if (serverLogs.length > 0) {
            const map = new Map();
            [...localLogs, ...serverLogs].forEach(l => map.set(l.id, l));
            const merged = Array.from(map.values())
               .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(merged);
          } else {
             setLogs(localLogs);
          }
        } catch (e) {
           setLogs(localLogs);
        } finally {
          setLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab, isAuthenticated]);

  const currentEditingBranch = branches.find(b => b.id === editingId);
  const editingStats = currentEditingBranch && currentEditingBranch.holidayHistory 
    ? calculateStats(currentEditingBranch.holidayHistory) 
    : {};

  const handleToggleHoliday = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const today = getTodayString();
      setHolidayUI({ ...holidayUI, isEnabled: true, startDate: holidayUI.startDate || today, endDate: holidayUI.endDate || today });
    } else {
      setHolidayUI({ ...holidayUI, isEnabled: false });
    }
  };

  // --- ACTIONS ---

  const prepareForm = (branch?: Branch) => {
    if (branch) {
      // Edit Mode
      setEditingId(branch.id);
      const isTempId = branch.id.startsWith('gen-') || branch.id.startsWith('init-');
      setFormData({
        id: isTempId ? `(Chưa có ID - ${branch.id})` : branch.id,
        name: branch.name || '', manager: branch.manager || '', address: branch.address || '',
        phoneNumber: normalizePhoneNumber(branch.phoneNumber),
        isActive: branch.isActive !== undefined ? branch.isActive : true, note: branch.note || ''
      });

      if (branch.holidaySchedule?.isEnabled) {
        const startObj = new Date(branch.holidaySchedule.startTime);
        const endObj = new Date(branch.holidaySchedule.endTime);
        const now = new Date();
        const isExpired = endObj < now;

        const startOffset = startObj.getTimezoneOffset() * 60000;
        const endOffset = endObj.getTimezoneOffset() * 60000;
        const startIso = (new Date(startObj.getTime() - startOffset)).toISOString();
        const endIso = (new Date(endObj.getTime() - endOffset)).toISOString();

        setHolidayUI({
          isEnabled: !isExpired,
          startDate: startIso.split('T')[0], startTime: startIso.split('T')[1].slice(0, 5),
          endDate: endIso.split('T')[0], endTime: endIso.split('T')[1].slice(0, 5), reason: branch.holidaySchedule.reason || ''
        });
      } else {
        setHolidayUI({ isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: '' });
      }
    } else {
      // Create Mode
      resetForm();
      setEditingId(null);
    }
    
    // Switch tab to form
    setActiveTab('form');
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', manager: '', address: '', phoneNumber: '', isActive: true, note: '' });
    setHolidayUI({ isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: '' });
  };

  const handleCancelEdit = () => { 
    setEditingId(null); 
    resetForm();
    // Về list nếu đang ở mobile
    setActiveTab('list');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Xác nhận xóa chi nhánh này?")) return;

    showToast("Đang xóa...", "loading");
    const previousBranches = [...branches];
    const newBranches = branches.filter(b => b.id !== id);
    setBranches(newBranches);
    
    if (editingId === id) handleCancelEdit();

    try {
      await sheetAPI.delete(id);
      showToast("Đã xóa thành công!", "success");
    } catch (error) {
      console.error("Delete failed", error);
      showToast("Lỗi khi xóa trên Server!", "error");
      setBranches(previousBranches); 
    }
  };
  
  const handleCheckAndSaveUrl = async () => {
     setUrlCheckStatus({ type: null, msg: '' });
     const urlToTest = scriptUrl.trim();
     if (!urlToTest.startsWith("https://script.google.com/")) {
       setUrlCheckStatus({ type: 'error', msg: 'Link không hợp lệ (phải bắt đầu bằng https://script.google.com/...)' });
       return;
     }

     setIsCheckingUrl(true);
     showToast("Đang kiểm tra kết nối...", "loading");
     try {
       const data = await sheetAPI.getAllBranches(urlToTest);
       
       if (Array.isArray(data)) {
          sheetAPI.setScriptUrl(urlToTest);
          setUrlCheckStatus({ type: 'success', msg: `✅ Kết nối thành công! (${data.length} dòng). Đã lưu & cập nhật dữ liệu.` });
          showToast("Kết nối thành công!", "success");
          onReload(); 
       } else {
          setUrlCheckStatus({ type: 'error', msg: '⚠️ Kết nối được nhưng format dữ liệu không đúng.' });
          showToast("Lỗi format dữ liệu!", "error");
       }
     } catch (err: any) {
        setUrlCheckStatus({ type: 'error', msg: '❌ Kết nối thất bại: ' + err.message });
        showToast("Kết nối thất bại!", "error");
     } finally {
        setIsCheckingUrl(false);
     }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) { alert('Thiếu Tên hoặc Địa chỉ.'); return; }
    
    let finalSchedule: HolidaySchedule = { isEnabled: false, startTime: '', endTime: '', reason: '' };
    
    if (holidayUI.isEnabled) {
      if (!holidayUI.startDate || !holidayUI.endDate) { alert('Thiếu ngày nghỉ.'); return; }
      const start = new Date(`${holidayUI.startDate}T${holidayUI.startTime || '00:00'}:00`);
      const end = new Date(`${holidayUI.endDate}T${holidayUI.endTime || '23:59'}:00`);
      if (start >= end) { alert('Ngày kết thúc phải sau ngày bắt đầu.'); return; }
      
      finalSchedule = { 
        isEnabled: true, 
        startTime: start.toISOString(), 
        endTime: end.toISOString(), 
        reason: holidayUI.reason 
      };
    }

    const searchStr = normalizeString(`${formData.name} ${formData.address} ${formData.phoneNumber || ''}`);
    const updatedAt = new Date().toISOString(); 
    const previousBranches = [...branches];
    const cleanPhone = normalizePhoneNumber(formData.phoneNumber);

    let newBranchData: Branch;
    let isUpdate = false;
    let isTempId = false;

    if (editingId) {
      isUpdate = true;
      const oldBranch = branches.find(b => b.id === editingId)!;
      isTempId = editingId.startsWith('init-') || editingId.startsWith('gen-');
      
      let currentHistory = [...(oldBranch.holidayHistory || [])];
      
      if (finalSchedule.isEnabled) {
         currentHistory = currentHistory.filter(h => 
            !(h.startTime === finalSchedule.startTime && h.endTime === finalSchedule.endTime)
         );
         currentHistory.push(finalSchedule);
         currentHistory.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      }

      newBranchData = {
        ...oldBranch,
        id: isTempId ? `br-${Date.now()}` : oldBranch.id, 
        name: formData.name, manager: formData.manager, address: formData.address,
        phoneNumber: cleanPhone, isActive: formData.isActive, note: formData.note,
        searchStr, holidaySchedule: finalSchedule, holidayHistory: currentHistory, updatedAt
      };
    } else {
      newBranchData = {
        id: `br-${Date.now()}`, 
        name: formData.name, manager: formData.manager, address: formData.address,
        phoneNumber: cleanPhone, isActive: formData.isActive, note: formData.note,
        searchStr, 
        holidaySchedule: finalSchedule, 
        holidayHistory: finalSchedule.isEnabled ? [finalSchedule] : [],
        updatedAt, originalName: formData.name
      };
    }

    if (isUpdate) {
      setBranches(branches.map(b => b.id === editingId ? newBranchData : b));
    } else {
      setBranches([newBranchData, ...branches]);
    }
    
    // Sau khi save thì về list
    setActiveTab('list');
    setEditingId(null);
    resetForm();

    const payload = (isUpdate && isTempId) 
        ? { ...newBranchData, originalName: previousBranches.find(b => b.id === editingId)?.originalName } 
        : newBranchData;

    showToast("Đang lưu lên Google Sheet...", "loading");
    const apiCall = isUpdate ? sheetAPI.update(payload) : sheetAPI.create(payload);

    apiCall.then(() => showToast("Lưu thành công!", "success"))
      .catch((err) => {
         console.error("Sync failed", err);
         showToast("Lỗi đồng bộ Sheet! (Đã lưu offline)", "error");
      });
  };

  const filteredBranches = branches.filter(b => {
    const s = searchTerm.toLowerCase();
    return (b.name||"").toLowerCase().includes(s) || (b.address||"").toLowerCase().includes(s) || (b.manager||"").toLowerCase().includes(s);
  }).sort((a, b) => {
     const getPriority = (branch: Branch) => {
        if (!branch.holidaySchedule?.isEnabled) return 3;
        const start = new Date(branch.holidaySchedule.startTime);
        const end = new Date(branch.holidaySchedule.endTime);
        if (now >= start && now <= end) return 1;
        if (now < start) return 2;
        return 3;
     };

     const pA = getPriority(a);
     const pB = getPriority(b);
     if (pA !== pB) return pA - pB;
     return (a.name || "").localeCompare(b.name || "");
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8B1E1E] to-[#601414] flex flex-col items-center justify-center p-4">
        {toast && (
           <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all transform animate-fade-in ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              <span className="font-bold text-sm">{toast.msg}</span>
           </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up border-4 border-[#D4AF37]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#8B1E1E] font-brand uppercase tracking-widest mb-2">Trường Bào Ngư</h1>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Hệ thống quản trị tập trung</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mật khẩu truy cập</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-[#8B1E1E] focus:ring-4 focus:ring-[#8B1E1E]/10 outline-none text-lg transition-all" 
                placeholder="Nhập mật khẩu quản trị..." 
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#8B1E1E] hover:bg-[#721515] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] uppercase tracking-wide text-sm flex items-center justify-center gap-2"
            >
              <span>Đăng Nhập</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-400 italic">
            Phiên bản 2.0 - Bảo mật & Tiện dụng
          </div>
        </div>
      </div>
    );
  }

  // --- COMPONENT: FORM NHẬP LIỆU (Reused) ---
  const BranchForm = () => (
    <div className={`h-full flex flex-col bg-white`}>
       <div className={`p-4 md:p-5 relative overflow-y-auto flex-1 transition-colors duration-300 ${editingId ? 'bg-amber-50' : 'bg-white'}`}>
          <h3 className={`text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2 ${editingId ? 'text-[#D4AF37]' : 'text-[#8B1E1E]'}`}>
            {editingId ? <span>✏️ Cập Nhật Chi Nhánh</span> : <span>➕ Thêm Chi Nhánh Mới</span>}
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4 pb-24 md:pb-0" autoComplete="off">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
              <span className="text-sm font-bold text-gray-700 uppercase">Trạng thái</span>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-[#8B1E1E]"/>
                <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.isActive ? 'bg-[#8B1E1E]' : 'bg-gray-300'}`}></label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Chi Nhánh <span className="text-red-500">*</span></label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8B1E1E]/20 outline-none text-base bg-white" required placeholder="VD: CN Đống Đa" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quản Lý</label>
                <input type="text" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} className="w-full p-3 border rounded-lg outline-none text-base bg-white" placeholder="Tên QL"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SĐT</label>
                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-3 border rounded-lg outline-none text-base bg-white" placeholder="09xxxx"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa Chỉ <span className="text-red-500">*</span></label>
              <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-[#8B1E1E]/20 outline-none text-base bg-white" required placeholder="Số nhà, đường, phường, quận..." />
            </div>

            <div className={`border rounded-lg p-3 ${holidayUI.isEnabled ? 'bg-red-50 border-red-200' : 'bg-white border-dashed border-gray-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#8B1E1E] uppercase flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Bếp nghỉ
                </label>
                <input type="checkbox" checked={holidayUI.isEnabled} onChange={handleToggleHoliday} className="w-6 h-6 accent-[#8B1E1E]" />
              </div>
              {holidayUI.isEnabled && (
                <div className="space-y-3 text-sm animate-fade-in">
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-500">Bắt đầu:</span> 
                      <div className="flex gap-2">
                         <input type="date" value={holidayUI.startDate} onChange={e => setHolidayUI({...holidayUI, startDate: e.target.value})} className="border p-2 rounded flex-1 bg-white"/> 
                         <TimePicker24h value={holidayUI.startTime} onChange={v => setHolidayUI({...holidayUI, startTime: v})}/>
                      </div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-500">Kết thúc:</span>
                      <div className="flex gap-2">
                         <input type="date" value={holidayUI.endDate} onChange={e => setHolidayUI({...holidayUI, endDate: e.target.value})} className="border p-2 rounded flex-1 bg-white"/> 
                         <TimePicker24h value={holidayUI.endTime} onChange={v => setHolidayUI({...holidayUI, endTime: v})}/>
                      </div>
                   </div>
                   <input type="text" value={holidayUI.reason} onChange={e => setHolidayUI({...holidayUI, reason: e.target.value})} placeholder="Lý do nghỉ..." className="w-full border p-2 rounded bg-white"/>
                </div>
              )}
            </div>

            {editingId && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between items-center">
                  <span>Thống kê lịch sử nghỉ:</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">
                    {currentEditingBranch?.holidayHistory?.length || 0} lần
                  </span>
                </label>
                {Object.keys(editingStats).length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {Object.entries(editingStats).sort((a,b) => Number(b[0]) - Number(a[0])).map(([year, stat]: any) => (
                       <div key={year} className="bg-white rounded border border-gray-200 p-2 text-xs">
                          <div className="flex justify-between font-bold text-[#8B1E1E] mb-1">
                             <span>Năm {year}</span>
                             <span>Tổng: {stat.total} lần</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                             {Object.entries(stat.months).map(([m, c]) => (
                                <span key={m} className="bg-gray-50 border px-1.5 rounded text-gray-600 font-medium">
                                  T{m}: <span className="text-black">{c as any}</span>
                                </span>
                             ))}
                          </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-2 border border-dashed rounded bg-gray-50">Chưa có dữ liệu lịch sử</p>
                )}
              </div>
            )}

             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú (Nội bộ)</label>
              <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-2 border bg-yellow-50 rounded text-sm" placeholder="Ghi chú admin..." />
            </div>

            <div className="flex gap-3 pt-2 pb-6 md:pb-0 sticky bottom-0 bg-white/95 backdrop-blur border-t md:border-t-0 p-4 md:p-0 -mx-4 md:mx-0 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] md:shadow-none z-10">
               <button type="submit" className={`flex-1 text-white font-bold py-3.5 rounded-lg shadow-md transition-transform active:scale-95 text-sm uppercase flex items-center justify-center gap-2 ${editingId ? 'bg-[#D4AF37]' : 'bg-[#8B1E1E]'}`}>
                 {editingId ? <span>💾 Lưu Thay Đổi</span> : <span>➕ Thêm Mới</span>}
               </button>
               {editingId && <button type="button" onClick={handleCancelEdit} className="px-5 bg-gray-200 font-bold rounded-lg hover:bg-gray-300 text-sm">Hủy</button>}
            </div>
          </form>
       </div>
    </div>
  );

  // --- LOGS COMPONENT ---
  const LogsView = () => (
    <div className="w-full h-full bg-gray-50 flex flex-col pb-16 md:pb-0">
      <div className="p-4 md:p-6 bg-white border-b flex justify-between items-end flex-shrink-0">
        <div>
            <h3 className="text-xl font-bold text-[#8B1E1E] mb-1">Lịch Sử Tra Cứu</h3>
            <p className="text-sm text-gray-500">Nhật ký hoạt động của hệ thống.</p>
        </div>
        {loadingLogs && <div className="text-xs text-gray-400 italic animate-pulse">Đang tải...</div>}
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Tổng Log</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800">{logs.length}</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Thành công</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">{logs.filter(l => l.isSuccess).length}</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Thất bại</p>
            <p className="text-xl md:text-2xl font-bold text-red-600">{logs.filter(l => !l.isSuccess).length}</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Tỉ lệ AI</p>
            <p className="text-xl md:text-2xl font-bold text-blue-600">
              {logs.length ? Math.round((logs.filter(l => l.source === 'AI').length / logs.length) * 100) : 0}%
            </p>
          </div>
      </div>
      
      <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-[600px] md:min-w-0">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs sticky top-0 shadow-sm">
                  <tr>
                      <th className="px-4 py-3 w-[150px]">Thời Gian</th>
                      <th className="px-4 py-3">Nội dung</th>
                      <th className="px-4 py-3">Kết quả</th>
                      <th className="px-4 py-3 text-center w-[100px]">Nguồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                            {log.query}
                        </td>
                        <td className="px-4 py-3">
                            {log.isSuccess ? (
                              <span className="text-green-700 font-bold flex items-center gap-1">
                                ✓ {log.resultBranch}
                              </span>
                            ) : (
                              <span className="text-red-500 text-xs">{log.resultBranch || 'Lỗi không xác định'}</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${log.source === 'AI' ? 'bg-blue-50 text-blue-600 border-blue-200' : log.source === 'FAIL' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                              {log.source}
                            </span>
                        </td>
                      </tr>
                  ))}
                  {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400 italic">Chưa có lịch sử tìm kiếm nào được ghi nhận.</td>
                      </tr>
                  )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="bg-white h-screen flex flex-col relative overflow-hidden">
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
         <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all transform duration-300 animate-fade-in ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#D4AF37] text-white'}`}>
            <span className="font-bold text-sm">{toast.msg}</span>
         </div>
      )}

      {/* HEADER (Sticky on Mobile, Static on Desktop) */}
      <div className={`bg-[#8B1E1E] px-4 py-3 md:px-6 md:py-4 flex justify-between items-center text-white flex-shrink-0 z-30 shadow-md`}>
        <div className="flex items-center gap-4">
           <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-bold font-brand uppercase tracking-wider">Trường Bào Ngư</h2>
              <span className="text-[10px] opacity-80 uppercase tracking-widest flex items-center gap-2">
                 Admin V2
                 <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${branches.length > 0 ? 'bg-green-500/20 text-green-200 border border-green-500/50' : 'bg-red-500/20 text-red-200 border border-red-500/50'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${branches.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                    {branches.length > 0 ? 'Online' : 'Offline'}
                 </span>
              </span>
           </div>
           
           {/* DESKTOP TABS */}
           <div className="hidden md:flex bg-[#601414] p-1 rounded-lg ml-4">
              <button onClick={() => setActiveTab('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${(activeTab === 'list' || activeTab === 'form') ? 'bg-white text-[#8B1E1E] shadow' : 'text-white/70 hover:text-white'}`}>Chi Nhánh</button>
              <button onClick={() => setActiveTab('logs')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'logs' ? 'bg-white text-[#8B1E1E] shadow' : 'text-white/70 hover:text-white'}`}>Nhật Ký</button>
           </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* DESKTOP: Config Toggle */}
          {(activeTab === 'list' || activeTab === 'form') && (
            <button onClick={() => setShowConfig(!showConfig)} className={`hidden md:block p-2 rounded-full transition-all border ${showConfig ? 'bg-white text-[#8B1E1E] border-white' : 'bg-white/10 hover:bg-white/20 text-white border-transparent'}`} title="Cấu hình kết nối Sheet">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
              </svg>
            </button>
          )}
          
          <button onClick={handleManualReload} className="p-2 hover:bg-white/20 rounded-full text-white" title="Tải lại dữ liệu">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          
          <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-full text-white" title="Đăng xuất">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
          </button>
        </div>
      </div>

      {showConfig && activeTab !== 'logs' && (
        <div className="bg-gray-800 text-white p-4 border-b border-gray-600 animate-fade-in shadow-inner flex-shrink-0 z-20 relative hidden md:block">
           <p className="text-xs text-gray-400 mb-1 uppercase font-bold">Google Apps Script URL (Exec Link):</p>
           <div className="flex flex-col gap-2">
             <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                   <input type={isUrlVisible ? "text" : "password"} value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#D4AF37] outline-none pr-10" placeholder="https://script.google.com/macros/s/.../exec" />
                   <button type="button" onClick={() => setIsUrlVisible(!isUrlVisible)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white" title={isUrlVisible ? "Ẩn link" : "Hiện link"}>{isUrlVisible ? "Ẩn" : "Hiện"}</button>
                </div>
                <button onClick={handleCheckAndSaveUrl} disabled={isCheckingUrl} className={`bg-[#D4AF37] hover:bg-[#b8962e] text-[#8B1E1E] font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-all whitespace-nowrap ${isCheckingUrl ? 'opacity-70 cursor-wait' : ''}`}>{isCheckingUrl ? 'Test...' : 'Lưu'}</button>
             </div>
             {urlCheckStatus.msg && <div className={`text-xs font-bold p-2 rounded flex-1 ${urlCheckStatus.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-900 text-red-100'}`}>{urlCheckStatus.msg}</div>}
           </div>
        </div>
      )}

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden bg-gray-100 relative flex flex-col md:flex-row">
        
        {/* VIEW: LOGS */}
        {activeTab === 'logs' && <LogsView />}

        {/* VIEW: BRANCHES & FORM (Split on Desktop, Tabbed on Mobile) */}
        {activeTab !== 'logs' && (
            <>
                {/* FORM COLUMN:
                    - Mobile: Show only if activeTab is 'form'
                    - Desktop: Always show (Split view)
                */}
                <div 
                  ref={formRef}
                  className={`
                     bg-white border-r border-gray-200 shadow-xl z-20 flex flex-col
                     md:w-1/3 lg:w-1/4 md:relative md:order-1 
                     ${activeTab === 'form' ? 'flex flex-1' : 'hidden md:flex'}
                  `}
                >
                   <BranchForm />
                </div>

                {/* LIST COLUMN:
                    - Mobile: Show only if activeTab is 'list'
                    - Desktop: Always show (Split view)
                */}
                <div className={`
                    flex-col h-full overflow-hidden order-1 md:order-2 bg-gray-50 relative
                    md:flex-1
                    ${activeTab === 'list' ? 'flex flex-1' : 'hidden md:flex'}
                `}>
                  <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex gap-2 flex-shrink-0 sticky top-0 z-10 shadow-sm">
                     <input type="text" placeholder="Tìm kiếm nhanh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-3 md:py-2.5 border rounded-lg focus:outline-none focus:border-[#8B1E1E] bg-gray-50 text-base shadow-inner" />
                     <div className="bg-[#8B1E1E] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow">{filteredBranches.length}</div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 pb-20 md:pb-6">
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
                       {filteredBranches.map(branch => {
                         const isHidden = branch.isActive === false;
                         let statusBadge = <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Hoạt động</span>;
                         
                         if (isHidden) {
                            statusBadge = <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Đã Ẩn</span>;
                         } else if (branch.holidaySchedule?.isEnabled) {
                            const start = new Date(branch.holidaySchedule.startTime);
                            const end = new Date(branch.holidaySchedule.endTime);
                            if (now >= start && now <= end) {
                               statusBadge = <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">Đang Nghỉ</span>;
                            } else if (now < start) {
                               statusBadge = <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Sắp Nghỉ</span>;
                            }
                         }

                         return (
                           <div key={branch.id} className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer ${editingId === branch.id ? 'ring-2 ring-[#D4AF37] bg-amber-50' : ''} ${isHidden ? 'opacity-60' : ''}`} onClick={(e) => prepareForm(branch)}>
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-[#8B1E1E] text-base md:text-lg">{branch.name}</h4>
                                {statusBadge}
                             </div>
                             <p className="text-gray-600 text-sm mb-3 leading-snug font-medium line-clamp-2">{branch.address}</p>
                             <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                                <div className="text-xs text-gray-500 font-medium flex flex-col gap-1">
                                   <span>QL: <span className="text-gray-800">{branch.manager}</span></span>
                                   {branch.phoneNumber && <span>SĐT: <span className="text-gray-800">{branch.phoneNumber}</span></span>}
                                </div>
                                <div className="flex gap-2">
                                   <button onClick={(e) => { e.stopPropagation(); prepareForm(branch); }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold text-xs uppercase px-3 py-1.5 rounded transition-colors">Sửa</button>
                                   <button onClick={(e) => handleDelete(e, branch.id)} className="text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs uppercase px-3 py-1.5 rounded transition-colors">Xóa</button>
                                </div>
                             </div>
                           </div>
                         )
                       })}
                     </div>
                  </div>
                </div>
            </>
        )}
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around pb-safe">
          <button 
             onClick={() => setActiveTab('list')}
             className={`flex flex-col items-center justify-center py-2 flex-1 transition-colors ${activeTab === 'list' ? 'text-[#8B1E1E]' : 'text-gray-400'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
             <span className="text-[10px] font-bold uppercase">Danh sách</span>
          </button>

          <button 
             onClick={() => prepareForm()}
             className={`flex flex-col items-center justify-center py-2 flex-1 transition-colors ${activeTab === 'form' ? 'text-[#8B1E1E]' : 'text-gray-400'}`}
          >
             {editingId ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
             )}
             <span className="text-[10px] font-bold uppercase">{editingId ? 'Sửa Chi Tiết' : 'Thêm Mới'}</span>
          </button>

          <button 
             onClick={() => setActiveTab('logs')}
             className={`flex flex-col items-center justify-center py-2 flex-1 transition-colors ${activeTab === 'logs' ? 'text-[#8B1E1E]' : 'text-gray-400'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             <span className="text-[10px] font-bold uppercase">Nhật Ký</span>
          </button>
      </div>

    </div>
  );
};
