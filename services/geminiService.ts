import { RAW_BRANCH_DATA } from "../constants";
import { BranchResult, Branch } from "../types";

// --- 1. HÀM TIỆN ÍCH XỬ LÝ CHUỖI ---

// Hàm bỏ dấu tiếng Việt và chuẩn hóa chuỗi về chữ thường (Export để dùng khi thêm mới)
export const normalizeString = (str: string): string => {
  if (!str) return "";
  let result = str.toLowerCase().trim();
  
  // Bỏ dấu
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  
  // Xử lý các từ viết tắt địa danh phổ biến
  result = result.replace(/\btp\.?\s/g, " thanh pho "); // tp. -> thanh pho
  result = result.replace(/\btp\s/g, " thanh pho ");
  result = result.replace(/\bhcm\b/g, " ho chi minh "); // hcm -> ho chi minh
  result = result.replace(/\bsai gon\b/g, " ho chi minh "); // sai gon -> ho chi minh
  result = result.replace(/\bhn\b/g, " ha noi "); // hn -> ha noi
  result = result.replace(/\bdn\b/g, " da nang "); // dn -> da nang
  
  // Loại bỏ ký tự đặc biệt thừa
  result = result.replace(/[^a-z0-9\s]/g, " ");
  
  // Rút gọn khoảng trắng
  return result.replace(/\s+/g, " ").trim();
};

// --- 2. PARSE DỮ LIỆU KHO BAN ĐẦU ---

export const parseInitialBranchData = (): Branch[] => {
  const lines = RAW_BRANCH_DATA.split('\n').filter(line => line.trim() !== '');
  const branches: Branch[] = [];

  lines.forEach((line, index) => {
    // Tách dựa trên tab hoặc khoảng trắng lớn
    let parts = line.split('\t');
    
    // Nếu không có tab, thử dùng regex heuristic
    if (parts.length < 3) {
      const match = line.match(/^(.+?)\s+((?:Chị|Anh|Cô|Chú|Thúy|Thu|Linh|Hoàng|Tổ|Kho|Nhà xe).+?)\s+(.+)$/);
      if (match) {
        parts = [match[1], match[2], match[3]];
      } else {
        return; // Skip lỗi
      }
    }

    const name = parts[0]?.trim();
    const manager = parts[1]?.trim();
    let address = parts[2]?.trim();
    
    if (address && address.startsWith('"') && address.endsWith('"')) {
      address = address.slice(1, -1);
    }

    if (name && address) {
      branches.push({
        id: `init-${index}-${Date.now()}`, // Tạo ID giả lập
        name,
        manager: manager || "Quản lý kho",
        address,
        phoneNumber: "", // Mặc định trống cho dữ liệu cũ
        searchStr: normalizeString(`${name} ${address} ${normalizeString(name)}`),
        holidaySchedule: { isEnabled: false, startTime: "", endTime: "" }, // Mặc định không nghỉ
        holidayHistory: [], // Khởi tạo lịch sử rỗng
        isActive: true, // Mặc định hiển thị
        note: "",
        updatedAt: new Date().toISOString()
      });
    }
  });
  return branches;
};

// --- 3. THUẬT TOÁN TÌM KIẾM ---

// Hàm này giờ nhận vào danh sách branches thay vì dùng biến tĩnh
export const findNearestBranch = async (customerAddress: string, branches: Branch[]): Promise<BranchResult> => {
  return new Promise((resolve, reject) => {
    if (!branches || branches.length === 0) {
        reject("Chưa có dữ liệu chi nhánh.");
        return;
    }

    // LỌC: Chỉ tìm kiếm trong các chi nhánh đang hoạt động (Active)
    const activeBranches = branches.filter(b => b.isActive !== false); // !== false để handle undefined (default true)

    if (activeBranches.length === 0) {
        reject("Không có chi nhánh nào đang hoạt động.");
        return;
    }

    const userQuery = normalizeString(customerAddress);
    const userTokens = userQuery.split(" ");
    
    let bestBranch: Branch | null = null;
    let maxScore = -1;

    for (const branch of activeBranches) {
      let score = 0;
      // Ensure searchStr exists to prevent 'includes' of undefined
      const searchStr = branch.searchStr || "";
      
      // 1. Kiểm tra bao hàm chính xác
      if (searchStr.includes(userQuery)) {
        score += 50;
      }

      // 2. Kiểm tra từ khóa quan trọng
      let matchCount = 0;
      for (const token of userTokens) {
        if (token.length > 1 && searchStr.includes(token)) {
          matchCount++;
          if (["quan", "huyen", "tp", "thi", "xa", "phuong"].includes(token)) {
             score += 1;
          } else {
             score += 10;
          }
        }
      }
      score += matchCount;

      // 3. Ưu tiên khớp Tỉnh/Thành
      const branchAddressLower = normalizeString(branch.address || "");
      if (userTokens.length > 2) {
          const lastPartOfUser = userTokens.slice(-2).join(" ");
          if (branchAddressLower.includes(lastPartOfUser)) {
              score += 20;
          }
      }

      if (score > maxScore) {
        maxScore = score;
        bestBranch = branch;
      }
    }

    if (!bestBranch) {
        bestBranch = activeBranches[0];
    }

    const reason = `Đã tìm thấy chi nhánh phù hợp nhất dựa trên thông tin địa chỉ: "${bestBranch.address}".`;

    resolve({
      branchName: bestBranch.name,
      managerName: bestBranch.manager,
      branchAddress: bestBranch.address,
      phoneNumber: bestBranch.phoneNumber, // Map SĐT
      reasoning: reason,
      customerAddressOriginal: customerAddress,
      holidaySchedule: bestBranch.holidaySchedule // Truyền thông tin nghỉ phép sang kết quả
    });
  });
};