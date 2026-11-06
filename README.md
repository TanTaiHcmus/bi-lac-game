# Bi Lắc

Ứng dụng web cho nhóm chơi bi lắc: quản lý người chơi, bốc thăm chia đội, ghi kết quả và xem bảng xếp hạng chung.

App làm cho điện thoại trước, với 3 tab ở đáy màn hình:

- **Chơi** (trang chính): chạm thẻ để điểm danh ai có mặt → **Chia đội** (2 vs 2, 3 vs 3…, ai dư thì ngồi ngoài, bốc ngẫu nhiên) → **Bắt đầu** → đá xong bấm **Đỏ thắng / Xanh thắng** rồi xác nhận. Người có mặt vẫn được giữ để chia trận tiếp theo.
- **Xếp hạng**: bục podium cho top 3, bên dưới là các thành viên còn lại; điểm cao xếp trên, tự làm mới mỗi 30 giây.
- **Thêm**:
  - **Lịch sử trận đấu**: nhóm theo ngày; xóa một trận ghi nhầm thì điểm được hoàn lại.
  - **Ghi tay**: chạm tên để xếp vào cột Đỏ hoặc Xanh, chọn đội thắng, lưu. Dùng cho 1 chọi 1, trận lệch người, trận đá ngoài app.
  - **Người chơi**: thêm, đổi tên, xóa (tên không phân biệt hoa/thường).

Đội A là **Đội Đỏ** (bên trái), đội B là **Đội Xanh** (bên phải), giống hai phe trên bàn bi lắc.

Có thể **thêm vào màn hình chính** (Safari: Chia sẻ → Thêm vào MH chính; Chrome: menu → Cài đặt ứng dụng) để mở toàn màn hình như một app.

## Chạy trên máy

Cần Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Dữ liệu được lưu trong file SQLite `data/bilac.db`, tự tạo ở lần chạy đầu.

## Deploy cho cả nhóm dùng chung

### Cách 1: Vercel + Turso (miễn phí, khuyên dùng)

Vercel không lưu được file trên server, nên dữ liệu phải nằm ở Turso, một database SQLite trên cloud.

1. **Tạo database Turso** tại https://app.turso.tech (hoặc dùng CLI):

   ```bash
   turso db create bi-lac
   turso db show bi-lac --url      # → libsql://bi-lac-<tên-bạn>.turso.io
   turso db tokens create bi-lac   # → token
   ```

2. **Đưa code lên GitHub** (repo private cũng được).
3. **Import repo vào Vercel** (https://vercel.com/new), thêm _Environment Variables_:
   - `TURSO_DATABASE_URL`: URL ở bước 1
   - `TURSO_AUTH_TOKEN`: token ở bước 1
   - `APP_PASSCODE` (không bắt buộc): mật khẩu chung của nhóm
4. Bấm **Deploy** rồi gửi link cho mọi người. Bảng dữ liệu tự tạo ở lần truy cập đầu tiên.

Mẹo: chọn vùng (region) của Turso và vùng Functions của Vercel gần nhau để trang tải nhanh hơn. Sửa biến môi trường xong phải **Redeploy** mới có hiệu lực.

**Chi phí:** gói miễn phí của Vercel (Hobby, dành cho dự án cá nhân, phi thương mại) và Turso là đủ cho một nhóm. Điểm được lưu sẵn, nên mỗi lần mở bảng xếp hạng chỉ đọc vài chục dòng dù lịch sử dài bao nhiêu hay màn hình mở cả ngày. Database Turso miễn phí bị lưu trữ (archive) nếu 10 ngày không ai dùng; nếu app báo lỗi sau một kỳ nghỉ dài, chạy `turso group unarchive <tên-group>` (xem tên bằng `turso group list`).

### Cách 2: Máy chủ nội bộ (máy công ty, VPS)

```bash
npm ci
npm run build
npm start            # cổng 3000; đổi cổng: npm start -- -p 8080
```

Mọi người trong mạng truy cập `http://<ip-máy-chủ>:3000`. Dữ liệu nằm trong thư mục `data/`. Muốn sao lưu thì dừng app rồi copy cả thư mục này. Cách này cũng dùng được với Turso nếu đặt hai biến `TURSO_*`.

## Biến môi trường

Xem [.env.example](.env.example). Khi chạy trên máy, chép thành `.env.local` để dùng.

| Biến                 | Bắt buộc         | Ý nghĩa                                                                     |
| -------------------- | ---------------- | --------------------------------------------------------------------------- |
| `TURSO_DATABASE_URL` | Khi deploy Vercel | URL database Turso. Để trống thì dùng file `data/bilac.db`.                |
| `TURSO_AUTH_TOKEN`   | Đi kèm URL       | Token truy cập database Turso.                                              |
| `APP_PASSCODE`       | Không            | Đặt thì phải nhập mật khẩu này (mỗi thiết bị một lần). Đổi mật khẩu thì mọi thiết bị phải nhập lại. |

Không đặt `APP_PASSCODE` thì **ai có link cũng xem và sửa được dữ liệu**. Nếu deploy công khai, nên đặt mật khẩu.

## Cách tính điểm

- Hai đội bằng người: mỗi người đội thắng +1, mỗi người đội thua −1.
- Ghi tay được phép lệch người nếu số người đội đông chia hết cho đội ít (1–2, 1–3, 2–4…). Mỗi trận đáng số điểm bằng số người đội đông, chia đều cho mỗi bên. Ví dụ Bảo thua Đệ, Tài, Phước: Bảo −3, ba người kia +1 mỗi người. Nếu Bảo thắng: Bảo +3, ba người kia −1 mỗi người.
- Trận ngẫu nhiên luôn từ 2 đấu 2 trở lên; 1 chọi 1 thì ghi tay.
- Điểm được tính lại từ lịch sử trận, nên xóa một trận là điểm tự hoàn lại.
- Hủy một trận đang đá thì không ai bị cộng hay trừ điểm.
- Hai người bằng điểm thì cùng hạng. Trong cùng hạng, ai thắng nhiều trận hơn đứng trước.
- Xóa người chơi chỉ ẩn khỏi danh sách và bảng xếp hạng; các trận đã đá vẫn giữ tên họ.
- Nhiều người cùng bấm chọn đội thắng cho một trận thì chỉ lần bấm đầu tiên được tính.

## Cấu trúc code

| Đường dẫn                 | Nội dung                                                 |
| ------------------------- | -------------------------------------------------------- |
| `src/app/`                | Các trang và Server Actions (`actions.ts`)               |
| `src/components/`         | Giao diện: `play-screen` (màn Chơi), `live-match` (trận đang đá), `match-recorder` (ghi tay), `ui` (đầu trang sân cỏ, dock, nút…) |
| `src/lib/db.ts`           | Kết nối database (file SQLite hoặc Turso), tạo bảng, tính lại bảng điểm |
| `src/lib/data.ts`         | Toàn bộ câu truy vấn đọc/ghi                             |
| `src/lib/scoring.ts`      | Luật chia điểm khi hai đội lệch người                    |
| `src/proxy.ts`, `src/lib/auth.ts` | Cổng mật khẩu chung (`APP_PASSCODE`)             |

Dự án dùng Next.js 16 (App Router, Cache Components), Tailwind CSS 4 và `@libsql/client`.
