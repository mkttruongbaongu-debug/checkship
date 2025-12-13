
import { GoogleGenAI, Type } from "@google/genai";
import { RAW_BRANCH_DATA } from "../constants";
import { BranchResult, Branch } from "../types";
import { VIETNAM_LOCATION_DB, DistrictDetail } from "./locationData";

// --- 1. CONFIGURATION ---
const MODEL_NAME = "gemini-2.5-flash";

// --- 2. TỪ ĐIỂN ĐỊA LÝ & HÀM CHUẨN HÓA ---

const STOP_WORDS = [
  "thanh pho", "tinh", "quan", "huyen", "thi xa", "thi tran", "phuong", "xa", "ap", 
  "duong", "so", "nha", "ngo", "ngach", "hem", "khu pho", "to", "viet nam", "vn", "tp"
];

const CONFUSING_WORDS = ["hue", "ho chi minh", "thai binh", "nam dinh", "hung yen", "cao bang", "lang son"];

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
  return result.replace(/\s+/g, " ").trim();
};

// Hàm chuẩn hóa SĐT: Thêm số 0 vào đầu nếu bị thiếu (do Google Sheet format number)
export const normalizePhoneNumber = (phone: any): string => {
  if (!phone) return "";
  let str = String(phone).trim();
  // Chỉ giữ lại số
  str = str.replace(/[^\d]/g, '');

  // Nếu độ dài là 9 số (VD: 704598786) -> Thêm 0
  if (str.length === 9 && !str.startsWith('0')) {
    return '0' + str;
  }
  // Nếu bắt đầu bằng 84 (VD: 8490...) -> Chuyển thành 090...
  if (str.startsWith('84') && str.length > 9) {
      return '0' + str.substring(2);
  }
  return str;
};

const BASE_GEO_ALIASES: Record<string, string> = {
  "sai gon": "ho chi minh", "hcm": "ho chi minh", "tphcm": "ho chi minh", "ho chi minh": "ho chi minh",
  "hn": "ha noi", "tphn": "ha noi", "ha noi": "ha noi",
  "ba ria": "ba ria vung tau", "vung tau": "ba ria vung tau",
  "thua thien hue": "hue", "hue": "hue",
  "buon ma thuot": "dak lak", "bmt": "dak lak",
  "quy nhon": "binh dinh",
  "nha trang": "khanh hoa",
  "da lat": "lam dong",
  "pleiku": "gia lai",
  "vinh": "nghe an",
  "ha long": "quang ninh",
  "ecopark": "hung yen",
  "moc bai": "tay ninh"
};

const generateExtendedGeoAliases = () => {
  const aliases = { ...BASE_GEO_ALIASES };
  Object.entries(VIETNAM_LOCATION_DB).forEach(([province, districts]) => {
     const normProv = normalizeString(province);
     if (!aliases[normProv]) aliases[normProv] = normProv;
     Object.keys(districts).forEach(district => {
        const normDist = normalizeString(district);
        if (normDist.length > 2) {
           aliases[normDist] = normProv;
        }
     });
  });
  return aliases;
};

const GEO_ALIASES = generateExtendedGeoAliases();
const SORTED_ALIAS_KEYS = Object.keys(GEO_ALIASES).sort((a, b) => b.length - a.length);

const getLevenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
};

// Hàm kiểm tra chuỗi mờ (Fuzzy Contains)
// Trả về true nếu 'pattern' xuất hiện trong 'text' với sai số cho phép (typo)
const fuzzyContains = (text: string, pattern: string): boolean => {
  const pLen = pattern.length;
  if (pLen < 4) return text.includes(pattern); // Từ khóa ngắn thì bắt buộc chính xác
  
  // UPDATE: Siết chặt quy tắc tolerance
  // < 8 ký tự (VD: "yen bai", "ha noi") -> Chỉ cho phép sai 1 ký tự
  // >= 8 ký tự -> Cho phép sai 2 ký tự
  const tolerance = pLen < 8 ? 1 : 2;
  const textLen = text.length;
  
  // Quét cửa sổ trượt (Sliding Window)
  for (let i = 0; i <= textLen - pLen + 1; i++) {
    // Kiểm tra các substring có độ dài tương đương pattern (+/- 1 ký tự để handle thiếu/thừa chữ)
    const sub = text.substring(i, i + pLen);
    if (getLevenshteinDistance(sub, pattern) <= tolerance) return true;

    if (i + pLen - 1 <= textLen) {
       const subMinus = text.substring(i, i + pLen - 1);
       if (getLevenshteinDistance(subMinus, pattern) <= tolerance) return true;
    }
    
    if (i + pLen + 1 <= textLen) {
       const subPlus = text.substring(i, i + pLen + 1);
       if (getLevenshteinDistance(subPlus, pattern) <= tolerance) return true;
    }
  }
  return false;
};

const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

export const generateBranchSearchStr = (name: string, address: string, phone: string): string => {
  return normalizeString(`${name} ${address} ${phone}`);
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
        name, manager: manager || "Quản lý kho", address,
        phoneNumber: "",
        searchStr: normalizeString(`${name} ${address}`),
        holidaySchedule: { isEnabled: false, startTime: "", endTime: "" },
        holidayHistory: [], isActive: true, note: "", updatedAt: new Date().toISOString()
      });
    }
  });
  return branches;
};

// --- 4. THUẬT TOÁN TÌM KIẾM CẢI TIẾN (LOGIC 3 BƯỚC: TỈNH -> QUẬN CỦA ĐƯỜNG -> KHO) ---

// Return Types:
// - Object: Tìm thấy
// - null: Không tìm thấy local nhưng có thể fallback (nếu cho phép)
// - 'NOT_FOUND_IN_REGION': Biết Tỉnh nhưng không có kho
// - 'MISSING_PROVINCE': Không biết Tỉnh (QUAN TRỌNG)
const findLocalMatch = (customerAddress: string, activeBranches: Branch[]): { branch: Branch, score: number, reason: string } | null | 'NOT_FOUND_IN_REGION' | 'MISSING_PROVINCE' => {
  const normalizedQuery = normalizeString(customerAddress);
  
  // --- BƯỚC 1: XÁC ĐỊNH TỈNH/THÀNH (SCOPE) ---
  let targetProvince: string | null = null;
  let targetKeyword = ""; 
  let detectionMethod = ""; // 'exact', 'fuzzy', 'inference'

  // 1a. EXACT MATCH (Ưu tiên cao nhất)
  for (const key of SORTED_ALIAS_KEYS) {
    if (normalizedQuery.includes(key)) {
      targetProvince = GEO_ALIASES[key]; 
      targetKeyword = key;
      detectionMethod = 'exact';
      break; 
    }
  }

  // 1b. FUZZY MATCH (Nếu khách gõ sai chính tả: "đà năx" -> "đà nẵng")
  if (!targetProvince) {
     for (const key of SORTED_ALIAS_KEYS) {
         if (key.length < 4) continue; // Bỏ qua từ khóa quá ngắn để tránh nhiễu
         if (fuzzyContains(normalizedQuery, key)) {
             targetProvince = GEO_ALIASES[key];
             targetKeyword = key;
             detectionMethod = 'fuzzy';
             console.log(`Fuzzy match detected: "${key}" in query`);
             break;
         }
     }
  }

  // 1c. INFERENCE FROM STREET (Logic "Thần thánh" để sửa sai cho Fuzzy)
  // Nếu chưa tìm thấy Tỉnh HOẶC chỉ tìm thấy bằng Fuzzy (có thể sai, VD: "Yên Bái" vs "Nguyễn Sinh..."),
  // Ta quét lại tên đường để kiểm chứng (Double Check).
  if (!targetProvince || detectionMethod === 'fuzzy') {
     let inferredProvince: string | null = null;

     for (const [prov, dists] of Object.entries(VIETNAM_LOCATION_DB)) {
         const normProv = normalizeString(prov);
         
         // Chỉ kiểm tra các tỉnh mà ta CÓ CHI NHÁNH HOẠT ĐỘNG
         const hasActiveBranch = activeBranches.some(b => b.searchStr.includes(normProv));
         if (!hasActiveBranch) continue;

         let provinceScore = 0;
         // Quét tất cả đường/địa danh trong tỉnh này
         Object.values(dists).forEach(d => {
             const keywords = [...(d.streets||[]), ...(d.landmarks||[]), ...(d.malls||[])];
             // Chỉ tính điểm với từ khóa dài (> 4 ký tự) để chắc chắn
             if (keywords.some(k => k.length > 4 && normalizedQuery.includes(normalizeString(k)))) {
                 provinceScore++;
             }
         });
         
         if (provinceScore > 0) {
             inferredProvince = normProv;
             // Nếu tìm thấy tên đường chính xác -> Break luôn, không cần quét tỉnh khác
             break; 
         }
     }

     // QUYẾT ĐỊNH: Nếu tìm ra Tỉnh nhờ tên đường -> Ưu tiên dùng nó!
     // (Vì tên đường "Nguyễn Sinh Sắc" chính xác hơn phỏng đoán mờ "Yên Bái")
     if (inferredProvince) {
         if (inferredProvince !== targetProvince) {
             console.log(`Override Fuzzy Province (${targetProvince}) with Inferred Province (${inferredProvince}) due to Street Match.`);
             targetProvince = inferredProvince;
             targetKeyword = "Suy luận từ tên đường";
             detectionMethod = 'inference';
         } else if (!targetProvince) {
             targetProvince = inferredProvince;
             targetKeyword = "Suy luận từ tên đường";
             detectionMethod = 'inference';
         }
     }
  }

  // --- RÀNG BUỘC MỚI: NẾU KHÔNG TÌM ĐƯỢC TỈNH THÌ DỪNG NGAY ---
  if (!targetProvince) {
      return 'MISSING_PROVINCE';
  }

  // Nếu tìm ra Tỉnh mà không có kho nào ở Tỉnh đó -> Báo lỗi vùng miền
  const provinceExists = activeBranches.some(b => b.searchStr.includes(targetProvince!));
  if (!provinceExists) {
      return 'NOT_FOUND_IN_REGION'; 
  }

  // --- BƯỚC 2: LỌC DANH SÁCH CHI NHÁNH (CANDIDATES) ---
  let candidates = activeBranches;
  if (targetProvince) {
      candidates = activeBranches.filter(b => b.searchStr.includes(targetProvince!));
  }
  if (candidates.length === 0) return 'NOT_FOUND_IN_REGION';

  // --- TRƯỜNG HỢP: TỈNH CHỈ CÓ 1 KHO -> RETURN LUÔN ---
  if (candidates.length === 1 && targetProvince) {
      const b = candidates[0];
      return {
          branch: b,
          score: 1000,
          reason: `Đây là chi nhánh duy nhất tại khu vực ${targetProvince.toUpperCase()} (Khớp: ${targetKeyword})`
      };
  }

  // --- BƯỚC 3: BÓC TÁCH CHI TIẾT (STREET -> DISTRICT MAPPING) ---
  const provinceData = targetProvince ? VIETNAM_LOCATION_DB[targetProvince] : null;
  let userInferredDistricts: string[] = []; 
  
  if (provinceData) {
      Object.entries(provinceData).forEach(([districtName, details]) => {
          const normDistrictName = normalizeString(districtName);

          if (normalizedQuery.includes(normDistrictName)) {
              userInferredDistricts.push(normDistrictName);
          }

          const allKeywords = [
              ...(details.streets || []),
              ...(details.hospitals || []),
              ...(details.malls || []),
              ...(details.landmarks || [])
          ];
          
          if (allKeywords.some(kw => normalizedQuery.includes(normalizeString(kw)))) {
               if (!userInferredDistricts.includes(normDistrictName)) {
                   userInferredDistricts.push(normDistrictName);
               }
          }
      });
  }

  // --- BƯỚC 4: CHẤM ĐIỂM DỰA TRÊN QUẬN ĐÃ SUY LUẬN ---
  let bestBranch: Branch | null = null;
  let maxScore = -1;
  let bestReason = "";

  for (const branch of candidates) {
      let score = 0;
      const branchStr = branch.searchStr;

      let isDistrictMatch = false;
      let isNeighborMatch = false;

      userInferredDistricts.forEach(inferredDist => {
          if (branchStr.includes(inferredDist)) {
              score += 1000;
              isDistrictMatch = true;
          } else {
              const neighbors = provinceData?.[inferredDist]?.nearbyDistricts || [];
              if (neighbors.some(neighbor => branchStr.includes(normalizeString(neighbor)))) {
                  score += 500;
                  isNeighborMatch = true;
              }
          }
      });

      const queryTokens = normalizedQuery.split(" ").filter(t => t.length > 2 && !STOP_WORDS.includes(t));
      queryTokens.forEach(token => {
          if (branchStr.includes(token)) score += 10;
      });

      if (score > maxScore) {
          maxScore = score;
          bestBranch = branch;
          
          if (isDistrictMatch) {
              bestReason = `Chi nhánh này nằm cùng khu vực quận/huyện với địa chỉ của bạn.`;
          } else if (isNeighborMatch) {
              bestReason = `Chi nhánh này nằm tại khu vực lân cận, thuận tiện giao hàng cho bạn.`;
          } else {
              bestReason = `Chi nhánh phù hợp nhất dựa trên địa chỉ tìm kiếm (${detectionMethod === 'fuzzy' ? 'Sửa lỗi chính tả địa danh' : 'Phân tích địa chỉ'}).`;
          }
      }
  }
  
  if (bestBranch) {
      return { branch: bestBranch, score: maxScore, reason: bestReason };
  }

  return null;
};

// --- 5. TÌM KIẾM CHÍNH ---

export const findNearestBranch = async (customerAddress: string, branches: Branch[]): Promise<BranchResult> => {
  if (!branches?.length) throw new Error("Chưa có dữ liệu chi nhánh.");
  const activeBranches = branches.filter(b => b.isActive !== false);
  if (!activeBranches.length) throw new Error("Không có chi nhánh nào đang hoạt động.");

  // --- BƯỚC 1: TRA CỨU CỤC BỘ ---
  const localResult = findLocalMatch(customerAddress, activeBranches);

  // Xử lý các mã lỗi đặc biệt từ thuật toán local
  if (localResult === 'MISSING_PROVINCE') {
      throw new Error(`Vui lòng nhập thêm Tên Tỉnh/Thành Phố để tìm kiếm chính xác (Ví dụ: ... Đà Nẵng).`);
  }

  if (localResult === 'NOT_FOUND_IN_REGION') {
      throw new Error(`Rất tiếc, hiện tại Trường Bào Ngư chưa có chi nhánh tại khu vực này hoặc địa chỉ chưa chính xác. Vui lòng kiểm tra lại.`);
  }

  if (localResult && typeof localResult === 'object') {
    console.log("Local match used (SMART):", localResult.branch.name);
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

  // --- BƯỚC 2: AI FALLBACK ---
  // Lưu ý: Do đã có chốt chặn 'MISSING_PROVINCE' ở trên, code sẽ rất ít khi chạy xuống đây
  // Trừ khi logic local trả về null (rất hiếm khi đã qua được ải Province)
  
  if (!process.env.API_KEY) {
    throw new Error("Không tìm thấy địa chỉ phù hợp (Và thiếu API Key để tra cứu nâng cao).");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const shortIdMap = new Map<string, Branch>();
  const branchesListText = activeBranches.map((b, idx) => {
    const shortId = String(idx + 1);
    shortIdMap.set(shortId, b);
    return `ID: ${shortId} | Name: ${b.name} | Address: ${b.address}`;
  }).join("\n");

  const prompt = `
    Find the closest warehouse for: "${customerAddress}"
    List:
    ${branchesListText}
    
    Instructions:
    1. Identify the location of the user address.
    2. Identify the location of each warehouse.
    3. Calculate approximated driving distance.
    4. Select the warehouse with the SHORTEST distance.
    5. VERY IMPORTANT: Prioritize the Province/City match FIRST. If the user is in Da Nang, DO NOT suggest a warehouse in Ho Chi Minh City even if the street name matches.
    
    Return JSON:
    {
      "selectedBranchId": "string (MUST be the exact ID number from the list above, e.g. '1', '10')",
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

    const resultJson = JSON.parse(cleanJsonString(response.text || "{}"));
    const bestBranch = shortIdMap.get(String(resultJson.selectedBranchId));

    if (!bestBranch) {
        console.error("AI returned invalid ID:", resultJson.selectedBranchId);
        throw new Error("AI không thể xác định chi nhánh cụ thể.");
    }

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
    throw new Error("Không tìm thấy kho phù hợp. Vui lòng nhập rõ Quận/Huyện, Tỉnh/Thành phố.");
  }
};
