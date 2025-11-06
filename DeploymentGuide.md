# Hướng dẫn Deploy ứng dụng lên Netlify

Làm theo các bước sau để deploy ứng dụng của bạn một cách an toàn và nhanh chóng.

### 1. Chuẩn bị

- **Tài khoản:** Bạn cần có tài khoản [Netlify](https://app.netlify.com/signup) và [GitHub](https://github.com/) (hoặc GitLab/Bitbucket).
- **Mã nguồn:** Đẩy toàn bộ mã nguồn của ứng dụng này lên một repository mới trên GitHub của bạn.

### 2. Tạo Project trên Netlify

1.  Đăng nhập vào Netlify, vào trang "Sites" và nhấn **"Add new site"** -> **"Import an existing project"**.
2.  Kết nối với nhà cung cấp Git của bạn (ví dụ: GitHub).
3.  Tìm và chọn repository bạn vừa tạo ở bước 1.

### 3. Cấu hình Build

Netlify sẽ tự động đọc file `netlify.toml` và điền sẵn các thông số. Bạn chỉ cần kiểm tra lại:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### 4. Thêm API Key (QUAN TRỌNG)

Đây là bước quan trọng nhất để bảo mật API Key.
1.  Trong trang cài đặt project, đi đến **"Site configuration"** -> **"Build & deploy"** -> **"Environment"**.
2.  Trong mục **"Environment variables"**, nhấn **"Edit variables"**.
3.  Nhấn **"Add a variable"** và chọn **"Create a single variable"**.
4.  Điền thông tin sau:
    - **Key:** `API_KEY`
    - **Value:** Dán Gemini API key của bạn vào đây.
5.  Nhấn **"Save"**.

### 5. Deploy

1.  Quay lại trang tổng quan của project và trigger một lần deploy mới bằng cách vào tab **"Deploys"** và chọn **"Trigger deploy"** -> **"Deploy site"**.
2.  Netlify sẽ bắt đầu quá trình build và deploy.
3.  Sau vài phút, trang web của bạn sẽ hoạt động tại một URL do Netlify cung cấp (ví dụ: `your-site-name.netlify.app`).

### 6. Sử dụng

- Truy cập trang web đã deploy.
- Nhập URL và tạo RSS feed.
- URL của feed được tạo sẽ có dạng: `https://your-site-name.netlify.app/.netlify/functions/generate-rss?url=...`. Bạn có thể dùng link này trong bất kỳ trình đọc RSS nào.
