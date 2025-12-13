import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [address, setAddress] = useState('');
  // State để theo dõi nếu Clipboard API bị trình duyệt chặn (Permissions Policy)
  // Nếu bị chặn, ta sẽ không preventDefault nữa để người dùng dùng menu mặc định
  const [isClipboardBlocked, setIsClipboardBlocked] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (address.trim()) {
      onSearch(address);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Xử lý chuột phải: Tự động paste nếu có dữ liệu
  const handleContextMenu = async (e: React.MouseEvent<HTMLTextAreaElement>) => {
    // Nếu đã xác định là bị chặn quyền, thả cho menu mặc định hiện ra
    if (isClipboardBlocked) return;

    // 1. Chặn menu chuột phải mặc định
    e.preventDefault();
    
    try {
      // Kiểm tra API có tồn tại không
      if (!navigator.clipboard?.readText) {
         throw new Error("Clipboard API not available");
      }

      // 2. Đọc dữ liệu từ clipboard
      const text = await navigator.clipboard.readText();
      
      // 3. Nếu có dữ liệu hợp lệ, điền vào ô
      if (text && text.trim().length > 0) {
        setAddress(text);
        // Hiệu ứng visual focus
        e.currentTarget.focus();
      }
    } catch (err: any) {
      // Nếu lỗi do Policy hoặc Permission -> Đánh dấu để lần sau cho hiện menu mặc định
      // (Khắc phục lỗi: The Clipboard API has been blocked because of a permissions policy...)
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError' || err.message?.includes('policy')) {
        console.warn("Clipboard auto-paste blocked by browser policy. Reverting to default menu.");
        setIsClipboardBlocked(true);
      } else {
        console.debug("Clipboard empty or other error", err);
      }
    }
  };

  // Xử lý nút dán thủ công (cho mobile hoặc fallback)
  const handleManualPaste = async () => {
    try {
      if (!navigator.clipboard?.readText) {
          alert("Trình duyệt không hỗ trợ dán tự động. Vui lòng dán thủ công.");
          return;
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) setAddress(text);
    } catch (err: any) {
      console.error("Manual paste failed:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('policy')) {
          alert("Trình duyệt chặn quyền truy cập Clipboard. Vui lòng nhập thủ công.");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-[#D4AF37]/20 p-5 md:p-8 animate-fade-in-up relative overflow-hidden">
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#FFFBF0] rounded-full blur-2xl opacity-50 pointer-events-none"></div>

      <div className="mb-6 md:mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#8B1E1E] mb-2 font-brand">Tra Cứu Điểm Bán</h2>
        <p className="text-sm md:text-base text-gray-500">Nhập địa chỉ nhận hàng để tìm kho gần nhất & phí ship</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div>
          <label htmlFor="address" className="block text-xs md:text-sm font-semibold text-[#8B1E1E] mb-2 tracking-wide uppercase">
            Địa chỉ khách hàng
          </label>
          <div className="relative group">
            <textarea
              id="address"
              rows={3}
              className="w-full px-4 py-3 md:px-5 md:py-4 rounded-xl border border-gray-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all resize-none text-gray-800 placeholder-gray-400 shadow-inner bg-gray-50/50 text-base pr-10"
              placeholder="Ví dụ: 194 Kinh Dương Vương... (Click phải để dán nhanh)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              onContextMenu={handleContextMenu} // SỰ KIỆN CLICK PHẢI THẦN THÁNH
              disabled={isLoading}
              required
            />
            
            {/* Icons Action ở góc phải */}
            <div className="absolute bottom-3 right-3 flex gap-2 text-gray-400">
               {/* Nút Paste (hiển thị khi hover hoặc empty) */}
               {!address && (
                 <button 
                   type="button" 
                   onClick={handleManualPaste}
                   className="hover:text-[#8B1E1E] transition-colors p-1"
                   title="Dán từ clipboard"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                 </button>
               )}
               
               {/* Icon trang trí mặc định (Map pin) */}
               {address && (
                 <div className="text-[#D4AF37]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                 </div>
               )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          className={`w-full py-3.5 md:py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wider text-sm md:text-base
            ${isLoading || !address.trim() 
              ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
              : 'bg-[#8B1E1E] hover:bg-[#6d1616] hover:shadow-xl transform hover:-translate-y-0.5 border-t border-white/10 active:scale-[0.98]'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              Tìm kiếm
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};