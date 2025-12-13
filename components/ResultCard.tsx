import React, { useEffect, useState } from "react";
import { BranchResult } from "../types";

interface ResultCardProps {
  result: BranchResult;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Logic kiểm tra lịch nghỉ THEO THỜI GIAN THỰC (Real-time)
  const schedule = result.holidaySchedule;
  
  // Chỉ tính là đóng cửa nếu: Đang bật + Có giờ + Thời gian hiện tại nằm trong khoảng
  const isKitchenClosed = schedule?.isEnabled && schedule.startTime && schedule.endTime 
    ? (currentTime >= new Date(schedule.startTime) && currentTime <= new Date(schedule.endTime))
    : false;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  useEffect(() => {
    // Timer đếm ngược để reset trang
    if (timeLeft <= 0) {
      onReset();
      return;
    }
    
    // Interval chạy mỗi giây:
    // 1. Giảm thời gian tự động back home
    // 2. Cập nhật currentTime để check trạng thái Bếp (Mở/Đóng) ngay lập tức
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onReset]);

  const googleMapsDirectLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(result.customerAddressOriginal || '')}&destination=${encodeURIComponent(result.branchAddress)}&travelmode=driving`;
  const origin = encodeURIComponent(result.customerAddressOriginal || '');
  const destination = encodeURIComponent(result.branchAddress);
  const embedUrl = `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&hl=vi&z=12&output=embed`;

  return (
    <div className={`bg-white rounded-xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.15)] overflow-hidden border-2 transition-all duration-500 animate-fade-in relative max-w-3xl mx-auto ${isKitchenClosed ? 'border-red-500/50' : 'border-[#D4AF37]/30'}`}>
      
      {/* CẢNH BÁO BẾP NGHỈ - Realtime Update */}
      {isKitchenClosed && (
        <div className="bg-red-600 text-white text-center p-4 md:p-6 animate-pulse border-b-4 border-red-800 transition-all duration-300">
           <div className="flex flex-col items-center justify-center gap-2">
             <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-2xl md:text-3xl font-extrabold uppercase tracking-widest font-brand">BẾP ĐANG NGHỈ</span>
             </div>
             <p className="text-sm md:text-lg font-medium bg-red-700 px-4 py-1 rounded-full shadow-inner border border-red-500">
                Tạm ngưng phục vụ từ: <span className="font-bold text-yellow-300">{formatDate(schedule!.startTime)}</span> 
                {' '}đến{' '} 
                <span className="font-bold text-yellow-300">{formatDate(schedule!.endTime)}</span>
             </p>
             {schedule?.reason && <p className="text-xs md:text-sm italic opacity-90 mt-1">Lý do: {schedule.reason}</p>}
           </div>
        </div>
      )}

      {/* Header Card */}
      <div className={`${isKitchenClosed ? 'opacity-90 bg-gray-100' : 'bg-gradient-to-r from-[#8B1E1E] to-[#601414]'} px-4 py-4 md:px-6 md:py-5 border-b border-[#D4AF37] transition-colors duration-500`}>
        <div className="flex justify-between items-center">
            <h2 className={`${isKitchenClosed ? 'text-gray-700' : 'text-white'} text-lg md:text-xl font-bold flex items-center gap-2 md:gap-3 font-brand uppercase tracking-wider`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${isKitchenClosed ? 'bg-gray-300 text-gray-500' : 'bg-[#D4AF37] text-[#8B1E1E]'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              Lộ trình vận chuyển
            </h2>
            
            {/* Hiển thị nguồn tìm kiếm */}
            <div className="hidden md:flex gap-2">
                {result.searchSource === 'INSTANT' && (
                    <div className="bg-green-500/20 backdrop-blur-md text-green-100 px-3 py-1 rounded-lg text-xs font-bold border border-green-400/30 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        Instant
                    </div>
                )}
                {result.estimatedDistance && (
                    <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold border border-white/30">
                        {result.estimatedDistance}
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-dashed border-gray-200 pb-4">
             <div className="w-full">
                <p className="text-xs font-bold text-[#8B1E1E]/70 uppercase tracking-wider mb-1">Kho xuất hàng gần nhất</p>
                <h3 className="text-2xl font-bold text-[#8B1E1E] font-brand">{result.branchName}</h3>
                <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                   <span><span className="font-semibold">Quản lý:</span> {result.managerName}</span>
                   {result.phoneNumber && (
                     <a href={`tel:${result.phoneNumber}`} className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                         <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                       </svg>
                       {result.phoneNumber}
                     </a>
                   )}
                </div>
             </div>
             <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Địa chỉ kho</p>
                <p className="text-sm text-gray-800 font-medium max-w-[250px] ml-auto">{result.branchAddress}</p>
             </div>
        </div>
        
        {/* MAP - Responsive height */}
        <div className={`w-full h-[250px] md:h-[400px] bg-gray-100 rounded-xl overflow-hidden border border-gray-300 shadow-inner relative group transition-all duration-500 ${isKitchenClosed ? 'grayscale opacity-70' : ''}`}>
            {isKitchenClosed && (
              <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center pointer-events-none">
                <span className="text-white/50 font-bold text-4xl -rotate-12 border-4 border-white/50 p-4 rounded-xl">CLOSED</span>
              </div>
            )}
            <iframe
                width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                src={embedUrl} title="Google Maps Route"
                className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            ></iframe>
        </div>

        {/* Action & Note */}
        <div className="space-y-4 pt-2">
           <div className="md:hidden bg-[#FFFBF0] p-3 rounded-lg border border-[#D4AF37]/20 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Địa chỉ kho:</p>
                    <p className="text-sm text-gray-800 leading-tight">{result.branchAddress}</p>
                  </div>
                  {result.estimatedDistance && <div className="text-xs font-bold bg-[#8B1E1E] text-white px-2 py-1 rounded whitespace-nowrap ml-2">{result.estimatedDistance}</div>}
              </div>
           </div>

          <div className="bg-gray-50 p-3 md:p-4 rounded-lg border-l-4 border-gray-300">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú hệ thống:</p>
            <p className="text-sm text-gray-600 italic">"{result.reasoning}"</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <a 
                href={googleMapsDirectLink} target="_blank" rel="noopener noreferrer"
                className={`py-3.5 px-4 bg-white border border-[#8B1E1E] text-[#8B1E1E] font-bold rounded-xl shadow-sm hover:bg-[#8B1E1E] hover:text-white transition-all flex items-center justify-center gap-2 uppercase text-sm active:bg-[#8B1E1E]/10 ${isKitchenClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={e => isKitchenClosed && e.preventDefault()}
            >
                <span>{isKitchenClosed ? 'Đang đóng cửa' : 'Mở Google Maps App'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </a>

            <button
                onClick={onReset}
                className="py-3.5 px-4 bg-[#8B1E1E] text-white font-bold rounded-xl shadow-lg hover:bg-[#6d1616] transition-all flex items-center justify-center gap-2 uppercase text-sm relative overflow-hidden active:scale-[0.98]"
            >
                <div className="absolute bottom-0 left-0 h-1 bg-[#D4AF37] transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 60) * 100}%` }}></div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 z-10"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <span className="z-10">Tra cứu khác ({timeLeft}s)</span>
            </button>
          </div>
          
          <div className="text-center">
             <p className="text-[10px] text-gray-400 italic">Màn hình sẽ tự động quay về trang chủ sau {timeLeft} giây</p>
          </div>
        </div>
      </div>
    </div>
  );
};