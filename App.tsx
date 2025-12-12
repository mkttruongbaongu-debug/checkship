import React, { useState, useEffect } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultCard } from './components/ResultCard';
import { BranchManager } from './components/BranchManager';
import { findNearestBranch, parseInitialBranchData, normalizeString } from './services/geminiService';
import { sheetAPI } from './services/sheetService';
import { BranchResult, Branch } from './types';

function App() {
  // State quản lý danh sách chi nhánh
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [result, setResult] = useState<BranchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Load dữ liệu từ Google Sheet khi khởi động
  useEffect(() => {
    const fetchBranches = async () => {
      setIsDataLoading(true);
      try {
        const data = await sheetAPI.getAllBranches();
        if (data && data.length > 0) {
          // Chuẩn hóa dữ liệu từ API để đảm bảo không bị undefined
          const normalizedData = data.map((b: any) => {
            // XỬ LÝ ID THÔNG MINH: Tìm mọi biến thể của cột ID (id, ID, Id...)
            const rawId = b.id || b.ID || b.Id || b.iD || b._id;
            const validId = (rawId && String(rawId).trim() !== "") ? String(rawId) : `gen-${Math.random()}`;

            return {
              ...b,
              id: validId,
              name: b.name || "",
              manager: b.manager || "",
              address: b.address || "",
              phoneNumber: b.phoneNumber ? String(b.phoneNumber) : "",
              // Nếu API không trả về searchStr, tự động tạo lại
              searchStr: b.searchStr || normalizeString(`${b.name || ""} ${b.address || ""} ${b.phoneNumber || ""} ${normalizeString(b.name || "")}`),
              holidaySchedule: b.holidaySchedule || { isEnabled: false },
              holidayHistory: b.holidayHistory || [],
              // --- XỬ LÝ TRƯỜNG MỚI ---
              isActive: b.isActive !== undefined ? b.isActive : true, // Mặc định true nếu chưa có
              note: b.note || "",
              updatedAt: b.updatedAt || "",
              // Lưu lại tên gốc để hỗ trợ việc sửa tên (update fallback)
              originalName: b.name || ""
            };
          });
          setBranches(normalizedData);
        } else {
          // Nếu Sheet rỗng hoặc lỗi format, fallback về dữ liệu mẫu ban đầu
          console.warn("Sheet data empty, using initial data.");
          setBranches(parseInitialBranchData());
        }
      } catch (err) {
        console.error("Failed to load from Google Sheet, falling back to local/initial data", err);
        // Fallback: Thử lấy từ localStorage hoặc dữ liệu tĩnh nếu API lỗi
        try {
            const saved = localStorage.getItem('branches');
            if (saved) {
                setBranches(JSON.parse(saved));
            } else {
                setBranches(parseInitialBranchData());
            }
        } catch(e) {
            setBranches(parseInitialBranchData());
        }
        setError("Không thể kết nối cơ sở dữ liệu. Đang sử dụng dữ liệu ngoại tuyến.");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Sync to local storage as backup (optional)
  useEffect(() => {
    if (branches.length > 0) {
        localStorage.setItem('branches', JSON.stringify(branches));
    }
  }, [branches]);

  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Truyền danh sách branches hiện tại vào hàm tìm kiếm
      const data = await findNearestBranch(address, branches);
      setResult(data);
    } catch (err: any) {
      setError(err?.toString() || "Không thể tìm thấy chi nhánh phù hợp hoặc có lỗi xảy ra.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  // Nếu đang mở Manager thì hiển thị overlay
  if (isManagerOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fixed inset-0 z-50">
        <BranchManager 
          branches={branches} 
          setBranches={setBranches} 
          onClose={() => setIsManagerOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative">
      
      {/* --- NÚT TRUY CẬP QUẢN LÝ DỮ LIỆU (TOP RIGHT) --- */}
      <button
        onClick={() => setIsManagerOpen(true)}
        className="absolute top-2 right-2 md:top-4 md:right-4 p-2.5 text-[#8B1E1E] bg-white hover:bg-[#8B1E1E] hover:text-white border border-[#8B1E1E]/20 rounded-full shadow-md transition-all group z-50"
        title="Quản lý dữ liệu chi nhánh"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
        {/* Tooltip text on hover for desktop */}
        <span className="absolute top-1/2 right-full mr-2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
          Quản lý dữ liệu
        </span>
      </button>

      <header className="text-center mb-10 animate-fade-in relative z-10">
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-4 opacity-70">
           <div className="h-[1px] w-16 bg-[#8B1E1E]"></div>
           <div className="w-2 h-2 rotate-45 bg-[#D4AF37]"></div>
           <div className="h-[1px] w-16 bg-[#8B1E1E]"></div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-[#8B1E1E] tracking-wide mb-2 uppercase drop-shadow-sm">
          TRƯỜNG BÀO NGƯ
        </h1>
        <p className="text-[#D4AF37] font-bold tracking-[0.2em] text-sm md:text-base uppercase mb-6">
          长 鲍 鱼 鲍 翅 养 馔
        </p>
        
        <div className="bg-white/80 backdrop-blur-sm py-2 px-6 rounded-full border border-[#D4AF37]/30 shadow-sm inline-block flex items-center gap-2">
          {isDataLoading ? (
            <svg className="animate-spin h-4 w-4 text-[#8B1E1E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
          )}
          <p className="text-gray-700 font-medium text-sm">
             {isDataLoading ? 'Đang kết nối CSDL...' : error ? 'Chế độ ngoại tuyến' : 'Hệ thống Online'}
          </p>
        </div>
      </header>

      <main className="w-full relative z-10">
        {error && (
          <div className="bg-red-50 border-l-4 border-[#8B1E1E] p-4 mb-6 rounded-r-lg animate-fade-in shadow-sm" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#8B1E1E]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-[#8B1E1E] font-bold font-brand">Thông báo</p>
                <p className="text-sm text-gray-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!result ? (
          <SearchForm onSearch={handleSearch} isLoading={isLoading || isDataLoading} />
        ) : (
          <ResultCard result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-16 text-center w-full">
        <div className="flex items-center justify-center gap-2 mb-2 text-[#8B1E1E]/40">
           <span className="h-[1px] w-8 bg-current"></span>
           <span className="text-xl">❖</span>
           <span className="h-[1px] w-8 bg-current"></span>
        </div>
        <p className="text-gray-500 text-sm mb-4">&copy; {new Date().getFullYear()} Trường Bào Ngư. Món Quà Tình Thân.</p>
        
        {/* Nút truy cập quản trị dưới chân trang (đã làm rõ hơn) */}
        <button 
          onClick={() => setIsManagerOpen(true)}
          className="text-xs font-bold text-[#8B1E1E]/70 hover:text-[#8B1E1E] hover:underline transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Quản lý dữ liệu chi nhánh
        </button>
      </footer>
    </div>
  );
}

export default App;