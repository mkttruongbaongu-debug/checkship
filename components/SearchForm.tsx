import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [address, setAddress] = useState('');

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

  return (
    <div className="bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-[#D4AF37]/20 p-6 md:p-8 animate-fade-in-up relative overflow-hidden">
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#FFFBF0] rounded-full blur-2xl opacity-50 pointer-events-none"></div>

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-[#8B1E1E] mb-2 font-brand">Tra Cứu Điểm Bán</h2>
        <p className="text-gray-500">Nhập địa chỉ nhận hàng để tìm kho gần nhất & phí ship</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-[#8B1E1E] mb-2 tracking-wide">
            ĐỊA CHỈ KHÁCH HÀNG
          </label>
          <div className="relative">
            <textarea
              id="address"
              rows={3}
              className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all resize-none text-gray-800 placeholder-gray-400 shadow-inner bg-gray-50/50"
              placeholder="Ví dụ: 194 Kinh Dương Vương..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              required
            />
            <div className="absolute bottom-3 right-3 text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
               </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wider
            ${isLoading || !address.trim() 
              ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
              : 'bg-[#8B1E1E] hover:bg-[#6d1616] hover:shadow-xl transform hover:-translate-y-0.5 border-t border-white/10'
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