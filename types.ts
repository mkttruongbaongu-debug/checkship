export interface BranchResult {
  branchName: string;
  managerName: string;
  branchAddress: string;
  phoneNumber?: string; // Thêm SĐT vào kết quả
  reasoning: string;
  customerAddressOriginal?: string; // Địa chỉ khách hàng gốc để tạo link map
  holidaySchedule?: HolidaySchedule; // Thêm thông tin nghỉ phép vào kết quả
  estimatedDistance?: string; // Khoảng cách ước tính từ AI
  searchSource?: 'INSTANT' | 'AI'; // Nguồn tìm kiếm: Tức thì hoặc AI
}

export interface BranchDataRaw {
  name: string;
  manager: string;
  address: string;
}

export interface HolidaySchedule {
  isEnabled: boolean;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  reason?: string;
}

// Interface chính cho đối tượng Chi nhánh được quản lý trong App
export interface Branch {
  id: string; // Unique ID
  name: string;
  manager: string;
  address: string;
  phoneNumber?: string; // Thêm SĐT vào dữ liệu gốc
  searchStr: string; // Chuỗi đã chuẩn hóa để tối ưu tìm kiếm
  holidaySchedule?: HolidaySchedule; // Cấu hình nghỉ hiện tại/sắp tới
  holidayHistory?: HolidaySchedule[]; // Lịch sử các lần nghỉ để thống kê
  
  // --- CÁC TRƯỜNG MỚI BỔ SUNG ---
  isActive?: boolean; // Cho phép tạm ẩn chi nhánh mà không cần xóa
  note?: string; // Ghi chú nội bộ (không hiện ra cho khách)
  updatedAt?: string; // Thời gian cập nhật lần cuối
  
  // --- HỖ TRỢ UPDATE THÔNG MINH ---
  originalName?: string; // Tên gốc (trước khi sửa) để tìm kiếm fallback
}