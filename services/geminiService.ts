import { GoogleGenAI, Type } from "@google/genai";
import { RAW_BRANCH_DATA } from "../constants";
import { BranchResult, Branch } from "../types";

// --- 1. CONFIGURATION ---
const MODEL_NAME = "gemini-2.5-flash";

// --- 2. TỪ ĐIỂN ĐỊA LÝ & HÀM CHUẨN HÓA ---

// Danh sách từ khóa loại bỏ khi tìm kiếm
const STOP_WORDS = [
  "thanh pho", "tinh", "quan", "huyen", "thi xa", "thi tran", "phuong", "xa", "ap", 
  "duong", "so", "nha", "ngo", "ngach", "hem", "khu pho", "to", "viet nam", "vn"
];

// Danh sách các từ dễ gây nhầm lẫn (Tên đường trùng tên Tỉnh)
const CONFUSING_WORDS = ["hue", "ho chi minh", "thai binh", "nam dinh", "hung yen", "cao bang", "lang son"];

// Từ điển ánh xạ địa lý (MAPPING QUAN TRỌNG ĐỂ TỐI ƯU TỐC ĐỘ)
// Key: Địa danh người dùng hay nhập -> Value: Từ khóa có trong Address/Name của kho
const GEO_ALIASES: Record<string, string> = {
  // =============================================
  // 1. KHU VỰC MIỀN NAM (TP.HCM & CÁC TỈNH)
  // =============================================
  
  // --- TP. HỒ CHÍ MINH (Mapping về các kho Quận cụ thể) ---
  "sai gon": "ho chi minh",
  "thu duc": "ho chi minh", // Có thể map về kho gần nhất nếu cần
  "go vap": "ho chi minh",
  "binh tan": "ho chi minh",
  "binh chanh": "ho chi minh",
  "hoc mon": "ho chi minh",
  "cu chi": "ho chi minh",
  "nha be": "nha be", // Có kho Nhà Bè
  
  // KHO BÌNH THẠNH
  "binh thanh": "binh thanh",
  "hang xanh": "binh thanh",
  "thanh da": "binh thanh",
  "dien bien phu": "binh thanh", // Đoạn cầu ĐBP hay thuộc Bình Thạnh
  "xo viet nghe tinh": "binh thanh",
  "nguyen xi": "binh thanh",
  "pham van dong": "binh thanh", // Đại lộ này dài, nhưng ưu tiên map về Bình Thạnh/Thủ Đức
  "ung van khiem": "binh thanh",
  "le quang dinh": "binh thanh",
  "no trang long": "binh thanh",

  // KHO PHÚ NHUẬN
  "phu nhuan": "phu nhuan",
  "phan xich long": "phu nhuan",
  "nguyen van troi": "phu nhuan",
  "hoang van thu": "phu nhuan",
  "le van sy": "phu nhuan", // Đoạn Phú Nhuận
  "tran huy lieu": "phu nhuan",
  "nguyen kiem": "phu nhuan",

  // KHO QUẬN 7
  "quan 7": "quan 7",
  "phu my hung": "quan 7",
  "tan thuan": "quan 7",
  "nguyen van linh": "quan 7",
  "nguyen thi thap": "quan 7",
  "huynh tan phat": "quan 7",
  "le van luong": "quan 7", // Đoạn Q7/Nhà Bè
  "him lam": "quan 7",

  // KHO QUẬN 8
  "quan 8": "quan 8",
  "pham the hien": "quan 8",
  "ta quang buu": "quan 8",
  "au duong lan": "quan 8",
  "duong ba trac": "quan 8",
  "hung phu": "quan 8",

  // KHO TÂN PHÚ
  "tan phu": "tan phu",
  "tan son nhi": "tan phu",
  "tay thanh": "tan phu",
  "luy ban bich": "tan phu",
  "tan ky tan quy": "tan phu",
  "vuon lai": "tan phu",
  "duong hoa binh": "tan phu", // Đầm Sen - Đổi từ "hoa binh" thành "duong hoa binh" để tránh trùng tên Tỉnh
  "le trong tan": "tan phu",

  // CÁC QUẬN KHÁC -> VỀ TP.HCM (AI sẽ tự chia hoặc map vào kho mặc định)
  "quan 1": "ho chi minh", "quan 2": "ho chi minh", "quan 3": "ho chi minh",
  "quan 4": "ho chi minh", "quan 5": "ho chi minh", "quan 6": "ho chi minh",
  "quan 9": "ho chi minh", "quan 10": "ho chi minh", "quan 11": "ho chi minh", "quan 12": "ho chi minh",
  "nguyen hue": "ho chi minh", "bui vien": "ho chi minh", "ben thanh": "ho chi minh",

  // --- BÌNH DƯƠNG ---
  "di an": "binh duong",
  "thuan an": "binh duong",
  "ben cat": "binh duong",
  "tan uyen": "binh duong",
  "bau bang": "binh duong",
  "thu dau mot": "thu dau mot", // Có kho Thủ Dầu Một
  "dai lo binh duong": "thu dau mot",
  "thanh pho moi": "thu dau mot",

  // --- ĐỒNG NAI ---
  "bien hoa": "bien hoa", // Có kho Biên Hòa
  "nga 3 vung tau": "bien hoa",
  "amata": "bien hoa",
  "tam hiep": "bien hoa",
  "tan mai": "bien hoa",
  "trang bom": "bien hoa", // Gần Biên Hòa
  "long khanh": "long khanh", // Có kho Long Khánh
  "dinh quan": "dinh quan", // Có kho Định Quán
  "la nga": "dinh quan",
  "tan phu dong nai": "dinh quan",
  "long thanh": "bien hoa", // Hoặc map về Vũng Tàu tùy vị trí, tạm để Biên Hòa
  "nhon trach": "bien hoa",

  // --- VŨNG TÀU ---
  "vung tau": "vung tau",
  "ba ria": "vung tau", // Map về Vũng Tàu hoặc Bà Rịa (nếu có kho)
  "phu my": "vung tau",
  "long hai": "vung tau",
  "chau duc": "vung tau",
  "xuyen moc": "vung tau",
  "bai truoc": "vung tau", "bai sau": "vung tau", "thuy van": "vung tau",

  // --- TÂY NINH ---
  "tay ninh": "tay ninh",
  "hoa thanh": "tay ninh",
  "trang bang": "tay ninh",
  "go dau": "tay ninh",
  "moc bai": "moc bai", // Có kho Mộc Bài
  "ben cau": "moc bai",
  "tan chau": "tan chau", // Có kho Tân Châu

  // --- MIỀN TÂY KHÁC ---
  "can tho": "can tho",
  "ninh kieu": "can tho", "cai rang": "can tho", "binh thuy": "can tho", "o mon": "can tho",
  "ben ninh kieu": "can tho", "dai lo hoa binh": "can tho",
  
  "tien giang": "my tho", // Map chung về Tiền Giang (có kho Mỹ Tho / Cai Lậy)
  "my tho": "my tho",
  "cai lay": "cai lay",
  "cai be": "cai lay",
  "cho gao": "my tho",
  "go cong": "tien giang",
  
  "ben tre": "ben tre", "chau thanh ben tre": "ben tre", "mo cay": "ben tre",
  "vinh long": "vinh long",
  "tra vinh": "tra vinh",
  "dong thap": "cao lanh", // Có kho Cao Lãnh, Sa Đéc, Hồng Ngự
  "cao lanh": "cao lanh",
  "sa dec": "sa dec",
  "hong ngu": "hong ngu",
  "an giang": "long xuyen", // Có kho Long Xuyên
  "long xuyen": "long xuyen",
  "chau doc": "long xuyen",
  "kien giang": "rach gia", // Có kho Rạch Giá
  "rach gia": "rach gia",
  "ha tien": "rach gia",
  "phu quoc": "rach gia", // Tạm map về KG
  "ca mau": "ca mau", "nam can": "ca mau",
  "bac lieu": "ca mau", // Gần Cà Mau
  "soc trang": "soc trang",
  "hau giang": "vi thanh", // Có kho Vị Thanh
  "vi thanh": "vi thanh",
  "nga bay": "vi thanh",

  // =============================================
  // 2. KHU VỰC MIỀN TRUNG & TÂY NGUYÊN
  // =============================================

  // --- ĐÀ NẴNG (Đã tối ưu) ---
  "da nang": "da nang",
  "hai chau": "da nang",
  "thanh khe": "lien chieu", 
  "lien chieu": "lien chieu",
  "son tra": "da nang",
  "ngu hanh son": "da nang",
  "cam le": "cam le",
  "hoa vang": "hoa vang",
  "hoa xuan": "hoa xuan",
  "nguyen sinh sac": "lien chieu", "hoang thi loan": "lien chieu", "ton duc thang": "lien chieu", 
  "nguyen luong bang": "lien chieu", "au co": "lien chieu", "kinh duong vuong": "lien chieu",
  "truong chinh": "cam le", "cach mang thang 8": "cam le", "thang long": "cam le", "nguyen huu tho": "cam le",
  "vo chi cong": "hoa xuan", "pham hung": "cam le",

  // --- CÁC TỈNH MIỀN TRUNG ---
  "thua thien hue": "hue",
  "hue": "hue",
  "vi da": "hue", "kim long": "hue", "phu hoi": "hue", "xuan phu": "hue",
  
  "quang nam": "tam ky", // Có kho Tam Kỳ
  "tam ky": "tam ky",
  "hoi an": "tam ky", // Hoặc map về Đà Nẵng tùy logistic, tạm để Tam Kỳ
  "dien ban": "tam ky",

  "quang ngai": "quang ngai",
  "binh dinh": "quy nhon", // Có kho Quy Nhơn
  "quy nhon": "quy nhon",
  "an nhon": "quy nhon",

  "phu yen": "tuy hoa", // Có kho Tuy Hòa
  "tuy hoa": "tuy hoa",
  
  "khanh hoa": "nha trang", // Có kho Nha Trang, Cam Ranh
  "nha trang": "nha trang",
  "cam ranh": "cam ranh",
  "dien khanh": "nha trang",
  "tran phu nha trang": "nha trang",

  "ninh thuan": "phan rang", // Có kho Phan Rang
  "phan rang": "phan rang",
  "thap cham": "phan rang",

  "binh thuan": "phan thiet", // Có kho Phan Thiết
  "phan thiet": "phan thiet",
  "mui ne": "phan thiet",
  "lagi": "phan thiet", // Có thể map riêng nếu có kho Lagi

  "quang tri": "dong ha", // Có kho Đông Hà
  "dong ha": "dong ha",
  
  "quang binh": "dong ha", // Tạm map về Đông Hà nếu chưa có kho QB
  "dong hoi": "dong ha",
  
  "nghe an": "vinh", // Có kho Vinh
  "vinh": "vinh",
  "cua lo": "vinh",

  "thanh hoa": "thanh hoa",
  "sam son": "thanh hoa",

  // --- TÂY NGUYÊN ---
  "lam dong": "da lat", // Có kho Đà Lạt, Bảo Lộc
  "da lat": "da lat",
  "bao loc": "bao loc",
  "duc trong": "da lat",
  "lam ha": "da lat",
  "ho xuan huong": "da lat",
  
  "dak lak": "buon ma thuot", // Có kho BMT
  "buon ma thuot": "buon ma thuot",
  "bmt": "buon ma thuot",
  "nga sau": "buon ma thuot",
  
  "gia lai": "pleiku", // Có kho Pleiku
  "pleiku": "pleiku",
  
  "kon tum": "kon tum", // Có kho Kon Tum
  "dak nong": "buon ma thuot", // Tạm map về BMT

  // =============================================
  // 3. KHU VỰC MIỀN BẮC
  // =============================================

  // --- HÀ NỘI ---
  "ha noi": "ha noi", // Có kho Hà Nội (Cầu Giấy)
  "cau giay": "ha noi",
  "thanh xuan": "ha noi",
  "dong da": "ha noi",
  "ba dinh": "ha noi",
  "hoan kiem": "ha noi",
  "hai ba trung": "ha noi",
  "hoang mai": "ha noi",
  "long bien": "ha noi",
  "tay ho": "ha noi",
  "bac tu liem": "ha noi", "nam tu liem": "ha noi",
  "ha dong": "ha noi",
  "son tay": "ha noi",
  // Tên đường lớn Hà Nội
  "lang ha": "ha noi", "nguyen chi thanh": "ha noi", "xuan thuy": "ha noi", 
  "ho tung mau": "ha noi", "kim ma": "ha noi", "xa dan": "ha noi", "pho hue": "ha noi",

  // --- HẢI PHÒNG ---
  "hai phong": "hai phong",
  "hong bang": "hai phong", "ngo quyen": "hai phong", "le chan": "hai phong",
  "hai an": "hai phong", "kien an": "hai phong", "do son": "hai phong",
  "thuy nguyen": "hai phong",
  "lach tray": "hai phong", "le hong phong hai phong": "hai phong",

  // --- CÁC TỈNH KHÁC ---
  "quang ninh": "ha long", // Có kho Hạ Long, Uông Bí, Móng Cái...
  "ha long": "ha long",
  "bai chay": "ha long", "hon gai": "ha long",
  "cam pha": "ha long", // Tạm map về Hạ Long nếu chưa có kho CP
  "uong bi": "uong bi",
  "mong cai": "mong cai", // (Nếu có kho Móng Cái) - check data thì chưa thấy, tạm map về QN
  
  "hai duong": "hai duong",
  "hung yen": "hung yen",
  "ecopark": "hung yen",
  
  "bac ninh": "bac ninh", // Có kho Bắc Ninh, Từ Sơn
  "tu son": "tu son",
  "yen phong": "bac ninh",
  
  "vinh phuc": "vinh yen", // Có kho Vĩnh Yên
  "vinh yen": "vinh yen",
  "phuc yen": "vinh yen",
  "tam dao": "vinh yen",
  
  "thai nguyen": "thai nguyen",
  "song cong": "thai nguyen",
  
  "bac giang": "bac ninh", // Tạm map về Bắc Ninh
  
  "thai binh": "thai binh",
  "nam dinh": "nam dinh",
  "ninh binh": "hoa lu", // Có kho Hoa Lư
  "hoa lu": "hoa lu",
  "tam diep": "hoa lu",
  
  "lao cai": "lao cai",
  "sapa": "lao cai",
  
  "yen bai": "yen bai",
  "tuyen quang": "tuyen quang",
  "son la": "son la",
  "moc chau": "son la",
  "lang son": "lang son",
  "hoa binh": "hoa binh",
  "ha nam": "nam dinh", // Tạm map
  "phu tho": "vinh yen" // Tạm map
};

export const normalizeString = (str: string): string => {
  if (!str) return "";
  let result = str.toLowerCase().trim();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/[^a-z0-9\s]/g, " ");
  // Rút gọn khoảng trắng
  return result.replace(/\s+/g, " ").trim();
};

const removeStopWords = (text: string): string => {
  let processed = text;
  STOP_WORDS.forEach(word => {
    // Chỉ replace nguyên từ (word boundary)
    processed = processed.replace(new RegExp(`\\b${word}\\b`, 'g'), " ");
  });
  return processed.replace(/\s+/g, " ").trim();
};

// --- 3. PARSE DỮ LIỆU ---

export const parseInitialBranchData = (): Branch[] => {
  const lines = RAW_BRANCH_DATA.split('\n').filter(line => line.trim() !== '');
  const branches: Branch[] = [];

  lines.forEach((line, index) => {
    let parts = line.split('\t');
    if (parts.length < 3) {
      const match = line.match(/^(.+?)\s+((?:Chị|Anh|Cô|Chú|Thúy|Thu|Linh|Hoàng|Tổ|Kho|Nhà xe).+?)\s+(.+)$/);
      if (match) parts = [match[1], match[2], match[3]];
      else return; 
    }

    const name = parts[0]?.trim();
    const manager = parts[1]?.trim();
    let address = parts[2]?.trim();
    if (address?.startsWith('"') && address?.endsWith('"')) address = address.slice(1, -1);

    if (name && address) {
      branches.push({
        id: `init-${index}-${Date.now()}`,
        name,
        manager: manager || "Quản lý kho",
        address,
        phoneNumber: "",
        searchStr: normalizeString(`${name} ${address}`),
        holidaySchedule: { isEnabled: false, startTime: "", endTime: "" },
        holidayHistory: [],
        isActive: true,
        note: "",
        updatedAt: new Date().toISOString()
      });
    }
  });
  return branches;
};

// --- 4. THUẬT TOÁN TÌM KIẾM CỤC BỘ (TỐC ĐỘ CAO) ---

const findLocalMatch = (customerAddress: string, activeBranches: Branch[]): { branch: Branch, score: number, reason: string } | null => {
  const normalizedQuery = normalizeString(customerAddress);
  
  // Bước 1: Mở rộng truy vấn bằng Alias (VD: Go Cong -> Go Cong Tien Giang)
  let expandedQuery = normalizedQuery;
  let aliasMatch = "";
  let aliasKeyword = ""; // Lưu keyword gốc (vd: nguyen sinh sac)

  // Tìm alias dài nhất khớp trước (để ưu tiên 'chau thanh tien giang' hơn 'tien giang')
  const sortedAliases = Object.keys(GEO_ALIASES).sort((a, b) => b.length - a.length);

  for (const key of sortedAliases) {
    if (normalizedQuery.includes(key)) {
      const mappedValue = GEO_ALIASES[key];
      expandedQuery += " " + mappedValue;
      aliasMatch = mappedValue; // Lưu lại từ khóa đích (VD: lien chieu)
      aliasKeyword = key;
      break; // Chỉ lấy 1 alias quan trọng nhất
    }
  }

  const queryTokens = removeStopWords(expandedQuery).split(" ");

  let bestBranch: Branch | null = null;
  let maxScore = 0;
  // let matchReason = "";

  for (const branch of activeBranches) {
    let score = 0;
    const branchStr = branch.searchStr; // Đã normalize

    // Kiểm tra Alias Match (Trọng số SIÊU CAO)
    // Nếu user nhập "Nguyễn Sinh Sắc" -> Alias ra "liên chiểu".
    // Kho nào có chữ "liên chiểu" (trong tên hoặc địa chỉ) sẽ được cộng 500 điểm.
    if (aliasMatch && branchStr.includes(aliasMatch)) {
      score += 500;
    }

    // Kiểm tra từng token
    let matchedTokens = 0;
    for (const token of queryTokens) {
      if (token.length < 2) continue; // Bỏ qua từ quá ngắn

      if (branchStr.includes(token)) {
        if (CONFUSING_WORDS.includes(token)) {
            score += 5;
        } else {
            score += 10;
        }
        matchedTokens++;
      }
    }
    
    // Thưởng điểm nếu khớp cụm từ liên tiếp (quan trọng)
    for (let i = 0; i < queryTokens.length - 1; i++) {
        const phrase = queryTokens[i] + " " + queryTokens[i+1];
        if (branchStr.includes(phrase)) {
            score += 30;
        }
    }

    if (score > maxScore) {
      maxScore = score;
      bestBranch = branch;
    }
  }
  
  // --- QUYẾT ĐỊNH CÓ DÙNG KẾT QUẢ LOCAL KHÔNG ---
  // Hạ ngưỡng chấp nhận xuống nếu có Alias Match
  const threshold = aliasMatch ? 100 : 40; 

  if (bestBranch && maxScore >= threshold) {
     // KIỂM TRA ĐỘ PHỨC TẠP CỦA INPUT
     const hasNumber = /\d/.test(customerAddress);
     const inputMeaningfulTokens = queryTokens.filter(t => t.length > 2);
     
     let matchedCount = 0;
     inputMeaningfulTokens.forEach(t => {
       if (bestBranch!.searchStr.includes(t)) matchedCount++;
     });
     
     const matchRatio = inputMeaningfulTokens.length > 0 ? (matchedCount / inputMeaningfulTokens.length) : 0;

     // LOGIC CHẶN LOCAL (ĐÃ TỐI ƯU):
     // Chỉ chặn (Force AI) nếu:
     // 1. Có số nhà (tìm cụ thể)
     // 2. Tỷ lệ khớp từ quá thấp (< 0.4 - đã giảm từ 0.6)
     // 3. VÀ QUAN TRỌNG: Không có Alias Match nào.
     //    (Nghĩa là: Nếu đã khớp Alias "Liên Chiểu" thì DÙ TÊN ĐƯỜNG KHÁC NHAU vẫn trả về ngay, không gọi AI).
     if (hasNumber && matchRatio < 0.4 && !aliasMatch) {
        console.log("Local match rejected (Force AI). Score:", maxScore, "Ratio:", matchRatio);
        return null; 
     }

     const reason = aliasMatch 
        ? `Đã tìm thấy kho tại khu vực ${aliasMatch.toUpperCase()} (Phù hợp với: ${aliasKeyword})`
        : `Tìm thấy kho có địa chỉ trùng khớp với từ khóa bạn nhập.`;
     
     return { branch: bestBranch, score: maxScore, reason };
  }

  return null;
};

// --- 5. THUẬT TOÁN TÌM KIẾM HYBRID (CHÍNH) ---

export const findNearestBranch = async (customerAddress: string, branches: Branch[]): Promise<BranchResult> => {
  if (!branches?.length) throw new Error("Chưa có dữ liệu chi nhánh.");
  const activeBranches = branches.filter(b => b.isActive !== false);
  if (!activeBranches.length) throw new Error("Không có chi nhánh nào đang hoạt động.");

  // --- BƯỚC 1: TRA CỨU CỤC BỘ (INSTANT) ---
  const localResult = findLocalMatch(customerAddress, activeBranches);

  if (localResult) {
    console.log("Local match used (FAST):", localResult.branch.name);
    return {
        branchName: localResult.branch.name,
        managerName: localResult.branch.manager,
        branchAddress: localResult.branch.address,
        phoneNumber: localResult.branch.phoneNumber, 
        reasoning: localResult.reason,
        estimatedDistance: "Gần nhất (Tra cứu nhanh)", 
        customerAddressOriginal: customerAddress,
        holidaySchedule: localResult.branch.holidaySchedule,
        searchSource: 'INSTANT'
    };
  }

  // --- BƯỚC 2: GỌI AI (FALLBACK) ---
  if (!process.env.API_KEY) {
    throw new Error("Không tìm thấy địa chỉ phù hợp (Và thiếu API Key để tra cứu nâng cao).");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const branchesListText = activeBranches.map(b => `ID: ${b.id} | Address: ${b.address}`).join("\n");

  const prompt = `
    Find the closest warehouse for: "${customerAddress}"
    List:
    ${branchesListText}
    
    Instructions:
    1. Identify the location of the user address.
    2. Identify the location of each warehouse.
    3. Calculate approximated driving distance.
    4. Select the warehouse with the SHORTEST distance.
    5. VERY IMPORTANT: If the user provides a specific street address, prioritize physical proximity over name matching.
    
    Return JSON:
    {
      "selectedBranchId": "string",
      "estimatedDistance": "string",
      "reasoning": "string (Vietnamese)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedBranchId: { type: Type.STRING },
            estimatedDistance: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
        },
      },
    });

    const resultJson = JSON.parse(response.text || "{}");
    const bestBranch = activeBranches.find(b => b.id === resultJson.selectedBranchId);

    if (!bestBranch) throw new Error("Không tìm thấy kết quả phù hợp.");

    return {
      branchName: bestBranch.name,
      managerName: bestBranch.manager,
      branchAddress: bestBranch.address,
      phoneNumber: bestBranch.phoneNumber, 
      reasoning: resultJson.reasoning || "Đề xuất bởi AI.",
      estimatedDistance: resultJson.estimatedDistance,
      customerAddressOriginal: customerAddress,
      holidaySchedule: bestBranch.holidaySchedule,
      searchSource: 'AI'
    };

  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error("Không tìm thấy kho phù hợp. Vui lòng nhập rõ Tỉnh/Thành phố.");
  }
};
