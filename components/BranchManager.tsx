import React, { useState, useRef, useEffect } from 'react';
import { Branch, HolidaySchedule } from '../types';
import { normalizeString } from '../services/geminiService';
import { sheetAPI } from '../services/sheetService';

interface BranchManagerProps {
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
  onClose: () => void;
}

const ADMIN_PASSWORD = "TruongBaoNgu2026";

// Helper lấy ngày hiện tại YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now.getTime() - offset)).toISOString().split('T')[0];
};

// Helper: Tính toán thống kê từ lịch sử
const calculateStats = (history: HolidaySchedule[]) => {
  const stats: Record<string, { total: number; months: Record<number, number> }> = {};

  if (!Array.isArray(history)) return stats;

  history.forEach(item => {
    if (!item.isEnabled || !item.startTime) return;
    const date = new Date(item.startTime);
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1; // 1-12

    if (!stats[year]) {
      stats[year] = { total: 0, months: {} };
    }

    stats[year].total += 1;
    stats[year].months[month] = (stats[year].months[month] || 0) + 1;
  });

  return stats;
};

// Component con: Bộ chọn giờ 24h tùy chỉnh
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
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 23) num = 23;
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
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 59) num = 59;
    onChange(`${hStr}:${num.toString().padStart(2, '0')}`);
  };

  return (
    <div className={`flex items-center border border-gray-300 rounded bg-white px-2 py-1.5 gap-1 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 w-fit ${disabled ? 'bg-gray-100' : ''}`}>
       <div className="flex flex-col items-center">
         <input 
            type="text" 
            inputMode="numeric"
            value={hStr}
            onChange={handleHourChange}
            onBlur={handleHourBlur}
            disabled={disabled}
            className="w-8 text-center text-sm font-bold outline-none bg-transparent p-0"
            placeholder="HH"
         />
       </div>
       <span className="text-gray-400 font-bold mb-0.5">:</span>
       <div className="flex flex-col items-center">
         <input 
            type="text" 
            inputMode="numeric"
            value={mStr}
            onChange={handleMinuteChange}
            onBlur={handleMinuteBlur}
            disabled={disabled}
            className="w-8 text-center text-sm font-bold outline-none bg-transparent p-0"
            placeholder="MM"
         />
       </div>
       <div className="ml-1 text-[10px] text-gray-400 font-medium select-none bg-gray-100 px-1 rounded">
          24h
       </div>
    </div>
  );
};

export const BranchManager: React.FC<BranchManagerProps> = ({ branches, setBranches, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
  // State form chính
  const [formData, setFormData] = useState({ 
    id: '', // Mới thêm: Trường ID hiển thị
    name: '', 
    manager: '', 
    address: '', 
    phoneNumber: '', 
    isActive: true, 
    note: '' 
  });
  
  const [holidayUI, setHolidayUI] = useState({
    isEnabled: false,
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '23:59',
    reason: ''
  });

  const [authPassword, setAuthPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lấy URL hiện tại khi mount
    setScriptUrl(sheetAPI.getCurrentUrl());
  }, []);

  // Lấy thống kê cho chi nhánh đang edit
  const currentEditingBranch = branches.find(b => b.id === editingId);
  const editingStats = currentEditingBranch && currentEditingBranch.holidayHistory 
    ? calculateStats(currentEditingBranch.holidayHistory) 
    : {};

  const handleToggleHoliday = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    
    if (isChecked) {
      const today = getTodayString();
      setHolidayUI({
        ...holidayUI,
        isEnabled: true,
        startDate: holidayUI.startDate || today,
        startTime: '00:00',
        endDate: holidayUI.endDate || today,
        endTime: '23:59'
      });
    } else {
      setHolidayUI({ ...holidayUI, isEnabled: false });
    }
  };

  const handleEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    setEditingId(branch.id);
    
    // Nếu là ID tạm (gen-...) thì để trống ô ID trong form để người dùng biết là chưa có
    const isTempId = branch.id.startsWith('gen-') || branch.id.startsWith('init-');
    
    setFormData({
      id: isTempId ? `(Chưa có ID - ${branch.id})` : branch.id,
      name: branch.name || '',
      manager: branch.manager || '',
      address: branch.address || '',
      phoneNumber: branch.phoneNumber ? String(branch.phoneNumber) : '',
      isActive: branch.isActive !== undefined ? branch.isActive : true,
      note: branch.note || ''
    });
    
    if (branch.holidaySchedule && branch.holidaySchedule.isEnabled) {
      const startObj = new Date(branch.holidaySchedule.startTime);
      const endObj = new Date(branch.holidaySchedule.endTime);
      
      const startOffset = startObj.getTimezoneOffset() * 60000;
      const endOffset = endObj.getTimezoneOffset() * 60000;
      
      const startIsoLocal = (new Date(startObj.getTime() - startOffset)).toISOString();
      const endIsoLocal = (new Date(endObj.getTime() - endOffset)).toISOString();

      setHolidayUI({
        isEnabled: true,
        startDate: startIsoLocal.split('T')[0],
        startTime: startIsoLocal.split('T')[1].slice(0, 5),
        endDate: endIsoLocal.split('T')[0],
        endTime: endIsoLocal.split('T')[1].slice(0, 5),
        reason: branch.holidaySchedule.reason || ''
      });
    } else {
      setHolidayUI({
        isEnabled: false,
        startDate: '',
        startTime: '00:00',
        endDate: '',
        endTime: '23:59',
        reason: ''
      });
    }

    setAuthPassword('');
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    const input = window.prompt(`CẢNH BÁO XÓA:\n\nVui lòng nhập mật khẩu quản trị để xác nhận xóa vĩnh viễn chi nhánh này:`);
    if (input === null) return;

    if (input.trim() !== ADMIN_PASSWORD) {
      alert("Mật khẩu không đúng! Không thể xóa.");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa chi nhánh này khỏi Google Sheet không?")) {
      setIsSubmitting(true);
      try {
        await sheetAPI.delete(id);
        const newBranches = branches.filter(b => b.id !== id);
        setBranches(newBranches);
        if (editingId === id) {
          handleCancelEdit();
        }
        alert("Đã xóa chi nhánh thành công!");
      } catch (error) {
        alert("Lỗi kết nối: Không thể xóa trên Google Sheet.\n(Lưu ý: Nếu xóa 'Dữ liệu mẫu' thì chỉ xóa được ở Web, không xóa được ở Sheet nếu chưa đồng bộ)");
        // Vẫn xóa ở local để người dùng tiếp tục làm việc
        const newBranches = branches.filter(b => b.id !== id);
        setBranches(newBranches);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- HÀM MỚI: CÀI ĐẶT CẤU TRÚC SHEET ---
  const handleSetupSheet = async () => {
    const input = window.prompt(`CÀI ĐẶT CẤU TRÚC SHEET:\n\nHành động này sẽ thêm các cột (id, name, address, isActive, note...) vào Dòng 1 của Google Sheet nếu chưa có.\n\nNhập mật khẩu quản trị:`);
    if (input !== ADMIN_PASSWORD) {
       if (input !== null) alert("Mật khẩu sai");
       return;
    }

    setIsSubmitting(true);
    try {
      await sheetAPI.setupInitialColumns();
      alert("Đã khởi tạo cấu trúc cột thành công!\nBây giờ bạn có thể Thêm/Sửa dữ liệu để lưu vào Sheet.");
    } catch (e: any) {
      alert("Lỗi khi tạo cột: " + e.message + "\n(Nếu cột đã tồn tại, bạn có thể bỏ qua lỗi này)");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- HÀM LƯU URL SCRIPT MỚI ---
  const handleSaveScriptUrl = () => {
     if (!scriptUrl.trim().startsWith("https://script.google.com/")) {
       alert("Link không hợp lệ. Link phải bắt đầu bằng https://script.google.com/...");
       return;
     }
     sheetAPI.setScriptUrl(scriptUrl);
     alert("Đã lưu Link Google Sheet Database!");
  };

  // --- HÀM TEST KẾT NỐI ---
  const handleTestConnection = async () => {
    if (!scriptUrl) return;
    setIsTesting(true);
    try {
       const oldUrl = sheetAPI.getCurrentUrl();
       sheetAPI.setScriptUrl(scriptUrl);
       
       const data = await sheetAPI.getAllBranches();
       const isSuccess = Array.isArray(data);
       
       alert(`✅ KẾT NỐI THÀNH CÔNG!\n\nĐã tìm thấy ${isSuccess ? data.length : 0} dòng dữ liệu.\nScript hoạt động tốt.`);
    } catch(e: any) {
       alert(`❌ KẾT NỐI THẤT BẠI!\n\nLỗi: ${e.message}\n\nNguyên nhân có thể:\n1. Chưa Deploy Script dưới dạng 'Anyone'.\n2. Chưa dán code vào Code.gs.\n3. Link sai.`);
    } finally {
       setIsTesting(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Vui lòng nhập Tên chi nhánh và Địa chỉ.');
      return;
    }

    let finalHolidaySchedule: HolidaySchedule = {
      isEnabled: false,
      startTime: '',
      endTime: '',
      reason: ''
    };

    if (holidayUI.isEnabled) {
      if (!holidayUI.startDate || !holidayUI.endDate) {
        alert('Vui lòng chọn ngày Bắt đầu và ngày Kết thúc.');
        return;
      }
      const startDateTimeStr = `${holidayUI.startDate}T${holidayUI.startTime || '00:00'}:00`;
      const endDateTimeStr = `${holidayUI.endDate}T${holidayUI.endTime || '23:59'}:00`;
      const startDateObj = new Date(startDateTimeStr);
      const endDateObj = new Date(endDateTimeStr);

      if (startDateObj >= endDateObj) {
        alert('Thời gian Kết thúc phải sau thời gian Bắt đầu.');
        return;
      }
      finalHolidaySchedule = {
        isEnabled: true,
        startTime: startDateObj.toISOString(),
        endTime: endDateObj.toISOString(),
        reason: holidayUI.reason
      };
    }

    if (authPassword.trim() !== ADMIN_PASSWORD) {
      alert("Mật khẩu quản trị không chính xác! Vui lòng kiểm tra lại.");
      return;
    }

    const searchStr = normalizeString(`${formData.name} ${formData.address} ${formData.phoneNumber || ''} ${normalizeString(formData.name)}`);
    const updatedAt = new Date().toISOString(); 
    
    setIsSubmitting(true);

    try {
      if (editingId) {
        // --- LOGIC CẬP NHẬT ---
        const branchToUpdate = branches.find(b => b.id === editingId);
        
        // KIỂM TRA ID TẠM
        const isSampleData = editingId.startsWith('init-') || editingId.startsWith('gen-');

        if (branchToUpdate) {
             const currentHistory = branchToUpdate.holidayHistory || [];
             let newHistory = [...currentHistory];

             if (finalHolidaySchedule.isEnabled) {
               const isDuplicate = newHistory.some(h => 
                   h.startTime === finalHolidaySchedule.startTime && 
                   h.endTime === finalHolidaySchedule.endTime
               );
               if (!isDuplicate) {
                   newHistory.push(finalHolidaySchedule);
               }
             }

             // Tạo ID thật nếu chưa có
             const realId = isSampleData ? `br-${Date.now()}` : branchToUpdate.id;

             const updatedBranchData: Branch = {
                 ...branchToUpdate,
                 id: realId, // Luôn dùng ID thật
                 name: formData.name,
                 manager: formData.manager,
                 address: formData.address,
                 phoneNumber: formData.phoneNumber,
                 isActive: formData.isActive,
                 note: formData.note,
                 searchStr,
                 holidaySchedule: finalHolidaySchedule,
                 holidayHistory: newHistory,
                 updatedAt
             };

             if (isSampleData) {
               // Dữ liệu mẫu (chưa có ID trên Sheet)
               // Thay vì chỉ tạo mới mù quáng, ta gửi thêm 'originalName' để Script cố gắng tìm và update
               // (Lưu ý: Bạn cần update lại Code.gs để hỗ trợ việc này)
               
               // Gán object đặc biệt để Script mới có thể xử lý
               const payload = {
                 ...updatedBranchData,
                 originalName: branchToUpdate.originalName || branchToUpdate.name // Gửi tên cũ để tìm
               };

               await sheetAPI.update(payload);
               alert("Đã CẤP MÃ MỚI (ID) và Cập nhật dữ liệu vào Google Sheet thành công!");
             } else {
               // Dữ liệu thật -> Gọi Update bình thường
               await sheetAPI.update(updatedBranchData);
               alert("Đã cập nhật lên Google Sheet thành công!");
             }

             // Cập nhật UI
             const updatedBranches = branches.map(b => b.id === editingId ? updatedBranchData : b);
             setBranches(updatedBranches);
             setEditingId(null);
        }
      } else {
        // --- LOGIC THÊM MỚI ---
        const history = finalHolidaySchedule.isEnabled ? [finalHolidaySchedule] : [];
        const newBranch: Branch = {
          id: `br-${Date.now()}`,
          name: formData.name,
          manager: formData.manager,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          isActive: formData.isActive,
          note: formData.note,
          searchStr,
          holidaySchedule: finalHolidaySchedule,
          holidayHistory: history,
          updatedAt,
          originalName: formData.name
        };

        await sheetAPI.create(newBranch);
        setBranches([newBranch, ...branches]);
        alert("Đã thêm mới lên Google Sheet thành công!");
      }
      resetForm();
    } catch (error: any) {
      console.error(error);
      alert(`Lỗi: ${error.message || "Không thể lưu"}.\n\nMẹo: Hãy đảm bảo bạn đã cập nhật lại Code Google Script mới nhất.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', manager: '', address: '', phoneNumber: '', isActive: true, note: '' });
    setHolidayUI({ isEnabled: false, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59', reason: '' });
    setAuthPassword('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const filteredBranches = branches.filter(b => {
    const s = searchTerm.toLowerCase();
    const name = (b.name || "").toLowerCase();
    const address = (b.address || "").toLowerCase();
    const manager = (b.manager || "").toLowerCase();
    const phone = b.phoneNumber ? String(b.phoneNumber) : "";

    return (
      name.includes(s) || 
      address.includes(s) ||
      manager.includes(s) ||
      phone.includes(s)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-fade-in w-full max-w-6xl h-[90vh] flex flex-col relative">
      <div className="bg-[#8B1E1E] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
        <h2 className="text-xl font-bold font-brand uppercase tracking-wider">Quản Lý Danh Sách Chi Nhánh</h2>
        <div className="flex gap-2">
          {/* NÚT CẤU HÌNH DATABASE */}
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors focus:outline-none"
            title="Cấu hình kết nối Google Sheet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          </button>

          {/* NÚT CÀI ĐẶT SHEET (TẠO CỘT) */}
          <button 
            onClick={handleSetupSheet}
            className="bg-[#D4AF37] hover:bg-[#b8962e] text-[#8B1E1E] px-3 py-1 rounded text-xs font-bold uppercase transition-colors shadow-sm flex items-center gap-1"
            title="Tạo cột header cho Google Sheet nếu chưa có"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Cài đặt Sheet
          </button>
          
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none"
            title="Đóng cửa sổ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* --- MODAL CẤU HÌNH DATABASE --- */}
      {showConfig && (
        <div className="bg-gray-800 text-white p-4 border-b border-gray-600 animate-fade-in">
           <div className="max-w-3xl mx-auto">
             <h3 className="font-bold text-[#D4AF37] mb-2 uppercase text-sm">Cấu hình kết nối Google Sheet Database</h3>
             <p className="text-xs text-gray-300 mb-3">
               Để dữ liệu được lưu vào Google Sheet của riêng bạn, hãy dán <b>Web App URL</b> từ Google Apps Script của bạn vào đây.
               <br/>(Triển khai Script -&gt; Deploy as Web App -&gt; Access: Anyone).
             </p>
             <div className="flex gap-2 items-center">
               <input 
                 type="text" 
                 value={scriptUrl}
                 onChange={(e) => setScriptUrl(e.target.value)}
                 className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] text-white"
                 placeholder="https://script.google.com/macros/s/..."
               />
               <button 
                 onClick={handleSaveScriptUrl}
                 className="bg-[#D4AF37] text-[#8B1E1E] font-bold px-4 py-2 rounded text-sm hover:bg-[#b8962e]"
               >
                 Lưu Kết Nối
               </button>
               <button 
                 onClick={handleTestConnection}
                 disabled={isTesting || !scriptUrl}
                 className={`font-bold px-4 py-2 rounded text-sm border border-gray-500 hover:bg-gray-700 transition-colors flex items-center gap-1 ${isTesting ? 'opacity-50' : ''}`}
               >
                 {isTesting && <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                 Test
               </button>
             </div>
           </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden h-full">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-4 overflow-y-auto pr-2 custom-scrollbar" ref={formRef}>
           <div className={`p-5 rounded-lg border shadow-sm transition-colors duration-300 relative ${editingId ? 'bg-amber-50 border-[#D4AF37]' : 'bg-gray-50 border-gray-200'}`}>
              
              {/* LOADING OVERLAY */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
                  <svg className="animate-spin h-8 w-8 text-[#8B1E1E] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[#8B1E1E] font-bold text-sm animate-pulse">Đang đồng bộ Sheet...</span>
                </div>
              )}

              <h3 className={`text-lg font-bold mb-4 border-b pb-2 ${editingId ? 'text-[#D4AF37]' : 'text-[#8B1E1E]'}`}>
                {editingId ? '✏️ Cập Nhật Chi Nhánh' : '➕ Thêm Chi Nhánh Mới'}
              </h3>
              
              {editingId && (editingId.startsWith('init-') || editingId.startsWith('gen-')) && (
                 <div className="mb-3 text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 italic">
                   Lưu ý: Dữ liệu này chưa có Mã ID trong Sheet. Khi lưu, hệ thống sẽ cấp Mã Mới.
                 </div>
              )}

              <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
                
                {/* --- TRẠNG THÁI HOẠT ĐỘNG (TOGGLE) --- */}
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded border border-gray-200">
                  <span className="text-xs font-bold text-gray-600 uppercase">Hiển thị chi nhánh này?</span>
                  <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        name="toggleActive" 
                        id="toggleActive" 
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        disabled={isSubmitting}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                        style={{
                          right: formData.isActive ? '0' : 'auto',
                          left: formData.isActive ? 'auto' : '0',
                          borderColor: formData.isActive ? '#10B981' : '#ccc'
                        }}
                      />
                      <label htmlFor="toggleActive" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                  </div>
                </div>

                {/* --- MÃ ID (MỚI THÊM) --- */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Chi Nhánh (ID)</label>
                  <input
                    type="text"
                    value={formData.id}
                    readOnly
                    className="w-full p-2 border border-gray-200 bg-gray-100 text-gray-500 rounded text-xs font-mono"
                  />
                </div>

                {/* --- THÔNG TIN CƠ BẢN --- */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Chi Nhánh <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: CN Cẩm Lệ"
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#8B1E1E] focus:ring-1 focus:ring-[#8B1E1E] outline-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quản Lý</label>
                    <input
                      type="text"
                      value={formData.manager}
                      onChange={e => setFormData({...formData, manager: e.target.value})}
                      placeholder="VD: Chị Lan"
                      className="w-full p-2 border border-gray-300 rounded focus:border-[#8B1E1E] focus:ring-1 focus:ring-[#8B1E1E] outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="09xx..."
                      className="w-full p-2 border border-gray-300 rounded focus:border-[#8B1E1E] focus:ring-1 focus:ring-[#8B1E1E] outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa Chỉ Chi Tiết <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="VD: 43 Nhơn Hòa 19..."
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#8B1E1E] focus:ring-1 focus:ring-[#8B1E1E] outline-none resize-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* --- CẤU HÌNH LỊCH NGHỈ (GIAO DIỆN MỚI 24H) --- */}
                <div className={`border-t border-dashed pt-4 mt-4 ${holidayUI.isEnabled ? 'bg-red-50 -mx-2 px-2 pb-2 rounded border border-red-200' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-[#8B1E1E] uppercase flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cấu hình nghỉ (Bếp nghỉ)
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                          type="checkbox" 
                          name="toggle" 
                          id="toggle" 
                          checked={holidayUI.isEnabled}
                          onChange={handleToggleHoliday}
                          disabled={isSubmitting}
                          className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                          style={{
                            right: holidayUI.isEnabled ? '0' : 'auto',
                            left: holidayUI.isEnabled ? 'auto' : '0',
                            borderColor: holidayUI.isEnabled ? '#8B1E1E' : '#ccc'
                          }}
                        />
                        <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${holidayUI.isEnabled ? 'bg-[#8B1E1E]' : 'bg-gray-300'}`}></label>
                    </div>
                  </div>

                  {holidayUI.isEnabled && (
                    <div className="space-y-3 animate-fade-in">
                       {/* BẮT ĐẦU */}
                       <div className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between">
                             <span>Bắt đầu nghỉ</span>
                             <span className="text-xs font-normal text-red-500">(dd/mm/yyyy - HH:mm)</span>
                          </div>
                          <div className="flex gap-2 items-center">
                             <input
                               type="date"
                               value={holidayUI.startDate}
                               onChange={e => setHolidayUI({...holidayUI, startDate: e.target.value})}
                               className="flex-1 p-1.5 text-xs border border-gray-300 rounded focus:border-red-500 outline-none h-[34px]"
                               required={holidayUI.isEnabled}
                               disabled={isSubmitting}
                             />
                             <TimePicker24h 
                                value={holidayUI.startTime} 
                                onChange={(val) => setHolidayUI({...holidayUI, startTime: val})}
                                disabled={!holidayUI.isEnabled || isSubmitting}
                             />
                          </div>
                       </div>

                       {/* KẾT THÚC */}
                       <div className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between">
                             <span>Kết thúc nghỉ</span>
                             <span className="text-xs font-normal text-red-500">(dd/mm/yyyy - HH:mm)</span>
                          </div>
                          <div className="flex gap-2 items-center">
                             <input
                               type="date"
                               value={holidayUI.endDate}
                               onChange={e => setHolidayUI({...holidayUI, endDate: e.target.value})}
                               className="flex-1 p-1.5 text-xs border border-gray-300 rounded focus:border-red-500 outline-none h-[34px]"
                               required={holidayUI.isEnabled}
                               disabled={isSubmitting}
                             />
                             <TimePicker24h 
                                value={holidayUI.endTime} 
                                onChange={(val) => setHolidayUI({...holidayUI, endTime: val})}
                                disabled={!holidayUI.isEnabled || isSubmitting}
                             />
                          </div>
                       </div>

                       <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú nghỉ (Khách thấy)</label>
                          <input
                            type="text"
                            value={holidayUI.reason || ''}
                            onChange={e => setHolidayUI({...holidayUI, reason: e.target.value})}
                            placeholder="VD: Bếp nghỉ trưa"
                            className="w-full p-1.5 text-xs border border-gray-300 rounded outline-none"
                            disabled={isSubmitting}
                          />
                       </div>
                    </div>
                  )}
                </div>

                 {/* --- GHI CHÚ NỘI BỘ (ADMIN) --- */}
                 <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú nội bộ (Chỉ Admin thấy)</label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    placeholder="VD: Chi nhánh sắp chuyển địa điểm, chủ nhà khó tính..."
                    className="w-full p-2 border border-gray-300 bg-yellow-50 rounded focus:border-[#D4AF37] outline-none text-xs"
                    disabled={isSubmitting}
                  />
                </div>

                {/* --- THỐNG KÊ (Chỉ hiển thị khi đang Edit) --- */}
                {editingId && (
                  <div className="border border-[#D4AF37]/50 rounded-lg bg-[#FFFBF0] overflow-hidden mt-2">
                    <div className="px-3 py-2 bg-[#D4AF37]/10 border-b border-[#D4AF37]/30 flex justify-between items-center">
                      <span className="text-xs font-bold text-[#8B1E1E] uppercase">Thống kê tần suất nghỉ</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#8B1E1E" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto custom-scrollbar">
                      {Object.keys(editingStats).length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center">Chưa có dữ liệu lịch sử</p>
                      ) : (
                        Object.entries(editingStats)
                          .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // Sort năm giảm dần
                          .map(([year, data]) => (
                          <div key={year} className="mb-3 last:mb-0">
                            <div className="flex justify-between text-xs font-bold text-gray-700 mb-1 border-b border-dashed border-gray-300 pb-1">
                              <span>Năm {year}</span>
                              <span className="text-[#8B1E1E]">{data.total} lần</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.entries(data.months).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([month, count]) => (
                                <div key={month} className="text-[10px] bg-white border rounded px-1 text-center text-gray-600">
                                  T{month}: <span className="font-bold text-black">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* --- XÁC THỰC --- */}
                <div className="bg-white p-3 rounded border border-red-100 mt-2">
                  <label className="block text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    Mật khẩu xác nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="w-full p-2 border border-red-200 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-semibold"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                   <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex-1 text-white font-bold py-3 rounded shadow-sm transition-colors text-sm uppercase ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : (editingId ? 'bg-[#D4AF37] hover:bg-[#b8962e]' : 'bg-[#8B1E1E] hover:bg-[#6d1616]')}`}
                   >
                     {isSubmitting ? 'Đang lưu...' : (editingId ? 'Lưu Cập Nhật' : 'Thêm Mới')}
                   </button>
                   {editingId && (
                     <button 
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="px-4 bg-gray-200 text-gray-700 font-bold py-3 rounded hover:bg-gray-300 transition-colors text-sm uppercase"
                     >
                       Hủy
                     </button>
                   )}
                </div>
              </form>
           </div>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <div className="mb-4 flex gap-2 flex-shrink-0">
             <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tên, địa chỉ, quản lý, sđt..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B1E1E] focus:ring-1 focus:ring-[#8B1E1E]/20 transition-all"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             <div className="bg-[#FFFBF0] px-3 py-2 rounded-lg border border-[#D4AF37] text-[#8B1E1E] font-bold text-sm flex items-center whitespace-nowrap shadow-sm">
                Tổng: {branches.length}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg shadow-inner bg-gray-50 relative custom-scrollbar">
             {filteredBranches.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                 </svg>
                 <p className="font-medium">Không tìm thấy dữ liệu phù hợp</p>
               </div>
             ) : (
               <table className="w-full text-sm text-left border-collapse table-fixed">
                 <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs sticky top-0 shadow-sm z-30">
                   <tr>
                     <th className="px-4 py-3 bg-gray-100 border-b w-[25%]">Tên Chi Nhánh</th>
                     <th className="px-4 py-3 bg-gray-100 border-b w-[35%]">Địa Chỉ</th>
                     <th className="px-4 py-3 bg-gray-100 border-b text-center w-[22%]">Trạng Thái</th>
                     <th className="px-4 py-3 bg-gray-100 border-b text-right w-[18%]">Thao Tác</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200 bg-white">
                   {filteredBranches.map(branch => {
                     const isHoliday = branch.holidaySchedule?.isEnabled && 
                                       branch.holidaySchedule.startTime && 
                                       branch.holidaySchedule.endTime &&
                                       new Date() >= new Date(branch.holidaySchedule.startTime) &&
                                       new Date() <= new Date(branch.holidaySchedule.endTime);

                     // Tính tổng nghỉ năm nay cho danh sách
                     const currentYear = new Date().getFullYear();
                     const yearStats = branch.holidayHistory 
                        ? calculateStats(branch.holidayHistory)[currentYear]?.total || 0
                        : 0;

                     // Hiển thị trạng thái
                     const isHidden = branch.isActive === false;

                     return (
                       <tr 
                          key={branch.id} 
                          className={`hover:bg-[#FFFBF0] transition-colors group ${editingId === branch.id ? 'bg-amber-50 ring-2 ring-inset ring-[#D4AF37]/50' : ''} ${isHidden ? 'opacity-60 bg-gray-50' : ''}`}
                       >
                         <td className="px-4 py-3 font-medium text-[#8B1E1E] align-top">
                           <div className="text-base truncate flex items-center gap-1" title={branch.name}>
                             {branch.name}
                             {isHidden && (
                               <span className="text-[9px] bg-gray-500 text-white px-1 rounded ml-1">ẨN</span>
                             )}
                           </div>
                           <div className="text-xs text-gray-500 font-normal mt-1 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A9.948 9.948 0 0010 18ad9.948 9.948 0 004.793-2.39A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                              </svg>
                              <span>{branch.manager}</span>
                           </div>
                           {branch.phoneNumber && (
                             <div className="text-xs text-blue-600 font-normal mt-0.5 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                <span>{branch.phoneNumber}</span>
                             </div>
                           )}
                           {/* Hiển thị note nếu có */}
                           {branch.note && (
                             <div className="mt-1 text-[10px] text-gray-400 bg-yellow-50 border border-yellow-100 p-1 rounded inline-block max-w-full truncate">
                               Note: {branch.note}
                             </div>
                           )}
                         </td>
                         <td className="px-4 py-3 text-gray-600 align-top">
                           {branch.address}
                         </td>
                         <td className="px-4 py-3 text-center align-top">
                           {isHidden ? (
                              <span className="inline-block px-2 py-1 text-[10px] font-bold text-gray-500 bg-gray-200 rounded border border-gray-300 shadow-sm whitespace-nowrap">
                               ĐÃ ẨN
                              </span>
                           ) : isHoliday ? (
                             <span className="inline-block px-2 py-1 text-[10px] font-bold text-red-600 bg-red-100 rounded border border-red-200 shadow-sm whitespace-nowrap">
                               BẾP NGHỈ
                             </span>
                           ) : (
                              <span className="inline-block px-2 py-1 text-[10px] font-bold text-green-600 bg-green-100 rounded border border-green-200 shadow-sm whitespace-nowrap">
                               HOẠT ĐỘNG
                              </span>
                           )}
                           {branch.holidaySchedule?.isEnabled && !isHoliday && !isHidden && (
                              <div className="text-[10px] text-gray-400 italic mt-1">Có lịch đặt</div>
                           )}
                           {yearStats > 0 && (
                             <div className="mt-2 w-full px-1" title={`Tổng số lần nghỉ trong năm ${currentYear}`}>
                                <div className="flex items-center justify-between text-[9px] text-gray-500 bg-gray-50 rounded px-2 py-1 border border-gray-100">
                                  <span className="whitespace-nowrap">Năm {currentYear}:</span>
                                  <b className="text-[#8B1E1E] ml-1 whitespace-nowrap">{yearStats} lần</b>
                                </div>
                             </div>
                           )}
                         </td>
                         <td className="px-4 py-3 align-top text-right">
                            <div className="flex justify-end gap-2 relative whitespace-nowrap">
                              <button 
                                type="button"
                                onClick={(e) => handleEdit(e, branch)}
                                className={`p-2 rounded border transition-all shadow-sm ${editingId === branch.id ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-blue-600 border-gray-200 hover:bg-blue-50 hover:border-blue-200'}`}
                                title="Chỉnh sửa & Xem thống kê"
                                disabled={isSubmitting}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => handleDelete(e, branch.id)}
                                className="p-2 bg-white text-red-600 rounded border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                                title="Xóa vĩnh viễn"
                                disabled={isSubmitting}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};