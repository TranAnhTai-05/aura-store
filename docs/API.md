# Tài liệu API

Địa chỉ gốc: `/api`. Dữ liệu gửi và nhận đều là JSON (trừ tải ảnh).

## Quy ước chung

| | |
| --- | --- |
| **Xác thực** | Cookie `aura_session` (khách hàng) hoặc `aura_admin_session` (quản trị), do máy chủ đặt khi đăng nhập |
| **Header bắt buộc** | `X-Aura-Client: web` trên mọi yêu cầu không phải `GET` |
| **Thành công** | Mã `200` hoặc `201`, thân là đối tượng JSON |
| **Thất bại** | Mã lỗi kèm `{ "error": "Thông báo bằng tiếng Việt" }` |

| Mã | Ý nghĩa |
| --- | --- |
| `400` | Dữ liệu gửi lên không hợp lệ |
| `401` | Chưa đăng nhập, phiên hết hạn, hoặc sai mật khẩu |
| `403` | Không có quyền (ví dụ khách hàng gọi API quản trị, tài khoản bị khóa) |
| `404` | Không tìm thấy |
| `409` | Xung đột với dữ liệu hiện có (hết hàng, email đã tồn tại, không chuyển được trạng thái) |
| `413` | Dữ liệu quá lớn |
| `429` | Thử đăng nhập quá nhiều lần |
| `500` | Lỗi máy chủ |

## Công khai

| Phương thức | Đường dẫn | Mô tả |
| --- | --- | --- |
| `GET` | `/api/health` | Kiểm tra máy chủ đang chạy |
| `GET` | `/api/catalog` | Sản phẩm đang bán, danh mục, mã khuyến mãi đang áp dụng, đánh giá |
| `POST` | `/api/contact` | Gửi tin nhắn liên hệ: `{ name, email, message }` |
| `POST` | `/api/newsletter` | Đăng ký bản tin: `{ email }` |

## Tài khoản khách hàng

| Phương thức | Đường dẫn | Cần đăng nhập | Mô tả |
| --- | --- | :---: | --- |
| `GET` | `/api/auth/me` | | Tài khoản của phiên hiện tại, hoặc `{ user: null }` |
| `POST` | `/api/auth/register` | | `{ name, email, phone, password }` — tạo tài khoản và đăng nhập |
| `POST` | `/api/auth/login` | | `{ email, password }` |
| `POST` | `/api/auth/logout` | | Xóa cookie phiên |
| `PUT` | `/api/auth/profile` | ✓ | `{ name, phone, address, city, district }` |
| `PUT` | `/api/auth/password` | ✓ | `{ currentPassword, newPassword }` — đăng xuất các thiết bị khác |

## Giỏ hàng

| Phương thức | Đường dẫn | Cần đăng nhập | Mô tả |
| --- | --- | :---: | --- |
| `GET` | `/api/cart` | ✓ | Giỏ hàng đã lưu của tài khoản |
| `PUT` | `/api/cart` | ✓ | Thay toàn bộ giỏ hàng: `{ lines: [{ productId, quantity, selectedColor?, selectedCapacity? }] }` |

## Đơn hàng và đánh giá

| Phương thức | Đường dẫn | Cần đăng nhập | Mô tả |
| --- | --- | :---: | --- |
| `GET` | `/api/orders` | ✓ | Đơn hàng của chính khách đang đăng nhập |
| `POST` | `/api/orders` | ✓ | Đặt hàng |
| `POST` | `/api/orders/:id/cancel` | ✓ | Hủy đơn của mình khi đơn chưa sang bước chuẩn bị hàng |
| `POST` | `/api/reviews` | ✓ | `{ productId, rating, comment }` — mỗi khách một đánh giá cho mỗi sản phẩm |

### Đặt hàng

```http
POST /api/orders
```

```json
{
  "customer": {
    "name": "Nguyễn Văn A",
    "phone": "0905123456",
    "email": "a@example.com",
    "city": "Đà Nẵng",
    "district": "Hải Châu",
    "ward": "Thạch Thang",
    "address": "25 Lê Duẩn",
    "note": "Giao sau 17h"
  },
  "paymentMethod": "cod",
  "lines": [{ "productId": "prod-10", "quantity": 1, "selectedColor": "Xám Mờ Titan" }],
  "couponCode": "AURAXIN"
}
```

`paymentMethod` nhận `cod` hoặc `bank_transfer`. Máy chủ bỏ qua mọi giá trị về giá do trình duyệt
gửi lên và tự tính tạm tính, phí vận chuyển, mức giảm và tổng tiền. Trả về `201` kèm `{ order }`.

## Quản trị

Mọi đường dẫn dưới đây (trừ ba đường dẫn đăng nhập) cần phiên quản trị.

| Phương thức | Đường dẫn | Mô tả |
| --- | --- | --- |
| `GET` | `/api/admin/auth/me` | Quản trị viên của phiên hiện tại, hoặc `{ user: null }` |
| `POST` | `/api/admin/auth/login` | `{ email, password, remember }` |
| `POST` | `/api/admin/auth/logout` | Xóa cookie phiên quản trị |
| `PUT` | `/api/admin/auth/password` | `{ currentPassword, newPassword }` |
| `GET` | `/api/admin/overview` | Toàn bộ dữ liệu khu vực quản trị |
| `POST` | `/api/admin/products` | Thêm sản phẩm |
| `PUT` | `/api/admin/products/:id` | Sửa sản phẩm |
| `PATCH` | `/api/admin/products/:id/active` | `{ isActive }` — hiện hoặc ẩn khỏi cửa hàng |
| `DELETE` | `/api/admin/products/:id` | Xóa sản phẩm |
| `POST` | `/api/admin/uploads` | Tải ảnh (`multipart/form-data`, trường `image`) → `{ url }` |
| `PATCH` | `/api/admin/orders/:id/status` | `{ status }` — chuyển trạng thái đơn |
| `POST` | `/api/admin/orders/:id/confirm-payment` | Ghi nhận đã nhận thanh toán |
| `PATCH` | `/api/admin/users/:id/lock` | `{ isLocked }` — khóa hoặc mở khóa khách hàng |
| `POST` | `/api/admin/promotions` | Tạo mã khuyến mãi |
| `PUT` | `/api/admin/promotions/:code` | Sửa mã khuyến mãi |
| `PATCH` | `/api/admin/promotions/:code/active` | `{ isActive }` |
| `DELETE` | `/api/admin/promotions/:code` | Xóa mã khuyến mãi |
| `PATCH` | `/api/admin/messages/:id/read` | `{ isRead }` |
| `DELETE` | `/api/admin/messages/:id` | Xóa tin nhắn |
| `DELETE` | `/api/admin/subscribers/:email` | Gỡ email khỏi danh sách bản tin |

### Chuyển trạng thái đơn hàng

| Từ | Sang được |
| --- | --- |
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `processing`, `cancelled` |
| `processing` | `shipping`, `cancelled` |
| `shipping` | `delivered`, `cancelled` |
| `delivered` | — |
| `cancelled` | — |

Đơn chuyển khoản chưa thanh toán chỉ có thể hủy; muốn xử lý phải gọi `confirm-payment` trước.
Mọi trường hợp khác trả về `409`.
