# Cơ sở dữ liệu

Microsoft SQL Server. Cấu trúc T-SQL được định nghĩa trong
[`server/db/schema.ts`](../server/db/schema.ts) và được tạo tự động khi máy chủ khởi động.
Database phải được tạo sẵn trên SQL Server; ứng dụng tự tạo các bảng và nạp dữ liệu mẫu.

Tệp để nhập thủ công:

| Tệp | Nội dung |
| --- | --- |
| [`database/schema.sql`](../database/schema.sql) | Chỉ cấu trúc bảng |

Dữ liệu mẫu được sinh từ mã nguồn khi ứng dụng khởi động; không còn dùng file dump MySQL.

## Sơ đồ quan hệ

```mermaid
erDiagram
    users ||--o{ orders : "đặt"
    users ||--o{ reviews : "viết"
    users ||--o{ cart_items : "có"
    categories ||--o{ products : "chứa"
    products ||--o{ order_items : "được mua trong"
    products ||--o{ reviews : "nhận"
    products ||--o{ cart_items : "nằm trong"
    orders ||--|{ order_items : "gồm"
    orders ||--|{ order_events : "trải qua"

    users {
        nvarchar id PK
        nvarchar email UK
        nvarchar name
        nvarchar role "customer | admin"
        nvarchar password_hash "bcrypt"
        tinyint is_locked
        int token_version
    }
    categories {
        nvarchar id PK
        nvarchar name UK
        nvarchar slug UK
    }
    products {
        nvarchar id PK
        nvarchar sku UK
        nvarchar slug UK
        nvarchar category_id FK
        int price
        int original_price
        int stock
        nvarchar specs "JSON"
        nvarchar images "JSON"
        tinyint is_active
    }
    promotions {
        nvarchar code PK
        nvarchar type "percent | freeship"
        tinyint discount_percent
        int min_order
        date valid_until
        int usage_count
        int max_usage
    }
    orders {
        bigint id PK
        nvarchar order_number UK
        nvarchar user_id FK
        bigint total_amount
        nvarchar payment_method
        nvarchar payment_status
        nvarchar status
    }
    order_items {
        bigint id PK
        bigint order_id FK
        nvarchar product_id FK
        nvarchar product_name "bản sao"
        int unit_price "bản sao"
        int quantity
    }
    order_events {
        bigint id PK
        bigint order_id FK
        nvarchar status
        datetime2 created_at
    }
    reviews {
        nvarchar id PK
        nvarchar product_id FK
        nvarchar user_id FK
        tinyint rating "1 đến 5"
        tinyint verified_purchase
    }
    cart_items {
        nvarchar user_id PK
        nvarchar product_id PK
        nvarchar selected_color PK
        nvarchar selected_capacity PK
        int quantity
    }
    contact_messages {
        nvarchar id PK
        nvarchar email
        tinyint is_read
    }
    newsletter_subscribers {
        nvarchar email PK
    }
```

## Các bảng

| Bảng | Vai trò |
| --- | --- |
| `users` | Khách hàng và quản trị viên, phân biệt bằng `role` |
| `categories` | Danh mục sản phẩm |
| `products` | Sản phẩm. Thông số, tính năng, ảnh và biến thể lưu dạng JSON |
| `promotions` | Mã khuyến mãi, kèm số lượt đã dùng và giới hạn |
| `orders` | Đơn hàng cùng địa chỉ giao và các khoản tiền |
| `order_items` | Dòng sản phẩm của đơn hàng |
| `order_events` | Lịch sử trạng thái của đơn, để hiển thị tiến độ |
| `reviews` | Đánh giá sản phẩm |
| `cart_items` | Giỏ hàng đã lưu của khách đã đăng nhập |
| `contact_messages` | Tin nhắn từ trang Liên hệ |
| `newsletter_subscribers` | Email đăng ký bản tin |

## Các quyết định thiết kế

**Dòng đơn hàng giữ bản sao tên và giá.** `order_items` lưu `product_name`, `product_sku` và
`unit_price` tại thời điểm đặt. Khi sản phẩm đổi giá hoặc bị xóa, đơn cũ vẫn đúng. Khóa ngoại
`product_id` dùng `ON DELETE SET NULL` nên xóa sản phẩm không làm mất đơn hàng.

**Không lưu số liệu suy ra được.** Không có cột điểm đánh giá, lượt bán hay tổng chi tiêu. Chúng
được tính bằng truy vấn con trong `server/db/mappers.ts`, nên không bao giờ lệch khỏi dữ liệu gốc.

**Tiền lưu bằng số nguyên.** VND không có phần lẻ, nên giá dùng `INT` và tổng tiền dùng `BIGINT`,
tránh sai số của kiểu số thực; các cột có `CHECK` để từ chối giá trị âm.

**`token_version` để hủy phiên.** Giá trị này nằm trong JWT. Khi tài khoản bị khóa hoặc đổi mật
khẩu, giá trị tăng lên và mọi token cũ mất hiệu lực ngay.

**Mỗi khách một đánh giá cho mỗi sản phẩm.** Unique filtered index trên
`(product_id, user_id) WHERE user_id IS NOT NULL` bảo đảm điều này mà vẫn cho phép nhiều đánh giá
mẫu không gắn tài khoản.

**Khóa dòng khi đặt hàng.** `placeOrder` dùng SQL Server lock hints `UPDLOCK, ROWLOCK` trên các
sản phẩm của đơn theo thứ tự `id`, rồi mới kiểm tra và trừ tồn kho.

**Thời gian lưu theo UTC.** Trình duyệt chuyển sang giờ địa phương khi hiển thị.
