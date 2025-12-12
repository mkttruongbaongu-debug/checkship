import React, { useState, useRef, useEffect } from 'react';
import { Branch, HolidaySchedule } from '../types';
import { normalizeString } from '../services/geminiService';
import { sheetAPI } from '../services/sheetService';

interface BranchManagerProps {
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
  onClose: () => void;
  onReload: () => void; // Callback để reload dữ liệu app
}

const ADMIN_PASSWORD = "TruongBaoNgu2026";

const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now.getTime() - offset)).toISOString().split('T')[0];
};

const calculateStats = (history: HolidaySchedule[]) => {
  const stats: Record<string, { total: number; months: Record<number, number> }> = {};
  if (!Array.isArray(history)) return stats;
  history.forEach(item => {
    if (!item.isEnabled || !item.startTime) return;
    const date = new Date(item.startTime);
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1; 
    if (!stats[year]) stats[year] = { total: 0, months: {} };
    stats[year].total += 1;
    stats[year].months[month] = (stats[year].months[month] || 0) + 1;
  });
  return stats;
};

// Component con: Bộ chọn giờ 24h
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
    <div className={`flex items-center border border-gray-300 rounded bg-white px-2 py-1.5 gap-1 focus-within:border-red-500 w-fit ${disabled ? 'bg-gray-100' : ''}`}>
       <input type="text" inputMode="numeric" value={hStr} onChange={handleHourChange} onBlur={handleHourBlur} disabled={disabled} className="w-8 text-center text-sm font-bold outline-none bg-transparent p-0" placeholder="HH" />
       <span className="text-gray-400 font-bold mb-0.5">:</span>
       <input type="text" inputMode="numeric" value={mStr} onChange={handleMinuteChange} onBlur={handleMinuteBlur} disabled={disabled} className="w-8 text-center text-sm font-bold outline-none bg-transparent p-0" placeholder="MM" />
    </div>
  );
};

export const BranchManager: React.FC<BranchManagerProps> = ({ branches, setBranches, onClose, onReload }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  // State thông báo trạng thái check URL
  const [urlCheckStatus, setUrlCheckStatus] = useState<{type: 'success' | 'error' | null, msg: string}>({ type: null, msg: '' });
  
  const [formData, setFormData] = useState({ 
    id: '', name: '', manager: '', address: '', phoneNumber: '', isActive: true, note: '' 
  });
  
  const [holidayUI, setHolidayUI] = useState({
    isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: ''
  });

  const [authPassword, setAuthPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setScriptUrl(sheetAPI.getCurrentUrl()); }, []);

  const currentEditingBranch = branches.find(b => b.id === editingId);
  const editingStats = currentEditingBranch && currentEditingBranch.holidayHistory 
    ? calculateStats(currentEditingBranch.holidayHistory) : {};

  const handleToggleHoliday = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const today = getTodayString();
      setHolidayUI({ ...holidayUI, isEnabled: true, startDate: holidayUI.startDate || today, endDate: holidayUI.endDate || today });
    } else {
      setHolidayUI({ ...holidayUI, isEnabled: false });
    }
  };

  const handleEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    setEditingId(branch.id);
    const isTempId = branch.id.startsWith('gen-') || branch.id.startsWith('init-');
    
    setFormData({
      id: isTempId ? `(Chưa có ID - ${branch.id})` : branch.id,
      name: branch.name || '', manager: branch.manager || '', address: branch.address || '',
      phoneNumber: branch.phoneNumber ? String(branch.phoneNumber) : '',
      isActive: branch.isActive !== undefined ? branch.isActive : true, note: branch.note || ''
    });
    
    if (branch.holidaySchedule?.isEnabled) {
      const startObj = new Date(branch.holidaySchedule.startTime);
      const endObj = new Date(branch.holidaySchedule.endTime);
      const startOffset = startObj.getTimezoneOffset() * 60000;
      const endOffset = endObj.getTimezoneOffset() * 60000;
      const startIso = (new Date(startObj.getTime() - startOffset)).toISOString();
      const endIso = (new Date(endObj.getTime() - endOffset)).toISOString();

      setHolidayUI({
        isEnabled: true, startDate: startIso.split('T')[0], startTime: startIso.split('T')[1].slice(0, 5),
        endDate: endIso.split('T')[0], endTime: endIso.split('T')[1].slice(0, 5), reason: branch.holidaySchedule.reason || ''
      });
    } else {
      setHolidayUI({ isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: '' });
    }
    setAuthPassword('');
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- LOGIC XÓA (OPTIMISTIC) ---
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.prompt(`CẢNH BÁO XÓA:\nNhập mật khẩu quản trị:`) !== ADMIN_PASSWORD) {
      alert("Sai mật khẩu!"); return;
    }
    if (!window.confirm("Xác nhận xóa?")) return;

    // 1. Optimistic Update: Xóa ngay lập tức khỏi UI
    const previousBranches = [...branches];
    const newBranches = branches.filter(b => b.id !== id);
    setBranches(newBranches);
    
    // Nếu đang edit thằng bị xóa thì reset form
    if (editingId === id) handleCancelEdit();

    // 2. Gửi request xóa dưới background
    try {
      await sheetAPI.delete(id);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Lỗi khi xóa trên Server. Dữ liệu sẽ được khôi phục.");
      setBranches(previousBranches); // Rollback nếu lỗi
    }
  };
  
  // Nút Lưu Link Script mới - có kiểm tra kết nối
  const handleCheckAndSaveUrl = async () => {
     setUrlCheckStatus({ type: null, msg: '' });
     const urlToTest = scriptUrl.trim();
     if (!urlToTest.startsWith("https://script.google.com/")) {
       setUrlCheckStatus({ type: 'error', msg: 'Link không hợp lệ (phải bắt đầu bằng https://script.google.com/...)' });
       return;
     }

     setIsCheckingUrl(true);
     try {
       // Test connection với URL mới nhập
       const data = await sheetAPI.getAllBranches(urlToTest);
       
       if (Array.isArray(data) && data.length > 0) {
          // Thành công & Có dữ liệu
          sheetAPI.setScriptUrl(urlToTest);
          setUrlCheckStatus({ type: 'success', msg: `✅ Kết nối thành công! (${data.length} dòng). Đã lưu & cập nhật dữ liệu.` });
          
          // Gọi hàm reload từ App component để refresh dữ liệu mà KHÔNG reload trang
          onReload(); 
       } else {
          // Thành công nhưng dữ liệu rỗng
          setUrlCheckStatus({ type: 'error', msg: '⚠️ Kết nối được nhưng KHÔNG CÓ DỮ LIỆU (0 dòng). Link chưa được lưu.' });
       }
     } catch (err: any) {
        setUrlCheckStatus({ type: 'error', msg: '❌ Kết nối thất bại: ' + err.message + '. Kiểm tra quyền truy cập Script.' });
     } finally {
        setIsCheckingUrl(false);
     }
  };

  // --- LOGIC LƯU (OPTIMISTIC UI) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) { alert('Thiếu Tên hoặc Địa chỉ.'); return; }

    if (authPassword.trim() !== ADMIN_PASSWORD) { alert("Sai mật khẩu!"); return; }

    let finalSchedule: HolidaySchedule = { isEnabled: false, startTime: '', endTime: '', reason: '' };
    if (holidayUI.isEnabled) {
      if (!holidayUI.startDate || !holidayUI.endDate) { alert('Thiếu ngày nghỉ.'); return; }
      const start = new Date(`${holidayUI.startDate}T${holidayUI.startTime || '00:00'}:00`);
      const end = new Date(`${holidayUI.endDate}T${holidayUI.endTime || '23:59'}:00`);
      if (start >= end) { alert('Ngày kết thúc phải sau ngày bắt đầu.'); return; }
      finalSchedule = { isEnabled: true, startTime: start.toISOString(), endTime: end.toISOString(), reason: holidayUI.reason };
    }

    const searchStr = normalizeString(`${formData.name} ${formData.address} ${formData.phoneNumber || ''}`);
    const updatedAt = new Date().toISOString(); 
    
    // Snapshot dữ liệu cũ để rollback nếu lỗi
    const previousBranches = [...branches];

    // --- XỬ LÝ DỮ LIỆU ---
    let newBranchData: Branch;
    let isUpdate = false;
    let isTempId = false;

    if (editingId) {
      isUpdate = true;
      const oldBranch = branches.find(b => b.id === editingId)!;
      isTempId = editingId.startsWith('init-') || editingId.startsWith('gen-');
      
      const currentHistory = oldBranch.holidayHistory || [];
      const newHistory = [...currentHistory];
      if (finalSchedule.isEnabled) {
         if (!newHistory.some(h => h.startTime === finalSchedule.startTime && h.endTime === finalSchedule.endTime)) {
             newHistory.push(finalSchedule);
         }
      }

      newBranchData = {
        ...oldBranch,
        id: isTempId ? `br-${Date.now()}` : oldBranch.id, // Cấp ID mới ngay lập tức nếu là temp
        name: formData.name, manager: formData.manager, address: formData.address,
        phoneNumber: formData.phoneNumber, isActive: formData.isActive, note: formData.note,
        searchStr, holidaySchedule: finalSchedule, holidayHistory: newHistory, updatedAt
      };
    } else {
      // Thêm mới
      newBranchData = {
        id: `br-${Date.now()}`, // Generate ID tạm thời (khá an toàn vì timestamp)
        name: formData.name, manager: formData.manager, address: formData.address,
        phoneNumber: formData.phoneNumber, isActive: formData.isActive, note: formData.note,
        searchStr, holidaySchedule: finalSchedule, holidayHistory: finalSchedule.isEnabled ? [finalSchedule] : [],
        updatedAt, originalName: formData.name
      };
    }

    // --- 1. OPTIMISTIC UPDATE: Cập nhật UI Ngay Lập Tức ---
    if (isUpdate) {
      setBranches(branches.map(b => b.id === editingId ? newBranchData : b));
    } else {
      setBranches([newBranchData, ...branches]);
    }
    
    // Reset Form & Đóng Modal (Tạo cảm giác xong ngay lập tức)
    handleCancelEdit(); 

    // --- 2. BACKGROUND SYNC: Gửi lên Server ---
    const payload = (isUpdate && isTempId) 
        ? { ...newBranchData, originalName: previousBranches.find(b => b.id === editingId)?.originalName } // Trường hợp update ID tạm
        : newBranchData;

    const apiCall = isUpdate ? sheetAPI.update(payload) : sheetAPI.create(payload);

    apiCall
      .then(() => {
         console.log("Synced to Sheet successfully");
      })
      .catch((err) => {
         console.error("Sync failed", err);
         alert("⚠️ Lỗi đồng bộ Google Sheet! Dữ liệu của bạn chỉ được lưu tạm trên máy này.\nChi tiết: " + err.message);
      });
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', manager: '', address: '', phoneNumber: '', isActive: true, note: '' });
    setHolidayUI({ isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: '' });
    setAuthPassword('');
  };

  const handleCancelEdit = () => { setEditingId(null); resetForm(); };

  const filteredBranches = branches.filter(b => {
    const s = searchTerm.toLowerCase();
    return (b.name||"").toLowerCase().includes(s) || (b.address||"").toLowerCase().includes(s) || (b.manager||"").toLowerCase().includes(s);
  });

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-fade-in w-full max-w-6xl h-[90vh] flex flex-col relative">
      <div className="bg-[#8B1E1E] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
        <h2 className="text-xl font-bold font-brand uppercase tracking-wider">Quản Lý Nhanh (Realtime UI)</h2>
        <div className="flex gap-2">
          {/* Nút Cấu hình URL */}
          <button 
             onClick={() => setShowConfig(!showConfig)} 
             className={`p-2 rounded-full transition-all border ${showConfig ? 'bg-white text-[#8B1E1E] border-white' : 'bg-white/10 hover:bg-white/20 text-white border-transparent'}`}
             title="Cấu hình kết nối Sheet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
            </svg>
          </button>
          
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
      </div>

      {showConfig && (
        <div className="bg-gray-800 text-white p-4 border-b border-gray-600 animate-fade-in shadow-inner">
           <p className="text-xs text-gray-400 mb-1 uppercase font-bold">Google Apps Script URL (Exec Link):</p>
           <div className="flex flex-col gap-2">
             <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={scriptUrl} 
                  onChange={(e) => setScriptUrl(e.target.value)} 
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#D4AF37] outline-none" 
                  placeholder="https://script.google.com/macros/s/.../exec" 
                />
                <button 
                  onClick={handleCheckAndSaveUrl} 
                  disabled={isCheckingUrl}
                  className={`bg-[#D4AF37] hover:bg-[#b8962e] text-[#8B1E1E] font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-all ${isCheckingUrl ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isCheckingUrl && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {isCheckingUrl ? 'Đang Test...' : 'Kiểm Tra & Lưu'}
                </button>
             </div>
             {/* Status Message */}
             {urlCheckStatus.msg && (
                <div className={`text-xs font-bold p-2 rounded ${urlCheckStatus.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-900 text-red-100'}`}>
                   {urlCheckStatus.msg}
                </div>
             )}
             <p className="text-[10px] text-gray-400 italic">* Hệ thống sẽ tự động cập nhật dữ liệu sau khi kết nối thành công.</p>
           </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden h-full">
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-4 overflow-y-auto pr-2 custom-scrollbar" ref={formRef}>
           <div className={`p-5 rounded-lg border shadow-sm relative ${editingId ? 'bg-amber-50 border-[#D4AF37]' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 border-b pb-2 ${editingId ? 'text-[#D4AF37]' : 'text-[#8B1E1E]'}`}>
                {editingId ? '✏️ Cập Nhật' : '➕ Thêm Mới'}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded border border-gray-200">
                  <span className="text-xs font-bold text-gray-600 uppercase">Hiển thị?</span>
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-green-600"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Chi Nhánh <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quản Lý</label><input type="text" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} className="w-full p-2 border rounded" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">SĐT</label><input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-2 border rounded" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa Chỉ <span className="text-red-500">*</span></label>
                  <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded resize-none" required />
                </div>

                {/* --- LỊCH NGHỈ --- */}
                <div className={`border-t border-dashed pt-4 mt-4 ${holidayUI.isEnabled ? 'bg-red-50 -mx-2 px-2 pb-2 rounded border border-red-200' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#8B1E1E] uppercase">Bếp nghỉ</label>
                    <input type="checkbox" checked={holidayUI.isEnabled} onChange={handleToggleHoliday} className="w-4 h-4 accent-[#8B1E1E]" />
                  </div>
                  {holidayUI.isEnabled && (
                    <div className="space-y-2 text-xs">
                       <div className="flex gap-1 items-center"><span className="w-12 font-bold">Từ:</span> <input type="date" value={holidayUI.startDate} onChange={e => setHolidayUI({...holidayUI, startDate: e.target.value})} className="border p-1 rounded flex-1"/> <TimePicker24h value={holidayUI.startTime} onChange={v => setHolidayUI({...holidayUI, startTime: v})}/></div>
                       <div className="flex gap-1 items-center"><span className="w-12 font-bold">Đến:</span> <input type="date" value={holidayUI.endDate} onChange={e => setHolidayUI({...holidayUI, endDate: e.target.value})} className="border p-1 rounded flex-1"/> <TimePicker24h value={holidayUI.endTime} onChange={v => setHolidayUI({...holidayUI, endTime: v})}/></div>
                       <input type="text" value={holidayUI.reason} onChange={e => setHolidayUI({...holidayUI, reason: e.target.value})} placeholder="Lý do nghỉ..." className="w-full border p-1 rounded"/>
                    </div>
                  )}
                </div>

                 <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú (Admin)</label>
                  <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-2 border bg-yellow-50 rounded text-xs" />
                </div>

                {/* --- THỐNG KÊ NHỎ --- */}
                {editingId && Object.keys(editingStats).length > 0 && (
                  <div className="text-[10px] text-gray-500 bg-gray-100 p-2 rounded">
                    <b>Lịch sử nghỉ:</b> {Object.entries(editingStats).map(([y, d]) => `${y} (${d.total} lần)`).join(', ')}
                  </div>
                )}

                <div className="bg-white p-2 rounded border border-red-100 mt-2">
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Mật khẩu xác nhận *" className="w-full p-2 border border-red-200 rounded text-sm font-bold" required />
                </div>

                <div className="flex gap-2 pt-2">
                   <button type="submit" className={`flex-1 text-white font-bold py-3 rounded shadow-sm transition-transform active:scale-95 text-sm uppercase ${editingId ? 'bg-[#D4AF37]' : 'bg-[#8B1E1E]'}`}>
                     {editingId ? 'Lưu Ngay' : 'Thêm Ngay'}
                   </button>
                   {editingId && <button type="button" onClick={handleCancelEdit} className="px-4 bg-gray-200 font-bold rounded hover:bg-gray-300 text-sm">Hủy</button>}
                </div>
              </form>
           </div>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <div className="mb-4 flex gap-2 flex-shrink-0">
             <input type="text" placeholder="Tìm nhanh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8B1E1E]" />
             <div className="bg-[#FFFBF0] px-3 py-2 rounded-lg border border-[#D4AF37] text-[#8B1E1E] font-bold text-sm">{branches.length}</div>
          </div>

          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 custom-scrollbar">
             <table className="w-full text-sm text-left border-collapse table-fixed">
                 <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs sticky top-0 shadow-sm z-30">
                   <tr>
                     <th className="px-4 py-3 border-b w-[30%]">Tên / Quản Lý</th>
                     <th className="px-4 py-3 border-b w-[40%]">Địa Chỉ</th>
                     <th className="px-4 py-3 border-b text-center w-[15%]">TT</th>
                     <th className="px-4 py-3 border-b text-right w-[15%]">#</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200 bg-white">
                   {filteredBranches.map(branch => {
                     const isHoliday = branch.holidaySchedule?.isEnabled;
                     const isHidden = branch.isActive === false;
                     return (
                       <tr key={branch.id} className={`hover:bg-amber-50 group ${editingId === branch.id ? 'bg-amber-100' : ''} ${isHidden ? 'opacity-50' : ''}`}>
                         <td className="px-4 py-2 align-top">
                           <div className="font-bold text-[#8B1E1E]">{branch.name}</div>
                           <div className="text-xs text-gray-500">{branch.manager} - {branch.phoneNumber}</div>
                         </td>
                         <td className="px-4 py-2 text-xs text-gray-600 align-top">{branch.address}</td>
                         <td className="px-4 py-2 text-center align-top">
                           {isHidden ? <span className="bg-gray-200 px-1 rounded text-[10px] font-bold">ẨN</span> : 
                            isHoliday ? <span className="bg-red-100 text-red-600 px-1 rounded text-[10px] font-bold">NGHỈ</span> : 
                            <span className="text-green-600 text-[10px] font-bold">BẬT</span>}
                         </td>
                         <td className="px-4 py-2 text-right align-top">
                            <div className="flex justify-end gap-1">
                              <button onClick={(e) => handleEdit(e, branch)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={(e) => handleDelete(e, branch.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
          </div>
        </div>
      </div>
    </div>
  );
};