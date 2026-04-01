Oke jadi saya membuat aplikasi untuk task dan project management.

Gambaran umum:

- Ada 2 role user: developer dan admin.
- Developer bisa buat project. Saat membuat project, developer otomatis jadi PM (project manager).
- PM bisa invite anggota project dengan memasukkan ID user (kode temen). Setelah invite, user yang diundang dapat notifikasi untuk join. Role anggota ditentukan saat invite (misal backend, frontend, QA, dll).

Fitur utama:

- Autentikasi user (register/login, profile), nanti ini akan menggunakan google authentication.
- Manajemen project (buat, edit, arsip, lihat detail).
- Manajemen anggota (invite, accept/reject, set role).
- Manajemen task per project (buat, edit, assign, status, tag, due date).
- Tampilan task dalam bentuk sprint/board (todo/in progress/done) atau list.

Halaman frontend:

- Login
- Register
- Dashboard (ringkasan proyek dan task terbaru)
- Projects (list project)
- Project Detail (info project, anggota, task)
- Tasks (task list/board per project)
- Profile (data user, role, setting)
- Notifications (undangan dan aktivitas)

Alur user utama:

1. User login.
2. Developer membuat project, otomatis jadi PM.
3. PM invite anggota dengan memasukkan ID user dan menentukan role.
4. User yang diinvite menerima notifikasi, lalu accept/reject.
5. Setelah join, user bisa lihat project, task, dan sprint/board.

Backend (ringkas):

- Auth: register, login, profile.
- Project: CRUD project, detail project.
- Project member: invite, accept/reject, set role.
- Task: CRUD task, assign user, status, tag.
- Tag: CRUD tag.

Catatan tambahan:

- Notifikasi undangan bisa berupa daftar notifikasi di dalam app.
- Task bersifat per project dan disusun seperti sprint.
- Role admin bisa mengelola user dan project secara global (tampilannya berbeda)
