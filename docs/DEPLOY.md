# Triển khai CI/CD: GitHub → Jenkins → Docker Hub → Docker

Dựa theo tài liệu "CI-CD Jenkins + Docker + GitHub", đã đổi từ .NET sang dự án này (Node.js + React + MySQL)
và từ server Ubuntu sang **một máy Windows** chạy cả Jenkins lẫn Docker Desktop.

Luồng: `git push` → Jenkins phát hiện commit mới → build image → push Docker Hub → `docker compose up -d`
trên chính máy đó.

| Tệp | Vai trò |
|---|---|
| `Dockerfile` | Kiểm tra TypeScript, build giao diện, tạo image chạy Express (cổng 4000) |
| `.dockerignore` | Không đưa `node_modules`, `.env`, ảnh tải lên… vào image |
| `docker-compose.prod.yml` | Container `app` + `mysql`, dữ liệu nằm trong volume |
| `Jenkinsfile` | Checkout → Docker Build → Push Docker Hub → Deploy |

## 1. Yêu cầu trên máy Windows

- Docker Desktop đang chạy.
- Git for Windows.
- Java 21 và Jenkins (`java -jar jenkins.war --httpPort=8080`), đã qua wizard và cài plugin gợi ý.
- Jenkins chạy bằng chính tài khoản Windows đang dùng Docker Desktop.

## 2. Docker Hub

Account settings → Personal access tokens → Generate new token, quyền **Read & Write**. Chép token.

## 3. Đưa mã nguồn lên GitHub

Tạo repo trống `aura-store` trên GitHub (không tích "Add README"), rồi trong thư mục dự án:

```bash
git init
git add .
git status            # kiểm tra KHÔNG có tệp .env (chỉ .env.example)
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<tên-bạn>/aura-store.git
git push -u origin main
```

Tạo token cho Jenkins: GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained tokens → chọn repo `aura-store`, quyền **Contents: Read-only**.

## 4. Thư mục deploy

Tạo `C:\aura-deploy\.env`:

```env
APP_PORT=80
# Web chạy http (chưa có HTTPS) nên phải để false, nếu không sẽ không đăng nhập được
COOKIE_SECURE=false
# Chuỗi ngẫu nhiên ≥ 32 ký tự:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=
DB_USER=aura
DB_PASSWORD=
DB_ROOT_PASSWORD=
DB_NAME=aura_store
```

Dòng `AURA_IMAGE=...` do Jenkins tự ghi mỗi lần deploy. Lần chạy đầu, máy chủ tự tạo bảng và nạp
dữ liệu mẫu; những lần sau dữ liệu được giữ nguyên trong volume `aura-prod_aura-mysql-data`.

## 5. Credentials trong Jenkins

Manage Jenkins → Credentials → System → Global credentials → Add Credentials:

| Kind | ID | Nội dung |
|---|---|---|
| Username with password | `github-pat` | Username GitHub + token ở bước 3 |
| Username with password | `dockerhub-cred` | Username Docker Hub + token ở bước 2 |

## 6. Tạo Pipeline job

Dashboard → New Item → `AURA-CICD` → **Pipeline**:

- Pipeline → Definition: **Pipeline script from SCM**, SCM: **Git**
- Repository URL: `https://github.com/<tên-bạn>/aura-store.git`, Credentials: `github-pat`
- Branch: `*/main`, Script Path: `Jenkinsfile`

Không cần webhook: `Jenkinsfile` tự kiểm tra GitHub khoảng 2 phút một lần (`pollSCM`). Chế độ này
chỉ có hiệu lực sau lần build đầu tiên.

## 7. Chạy

1. Bấm **Build Now** → mở `#1` → **Console Output**. Lần đầu mất vài phút.
2. Thấy `Finished: SUCCESS` thì mở `http://localhost`.
3. Kiểm tra container:

```bash
docker compose -p aura-prod ps
docker compose -p aura-prod logs app
```

Từ đó, mỗi lần `git push` lên `main`, trong khoảng 2 phút Jenkins tự build và deploy lại.

## Xử lý sự cố

| Triệu chứng | Cách sửa |
|---|---|
| `'docker' is not recognized` | Jenkins không thấy Docker: mở Docker Desktop, khởi động lại Jenkins |
| `Missing C:\aura-deploy\.env` | Làm bước 4 |
| `unauthorized` khi push | Token Docker Hub thiếu quyền Write hoặc sai username |
| `Bind for 0.0.0.0:80 failed: port is already allocated` | Đổi `APP_PORT=8081` trong `.env`, mở `http://localhost:8081` |
| Đăng nhập xong bị đăng xuất ngay | Thiếu `COOKIE_SECURE=false` trong `.env` |
| Muốn quay về bản cũ | Sửa `AURA_IMAGE=...:<số build cũ>` trong `C:\aura-deploy\.env`, chạy `docker compose -p aura-prod up -d` trong thư mục đó |

## Triển khai lên Render

Render build thẳng từ `Dockerfile` theo cấu hình trong `render.yaml`, không cần Jenkins hay Docker Hub.
Render không có MySQL nên cơ sở dữ liệu đặt ở Aiven (gói miễn phí).

1. **Aiven** (`console.aiven.io`) → Create service → MySQL → gói Free. Khi service chạy, mở tab
   Overview để lấy Host, Port, User, Password, Database name và tải **CA certificate** (`ca.pem`).
2. **Render** → mở
   `https://dashboard.render.com/blueprint/new?repo=https://github.com/<tên-bạn>/aura-store`
   rồi nhập các giá trị Render hỏi:

   | Biến | Giá trị |
   |---|---|
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | Lấy từ Aiven |
   | `DB_NAME` | `defaultdb` (cơ sở dữ liệu Aiven tạo sẵn) |
   | `DB_SSL_CA` | Toàn bộ nội dung tệp `ca.pem` |

   `JWT_SECRET` do Render tự sinh; `DB_SSL` và `TRUST_PROXY` đã đặt sẵn trong `render.yaml`.
3. Bấm **Deploy Blueprint**. Lần chạy đầu máy chủ tự tạo bảng và nạp dữ liệu mẫu; web có địa chỉ
   `https://aura-store-xxxx.onrender.com`. Từ đó mỗi lần `git push` lên `main` Render tự deploy lại.

Giới hạn của gói miễn phí:

- Web ngủ sau 15 phút không có ai truy cập; lượt truy cập kế tiếp phải chờ khoảng một phút.
- Ổ đĩa không được giữ lại: ảnh tải lên từ trang quản trị (`server/uploads`) mất mỗi khi web
  khởi động lại. Ảnh nhập bằng đường dẫn `https://…` không bị ảnh hưởng. Muốn giữ ảnh tải lên
  cần gói trả phí kèm Disk gắn vào `/app/server/uploads`.

## Triển khai lên server Linux thật

Khi có VPS, cài Docker ở đó, chép `docker-compose.prod.yml` và `.env` lên server, rồi đổi stage
Deploy thành SSH vào server chạy `docker compose pull && docker compose up -d` (plugin SSH Agent),
đúng như mục 9 của tài liệu gốc.
