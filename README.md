# Aplikasi Back-End Website Addo Salon

## Profil Developer

Fakhri Fajar Ramadhan <br>
140810210046 <br>
Teknik Informatika Unpad <br>

## Deskripsi Aplikasi

Repositori ini berisi layanan logika bisnis untuk aplikasi web pelanggan dan admin Addo Salon, termasuk integrasi dengan payment gateway Midtrans.

## Tujuan

- Menyediakan logika bisnis untuk pemesanan jasa salon bagi pelanggan
- Menyediakan logika bisnis untuk mengelola data salon bagi admin

## Fitur Aplikasi

- OAuth: Fitur untuk melakukan login langsung menggunakan akun Google
- Autentikasi: Sistem login dengan JWT token dan session management
- Registrasi: Fitur untuk pelanggan mendaftarkan akun
- Verifikasi email: Fitur untuk pengguna melakukan verifikasi email
- Reset Password: Fitur untuk pelanggan memulihkan password
- Data management: Fitur untuk mengelola data yang penting untuk salon
- Operasi CRUD: Fitur tambah, edit, hapus, dan membaca data pengguna, layanan, pesanan, transaksi, dan pegawai
- Pembayaran: Fitur pembayaran di dalam aplikasi, terintegrasi dengan Midtrans
- Dashboard: Fitur untuk menyediakan data-data penting di halaman dashboard admin

## Teknologi yang Digunakan

- NestJs: Framework back-end berbasis NodeJs
- MongoDB: Database NoSQL
- Mongoose: ODM untuk MongoDB
- Midtrans: Payment gateway untuk pembayaran digital
- Supabase Storage: Layanan pihak ketiga untuk menyimpan berkas

## Deployment

Saat ini aplikasi back-end di-deploy menggunakan Railway

## Kebutuhan Environment Variables
PORT= <br>
NODE_ENV= <br>
MONGO_URL= <br>

MAIL_HOST= <br> 
MAIL_PORT= <br>
MAIL_USER= <br>
MAIL_PASS= <br>
MAIL_SECURE= <br>

FE_URL= <br> 

REDIS_HOST= <br>
REDIS_PORT= <br>
REDIS_PASSWORD= <br>
REDIS_URL= <br>

JWT_SECRET= <br>
JWT_EXPIRES_IN= <br>

CORS_ORIGIN_OPTIONS= <br>

SUPABASE_URL= <br>
SUPABASE_ANON_KEY= <br> 
SUPABASE_BUCKET_NAME= <br>

GOOGLE_OAUTH_CLIENT_ID= <br>
GOOGLE_OAUTH_SCOPE= <br>
GOOGLE_OAUTH_CALLBACK_URL= <br>

ONE_HOUR=

MIDTRANS_MERCHANT_ID= <br>
MIDTRANS_CLIENT_KEY= <br>
MIDTRANS_SERVER_KEY= <br>
MIDTRANS_MODE= <br>
MIDTRANS_BASE_URL_SANDBOX= <br>
MIDTRANS_BASE_URL_PRODUCTION= <br>
MIDTRANS_GOPAY_CALLBACK_URL= <br>

HTTP_TIMEOUT= <br>
MAX_REDIRECTS= <br>

WHATSAPP_API_URL= <br>
WHATSAPP_API_VERSION= <br>
WHATSAPP_PHONE_NUMBER_ID= <br>
WHATSAPP_ACCESS_TOKEN= <br>
