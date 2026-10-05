import { User } from '../../shared/types';
import { ProductKind } from './seedCatalog';

/** Sample customers beyond the first four. They sign in with the default sample password. */
export const EXTRA_CUSTOMERS: User[] = [
  {
    id: 'user-05',
    name: 'Phạm Thanh Thảo',
    email: 'thanhthao.pham@studio.design',
    phone: '0977889900',
    address: '208 Nguyễn Hữu Cảnh, Tòa Landmark 81',
    city: 'Hồ Chí Minh',
    district: 'Quận Bình Thạnh',
    createdAt: '2026-02-14T03:20:00Z',
  },
  {
    id: 'user-06',
    name: 'Võ Minh Khôi',
    email: 'khoi.vo@example.com',
    phone: '0935667788',
    address: '27 Trần Duy Hưng',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    createdAt: '2026-02-27T08:45:00Z',
  },
  {
    id: 'user-07',
    name: 'Huỳnh Ngọc Ánh',
    email: 'ngocanh.huynh@example.com',
    phone: '0908112233',
    address: '112 Võ Văn Tần',
    city: 'Hồ Chí Minh',
    district: 'Quận 3',
    createdAt: '2026-03-09T13:10:00Z',
  },
  {
    id: 'user-08',
    name: 'Bùi Đức Long',
    email: 'long.bui@example.com',
    phone: '0867445566',
    address: '45 Lê Hồng Phong',
    city: 'Hải Phòng',
    district: 'Quận Ngô Quyền',
    createdAt: '2026-03-25T02:30:00Z',
  },
  {
    id: 'user-09',
    name: 'Đỗ Thùy Linh',
    email: 'thuylinh.do@example.com',
    phone: '0396778899',
    address: '9 Nguyễn Văn Linh',
    city: 'Đà Nẵng',
    district: 'Quận Thanh Khê',
    createdAt: '2026-04-11T10:05:00Z',
  },
  {
    id: 'user-10',
    name: 'Lý Quốc Huy',
    email: 'huy.ly@example.com',
    phone: '0772334455',
    address: '88 Đường 3 Tháng 2',
    city: 'Cần Thơ',
    district: 'Quận Ninh Kiều',
    createdAt: '2026-04-29T06:40:00Z',
  },
  {
    id: 'user-11',
    name: 'Trương Mỹ Duyên',
    email: 'myduyen.truong@example.com',
    phone: '0945990011',
    address: '15 Hùng Vương',
    city: 'Huế',
    district: 'Phường Phú Hội',
    createdAt: '2026-05-13T14:55:00Z',
  },
  {
    id: 'user-12',
    name: 'Ngô Gia Bảo',
    email: 'giabao.ngo@example.com',
    phone: '0826556677',
    address: '301 Phạm Văn Đồng',
    city: 'Hồ Chí Minh',
    district: 'Thành phố Thủ Đức',
    createdAt: '2026-05-28T04:15:00Z',
  },
].map((customer) => ({
  ...customer,
  role: 'customer' as const,
  totalSpent: 0,
  ordersCount: 0,
  isLocked: false,
}));

/** Accounts do not store a ward; sample orders take it from here */
export const CUSTOMER_WARDS: Record<string, string> = {
  'user-current': 'Phường Thạch Thang',
  'user-02': 'Phường Bến Nghé',
  'user-03': 'Phường Kim Mã',
  'user-04': 'Phường Tân Phong',
  'user-05': 'Phường 22',
  'user-06': 'Phường Trung Hòa',
  'user-07': 'Phường Võ Thị Sáu',
  'user-08': 'Phường Đông Khê',
  'user-09': 'Phường Vĩnh Trung',
  'user-10': 'Phường Xuân Khánh',
  'user-11': 'Phường Phú Hội',
  'user-12': 'Phường Linh Tây',
};

/** Reviewers without an account in the shop */
export const REVIEWER_NAMES = [
  'Nguyễn Hoàng Anh',
  'Trần Thị Bích Ngọc',
  'Lê Văn Dũng',
  'Phạm Quỳnh Chi',
  'Hoàng Minh Tuấn',
  'Vũ Thị Hồng Nhung',
  'Đặng Quang Vinh',
  'Bùi Thị Thu Hà',
  'Đỗ Mạnh Cường',
  'Hồ Ngọc Diệp',
  'Ngô Thanh Sơn',
  'Dương Thị Kim Oanh',
  'Lý Hải Đăng',
  'Phan Thị Mai Anh',
  'Trịnh Công Minh',
  'Đinh Thị Phương Thảo',
  'Lâm Tuấn Kiệt',
  'Mai Thị Yến Nhi',
  'Tạ Đình Phong',
  'Châu Ngọc Trâm',
  'Quách Gia Huy',
  'Kiều Thị Lan',
  'Thái Bảo Khang',
  'La Thị Tuyết',
  'Cao Thành Đạt',
  'Tô Ngọc Hân',
  'Lưu Đức Anh',
  'Văn Thị Diễm',
  'Hà Trung Kiên',
  'Doãn Khánh Vy',
];

type CommentPool = Record<2 | 3 | 4 | 5, string[]>;

/** What a review says about the purchase as a whole. {noun} / {Noun} is the product. */
export const GENERAL_COMMENTS: CommentPool = {
  5: [
    '{Noun} hoàn thiện rất tốt, dùng hơn một tháng chưa thấy lỗi gì. Đóng gói cẩn thận, giao nhanh.',
    'Đúng như mô tả. Chất lượng xứng đáng với giá tiền, mình rất hài lòng.',
    'Mua tặng người thân, ai cũng khen. {Noun} ngoài đời đẹp hơn cả trong ảnh.',
    'Đã dùng qua vài hãng khác, {noun} này là lựa chọn mình ưng nhất trong tầm giá.',
    'Nhân viên tư vấn nhiệt tình, hàng về sớm hơn dự kiến một ngày. {Noun} dùng rất thích.',
    'Thiết kế tối giản, cầm lên là thấy chắc chắn. Rất đáng mua.',
    'Lần thứ hai mua hàng ở AURA và vẫn hài lòng như lần đầu.',
  ],
  4: [
    '{Noun} dùng tốt, hoàn thiện đẹp. Trừ một sao vì giao hàng chậm hơn dự kiến hai ngày.',
    'Nhìn chung hài lòng. Hướng dẫn sử dụng hơi sơ sài, phải tự mày mò một lúc.',
    'Chất lượng ổn so với giá. Giá mà có thêm màu khác để chọn thì tốt.',
    'Dùng được hai tuần, mọi thứ ổn định. Hộp hơi móp khi nhận nhưng {noun} bên trong không sao.',
    'Khá ưng ý. Mong cửa hàng có thêm phụ kiện đi kèm.',
    '{Noun} tốt, đúng như giới thiệu. Giá hơi cao nhưng chấp nhận được.',
  ],
  3: [
    '{Noun} dùng tạm được, không có gì nổi bật so với giá tiền.',
    'Chất lượng trung bình. Hoàn thiện ổn nhưng vài chi tiết chưa tinh xảo như mong đợi.',
    'Dùng được, nhưng mình kỳ vọng nhiều hơn ở mức giá này.',
    'Giao hàng nhanh, nhưng {noun} có vết xước nhỏ khi nhận. Cửa hàng hỗ trợ đổi nên vẫn cho ba sao.',
    'Tạm ổn. Có lẽ hợp với người dùng cơ bản hơn là người khó tính.',
  ],
  2: [
    'Không như kỳ vọng. {Noun} dùng được vài tuần thì bắt đầu có vấn đề.',
    'Hoàn thiện kém hơn mình nghĩ, các chi tiết lắp ghép chưa khít.',
    'Phải liên hệ bảo hành ngay trong tháng đầu. Được đổi mới nhưng khá mất thời gian.',
    '{Noun} nhận được khác khá nhiều so với hình dung của mình từ phần mô tả.',
  ],
};

/** A remark that fits the kind of product: praise for 4–5 stars, a complaint for 2–3 */
export const KIND_REMARKS: Record<ProductKind, { praise: string[]; complaint: string[] }> = {
  audio: {
    praise: [
      'Âm thanh rõ ràng, nghe lâu không mệt.',
      'Kết nối nhanh và ổn định.',
      'Âm trầm vừa đủ, không lấn át giọng hát.',
    ],
    complaint: ['Thỉnh thoảng bị ngắt kết nối.', 'Âm thanh chưa được như quảng cáo.'],
  },
  wearable: {
    praise: [
      'Đeo nhẹ, đi ngủ cũng không vướng.',
      'Pin bền, số đo nhịp tim khá chính xác.',
      'Thay dây dễ, phối đồ rất hợp.',
    ],
    complaint: ['Ứng dụng đồng bộ chậm.', 'Số liệu giấc ngủ chưa chính xác lắm.'],
  },
  desk: {
    praise: [
      'Bàn làm việc gọn hẳn từ khi dùng.',
      'Dùng cả ngày vẫn thoải mái.',
      'Lắp đặt nhanh, không cần thêm dụng cụ.',
    ],
    complaint: ['Lắp đặt hơi mất thời gian.', 'Có mùi vật liệu mới, để vài ngày mới hết.'],
  },
  accessory: {
    praise: [
      'Nhỏ gọn, mang đi công tác rất tiện.',
      'Dùng hàng ngày vẫn bền đẹp.',
      'Hoàn thiện chắc chắn hơn mình nghĩ.',
    ],
    complaint: ['Hoàn thiện chưa đều tay.', 'Dùng một thời gian thì bị xuống màu.'],
  },
  home: {
    praise: [
      'Cài đặt qua ứng dụng dễ, cả nhà đều dùng được.',
      'Chạy êm, không gây ồn.',
      'Tiết kiệm cho mình khá nhiều thời gian mỗi ngày.',
    ],
    complaint: ['Ứng dụng thỉnh thoảng mất kết nối.', 'Tiếng ồn lớn hơn mình nghĩ.'],
  },
};
