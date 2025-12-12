// Storing the raw data provided by the user as a constant string to be processed locally.
export const RAW_BRANCH_DATA = `
HÀ NỘI	Chị Phượng	155 Nguyễn Ngọc Vũ - Phường Trung Hoà - Quận Cầu Giấy HN
CN ĐÀ LẠT	Chị Huyền	Trạm 24h - 03 Triệu Việt Vương, Phường 04, TP. Đà Lạt
CN TÂN AN 1	Chị Thu Hiền	122 TL 827, Phường 7, TP. Tân An, Long An
CN TÂN AN 2	Chị Ngọc Tiên	57/25 Huỳnh Văn Gấm, Phường 1, Tân An, Long An
CN BÌNH THẠNH	Chị Giang	62D/8 Nguyên Hồng, Phường 11, Quận Bình Thạnh, TP. Hồ Chí Minh
CN HUẾ	Chị Hoàng Lan	12/1 Kiệt 245 Phan Bội Châu, Phường Trường An, Q. Thuận Hóa, TP. Huế
CN VĨNH LONG	Chị Ái Nhi	34/2/4 Hưng Đạo Vương, Phường 1, TP. Vĩnh Long
CN LONG KHÁNH	Chị Đào	57/3 Đường Số 10, Phường Suối Tre, TP. Long Khánh
CN QUẢNG NGÃI  	Chị Thuý Hồng	84 Nguyễn Đình Chiểu, Phường Quảng Phú, TP. Quảng Ngãi
CN CẦN THƠ	Chị Thu Huyền	108/49/70C Đường 30/4, Phường Ninh Kiều, TP. Cần Thơ
CN SA ĐÉC	Chị Ngọc	77 Đường ĐT 852, Khóm Tân Hòa, Phường An Hòa, TP. Sa Đéc, Đồng Tháp
CN QUY NHƠN	Anh Hoàng Minh	Chung Cư Hoàng Anh Gia Lai A12-04 - Phường Hải Cảng - TP. Quy Nhơn - Bình Định
CN LONG XUYÊN	Chị Trâm	250/13 Trần Hưng Đạo, Phường Bình Khánh, TP. Long Xuyên, An Giang
CN BIÊN HOÀ	Chị Phượng	Tổ 19, KP 4, Phường Trảng Dài, TP. Biên Hòa, Đồng Nai
CN PLEIKU	Chị Tố Uyên	 134 Phan Đình Giót, Phường Hoa Lư, TP. Pleiku, Gia Lai
CN BUÔN MA THUỘT	Cô Dịp	57 Tô Hiến Thành, Tân Lợi, TP. Buôn Ma Thuột, Đắk Lắk
CN HẢI PHÒNG	Chị Phượng	 17/35B Nguyễn Trung Thành, Hùng Vương, Hồng Bàng, TP. Hải Phòng
CN HẢI DƯƠNG	Chị Lý	65a Vũ Hựu, Phường Thanh Bình, TP. Hải Dương
CN TAM KỲ	Chị Minh Tâm	 K215/2 Trần Cao Vân, Phường An Sơn, tp. Tam Kỳ
CN HOA LƯ	Thùy Linh	Phố Thạch Tác, Phường Ninh Mỹ, TP. Hoa Lư
CN HƯNG YÊN	Chị Quỳnh Giang	42 Phạm Ngọc Thạch, Phường An Tảo, TP. Hưng Yên
CN ĐÔNG HÀ	Chị Thiện Nhân	46 Phan Chu Trinh, Phường 1,TP. Đông Hà, Quảng Trị
CN CÀ MAU	Chị Trà My	 20 Đường Đỗ Thừa Tự, Khóm 5, Phường 1, TP. Cà Mau 
CN THỦ DẦU MỘT	Chị Linh Trang	Số 89 Đường N13, KDC Phú Hòa 1, Phường Phú Hòa, TP. Thủ Dầu Một
CN CẨM LỆ - ĐÀ NẴNG	Thúy Hường 	43 Nhơn Hòa 19, Phường Hoà An, Quận Cẩm Lệ, TP. Đà Nẵng
CN MỸ THO	Chị Quỳnh Như 	46/92 Lê Thị Hồng Gấm, Phường 4, TP Mỹ Tho
CN HẠ LONG	Chị Thanh Trúc	Số nhà 38A, Đường Phan Đăng Lưu, Phường Hồng Hải, TP. Hạ Long
CN THÁI NGUYÊN	Chị Hoà Thuận	Số 83, Ngách 62, Ngõ 272, Đường 3/2, Phường Tân Lập, TP. Thái Nguyên
CN THÁI BÌNH	Chị Vui	Chưng cư Damsan Quang Trung, Đường Lý Thái Tổ, Phường Quang Trung, TP. Thái Bình
CN CAM RANH	Anh Tạo	TDP Thuận Hưng, Phường Cam Thuận, TP. Cam Ranh 
CN PHAN RANG 	Chị Vân	349 Thống Nhất, Phường Kinh Dinh, TP. Phan Rang
CN TÂN PHÚ	Chị Ân	32/8 Lương Thế Vinh, Phường Tân Thới Hoà, Quận Tân Phú, Thành phố Hồ Chí Minh
CN BẾN TRE	Chị Quyên	306 Ấp Hữu Nhơn, Hữu Định, Châu Thành, Bến Tre
CN TRÀ VINH	Chị Út Thuỷ	Hải Sản Út Thủy - Căn A2_21 Đường Hoa Hồng, Khu Đô Thị Hoàng Quân, Phường 4, TP.Trà Vinh
CN SÓC TRĂNG  	Chị Phan Thị Kiều Diểm 	76 Phan Văn Chiêu, Phường 9, TP. Sóc Trăng
CN NAM ĐỊNH	Chị Huệ	8/496 Đường Điện Biên, Phường Lộc Hòa, TP. Nam Định 
CN TUY HOÀ	Anh Phúc Gia	287B Nguyễn Công Trứ, Phường 4, TP. Tuy Hòa
CN PHAN THIẾT	Chị Xuân Vy	315/13 Trần Hưng Đạo, Phường Bình Hưng, TP. Phan Thiết
CN KON TUM	Chị Thảo Vy	154/2 Đoàn Thị Điểm, Phường Quyết Thắng, TP. Kon Tum
CN RẠCH GIÁ 	Chị Mì Mì	172 Nguyễn Thoại Hầu, TP. Rạch Giá, Kiên Giang
CN BẢO LỘC	Chị Liễu	109/35 Trần Bình Trọng, Phường Lộc Phát, TP. Bảo Lộc
CN VĨNH YÊN	Chị Bảo An	Khu Liền Kề Chung Cư An Phú - Đ. Phan Chu Trinh, P. Khai Quang, TP. Vĩnh Yên
CN TÂY NINH	Chị Minh Châu 	31 Hẻm 11 Đường Thuyền, Phường Hiệp Ninh, TP. Tây Ninh
CN TÂN CHÂU	Chị Diệp Minh	184 Lê Duẩn, Khu Phố 3, Tân châu, Tây ninh
CN THANH HOÁ	Chị Hà	04/10 Tân An, Phường Ngọc Trạo, TP. Thanh Hóa
CN NHA TRANG 	Anh Danh	2d Nguyễn Thị Định, Phường Phước Long, TP. Nha Trang
CN BẮC NINH	Chị Chu Lan	Số 13 Phố Trần Bình Trọng, Phường Đại Phúc, TP. Bắc Ninh
CN LẠNG SƠN	Anh Hậu	Toà Nhà GP1, Chung Cư Green Park, Đường Võ Thị Sáu, Phường Đông Kinh, TP. Lạng Sơn
CN CAO LÃNH	Chị Hoa	 157 Chi Lăng, Phường 3, TP. Cao Lãnh, Đồng Tháp 
CN VINH 	Chị Việt An	35 Hoàng Văn Thụ, Phường Hà Huy Tập, TP. Vinh
CN VŨNG TÀU	Chị Trần Thị Lan 	55/4 Nơ Trang Long, Phường Rạch Dừa, TP. Vũng Tàu
CN TỪ SƠN	Chị  Ánh Tuyết	Số Nhà 30, KP1 Cẩm Giang, Phường Đồng Nguyên, TP. Từ Sơn
CN HOÀ XUÂN - ĐÀ NẴNG 	Chị Oanh	110 Hà Duy Phiên, Hòa Châu, Hòa Vang, Đà Nẵng
CN HOÀ BÌNH	Chị Trang	Số Nhà 36, Phố Kim Đồng, Phường Đồng Tiến, TP. Hoà Bình
CN UÔNG BÍ	Chị Hoan	KĐT Yên Thanh, Đường Số 18, Phường Yên Thanh, TP. Uông Bí
CN LÀO CAI	Chị Tuyến	37 Ngô Quyền, Phường Kim Tân, TP. Lào Cai
CN SƠN LA	Chị Hạnh	SN 01, ngách 02, ngõ 151, đường Lê Đức Thọ, Phường Quyết Thắng, TP. Sơn La
CN ĐỊNH QUÁN	Chị Thảo	Tiệm sửa xe Hoàng Anh 102km, Xã Là Ngà, Huyện Định Quán, Đồng Nai
CN YÊN BÁI	Chị Xuân	Số 07, Ngõ 431, Đinh Tiên Hoàng, Phường Yên Thịnh, TP. Yên Bái
CN VỊ THANH	Chị Bích Như	231 Trần Ngọc Quế, Phường 3, TP. Vị Thanh
CN TUYÊN QUANG	Chị Nhật Linh	174 Đường 17 Tháng 8, Tổ 17, Phường Minh Xuân, TP. Tuyên Quang
CN PHÚ NHUẬN	Chị Phương Anh	22/5A Nguyễn Thị Huỳnh, Phường 8, Quận Phú Nhuận, TP. Hồ Chí Minh
CN QUẬN 7  	Chị Huệ Phương	167/1 Huỳnh Tấn Phát, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh
CN QUẬN 8	Chị Thanh Quý	163 Đường Trịnh Quang Nghị, Phường 7, Quận 8, TP. Hồ Chí Minh
CN MỘC BÀI TÂY NINH	Anh Kelvin Tuấn	Ấp Lợi Thuận, huyện Bến Cầu, cửa khẩu Mộc Bài, tỉnh Tây Ninh
CN MỘC BÀI SÀI GÒN	Kho nhà xe Khải Nam	Nhà xe Khải Nam, 363 Hùng Vương, Phường 9, Quận 5, TP. Hồ Chí Minh
CN HỒNG NGỰ	Chị Bảo Trân	06 Đường Phạm Hùng Dũng, Phường An Thạnh, TP. Hồng Ngự
CN CAI LẬY	 Chị Mộng Chi	Số 292 Võ Việt Tân, Khu Phố 1, Phường 4, Tx. Cai Lậy, Tỉnh Tiền Giang
CN NHÀ BÈ	Chị Kiều	 Chung Cư The Park Residence (tầng 9) - 12 Nguyễn Hữu Thọ, Phước Kiển, Nhà Bè, TP. HCM
CN LIÊN CHIỂU	Anh Cao Tỉnh 	194 Kinh Dương Vương, Phường Thanh Khê, TP. Đà Nẵng
`;