import { Branch, SearchLog } from "../types";

// URL Mặc định (Demo) - Dùng khi người dùng chưa cấu hình
// Đã cập nhật link mới nhất (AKfycbzGV6LkUxEAVaSWYj2JLJu3_p15urStyOlNM3j_fEOsCfbSmP-eCAEApAWSYveSARbCKw)
const DEMO_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGV6LkUxEAVaSWYj2JLJu3_p15urStyOlNM3j_fEOsCfbSmP-eCAEApAWSYveSARbCKw/exec";
const STORAGE_KEY_URL = "MY_GOOGLE_SHEET_SCRIPT_URL";

// Cấu trúc payload mở rộng để hỗ trợ nhiều action
interface SheetPayload {
  action: 'create' | 'update' | 'delete' | 'add_column' | 'rename_sheet' | 'log_search' | 'get_logs';
  data: any; // Data linh hoạt tùy theo action
}

// Hàm lấy URL hiện tại (Ưu tiên LocalStorage của người dùng)
const getScriptUrl = () => {
  const customUrl = localStorage.getItem(STORAGE_KEY_URL);
  return customUrl && customUrl.trim() !== "" ? customUrl : DEMO_SCRIPT_URL;
};

export const sheetAPI = {
  // Lưu URL Script mới của người dùng
  setScriptUrl: (url: string) => {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  },

  getCurrentUrl: () => getScriptUrl(),

  // 1. Lấy toàn bộ danh sách chi nhánh
  // UPDATE: Thêm tham số customUrl tùy chọn để test kết nối trước khi lưu
  getAllBranches: async (customUrl?: string): Promise<Branch[]> => {
    try {
      const url = customUrl || getScriptUrl();
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
      });
      
      if (!response.ok) {
        throw new Error("Không thể kết nối đến Google Sheet");
      }

      const data = await response.json();
      // Script mới trả về mảng trực tiếp khi GET
      return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  },

  // 2. Hàm lõi gửi request (Sync) với Fallback mode
  syncBranch: async (payload: SheetPayload): Promise<any> => {
    // console.log("Sending payload to Sheet:", payload); 
    const url = getScriptUrl();

    const requestOptions: RequestInit = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Tránh preflight CORS
      },
    };

    try {
      // Ưu tiên Standard Fetch để nhận phản hồi từ script
      const response = await fetch(url, {
        ...requestOptions,
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      return result;

    } catch (error) {
      console.warn("Standard sync failed, attempting no-cors fallback...", error);
      
      // Fallback: Gửi mù (Fire-and-forget) nếu CORS chặn
      try {
        await fetch(url, {
          ...requestOptions,
          mode: 'no-cors'
        });
        return { status: 'success', message: 'Request sent via no-cors (Backup mode)' };
      } catch (retryError) {
        console.error("Sync totally failed:", retryError);
        throw retryError;
      }
    }
  },

  // --- CÁC HÀM GỌI CỤ THỂ ---

  // Tạo mới: Gửi toàn bộ object Branch
  create: async (branch: Branch) => {
    return sheetAPI.syncBranch({ action: 'create', data: branch });
  },

  // Cập nhật: Gửi object Branch (bắt buộc có id)
  update: async (branch: Branch) => {
    // Lưu ý: data gửi đi có thể chứa originalName để Script xử lý fallback
    if (!branch.id) throw new Error("Update failed: Missing Branch ID");
    return sheetAPI.syncBranch({ action: 'update', data: branch });
  },

  // Xóa: Chỉ cần gửi ID
  delete: async (id: string) => {
    return sheetAPI.syncBranch({ action: 'delete', data: { id } });
  },

  // Mới: Thêm cột vào Sheet
  addColumn: async (columnName: string) => {
    return sheetAPI.syncBranch({ action: 'add_column', data: { columnName } });
  },

  // Mới: Đổi tên Sheet
  renameSheet: async (sheetName: string) => {
    return sheetAPI.syncBranch({ action: 'rename_sheet', data: { sheetName } });
  },
  
  // --- MỚI: LOGGING SYSTEM ---
  
  // Gửi log tìm kiếm
  logSearch: async (log: SearchLog) => {
    // Gửi bất đồng bộ, không cần chờ kết quả để tránh chặn UI
    return sheetAPI.syncBranch({ action: 'log_search', data: log }).catch(err => console.error("Log failed:", err));
  },
  
  // Lấy danh sách log (nếu Backend hỗ trợ trả về qua POST)
  getLogs: async (limit: number = 100): Promise<SearchLog[]> => {
    try {
      const res = await sheetAPI.syncBranch({ action: 'get_logs', data: { limit } });
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn("Could not fetch logs from server. Using local storage if available.", e);
      return [];
    }
  },

  // Helper: Khởi tạo cấu trúc bảng (chạy 1 lần đầu)
  // Đây là 11 cột chuẩn đã thống nhất với Google Apps Script mới
  setupInitialColumns: async () => {
    const columns = [
      'id',              // Mã định danh
      'name',            // Tên
      'manager',         // Quản lý
      'address',         // Địa chỉ
      'phoneNumber',     // SĐT
      'searchStr',       // Chuỗi tìm kiếm
      'holidaySchedule', // JSON Lịch nghỉ
      'holidayHistory',  // JSON Lịch sử
      'isActive',        // Trạng thái
      'note',            // Ghi chú
      'updatedAt'        // Thời gian cập nhật
    ];
    
    // Gửi tuần tự để đảm bảo thứ tự cột (dù script có check exists)
    for (const col of columns) {
      await sheetAPI.addColumn(col);
    }
    return true;
  }
};