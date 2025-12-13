
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU CHUẨN
export type DistrictDetail = {
  streets: string[];       // Danh sách cung đường
  hospitals: string[];     // Bệnh viện, Trung tâm y tế
  malls: string[];         // TTTM, Siêu thị, Chợ
  landmarks: string[];     // Địa danh nổi tiếng, Trường học, Cơ quan
  nearbyDistricts: string[]; // Các quận huyện lân cận (để thuật toán lan truyền tìm kiếm)
};

export type ProvinceData = Record<string, DistrictDetail>;

// Helper để migrate dữ liệu cũ (chỉ có đường) sang cấu trúc mới
const simpleDist = (streets: string[]): DistrictDetail => ({
  streets, hospitals: [], malls: [], landmarks: [], nearbyDistricts: []
});

// 2. DỮ LIỆU CỰC ĐOAN (FULL LIST + RICH DATA)
export const VIETNAM_LOCATION_DB: Record<string, ProvinceData> = {

  // =================================================================
  // LÂM ĐỒNG
  // =================================================================
  "lam dong": {
    "da lat": {
      streets: ["bui thi xuan", "phan dinh phung", "3 thang 2", "tran phu", "ho tung mau", "le dai hanh", "nguyen van cu", "phu dong thien vuong", "nguyen thi minh khai", "hung vuong", "le hong phong", "pasteur", "tran hung dao", "hoang van thu", "dinh tien hoang", "nguyen cong tru", "hai ba trung", "tang bat ho", "truong cong dinh", "mai anh dao", "nguyen tu luc"],
      hospitals: ["benh vien da khoa lam dong", "benh vien hoan my da lat", "benh vien y hoc co truyen pham ngoc thach", "benh vien nhi lam dong"],
      malls: ["cho da lat", "cho dem da lat", "big c da lat", "go! da lat", "phan rang shop", "cho am phu"],
      landmarks: ["ho xuan huong", "quang truong lam vien", "vuon hoa thanh pho", "thung lung tinh yeu", "dinh bao dai", "ga da lat", "truong cao dang su pham", "nha tho con ga", "thien vien truc lam", "ho tuyen lam", "langbiang"],
      nearbyDistricts: ["lac duong", "don duong", "duc trong", "lam ha"]
    },
    "bao loc": {
      streets: ["tran phu", "nguyen van cu", "le hong phong", "huynh thuc khang", "phan boi chau", "ha giang", "nguyen cong tru", "lam son", "dao duy tu", "ly thuong kiet", "quang trung", "ho tung mau", "mac dinh chi", "ky con"],
      hospitals: ["benh vien II lam dong", "benh vien y hoc co truyen bao loc", "trung tam y te bao loc"],
      malls: ["vincom plaza bao loc", "co.op mart bao loc", "cho bao loc", "cho cu bao loc"],
      landmarks: ["ho dong nai", "thac dambri", "chua bat nha", "nha tho bao loc", "doi che tam chau", "ho nam phuong", "chua linh quy phap an"],
      nearbyDistricts: ["bao lam", "di linh", "da teh"]
    }
  },

  // =================================================================
  // ĐÀ NẴNG (ĐÃ NÂNG CẤP)
  // =================================================================
  "da nang": {
    "cam le": {
      streets: ["cach mang thang 8", "truong chinh", "le dai hanh", "nguyen huu tho", "thang long", "ong ich duong", "pham hung", "xuan thuy", "nguyen nhan", "nguyen phong sac", "trinh dinh thao", "buu dinh", "con dau", "vo chi cong", "tran nam trung", "nguyen phuoc lan", "van tien dung", "chu cam phong", "me thu"],
      hospitals: ["benh vien da khoa cam le", "benh vien y hoc co truyen da nang", "trung tam y te cam le"],
      malls: ["cho cam le", "cho hoa cam", "mega market da nang (gan do)", "cho dau moi hoa cuong"],
      landmarks: ["ben xe trung tam da nang", "trung tam hoi cho trien lam", "lang yen ne", "dh kien truc da nang", "dh dong a", "dh ngoai thuong", "khu do thi phuoc ly", "khu do thi hoa xuan", "cau nguyen tri phuong", "cau hoa xuan", "san van dong hoa xuan"],
      nearbyDistricts: ["hoa vang", "hai chau", "thanh khe", "ngu hanh son"]
    },
    "thanh khe": {
      // Đã thêm "nguyen van linh", "hung vuong" vào đây vì đường này chạy qua Thanh Khê
      streets: ["dien bien phu", "nguyen tat thanh", "ha huy tap", "le duan", "nguyen tri phuong", "ham nghi", "huynh ngoc hue", "dung si thanh khe", "tran cao van", "hung vuong", "ly thai to", "nguyen van linh", "hoang hoa tham"],
      hospitals: ["benh vien da khoa thanh khe", "benh vien hoan my da nang"],
      malls: ["sieu thi co.op mart da nang", "cho sieu thi da nang", "cho thanh khe", "cho hai san thanh khe"],
      landmarks: ["cong vien 29/3", "ga da nang", "san bay da nang (tiep giap)", "tuong dai me nhu"],
      nearbyDistricts: ["hai chau", "cam le", "lien chieu"]
    },
    "lien chieu": {
       streets: ["ton duc thang", "nguyen luong bang", "nguyen tat thanh", "hoang van thai", "au co", "nguyen sinh sac", "lac long quan", "ngo thi nham", "kinh duong vuong"],
       hospitals: ["benh vien ung buou da nang", "benh vien tam than da nang", "trung tam y te lien chieu"],
       malls: ["cho hoa khanh", "cho nam o"],
       landmarks: ["dh bach khoa da nang", "dh su pham da nang", "khu cong nghiep hoa khanh", "bai tam xuan thieu", "deo hai van"],
       nearbyDistricts: ["thanh khe", "hoa vang"]
    },
    // Nâng cấp Hải Châu từ simpleDist lên Full để có nearbyDistricts
    "hai chau": {
      streets: ["bach dang", "tran phu", "nguyen van linh", "le duan", "2 thang 9", "hung vuong", "phan chau trinh", "hoang dieu", "le loi", "nguyen chi thanh", "trung nu vuong", "nguyen hue", "dong da", "pasteur", "hai phong", "ong ich khiem"],
      hospitals: ["benh vien da khoa gia dinh", "benh vien c da nang", "trung tam y te hai chau"],
      malls: ["cho han", "cho con", "vincom plaza da nang", "lotte mart da nang (gan do)"],
      landmarks: ["cau rong", "cau song han", "co vien cham", "nha tho chinh toa", "toa nha hanh chinh"],
      nearbyDistricts: ["thanh khe", "son tra", "cam le", "ngu hanh son"]
    },
    "son tra": simpleDist(["ngo quyen", "pham van dong", "vo van kiet", "hoang sa", "le duc tho", "nguyen van thoai"]),
    "ngu hanh son": simpleDist(["le van hien", "ngu hanh son", "truong sa", "vo nguyen giap", "mai dang chon", "non nuoc"]),
    "hoa vang": simpleDist(["quoc lo 14b", "au co", "pham hung", "hoa son", "hoa nhon", "ql14b", "dt602", "dt605"]),
    "hoa xuan": simpleDist(["vo chi cong", "tran nam trung", "con dau", "van tien dung", "nguyen phuoc lan", "chu cam phong", "me thu"])
  },

  // =================================================================
  // LONG AN
  // =================================================================
  "long an": {
    "tan an": {
      streets: ["hung vuong", "chau thi kim", "nguyen hue", "truong dinh", "mai thi tot", "nguyen huu tho", "quoc lo 1a", "huynh van nhut", "nguyen dinh chieu", "thu khoa huan", "vo van mon", "nguyen cuu van", "tra quy binh", "le van tao", "quoc lo 62"],
      hospitals: ["benh vien da khoa long an", "benh vien san nhi long an", "benh vien tam than long an"],
      malls: ["co.op mart tan an", "vincom plaza tan an", "cho tan an", "sieu thi dien may cho lon"],
      landmarks: ["cong vien thanh pho tan an", "san van dong long an", "tuong dai long an", "chua long phuoc", "cau tan an"],
      nearbyDistricts: ["thu thua", "chau thanh", "tan tru"]
    },
    "ben luc": simpleDist(["nguyen huu tho", "quoc lo 1a", "dt830", "phan van mang", "nguyen van tiep", "huong lo 8", "vo cong ton"]),
    "tan tru": simpleDist(["dt833", "huong lo 24", "nguyen trung truc"])
  },

  // =================================================================
  // TP. HỒ CHÍ MINH
  // =================================================================
  "ho chi minh": {
    "binh thanh": {
      streets: ["dien bien phu", "xo viet nghe tinh", "bach dang", "phan dang luu", "le quang dinh", "no trang long", "dinh bo linh", "nguyen xi", "ung van khiem", "nguyen gia tri", "thanh da", "binh quoi", "chu van an", "nguyen van dau", "hoang hoa tham", "van kiep", "vu huy tan", "pham viet chanh", "ngo tat to", "nguyen huu canh"],
      hospitals: ["benh vien ung buou", "benh vien nhan dan gia dinh", "benh vien columbia asia", "benh vien quoc te vinmec", "benh vien quan binh thanh"],
      malls: ["landmark 81", "vincom center landmark 81", "pearl plaza", "cho ba chieu", "cho thi nghe", "cho van thanh", "co.op mart chu van an"],
      landmarks: ["vinhomes central park", "saigon pearl", "city garden", "ben xe mien dong", "khu du lich van thanh", "khu du lich binh quoi", "hutech", "dh giao thong van tai", "dh ngoai thuong"],
      nearbyDistricts: ["quan 1", "phu nhuan", "go vap", "thu duc", "quan 2"]
    },
    "tan phu": {
      streets: ["luy ban bich", "tan ky tan quy", "au co", "thoai ngoc hau", "hoa binh", "vuon lai", "le trong tan", "tay thanh", "doc lap", "tan son nhi", "nguyen son", "go dau", "truong vinh ky", "tan huong", "che lan vien", "thach lam", "binh long"],
      hospitals: ["benh vien quan tan phu", "phong kham da khoa cong hoa", "trung tam y te tan phu"],
      malls: ["aeon mall tan phu", "aeon celadon", "pandora city", "big c truong chinh", "go! truong chinh", "cho tan huong", "cho tan quy", "cho son ky"],
      landmarks: ["cong vien dam sen", "dam sen nuoc", "chung cu richstar", "dh cong nghiep thuc pham", "hufi", "gamuda land"],
      nearbyDistricts: ["tan binh", "binh tan", "quan 11", "quan 12", "quan 6"]
    },
    "phu nhuan": {
      streets: ["phan xich long", "phan dang luu", "nguyen van troi", "hoang van thu", "le van sy", "huynh van banh", "tran huy lieu", "thich quang duc", "hoa su", "co giang", "co bac", "nguyen trong tuyen", "truong quoc dung", "dao duy anh", "ho van hue"],
      hospitals: ["benh vien hoan my", "benh vien an sinh", "benh vien quan phu nhuan", "vien y duoc hoc dan toc"],
      malls: ["cho phu nhuan", "cho nguyen dinh chieu", "co.op mart rach mieu", "sieu thi super bowl"],
      landmarks: ["san van dong quan khu 7", "white palace", "cong vien gia dinh", "chua vinh nghiem", "cong vien hoang van thu"],
      nearbyDistricts: ["quan 1", "quan 3", "binh thanh", "tan binh", "go vap"]
    },
    "quan 7": {
      streets: ["nguyen van linh", "huynh tan phat", "nguyen huu tho", "nguyen thi thap", "le van luong", "lam van ben", "nguyen luong bang", "tan my", "hoang quoc viet", "ton dat tien", "tran xuan soan", "ly phuc man", "mai van vinh", "pham thai buong", "ha huy tap"],
      hospitals: ["benh vien fv", "benh vien phap viet", "benh vien tim tam duc", "benh vien quan 7", "phong kham victoria"],
      malls: ["lotte mart quan 7", "crescent mall", "sc vivocity", "big c nguyen thi thap", "cho tan my", "cho tan quy dong"],
      landmarks: ["secc", "trung tam trien lam sai gon", "ho ban nguyet", "cau anh sao", "phu my hung", "sunrise city", "dh rmit", "dh ton duc thang"],
      nearbyDistricts: ["quan 4", "quan 8", "nha be", "binh chanh", "quan 2"]
    },
    "quan 1": simpleDist(["nguyen hue", "le loi", "dong khoi", "ham nghi", "ton duc thang", "le duan", "hai ba trung", "nam ky khoi nghia", "vo van kiet", "tran hung dao", "nguyen trai", "ly tu trong", "pasteur", "dinh tien hoang", "nguyen du"]),
    "thu duc": simpleDist(["vo van ngan", "dang van bi", "kha van can", "pham van dong", "hoang dieu 2", "le van viet", "do xuan hop", "nguyen duy trinh", "xa lo ha noi", "to ngoc van", "linh dong", "linh trung"]),
    "quan 8": simpleDist(["trinh quang nghi", "pham the hien", "ta quang buu", "duong ba trac"]),
    "nha be": simpleDist(["nguyen huu tho", "huynh tan phat", "le van luong", "phuoc kien"])
  },

  // =================================================================
  // TIỀN GIANG (ĐÃ NÂNG CẤP)
  // =================================================================
  "tien giang": {
    "my tho": {
      streets: ["ap bac", "hung vuong", "le thi hong gam", "dinh bo linh", "nguyen thi thap", "tran hung dao", "ly thuong kiet", "thu khoa huan", "nam ky khoi nghia", "tet mau than", "hoang hoa tham", "quoc lo 60", "le dai hanh", "yersin", "le van pham"],
      hospitals: ["benh vien da khoa tien giang", "benh vien quan y 120", "benh vien phu san tien giang", "benh vien mat tien giang"],
      malls: ["big c go! my tho", "co.op mart my tho", "vincom plaza my tho", "cho my tho", "cho cu"],
      landmarks: ["cong vien lac hong", "gieng nuoc my tho", "chua vinh trang", "trai ran dong tam", "cau rach mieu"],
      nearbyDistricts: ["chau thanh", "cho gao"]
    },
    "cai lay": {
      streets: ["vo viet tan", "30 thang 4", "quoc lo 1a", "truong dinh", "nguyen thi thap", "thanh tam", "tu kiet", "ben cat", "phan van khoe", "duong so 1", "duong so 2", "dt868"],
      hospitals: ["benh vien da khoa khu vuc cai lay"],
      malls: ["cho cai lay", "co.op mart cai lay"],
      landmarks: ["tuong dai chien thang ap bac", "thien ho duong", "cong vien cai lay"],
      nearbyDistricts: ["cai be", "chau thanh"]
    }
  },

  // =================================================================
  // THỪA THIÊN HUẾ (KEY ĐÃ ĐƯỢC CHUẨN HÓA VỀ 'HUE' ĐỂ KHỚP DATA)
  // =================================================================
  "hue": {
    "hue": {
      streets: ["le loi", "hung vuong", "nguyen hue", "ba trieu", "tran hung dao", "le duan", "phan dang luu", "huynh thuc khang", "ben nghe", "dong da", "le quy don", "nguyen tri phuong", "to huu", "kiem hue", "dien bien phu", "phan chu trinh", "ly thuong kiet", "hai ba trung", "ngo quyen", "dinh tien hoang", "mai thuc loan"],
      hospitals: ["benh vien trung uong hue", "benh vien quoc te hue", "benh vien dai hoc y duoc hue", "benh vien thanh pho hue", "benh vien mat hue"],
      malls: ["vincom plaza hue", "big c hue", "go! hue", "cho dong ba", "co.op mart hue", "cho an cuu", "cho ben ngu"],
      landmarks: ["dai noi hue", "kinh thanh hue", "chua thien mu", "cau truong tien", "cau phu xuan", "dh y duoc hue", "dh su pham hue", "quoc hoc hue", "lang khai dinh", "lang tu duc", "con hen"],
      nearbyDistricts: ["huong thuy", "huong tra", "phu vang"]
    }
  },

  // =================================================================
  // KHÁNH HÒA (ĐÃ NÂNG CẤP)
  // =================================================================
  "khanh hoa": {
    "nha trang": {
      streets: ["tran phu", "le thanh ton", "hung vuong", "nguyen thien thuat", "le hong phong", "23 thang 10", "thai nguyen", "yersin", "thong nhat", "nguyen trai", "nguyen binh khiem", "pasteur", "hoang dieu", "nguyen thi minh khai", "vo truong toan", "pham van dong"],
      hospitals: ["benh vien da khoa tinh khanh hoa", "benh vien quan y 87", "benh vien vinmec nha trang", "benh vien tam tri"],
      malls: ["vincom plaza nha trang", "vincom thai nguyen", "lotte mart nha trang", "cho dam", "cho xom moi", "big c go! nha trang"],
      landmarks: ["thap tram huong", "chua long son", "thap ba ponagar", "vinpearl land", "ga nha trang", "vien hai duong hoc", "hon chong"],
      nearbyDistricts: ["dien khanh", "cam lam"]
    },
    "cam ranh": {
      streets: ["hung vuong", "pham van dong", "nguyen tat thanh", "3 thang 4", "phan boi chau", "nguyen trong ky", "le duan", "nguyen cong tru", "22 thang 8"],
      hospitals: ["benh vien da khoa khu vuc cam ranh", "benh vien quan y 486"],
      malls: ["co.op mart cam ranh", "cho cam ranh", "sieu thi dien may xanh"],
      landmarks: ["san bay quoc te cam ranh", "cang cam ranh", "chua oc (tu van)", "dao binh ba"],
      nearbyDistricts: ["cam lam"]
    }
  },

  // =================================================================
  // VĨNH LONG
  // =================================================================
  "vinh long": {
    "vinh long": {
      streets: ["pham thai buong", "trung nu vuong", "le thai to", "hung dao vuong", "nguyen hue", "mau than", "vo van kiet", "pho co dieu", "dinh tien hoang", "tran dai nghia", "3 thang 2", "19 thang 8", "nguyen van thiet", "lo bo"],
      hospitals: ["benh vien da khoa vinh long", "benh vien xuyen a vinh long", "benh vien y duoc co truyen vinh long", "benh vien trieu an loan tram"],
      malls: ["cho vinh long", "vincom plaza vinh long", "co.op mart vinh long", "sieu thi dien may cho lon"],
      landmarks: ["quang truong vinh long", "dh su pham ky thuat vinh long", "cau my thuan", "cong vien song tien", "van thanh mieu"],
      nearbyDistricts: ["long ho", "mang thit"]
    }
  },

  // =================================================================
  // ĐỒNG NAI
  // =================================================================
  "dong nai": {
    "long khanh": {
      streets: ["hung vuong", "ho thi huong", "ngo quyen", "le a", "nguyen tri phuong", "tran phu", "thich quang duc", "nguyen du", "khong tu", "hong thap tu", "khong tu"],
      hospitals: ["benh vien da khoa khu vuc long khanh", "trung tam y te long khanh"],
      malls: ["cho long khanh", "sieu thi hoang duc", "vinmart long khanh"],
      landmarks: ["tuong dai long khanh", "cong vien bia chien thang", "ga long khanh"],
      nearbyDistricts: ["xuan loc", "cam my", "thong nhat"]
    },
    "bien hoa": {
      streets: ["pham van thuan", "nguyen ai quoc", "dong khoi", "bui van hoa", "vo thi sau", "huynh van nghe", "nguyen van tri", "phan trung", "xa lo ha noi", "quoc lo 1k", "nguyen khuyen", "truong dinh", "phan dinh phung", "hung dao vuong", "30 thang 4", "hoang minh chanh"],
      hospitals: ["benh vien da khoa dong nai", "benh vien nhi dong nai", "benh vien tam than TW2", "benh vien quoc te hoan my dong nai", "benh vien ito sai gon"],
      malls: ["big c dong nai", "lotte mart bien hoa", "vincom plaza bien hoa", "co.op mart bien hoa", "cho bien hoa", "cho sat"],
      landmarks: ["khu du lich buu long", "van mieu tran bien", "cong vien bien hung", "quang truong tinh", "cau hoa an", "cu lao pho", "ga bien hoa"],
      nearbyDistricts: ["long thanh", "trang bom", "vinh cuu", "di an"]
    },
    "dinh quan": {
      streets: ["quoc lo 20", "la nga", "phu ngoc", "gia canh", "tran nhan tong", "nguyen hue", "3 thang 2", "dt763"],
      hospitals: ["benh vien da khoa khu vuc dinh quan", "trung tam y te dinh quan"],
      malls: ["cho dinh quan", "bach hoa xanh dinh quan"],
      landmarks: ["da ba chong", "thac mai", "khu du lich suoi mo", "cau la nga", "cong vien dinh quan"],
      nearbyDistricts: ["tan phu", "thong nhat", "vinh cuu"]
    }
  },

  // =================================================================
  // QUẢNG NGÃI
  // =================================================================
  "quang ngai": {
    "quang ngai": {
      streets: ["quang trung", "hung vuong", "pham van dong", "le loi", "phan dinh phung", "truong chinh", "le thanh ton", "nguyen nghiem", "tran hung dao", "le trung dinh", "nguyen cong phuong", "nguyen tu tan", "phan chu trinh", "nguyen du"],
      hospitals: ["benh vien da khoa quang ngai", "benh vien san nhi quang ngai", "benh vien phuc hung"],
      malls: ["cho quang ngai", "vincom plaza quang ngai", "co.op mart quang ngai", "go! quang ngai"],
      landmarks: ["nui thien an", "bo ke song tra", "quang truong pham van dong", "dh pham van dong", "co luy co thon", "thanh co quang ngai"],
      nearbyDistricts: ["tu nghia", "son tinh"]
    }
  },

  // =================================================================
  // CẦN THƠ
  // =================================================================
  "can tho": {
    "ninh kieu": {
      streets: ["hoa binh", "30 thang 4", "mau than", "nguyen van cu", "tran hung dao", "ly tu trong", "hai ba trung", "nguyen trai", "xo viet nghe tinh", "nguyen van linh", "hung vuong", "tran phu", "le loi", "phan dinh phung", "vo van tan", "de tham", "huynh cuong"],
      hospitals: ["benh vien da khoa trung uong can tho", "benh vien da khoa thanh pho can tho", "benh vien quan y 121", "benh vien phu san can tho"],
      malls: ["vincom xuan khanh", "vincom hung vuong", "lotte mart can tho", "cho dem tay do", "sense city", "co.op mart can tho"],
      landmarks: ["ben ninh kieu", "cau di bo can tho", "tuong dai bac ho", "dh can tho", "dh y duoc can tho", "cong vien luu huu phuoc", "chua ong", "bao tang can tho"],
      nearbyDistricts: ["cai rang", "binh thuy", "phong dien"]
    },
    "cai rang": {
      streets: ["quoc lo 1a", "pham hung", "quang trung", "vo nguyen giap", "tran chi dan", "lo vong cung"],
      hospitals: ["benh vien da khoa cai rang", "benh vien hoan my cuu long"],
      malls: ["cho noi cai rang", "cho cai rang", "go! can tho (gan do)"],
      landmarks: ["dh tay do", "cau can tho", "thien vien truc lam phuong nam (gan do)"],
      nearbyDistricts: ["ninh kieu", "phong dien"]
    },
    "binh thuy": simpleDist(["cach mang thang 8", "le hong phong", "bui huu nghia", "vo van kiet", "nguyen thong", "tran quang dieu"])
  },

  // =================================================================
  // ĐỒNG THÁP
  // =================================================================
  "dong thap": {
    "sa dec": {
      streets: ["nguyen sinh sac", "hung vuong", "tran hung dao", "nguyen tat thanh", "an duong vuong", "dt848", "nguyen hue", "tran phu", "le loi", "nguyen cu trinh", "hung dao vuong"],
      hospitals: ["benh vien da khoa sa dec", "benh vien phuong chau sa dec"],
      malls: ["cho sa dec", "co.op mart sa dec", "vincom plaza sa dec"],
      landmarks: ["lang hoa sa dec", "cong vien sa dec", "nha co huynh thuy le", "chua kien an cung"],
      nearbyDistricts: ["chau thanh", "lai vung", "lap vo"]
    },
    "cao lanh": {
      streets: ["nguyen hue", "30 thang 4", "ton duc thang", "pham huu lau", "ly thuong kiet", "nguyen trai", "dien bien phu", "vo truong toan", "nguyen van tre", "tran hung dao", "ngo thi nham", "dang dung"],
      hospitals: ["benh vien da khoa dong thap", "benh vien thai hoa", "benh vien mat dong thap"],
      malls: ["co.op mart cao lanh", "vincom plaza cao lanh", "cho cao lanh"],
      landmarks: ["lang mo nguyen sinh sac", "bao tang dong thap", "dh dong thap", "cong vien van mieu"],
      nearbyDistricts: ["cao lanh (huyen)", "thap muoi"]
    },
    "hong ngu": {
      streets: ["nguyen tat thanh", "le loi", "vo van kiet", "an duong vuong", "tran hung dao", "ngo quyen", "ham nghi", "vo thi sau", "ton duc thang"],
      hospitals: ["benh vien da khoa khu vuc hong ngu"],
      malls: ["cho hong ngu", "co.op mart hong ngu"],
      landmarks: ["tuong dai ca basa", "quang truong vo nguyen giap", "cau hong ngu"],
      nearbyDistricts: ["tan hong", "tam nong"]
    }
  },

  // =================================================================
  // BÌNH ĐỊNH
  // =================================================================
  "binh dinh": {
    "quy nhon": {
      streets: ["nguyen tat thanh", "an duong vuong", "xuan dieu", "nguyen thai hoc", "le hong phong", "tran hung dao", "ngo may", "nguyen hue", "dong da", "le duan", "tay son", "phan boi chau", "tang bat ho", "chuong duong"],
      hospitals: ["benh vien da khoa binh dinh", "benh vien quan y 13", "benh vien hoa binh"],
      malls: ["co.op mart quy nhon", "go! quy nhon", "vincom plaza quy nhon", "cho dam", "cho khu 6"],
      landmarks: ["eo gio", "ky co", "ghenh rang", "mo han mac tu", "quang truong nguyen tat thanh", "dh quy nhon", "thap doi", "cau thi nai"],
      nearbyDistricts: ["tuy phuoc", "van canh"]
    }
  },

  // =================================================================
  // AN GIANG
  // =================================================================
  "an giang": {
    "long xuyen": {
      streets: ["tran hung dao", "ha hoang ho", "nguyen hoang", "ton duc thang", "pham cu luong", "ly thai to", "ung long nguyen", "thoai ngoc hau", "nguyen trai", "le trieu kieu", "hai ba trung", "nguyen van cung", "ung van khiem", "vo thi sau"],
      hospitals: ["benh vien da khoa trung tam an giang", "benh vien san nhi an giang", "benh vien binh dan"],
      malls: ["cho long xuyen", "vincom plaza long xuyen", "nguyen kim an giang", "co.op mart long xuyen", "lotte mart long xuyen"],
      landmarks: ["tuong dai ton duc thang", "dh an giang", "pha vam cong", "ho nguyen du", "chua ong bac"],
      nearbyDistricts: ["chau thanh", "thoai son"]
    }
  },

  // =================================================================
  // GIA LAI
  // =================================================================
  "gia lai": {
    "pleiku": {
      streets: ["hung vuong", "tran phu", "le duan", "pham van dong", "cach mang thang 8", "truong chinh", "nguyen tat thanh", "hai ba trung", "phan dinh phung", "hoang van thu", "tran hung dao", "quyet tien", "thong nhat", "wuu", "le loi", "hoang hoa tham"],
      hospitals: ["benh vien da khoa gia lai", "benh vien quan y 211", "benh vien nhi gia lai", "benh vien mat gia lai"],
      malls: ["vincom plaza pleiku", "co.op mart pleiku", "cho pleiku", "cho moi", "trung tam thuong mai pleiku"],
      landmarks: ["bien ho (to nung)", "quang truong dai doan ket", "chua minh thanh", "san van dong pleiku", "hoc vien bong da hagl", "nha tu pleiku"],
      nearbyDistricts: ["dak doa", "ia grai", "chu pah"]
    }
  },

  // =================================================================
  // ĐẮK LẮK
  // =================================================================
  "dak lak": {
    "buon ma thuot": {
      streets: ["le duan", "nguyen tat thanh", "phan chu trinh", "y jut", "le hong phong", "hoang dieu", "nguyen cong tru", "nguyen van cu", "le thanh tong", "mai hac de", "tran phu", "ha huy tap", "ly thuong kiet", "ngo quyen", "y ngong", "dinh tien hoang", "le quy don", "y moan", "pham ngu lao", "nguyen du"],
      hospitals: ["benh vien da khoa vung tay nguyen", "benh vien da khoa thien hanh", "benh vien mat tay nguyen", "benh vien thanh pho"],
      malls: ["co.op mart buon ma thuot", "vincom plaza buon ma thuot", "go! buon ma thuot", "cho buon ma thuot", "sieu thi nguyen kim", "cho tan an"],
      landmarks: ["tuong dai chien thang", "nga 6 ban me", "lang ca phe trung nguyen", "bao tang dak lak", "dh tay nguyen", "cong vien nuoc", "biet dien bao dai", "chua sac tu khai doan"],
      nearbyDistricts: ["buon don", "cu m'gar", "krong ana", "cu kuin"]
    }
  },

  // =================================================================
  // HẢI PHÒNG
  // =================================================================
  "hai phong": {
    "hong bang": {
      streets: ["dinh tien hoang", "hoang van thu", "le dai hanh", "minh khai", "ly thuong kiet", "phan boi chau", "quang trung", "tran hung dao", "bach dang", "dien bien phu", "tran quang khai", "tam bac", "the lu"],
      hospitals: ["benh vien huu nghi viet tiep", "benh vien phu san hai phong", "benh vien da khoa quoc te"],
      malls: ["cho sat", "cho do", "vincom plaza imperia", "mega market hong bang"],
      landmarks: ["nha hat lon hai phong", "ben binh", "vuon hoa kim dong", "tuong dai nu tuong le chan", "cau hoang van thu", "pho di bo the lu"],
      nearbyDistricts: ["ngo quyen", "le chan", "thuy nguyen"]
    },
    "ngo quyen": {
      streets: ["le loi", "lach tray", "cau dat", "le thanh tong", "luong khanh thien", "da nang", "le hong phong", "may to", "van cao", "nguyen binh khiem", "tran phu", "nguyen trai"],
      hospitals: ["benh vien dai hoc y hai phong", "benh vien may chai"],
      malls: ["vincom plaza le thanh tong", "big c hai phong", "go! hai phong", "cho ga", "cho luong van can"],
      landmarks: ["ga hai phong", "san van dong lach tray", "ho an bien", "cung van hoa huu nghi viet tiep", "dh hang hai"],
      nearbyDistricts: ["hong bang", "le chan", "hai an"]
    },
    "le chan": {
      streets: ["to hieu", "tran nguyen han", "nguyen duc canh", "hai ba trung", "me linh", "ho sen", "nguyen van linh", "ton duc thang", "cat cut", "cho hang", "hoang minh thao"],
      hospitals: ["benh vien viet tiep 2", "benh vien y hoc bien"],
      malls: ["aeon mall hai phong", "cho hang", "cho an duong"],
      landmarks: ["ho sen", "tuong dai le chan", "den nghe"],
      nearbyDistricts: ["hong bang", "ngo quyen", "kien an"]
    },
    "kien an": simpleDist(["tran thanh ngo", "truong chinh", "le duan", "nguyen luong bang", "phan dang luu"]),
    "thuy nguyen": simpleDist(["nui deo", "bach dang", "da nang"])
  },

  // =================================================================
  // HẢI DƯƠNG
  // =================================================================
  "hai duong": {
    "hai duong": {
      streets: ["nguyen luong bang", "pham ngu lao", "le thanh nghi", "thanh nien", "tran hung dao", "truong chinh", "vo nguyen giap", "nguyen thi due", "bach dang", "chi lang", "ngo quyen", "doan ket", "thong nhat"],
      hospitals: ["benh vien da khoa tinh hai duong", "benh vien quan y 7", "benh vien nhi hai duong"],
      malls: ["big c hai duong", "vincom plaza hai duong", "cho phu yen", "cho hoi do"],
      landmarks: ["cong vien bach dang", "ho bach dang", "quang truong thong nhat", "con son kiep bac (gan do)"],
      nearbyDistricts: ["nam sach", "gia loc", "tu ky"]
    }
  },

  // =================================================================
  // QUẢNG NAM
  // =================================================================
  "quang nam": {
    "tam ky": {
      streets: ["hung vuong", "phan chu trinh", "tran cao van", "huynh thuc khang", "le loi", "nguyen hoang", "ly thuong kiet", "bach dang", "dien bien phu", "nguyen chi thanh", "trung nu vuong", "tran quy cap", "tieu la"],
      hospitals: ["benh vien da khoa quang nam", "benh vien nhi quang nam", "benh vien minh thien"],
      malls: ["co.op mart tam ky", "cho tam ky", "sieu thi dien may xanh"],
      landmarks: ["quang truong 24/3", "tuong dai me thu", "bien tam thanh", "dia dao ky anh"],
      nearbyDistricts: ["nui thanh", "thang binh", "phu ninh"]
    }
  },

  // =================================================================
  // NINH BÌNH
  // =================================================================
  "ninh binh": {
    "ninh binh": {
      streets: ["tran hung dao", "luong van thang", "le dai hanh", "dinh tien hoang", "nguyen cong tru", "truong han sieu", "hai thuong lan ong", "le hong phong", "van giang", "phuc thanh"],
      hospitals: ["benh vien da khoa ninh binh", "benh vien san nhi ninh binh", "benh vien quan y 5"],
      malls: ["cho rong ninh binh", "big c ninh binh", "go! ninh binh"],
      landmarks: ["nui non nuoc", "cong chao trang an", "san van dong ninh binh", "quang truong dinh tien hoang de"],
      nearbyDistricts: ["hoa lu", "yen khanh"]
    },
    "hoa lu": {
      streets: ["trang an", "thien ton", "hoa lu", "tam coc", "bich dong", "dt491"],
      hospitals: ["trung tam y te huyen hoa lu"],
      malls: ["cho thien ton"],
      landmarks: ["co do hoa lu", "khu du lich trang an", "tam coc bich dong", "chua bai dinh", "hang mua"],
      nearbyDistricts: ["ninh binh", "gia vien"]
    }
  },

  // =================================================================
  // HƯNG YÊN
  // =================================================================
  "hung yen": {
    "hung yen": {
      streets: ["dien bien phu", "pham ngu lao", "bai say", "trieu quang phuc", "nguyen van linh", "to hieu", "le loi", "chu manh trinh", "nguyen trai", "trung trac", "trung nhi"],
      hospitals: ["benh vien da khoa hung yen", "benh vien san nhi hung yen"],
      malls: ["cho pho hien", "sieu thi intimex", "sieu thi hcmart"],
      landmarks: ["ho ban nguyet", "den mau", "den tran", "van mieu xich dang", "quang truong nguyen van linh"],
      nearbyDistricts: ["tien lu", "kim dong"]
    },
    "van giang": simpleDist(["ecopark", "van giang", "long hung"])
  },

  // =================================================================
  // QUẢNG TRỊ
  // =================================================================
  "quang tri": {
    "dong ha": {
      streets: ["hung vuong", "le duan", "quoc lo 9", "ham nghi", "nguyen trai", "ly thuong kiet", "thanh co", "dang dung", "hoang dieu", "nguyen hue", "tran hung dao", "huyen tran cong chua", "nguyen trai"],
      hospitals: ["benh vien da khoa quang tri", "benh vien mat quang tri"],
      malls: ["cho dong ha", "co.op mart dong ha", "vincom plaza dong ha"],
      landmarks: ["cau hien luong (xa)", "thanh co quang tri (gan do)", "cong vien le duan", "trung tam van hoa tinh"],
      nearbyDistricts: ["trieu phong", "gio linh", "cam lo"]
    }
  },

  // =================================================================
  // CÀ MAU
  // =================================================================
  "ca mau": {
    "ca mau": {
      streets: ["ngo quyen", "tran hung dao", "phan ngoc hien", "nguyen tat thanh", "huynh thuc khang", "ly thuong kiet", "nguyen trai", "ca mau", "luu tan tai", "le duan", "phan dinh phung", "dinh tien hoang", "nguyen du"],
      hospitals: ["benh vien da khoa ca mau", "benh vien san nhi ca mau", "benh vien hoan my minh hai"],
      malls: ["cho ca mau", "vincom plaza ca mau", "co.op mart ca mau", "muong thanh ca mau", "sieu thi dien may xanh"],
      landmarks: ["cong vien hung vuong", "tuong dai ca mau", "cho noi ca mau", "chua monivongsa bopharam"],
      nearbyDistricts: ["cai nuoc", "tran van thoi"]
    }
  },

  // =================================================================
  // BÌNH DƯƠNG
  // =================================================================
  "binh duong": {
    "thu dau mot": {
      streets: ["dai lo binh duong", "cach mang thang 8", "yersin", "phu loi", "le hong phong", "pham ngoc thach", "huynh van luy", "thich quang duc", "nguyen van tiet", "bs yersin", "ngo quyen", "hoang van thu", "30 thang 4", "nguyen chi thanh", "tran van on"],
      hospitals: ["benh vien da khoa tinh binh duong", "benh vien van phuc", "benh vien columbia asia", "benh vien mau nhi binh duong"],
      malls: ["co.op mart binh duong", "big c binh duong", "go! binh duong", "cho thu dau mot", "becamex tower"],
      landmarks: ["chua ba thien hau", "nha tho phu cuong", "cong vien thanh le", "dh thu dau mot", "dh binh duong", "sVD go dau"],
      nearbyDistricts: ["thuan an", "di an", "ben cat", "tan uyen"]
    },
    "thuan an": simpleDist(["quoc lo 13", "dt743", "lai thieu", "nguyen van tiet", "binh chuan"]),
    "di an": simpleDist(["quoc lo 1k", "nguyen an ninh", "ly thuong kiet", "tran hung dao"])
  },

  // =================================================================
  // BÀ RỊA - VŨNG TÀU (ĐÃ NÂNG CẤP)
  // =================================================================
  "ba ria vung tau": {
    "vung tau": {
      streets: ["thuy van", "ha long", "bacu", "ba cu", "truong cong dinh", "le hong phong", "nguyen an ninh", "binh gia", "thong nhat", "hoang hoa tham", "vo thi sau", "tran phu", "le loi", "3 thang 2", "30 thang 4", "luong the vinh", "vi ba"],
      hospitals: ["benh vien le loi", "benh vien vung tau", "trung tam y te vietsovpetro"],
      malls: ["lotte mart vung tau", "co.op mart vung tau", "cho vung tau", "cho moi vung tau", "imperial plaza"],
      landmarks: ["tuong chua kito", "bach dinh", "ngon hai dang", "ho may park", "bai sau", "bai truoc", "mui nghinh phong", "hon ba"],
      nearbyDistricts: ["ba ria", "long dien"]
    }
  },

  // =================================================================
  // THANH HÓA (ĐÃ NÂNG CẤP)
  // =================================================================
  "thanh hoa": {
    "thanh hoa": {
      streets: ["le loi", "dai lo le loi", "ba trieu", "tran phu", "nguyen trai", "tong duy tan", "le hoan", "dinh cong trang", "hac thanh", "quang trung", "le lai", "truong thi", "doi cung", "nguyen du", "le huu lap", "cao thang"],
      hospitals: ["benh vien da khoa tinh thanh hoa", "benh vien nhi thanh hoa", "benh vien phu san thanh hoa", "benh vien hop luc"],
      malls: ["vincom plaza thanh hoa", "big c thanh hoa", "go! thanh hoa", "cho vuon hoa", "cho tay thanh", "sieu thi hc"],
      landmarks: ["tuong dai le loi", "quang truong lam son", "cau ham rong", "cong vien hoi an", "nha hat lam son", "ga thanh hoa"],
      nearbyDistricts: ["sam son", "dong son", "hoang hoa"]
    }
  },

  // =================================================================
  // BẮC NINH (ĐÃ NÂNG CẤP)
  // =================================================================
  "bac ninh": {
    "bac ninh": {
      streets: ["ly thai to", "nguyen trai", "tran hung dao", "nguyen dang dao", "huyen quang", "nguyen gia thieu", "kinh duong vuong", "ngoc han cong chua", "au co", "ho ngoc lan", "le thai to", "nguyen van cu", "nguyen cao"],
      hospitals: ["benh vien da khoa tinh bac ninh", "benh vien san nhi bac ninh", "benh vien quan y 110", "benh vien hoan my bac ninh"],
      malls: ["vincom plaza bac ninh", "dabaco bac ninh", "cho niem xa", "cho do"],
      landmarks: ["trung tam van hoa kinh bac", "thanh co bac ninh", "tuong dai ly thai to", "cong vien nguyen van cu", "van mieu bac ninh"],
      nearbyDistricts: ["tu son", "que vo", "tien du"]
    },
    "tu son": {
      streets: ["tran phu", "nguyen van cu", "minh khai", "ly thanh tong", "tu son", "dinh bang", "ly thai to", "le quang dao"],
      hospitals: ["benh vien da khoa tu son", "trung tam y te tu son"],
      malls: ["dabaco tu son", "cho giau"],
      landmarks: ["den do", "chua do", "dh the duc the thao bac ninh", "cong vien tu son"],
      nearbyDistricts: ["bac ninh", "yen phong"]
    }
  },

  // =================================================================
  // QUẢNG NINH (ĐÃ NÂNG CẤP)
  // =================================================================
  "quang ninh": {
    "uong bi": {
      streets: ["quang trung", "tran nhan tong", "phuong dong", "yen thanh", "nam khe", "trung vuong", "bac son", "thanh son", "hung vuong", "tue tinh"],
      hospitals: ["benh vien viet nam thuy dien uong bi"],
      malls: ["vincom plaza uong bi", "cho trung tam uong bi"],
      landmarks: ["chua ba vang", "yen tu", "ho yen trung", "dh ha long", "ga uong bi"],
      nearbyDistricts: ["dong trieu", "quang yen"]
    },
    "ha long": simpleDist(["le thanh tong", "tran hung dao", "cao xanh", "ha lam", "bach dang", "bai chay", "hoang quoc viet", "ha long", "cai dam", "hung thang"])
  },

  // =================================================================
  // THÁI NGUYÊN (ĐÃ NÂNG CẤP)
  // =================================================================
  "thai nguyen": {
    "thai nguyen": {
      streets: ["luong ngoc quyen", "hoang van thu", "cach mang thang 8", "phan dinh phung", "bac kan", "quang trung", "minh cau", "ben tuong", "nha trang", "thinh dan", "z115", "phu liem", "thong nhat"],
      hospitals: ["benh vien trung uong thai nguyen", "benh vien a thai nguyen", "benh vien gang thep"],
      malls: ["vincom plaza thai nguyen", "go! thai nguyen", "cho thai", "lan chi mart"],
      landmarks: ["bao tang van hoa cac dan toc", "quang truong vo nguyen giap", "dh thai nguyen", "dh su pham thai nguyen", "ho nui coc (gan do)"],
      nearbyDistricts: ["song cong", "pho yen"]
    }
  },

  // =================================================================
  // THÁI BÌNH (ĐÃ NÂNG CẤP)
  // =================================================================
  "thai binh": {
    "thai binh": {
      streets: ["le loi", "hai ba trung", "tran hung dao", "ly thuong kiet", "quang trung", "tran thai tong", "hoang dieu", "phan ba vanh", "le quy don", "ky dong", "ly bon", "long hung", "vo nguyen giap"],
      hospitals: ["benh vien da khoa tinh thai binh", "benh vien phu san thai binh", "benh vien nhi thai binh", "benh vien dai hoc y thai binh"],
      malls: ["vincom plaza thai binh", "go! thai binh", "cho bo xuyen"],
      landmarks: ["tuong dai bac ho", "dh y duoc thai binh", "cong vien ky ba", "bao tang thai binh"],
      nearbyDistricts: ["dong hung", "kien xuong"]
    }
  },

  // =================================================================
  // NAM ĐỊNH (ĐÃ NÂNG CẤP)
  // =================================================================
  "nam dinh": {
    "nam dinh": {
      streets: ["tran hung dao", "dien bien", "truong chinh", "giai phong", "le hong phong", "nguyen du", "hung vuong", "mac thi buoi", "han thuyen", "quang trung", "vi hoang", "van cao", "dong a", "truong thi"],
      hospitals: ["benh vien da khoa tinh nam dinh", "benh vien phu san nam dinh", "benh vien sai gon nam dinh"],
      malls: ["big c nam dinh", "go! nam dinh", "cho rong", "micom plaza"],
      landmarks: ["tuong dai tran hung dao", "ho vi xuyen", "san van dong thien truong", "cot co nam dinh", "den tran"],
      nearbyDistricts: ["my loc", "vu ban"]
    }
  },

  // =================================================================
  // PHÚ YÊN (ĐÃ NÂNG CẤP)
  // =================================================================
  "phu yen": {
    "tuy hoa": {
      streets: ["hung vuong", "le duan", "tran hung dao", "nguyen hue", "doc lap", "le loi", "nguyen tat thanh", "truong chinh", "ba trieu", "tran hung dao", "nguyen trai", "mai xuan thuong", "tran phu"],
      hospitals: ["benh vien da khoa phu yen", "benh vien mat phu yen"],
      malls: ["vincom plaza tuy hoa", "co.op mart tuy hoa", "cho tuy hoa"],
      landmarks: ["thap nhan", "nui nhan", "quang truong 1/4", "cau hung vuong", "ga tuy hoa", "bai bien tuy hoa"],
      nearbyDistricts: ["phu hoa", "dong hoa"]
    }
  },

  // =================================================================
  // BÌNH THUẬN (ĐÃ NÂNG CẤP)
  // =================================================================
  "binh thuan": {
    "phan thiet": {
      streets: ["tran hung dao", "thu khoa huan", "nguyen tat thanh", "ton duc thang", "le duan", "vo van kiet", "hung vuong", "mau than", "tu van tu", "le hong phong", "nguyen dinh chieu", "hai thuong lan ong", "nguyen hoi", "nguyen thong"],
      hospitals: ["benh vien da khoa binh thuan", "benh vien y hoc co truyen binh thuan"],
      malls: ["lotte mart phan thiet", "co.op mart phan thiet", "cho phan thiet", "cho phu thuy"],
      landmarks: ["thap poshanu", "truong duc thanh", "bai da ong dia", "cong vien vo van kiet", "mui ne (gan do)", "ga phan thiet"],
      nearbyDistricts: ["ham thuan bac", "ham thuan nam"]
    }
  },

  // =================================================================
  // NINH THUẬN (ĐÃ NÂNG CẤP)
  // =================================================================
  "ninh thuan": {
    "phan rang": {
      streets: ["thong nhat", "16 thang 4", "ngo gia tu", "21 thang 8", "le hong phong", "nguyen van cu", "yen ninh", "quang trung", "nguyen trai", "hung vuong", "hai thuong lan ong"],
      hospitals: ["benh vien da khoa tinh ninh thuan", "benh vien sai gon phan rang"],
      malls: ["vincom plaza phan rang", "co.op mart thanh ha", "cho phan rang"],
      landmarks: ["thap poklong garai", "quang truong 16/4", "cong vien bien binh son", "bao tang ninh thuan"],
      nearbyDistricts: ["ninh hai", "ninh phuoc"]
    }
  },

  // =================================================================
  // KIÊN GIANG (ĐÃ NÂNG CẤP)
  // =================================================================
  "kien giang": {
    "rach gia": {
      streets: ["nguyen trung truc", "lac hong", "3 thang 2", "tran phu", "lam quang ky", "dong da", "ton duc thang", "nguyen binh khiem", "mac cuu", "le hong phong", "nguyen hung son", "phan huy chu", "nguyen thoai hau", "quang trung"],
      hospitals: ["benh vien da khoa kien giang", "benh vien binh an"],
      malls: ["vincom plaza rach gia", "co.op mart rach gia", "cho rach gia", "trung tam thuong mai rach soi"],
      landmarks: ["cong tam quan", "khu lan bien tay bac", "den tho nguyen trung truc", "cong vien van hoa an hoa", "ben tau rach gia"],
      nearbyDistricts: ["chau thanh", "hon dat"]
    }
  },

  // =================================================================
  // VĨNH PHÚC (ĐÃ NÂNG CẤP)
  // =================================================================
  "vinh phuc": {
    "vinh yen": {
      streets: ["me linh", "hung vuong", "nguyen tat thanh", "kim ngoc", "ton duc thang", "lam son", "ngo quyen", "nguyen trai", "chu van an", "hai ba trung", "ly bon", "tran phu"],
      hospitals: ["benh vien da khoa tinh vinh phuc", "benh vien huu nghi lac viet", "benh vien quan y 109"],
      malls: ["co.op mart vinh phuc", "go! vinh phuc", "cho vinh yen"],
      landmarks: ["quang truong ho chi minh", "cong vien song hong thu do", "hoc vien ky thuat quan su", "dam vac"],
      nearbyDistricts: ["yen lac", "binh xuyen"]
    },
    "phuc yen": simpleDist(["hung vuong", "trung trac", "tran hung dao", "soc son"])
  },

  // =================================================================
  // TÂY NINH (ĐÃ NÂNG CẤP)
  // =================================================================
  "tay ninh": {
    "tay ninh": {
      streets: ["cach mang thang 8", "30 thang 4", "dien bien phu", "hoang le kha", "ly thuong kiet", "nguyen thai hoc", "pham van dong", "chau van liem", "lac long quan", "nguyen van rop", "truong chinh", "bo loi"],
      hospitals: ["benh vien da khoa tay ninh", "benh vien le ngoc tung"],
      malls: ["vincom plaza tay ninh", "co.op mart tay ninh", "cho long hoa", "cho tay ninh"],
      landmarks: ["nui ba den", "toa thanh tay ninh", "cong vien 30/4", "cau quan"],
      nearbyDistricts: ["hoa thanh", "chau thanh"]
    }
  },

  // =================================================================
  // BẾN TRE (ĐÃ NÂNG CẤP)
  // =================================================================
  "ben tre": {
    "ben tre": {
      streets: ["dong khoi", "nguyen dinh chieu", "hung vuong", "cach mang thang 8", "hoang lam", "vo nguyen giap", "nguyen van tu", "doan hoang minh", "nguyen trung truc", "le dai hanh", "tran quoc tuan"],
      hospitals: ["benh vien da khoa nguyen dinh chieu", "benh vien minh duc"],
      malls: ["co.op mart ben tre", "go! ben tre", "cho ben tre"],
      landmarks: ["ho truc giang", "cong vien dong khoi", "bao tang ben tre", "cau ben tre"],
      nearbyDistricts: ["chau thanh", "giong trom"]
    }
  },

  // =================================================================
  // TRÀ VINH (ĐÃ NÂNG CẤP)
  // =================================================================
  "tra vinh": {
    "tra vinh": {
      streets: ["nguyen thi minh khai", "vo nguyen giap", "pham ngu lao", "le loi", "nguyen dang", "dien bien phu", "son thong", "kien thi nhan", "le thanh ton", "tran quoc tuan", "bach dang"],
      hospitals: ["benh vien da khoa tra vinh", "benh vien quan y 121 (phan hieu)"],
      malls: ["co.op mart tra vinh", "vincom plaza tra vinh", "cho tra vinh"],
      landmarks: ["ao ba om", "chua ang", "bao tang khmer", "dh tra vinh", "cong vien thanh pho"],
      nearbyDistricts: ["chau thanh"]
    }
  },

  // =================================================================
  // SÓC TRĂNG (ĐÃ NÂNG CẤP)
  // =================================================================
  "soc trang": {
    "soc trang": {
      streets: ["tran hung dao", "phu loi", "le hong phong", "hung vuong", "ngo gia tu", "le duan", "ton duc thang", "nguyen chi thanh", "mac dinh chi", "truong cong dinh", "ly thuong kiet", "30 thang 4", "le loi"],
      hospitals: ["benh vien da khoa soc trang", "benh vien phuong chau soc trang"],
      malls: ["co.op mart soc trang", "cho soc trang", "vincom plaza soc trang"],
      landmarks: ["chua doi", "chua dat set", "chua kh'leang", "ho nuoc ngot", "tuong dai 3 co gai"],
      nearbyDistricts: ["my xuyen", "chau thanh"]
    }
  },

  // =================================================================
  // HẬU GIANG (ĐÃ NÂNG CẤP)
  // =================================================================
  "hau giang": {
    "vi thanh": {
      streets: ["tran hung dao", "nguyen cong tru", "vo van kiet", "le hong phong", "3 thang 2", "hau giang", "nguyen hue", "hai thuong lan ong", "vo nguyen giap", "hoa binh", "nguyen van troi"],
      hospitals: ["benh vien da khoa hau giang", "benh vien san nhi hau giang"],
      malls: ["vincom plaza vi thanh", "cho vi thanh", "co.op mart vi thanh"],
      landmarks: ["cong vien xa no", "kenh xa no", "cong vien chien thang chuong thien"],
      nearbyDistricts: ["vi thuy", "long my"]
    }
  },

  // =================================================================
  // HÒA BÌNH (ĐÃ NÂNG CẤP)
  // =================================================================
  "hoa binh": {
    "hoa binh": {
      streets: ["cu chinh lan", "chi lang", "tran hung dao", "le thanh tong", "thinh lang", "huu nghi", "tan thinh", "thong nhat", "an duong vuong", "hoang van thu"],
      hospitals: ["benh vien da khoa tinh hoa binh"],
      malls: ["vincom plaza hoa binh", "cho phuong lam", "ap plaza"],
      landmarks: ["thuy dien hoa binh", "tuong dai bac ho", "quang truong hoa binh"],
      nearbyDistricts: ["cao phong", "ky son"]
    }
  },

  // =================================================================
  // LÀO CAI (ĐÃ NÂNG CẤP)
  // =================================================================
  "lao cai": {
    "lao cai": {
      streets: ["hoang lien", "nguyen hue", "coc leu", "nhac son", "tran hung dao", "hong ha", "thuy hoa", "kim tan", "quang truong", "le thanh", "soi tien", "vo nguyen giap"],
      hospitals: ["benh vien da khoa tinh lao cai", "benh vien noi tiet lao cai"],
      malls: ["cho coc leu", "duc huy plaza", "sieu thi go!"],
      landmarks: ["cua khau lao cai", "den thuong", "den mau", "cong vien nhac son", "cau coc leu"],
      nearbyDistricts: ["bao thang", "sapa"]
    }
  },

  // =================================================================
  // YÊN BÁI (ĐÃ NÂNG CẤP)
  // =================================================================
  "yen bai": {
    "yen bai": {
      streets: ["dinh tien hoang", "dien bien", "yen ninh", "nguyen thai hoc", "thanh cong", "hoa binh", "thanh nien", "tran hung dao", "kim dong", "le loi"],
      hospitals: ["benh vien da khoa tinh yen bai", "benh vien san nhi yen bai"],
      malls: ["vincom plaza yen bai", "cho yen bai", "cho ga"],
      landmarks: ["quang truong 19/8", "cong vien yen hoa", "ho yen thang"],
      nearbyDistricts: ["tran yen", "yen binh"]
    }
  },

  // =================================================================
  // KON TUM (ĐÃ NÂNG CẤP)
  // =================================================================
  "kon tum": {
    "kon tum": {
      streets: ["ba trieu", "phan dinh phung", "le hong phong", "tran hung dao", "nguyen hue", "truong chinh", "ure", "dao duy tu", "tran phu", "nguyen trai", "tran khanh du", "ba dinh"],
      hospitals: ["benh vien da khoa kon tum", "benh vien quan y 24"],
      malls: ["co.op mart kon tum", "cho kon tum", "vincom plaza kon tum"],
      landmarks: ["nha tho go", "cau treo kon klor", "nguc kon tum", "bao tang kon tum", "song dak bla"],
      nearbyDistricts: ["dak ha"]
    }
  },

  // =================================================================
  // CÁC TỈNH KHÁC (DỮ LIỆU CŨ - ĐỂ ĐẢM BẢO KHÔNG MẤT DỮ LIỆU)
  // =================================================================
  "ha noi": {
     "hoan kiem": simpleDist(["dinh tien hoang", "le thai to", "trang tien", "hang bai", "pho hue", "ly thuong kiet", "tran hung dao", "hai ba trung", "hang bong", "hang gai"]),
     "cau giay": simpleDist(["cau giay", "xuan thuy", "ho tung mau", "pham hung", "tran duy hung", "trung kinh", "duy tan", "hoang quoc viet", "nguyen phong sac"]),
     "dong da": simpleDist(["nguyen luong bang", "tay son", "nguyen trai", "ton duc thang", "kham thien", "lang", "chua boc", "xa dan", "thai ha"]),
     "ba dinh": simpleDist(["hoang dieu", "phan dinh phung", "doi can", "kim ma", "nguyen thai hoc", "giang vo", "lieu giai", "van cao"]),
     "hai ba trung": simpleDist(["ba trieu", "pho hue", "bach mai", "dai co viet", "tran khat chan", "minh khai", "truong dinh"]),
     "thanh xuan": simpleDist(["nguyen trai", "khuat duy tien", "le van luong", "nguyen tuan", "le trong tan", "truong chinh", "giai phong"]),
     "ha dong": simpleDist(["quang trung", "tran phu", "to hieu", "van quan", "mo lao", "le trong tan"]),
     "hoang mai": simpleDist(["giai phong", "tan mai", "truong dinh", "linh nam", "tam trinh", "ngoc hoi"]),
     "long bien": simpleDist(["nguyen van cu", "ngo gia tu", "ngoc lam", "sai dong", "co linh"]),
     "tay ho": simpleDist(["lac long quan", "au co", "thuy khue", "hoang hoa tham", "xuan la", "vo chi cong"])
  },
  "nghe an": {
    "vinh": simpleDist(["quang trung", "le loi", "truong thi", "nguyen thi minh khai", "nguyen van cu", "ha huy tap", "le nin", "phuong hoang trung do", "mai hac de", "phan boi chau", "tran phu", "nguyen du", "le mao", "dinh cong trang", "hong bang"])
  },
  "lang son": {
    "lang son": simpleDist(["ba trieu", "le loi", "tran dang ninh", "phai ve", "hung vuong", "nh ha", "tam thanh"])
  },
  "son la": {
    "son la": simpleDist(["chu van thinh", "to hieu", "truong chinh", "le duan", "cach mang thang 8", "lo van gia"])
  },
  "tuyen quang": {
    "tuyen quang": simpleDist(["binh thuan", "tan quang", "phan thiet", "minh xuan", "quang trung", "17 thang 8"])
  }
};
