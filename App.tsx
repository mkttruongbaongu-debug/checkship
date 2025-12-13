import React, { useState, useEffect, useCallback } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultCard } from './components/ResultCard';
import { BranchManager } from './components/BranchManager';
import { findNearestBranch, parseInitialBranchData, generateBranchSearchStr, normalizePhoneNumber } from './services/geminiService';
import { sheetAPI } from './services/sheetService';
import { BranchResult, Branch, SearchLog } from './types';

function App() {
  // State quản lý danh sách chi nhánh
  const [branches, setBranches] = useState<Branch[]>([]);
  // isDataLoading chỉ dùng để hiển thị trạng thái sync background, không chặn UI
  const [isDataLoading, setIsDataLoading] = useState(false);
  // Mặc định là offline cho đến khi fetch thành công
  const [isOfflineMode, setIsOfflineMode] = useState(true);

  const [result, setResult] = useState<BranchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Helper chuẩn hóa dữ liệu đầu vào
  const processBranchData = (rawList: any[]): Branch[] => {
     return rawList.map((b: any) => {
        const rawId = b.id || b.ID || b.Id || b.iD || b._id;
        const validId = (rawId && String(rawId).trim() !== "") ? String(rawId) : `gen-${Math.random()}`;
        const name = b.name || "";
        const address = b.address || "";
        // CHUẨN HÓA SỐ ĐIỆN THOẠI NGAY TỪ NGUỒN (XỬ LÝ MẤT SỐ 0 DO SHEET)
        const phone = normalizePhoneNumber(b.phoneNumber);

        return {
          ...b,
          id: validId,
          name: name,
          manager: b.manager || "",
          address: address,
          phoneNumber: phone,
          // SỬ DỤNG HÀM TẠO SEARCH STR THÔNG MINH (ĐỒNG BỘ VỚI GEMINI SERVICE)
          searchStr: b.searchStr || generateBranchSearchStr(name, address, phone),
          holidaySchedule: b.holidaySchedule || { isEnabled: false },
          holidayHistory: b.holidayHistory || [],
          isActive: b.isActive !== undefined ? b.isActive : true,
          note: b.note || "",
          updatedAt: b.updatedAt || "",
          originalName: b.name || ""
        };
      });
  };

  // Hàm load dữ liệu (có thể gọi lại từ Manager)
  const loadBranchData = useCallback(async () => {
      // 1. Tải ngay từ LocalStorage (Tốc độ ánh sáng)
      try {
        const cached = localStorage.getItem('branches');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBranches(parsed);
          } else {
             setBranches(parseInitialBranchData());
          }
        } else {
           setBranches(parseInitialBranchData());
        }
      } catch (e) {
        setBranches(parseInitialBranchData());
      }

      // 2. Fetch data mới từ Google Sheet (Background)
      setIsDataLoading(true);
      try {
        const data = await sheetAPI.getAllBranches();
        
        // LOGIC MỚI: Chỉ khi có data và array > 0 thì mới tính là Online
        if (data && Array.isArray(data) && data.length > 0) {
          const normalizedData = processBranchData(data);
          
          // Cập nhật State và Cache mới
          setBranches(normalizedData);
          localStorage.setItem('branches', JSON.stringify(normalizedData));
          
          setIsOfflineMode(false); // KẾT NỐI THÀNH CÔNG
          setError(null);
        } else {
          // Trường hợp trả về rỗng -> Coi như lỗi / mất kết nối dữ liệu
          console.warn("Fetched data is empty.");
          setIsOfflineMode(true); 
        }
      } catch (err) {
        console.warn("Background fetch failed.", err);
        setIsOfflineMode(true); // CÓ LỖI -> MẤT KẾT NỐI
      } finally {
        setIsDataLoading(false);
      }
  }, []);

  // Load dữ liệu khi mount
  useEffect(() => {
    loadBranchData();
  }, [loadBranchData]);

  const recordLog = (query: string, resultData: BranchResult | null, isSuccess: boolean, errorMsg?: string) => {
    const logEntry: SearchLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      query: query,
      resultBranch: resultData ? resultData.branchName : (errorMsg || "Không tìm thấy"),
      isSuccess: isSuccess,
      source: resultData ? (resultData.searchSource || 'AI') : 'FAIL',
      userAgent: navigator.userAgent
    };

    // 1. Lưu Local Storage (để xem ngay lập tức)
    try {
      const localLogs = JSON.parse(localStorage.getItem('search_logs') || '[]');
      // Giữ lại 100 log mới nhất local
      const newLogs = [logEntry, ...localLogs].slice(0, 100);
      localStorage.setItem('search_logs', JSON.stringify(newLogs));
    } catch (e) {
      console.warn("Local log failed", e);
    }

    // 2. Gửi về Database (Google Sheet)
    sheetAPI.logSearch(logEntry);
  };

  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Dùng setTimeout để đẩy việc tính toán ra sau luồng render UI (cho cảm giác mượt hơn)
    setTimeout(async () => {
        try {
            const data = await findNearestBranch(address, branches);
            setResult(data);
            // GHI LOG THÀNH CÔNG
            recordLog(address, data, true);
        } catch (err: any) {
            const msg = err?.toString() || "Không thể tìm thấy chi nhánh phù hợp.";
            setError(msg);
            // GHI LOG THẤT BẠI
            recordLog(address, null, false, msg);
        } finally {
            setIsLoading(false);
        }
    }, 50);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  // Nếu đang mở Manager thì hiển thị overlay
  if (isManagerOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white md:bg-black/50 md:flex md:items-center md:justify-center md:p-4">
        <BranchManager 
          branches={branches} 
          setBranches={(newBranches) => {
             setBranches(newBranches);
             localStorage.setItem('branches', JSON.stringify(newBranches));
          }} 
          onClose={() => setIsManagerOpen(false)}
          onReload={loadBranchData} // Truyền hàm reload xuống
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-3 md:py-12 md:px-6 lg:px-8 max-w-4xl mx-auto relative">
      
      {/* --- NÚT TRUY CẬP QUẢN LÝ DỮ LIỆU --- */}
      <button
        onClick={() => setIsManagerOpen(true)}
        className="absolute top-2 right-2 md:top-4 md:right-4 p-2.5 text-[#8B1E1E] bg-white hover:bg-[#8B1E1E] hover:text-white border border-[#8B1E1E]/20 rounded-full shadow-md transition-all group z-40 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      </button>

      <header className="text-center mb-6 md:mb-10 animate-fade-in relative z-10 mt-4 md:mt-0">
        <div className="flex items-center justify-center gap-4 mb-3 md:mb-4 opacity-70 scale-75 md:scale-100">
           <div className="h-[1px] w-16 bg-[#8B1E1E]"></div>
           <div className="w-2 h-2 rotate-45 bg-[#D4AF37]"></div>
           <div className="h-[1px] w-16 bg-[#8B1E1E]"></div>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-[#8B1E1E] tracking-wide mb-2 uppercase drop-shadow-sm leading-tight">
          TRƯỜNG BÀO NGƯ
        </h1>
        <p className="text-[#D4AF37] font-bold tracking-[0.2em] text-xs md:text-base uppercase mb-4 md:mb-6">
          长 鲍 鱼 鲍 翅 养 馔
        </p>
        
        <div className="bg-white/80 backdrop-blur-sm py-1.5 px-4 md:py-2 md:px-6 rounded-full border border-[#D4AF37]/30 shadow-sm inline-block flex items-center gap-2">
          {isDataLoading ? (
            <div className="flex items-center gap-2">
                 <svg className="animate-spin h-3 w-3 text-[#8B1E1E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[10px] md:text-xs text-gray-500 italic">Đang đồng bộ...</span>
            </div>
          ) : (
            <div className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
          )}
          <p className={`font-medium text-[10px] md:text-sm ${isOfflineMode ? 'text-red-600 font-bold' : 'text-green-700'}`}>
             {isOfflineMode ? 'Offline / Mất dữ liệu' : 'Hệ thống Online'}
          </p>
        </div>
      </header>

      <main className="w-full relative z-10">
        {error && (
          <div className="bg-red-50 border-l-4 border-[#8B1E1E] p-4 mb-6 rounded-r-lg animate-fade-in shadow-sm" role="alert">
            <p className="text-sm text-[#8B1E1E] font-bold">{error}</p>
          </div>
        )}

        {!result ? (
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        ) : (
          <ResultCard result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-12 text-center w-full pb-6">
        <p className="text-gray-500 text-xs md:text-sm mb-3">&copy; {new Date().getFullYear()} Trường Bào Ngư. Món Quà Tình Thân.</p>
        <button 
          onClick={() => setIsManagerOpen(true)}
          className="text-[10px] md:text-xs font-bold text-[#8B1E1E]/70 hover:text-[#8B1E1E] hover:underline transition-colors border border-[#8B1E1E]/20 px-3 py-1 rounded-full"
        >
          Quản lý dữ liệu
        </button>
      </footer>
    </div>
  );
}

export default App;