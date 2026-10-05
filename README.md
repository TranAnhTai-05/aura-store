# AURA Store

Website thương mại điện tử full-stack cho thương hiệu thiết bị & phong cách sống AURA:
cửa hàng cho khách, khu vực quản trị tách biệt, API và cơ sở dữ liệu MySQL.

| Tầng | Công nghệ |
| --- | --- |
| Giao diện | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Máy chủ | Node.js, Express 5, TypeScript |
| Cơ sở dữ liệu | MySQL 8 (tương thích MariaDB của XAMPP) |
| Xác thực | JWT trong cookie httpOnly, mật khẩu băm bằng bcrypt |
| Kiểm thử | `node:test`, 44 bài kiểm thử (quy tắc nghiệp vụ + API trên MySQL thật) |

## Cài đặt

Yêu cầu: **Node.js 22 trở lên** và **MySQL** (chọn một trong hai cách bên dưới).

### 1. Cài thư viện và tạo tệp cấu hình

```bash
npm install
```

Sao chép `.env.example` thành `.env`, rồi đặt `JWT_SECRET` là một chuỗi ngẫu nhiên. Tạo chuỗi bằng:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Chuẩn bị MySQL

**Cách A — XAMPP hoặc MySQL đã cài sẵn.** Bật MySQL, rồi sửa `.env`:

```
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=aura_store
```

**Cách B — Docker.** Đặt `DB_PASSWORD` và `DB_ROOT_PASSWORD` trong `.env` (giữ `DB_PORT=3307`), rồi chạy:

```bash
docker compose up -d
```

Không cần tạo bảng bằng tay: lần đầu khởi động, máy chủ tự tạo cơ sở dữ liệu, các bảng và nạp
dữ liệu mẫu. Nếu muốn nhập thủ công qua phpMyAdmin, dùng [`database/aura_store.sql`](database/aura_store.sql).

### 3. Chạy

```bash
npm run dev
```

Mở http://localhost:3000. Lệnh này chạy cả API (cổng 4000) lẫn giao diện (cổng 3000).

## Các lệnh

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy API và giao diện cùng lúc, tự tải lại khi sửa mã |
| `npm run dev:api` / `npm run dev:web` | Chạy riêng từng phần |
| `npm run build` | Đóng gói giao diện vào `dist/` |
| `npm start` | Chạy máy chủ; nếu có `dist/` thì phục vụ luôn giao diện (production) |
| `npm test` | Chạy toàn bộ bài kiểm thử |
| `npm run lint` | Kiểm tra kiểu TypeScript cho cả giao diện và máy chủ |
| `npm run db:seed` | Nạp dữ liệu mẫu vào cơ sở dữ liệu trống |
| `npm run db:upgrade` | Bổ sung dữ liệu mẫu còn thiếu vào cơ sở dữ liệu đang dùng, **không xóa gì** |
| `npm run db:reset` | **Xóa toàn bộ dữ liệu** rồi nạp lại dữ liệu mẫu |

`npm test` dùng cơ sở dữ liệu riêng tên `<DB_NAME>_test` và không đụng tới dữ liệu của cửa hàng.

## Dữ liệu mẫu

Cửa hàng mẫu có 49 sản phẩm thuộc 5 danh mục, trải đều các mức giá (từ 290.000₫ đến
16.800.000₫) và các mức đánh giá (từ dưới 3 sao đến 5 sao, kể cả sản phẩm chưa có đánh giá, sản
phẩm hết hàng và sắp hết hàng), cùng 12 khách hàng, 69 đơn hàng trong bốn tháng gần nhất và 232
đánh giá.

- Sản phẩm viết tay nằm ở [`seedData.ts`](server/db/seedData.ts) và
  [`seedCatalog.ts`](server/db/seedCatalog.ts).
- Đơn hàng và đánh giá do [`seedBuilder.ts`](server/db/seedBuilder.ts) sinh ra từ một bộ sinh số
  có hạt giống cố định, nên lần nạp nào cũng cho cùng một cửa hàng. Ngày tháng được dời theo ngày
  nạp để biểu đồ "7 ngày gần nhất" không bao giờ trống.
- Điểm đánh giá và lượt bán không được ghi sẵn: chúng được tính từ các đánh giá và đơn hàng đó.

### Ảnh sản phẩm

Ảnh lấy từ [Wikimedia Commons](https://commons.wikimedia.org) theo giấy phép tự do và được tải
trực tiếp từ máy chủ của Wikimedia (cần có mạng; khi ảnh không tải được, trang hiện hình minh họa
của loại sản phẩm). Tác giả và giấy phép của từng ảnh được ghi ở trang `/image-credits`, dưới
ảnh trong trang chi tiết sản phẩm và trong [docs/IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md).

AURA là thương hiệu giả định. Ảnh chỉ minh họa cho loại sản phẩm; thiết bị trong ảnh thuộc về nhà
sản xuất của chúng.

## Tài khoản mẫu

Dữ liệu mẫu có một tài khoản quản trị và mười hai tài khoản khách hàng. Email nằm trong
`INITIAL_USERS` ([`seedData.ts`](server/db/seedData.ts)) và `EXTRA_CUSTOMERS`
([`seedPeople.ts`](server/db/seedPeople.ts)), mật khẩu mặc định nằm trong `SEED_PASSWORDS`.

**Hãy đổi mật khẩu quản trị sau lần đăng nhập đầu** tại `/admin/settings`.

## Đường dẫn

| Khu vực | Đường dẫn |
| --- | --- |
| Cửa hàng | `/`, `/products`, `/products/:id`, `/cart`, `/checkout`, `/promotions`, `/about`, `/contact`, `/policies`, `/image-credits` |
| Tài khoản | `/login`, `/register` |
| Cần đăng nhập | `/profile`, `/orders`, `/orders/:orderNumber` |
| Quản trị | `/admin` (cổng đăng nhập), `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/users`, `/admin/promotions`, `/admin/messages`, `/admin/settings` |

Không có liên kết nào từ cửa hàng dẫn tới khu vực quản trị; chỉ vào được bằng cách gõ `/admin`.

## Cấu trúc dự án

```
shared/            Dùng chung cho giao diện và máy chủ
  types.ts           Kiểu dữ liệu
  config.ts          Cấu hình cửa hàng: phí ship, ngưỡng miễn phí, ngân hàng, thời hạn phiên
  pricing.ts         Phí vận chuyển, mã giảm giá
  orders.ts          Quy tắc chuyển trạng thái đơn hàng
  validators.ts      Kiểm tra dữ liệu của các biểu mẫu

server/            Máy chủ API
  index.ts           Khởi động: kết nối, tạo bảng, nạp dữ liệu mẫu, mở cổng
  app.ts             Lắp ráp Express: bảo mật, định tuyến, xử lý lỗi
  auth.ts            Băm mật khẩu, JWT, cookie, kiểm tra quyền
  routes/            catalog, auth, cart, orders, admin
  services/orders.ts Đặt hàng và chuyển trạng thái trong transaction
  db/                Kết nối, cấu trúc bảng, dữ liệu mẫu, chuyển đổi dòng → đối tượng

src/               Giao diện React
  services/api.ts    Nơi duy nhất gọi máy chủ
  services/store.ts  Trạng thái của ứng dụng và mọi thao tác
  pages/, components/, router/, context/

database/          Tệp SQL để nhập thủ công
tests/             Bài kiểm thử
docs/              Tài liệu API và cơ sở dữ liệu
```

Tài liệu chi tiết: [API](docs/API.md) · [Cơ sở dữ liệu](docs/DATABASE.md) · [Nguồn hình ảnh](docs/IMAGE_CREDITS.md)

## Quy tắc nghiệp vụ

- **Máy chủ là nơi quyết định.** Giá, tồn kho, phí vận chuyển và mức giảm giá của một đơn hàng
  được tính từ cơ sở dữ liệu. Giá do trình duyệt gửi lên bị bỏ qua.
- **Đặt hàng là một transaction.** Kiểm tra tồn kho, trừ kho, ghi đơn, tăng lượt dùng mã và xóa
  giỏ hàng cùng thành công hoặc cùng thất bại. Dòng sản phẩm bị khóa trong lúc đó, nên hai
  khách không thể cùng mua sản phẩm cuối cùng.
- **Số liệu được tính, không lưu.** Điểm đánh giá, lượt bán, số đơn và tổng chi tiêu của khách
  được tính bằng truy vấn từ đánh giá và đơn hàng thực tế.
- **Trạng thái đơn** chỉ đi tới một bước mỗi lần: Chờ xác nhận → Đã xác nhận → Đang chuẩn bị →
  Đang giao → Đã giao. Có thể hủy trước khi giao. Đơn đã giao hoặc đã hủy không đổi được nữa.
- **Thanh toán.** Đơn COD được ghi nhận đã thanh toán khi giao thành công. Đơn chuyển khoản
  phải được quản trị viên xác nhận đã nhận tiền trước khi xử lý.
- **Hủy đơn** trả hàng về kho và hoàn lượt dùng mã giảm giá.
- **Đơn hàng giữ bản sao** tên và giá sản phẩm tại thời điểm đặt, nên vẫn đúng sau khi sản phẩm
  đổi giá hoặc bị xóa.
- **Giỏ hàng** của khách chưa đăng nhập nằm trong trình duyệt; khi đăng nhập, giỏ được gộp vào
  tài khoản và đi theo tài khoản sang thiết bị khác.

## Bảo mật

- Mật khẩu được băm bằng bcrypt; không nơi nào lưu hay ghi log mật khẩu gốc.
- Phiên đăng nhập là JWT trong cookie `httpOnly`, `SameSite=Lax`, và `Secure` khi chạy production.
  Mã JavaScript của trang không đọc được cookie này.
- Khách hàng và quản trị viên có phiên riêng, cổng đăng nhập riêng. Phiên của bên này không
  mở được tính năng của bên kia.
- Mỗi yêu cầu đều kiểm tra lại tài khoản trong cơ sở dữ liệu: khóa tài khoản hoặc đổi mật khẩu
  có hiệu lực ngay trên mọi thiết bị.
- Đăng nhập sai 8 lần liên tiếp bị tạm khóa 10 phút. Thông báo lỗi giống nhau dù email không tồn
  tại hay mật khẩu sai.
- Mọi yêu cầu thay đổi dữ liệu phải mang header `X-Aura-Client`, để trang web khác không thể
  thao tác thay người dùng (CSRF).
- Mọi truy vấn SQL dùng tham số (`?`), không ghép chuỗi từ dữ liệu người dùng.
- Ảnh tải lên chỉ nhận JPG, PNG, WebP tối đa 5MB; tên tệp do máy chủ tự đặt.

## Giới hạn hiện tại

- **Không gửi email.** Tin nhắn liên hệ và đăng ký bản tin được lưu vào hộp thư quản trị;
  quản trị viên trả lời bằng ứng dụng email của mình. Chưa có chức năng quên mật khẩu tự động.
- **Không có cổng thanh toán trực tuyến.** Chỉ hỗ trợ COD và chuyển khoản thủ công.
- **Giới hạn đăng nhập sai được lưu trong bộ nhớ** của máy chủ, nên sẽ đặt lại khi khởi động lại
  và không dùng chung giữa nhiều máy chủ.
- **Thông tin ngân hàng, địa chỉ, hotline và nội dung chính sách** là nội dung mẫu. Hãy thay
  trong `shared/config.ts` và `src/pages/user/PoliciesPage.tsx`.

## Lưu ý trên Windows

Nếu tên thư mục dự án chứa ký tự `&`, một số công cụ dòng lệnh sẽ lỗi vì `cmd.exe` hiểu `&` là
dấu tách lệnh. Các lệnh `npm run` của dự án đã tránh được lỗi này, nhưng nên đổi tên thư mục
thành tên không dấu, không ký tự đặc biệt (ví dụ `aura-store`).
