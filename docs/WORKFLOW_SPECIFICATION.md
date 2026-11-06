# CDI Job Request & Workflow Specification

Dokumen ini adalah **spesifikasi rasmi (Single Source of Truth)** bagi kitaran hayat aliran kerja (*Workflow Lifecycle*), matriks kebenaran (*Permission Matrix*), dan peraturan logik perniagaan dalam sistem CDI (Cloudflare Workers + D1 Database + React Frontend).

Semua perubahan kod yang melibatkan modul `jobRequests.ts`, `JobRequestDetail.tsx`, `JobRequestsList.tsx`, dan `UnitWorkspacePage.tsx` **MESTI MEMATUHI SPESIFIKASI INI** bagi mengelakkan sebarang regresi atau ralat logik.

---

## 1. Jenis-Jenis Tiket & Mod Aliran Kerja

Sistem CDI mengendalikan 4 jenis aliran kerja utama:

| Kod Awalan Tiket | Jenis Tiket (`request_type`) | Penerangan & Mod Kerjasama |
| :--- | :--- | :--- |
| `#REQ...` | `client_online` | **Standard Single-Unit**: Pelanggan awam menghantar permintaan online kepada satu unit tertentu. |
| `#MU...` | `multi_unit` | **Multi-Unit Job**: Melibatkan 2 atau lebih unit dalam satu projek utama (cth: Writer + Graphic & Web). Diluluskan oleh pengurus jabatan masing-masing dan diagihkan kepada staf oleh ketua unit masing-masing. |
| `#IU...` | `inter_unit` | **Inter-Unit Job**: Permintaan kolaborasi rentas unit yang dimulakan oleh staf unit asal kepada unit sasaran dengan konsep agile turn-taking / pass turn. |
| `#SELF...` | `internal_self` | **Direct Staff Task Entry**: Tugasan kendiri dalaman yang direkodkan terus oleh staf atau unit head tanpa melalui proses kelulusan pelanggan. |

---

## 2. Kitaran Hayat Status Tiket (*State Machine*)

Setiap tiket bergerak mengikut fasa-fasa status berikut:

```
[ pending / manager_approval ]
        │
        ▼
 (Manager Approval)
        │
        ▼
 (Unit Head Assignment)
        │
        ▼
[ staff_processing ] ── (Staff Work & Parallel Finalization)
        │
        ▼
[ completed ]  (Semua unit & semua staf selesai)
```

### Status-Status Utama:
1. **`pending` / `manager_approval`**:
   * Menunggu kelulusan pengurus jabatan yang bertanggungjawab.
   * Bagi Multi-Unit: Mengandungi sub-status setiap unit dalam `additional_data.unit_assignments`.
2. **`staff_processing`**:
   * Semua kelulusan pengurus dan agihan staf selesai, atau projek telah diaktifkan untuk tindakan staf.
3. **`completed`**:
   * Semua tugasan bagi semua staf di semua unit yang terlibat telah ditandakan sebagai `STAFF_DONE` / `completed`.
4. **`rejected`**:
   * Permintaan ditolak oleh pengurus atau unit head sebelum sebarang kerja dimulakan.
5. **`on_hold` / `cancelled`**:
   * Projek ditangguhkan sementara atau dibatalkan.

---

## 3. Matriks Peranan & Kebenaran (*Permission & Action Matrix*)

| Peranan (*Role*) | Keupayaan Semasa `manager_approval` | Keupayaan Semasa `staff_processing` | Keterlihatan Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin / Director** | Luluskan/tolak mana-mana unit, assign mana-mana staf, kemaskini tarikh & status. | Pantau semua kerja, reassign staf, override status. | Boleh lihat SEMUA tiket. |
| **Department Manager** | Luluskan (`APPROVE`) atau tolak (`REJECT`) unit di bawah jabatannya. | Pantau kemajuan staf, beri nota/laporan semakan. | Boleh lihat semua tiket di bawah jabatannya. |
| **Head of Unit** | Assign staf ke unitnya sebaik sahaja pengurus luluskan (atau direct route). | Kemaskini pasukan (`MANAGE TEAM`), pantau tugasan unitnya. | Boleh lihat semua tiket yang melibatkan unitnya. |
| **Assigned Staff** | **MULA KERJA TERUS** jika unitnya sudah diluluskan & di-assign (Multi-Unit/Inter-Unit). Boleh tekan `MARK MY PART AS DONE`. | Hantar draf, kemaskini checklist, tekan `MARK MY PART AS DONE`. | **HANYA** tiket yang namanya tersenarai dalam `assigned_staff_ids`. |
| **Non-Assigned Staff**| **DISEKAT DARIPADA PAPARAN.** | **DISEKAT DARIPADA PAPARAN.** (Kecuali dalam paparan Workspace/Whiteboard perkongsian unit). | Tidak terbeban dengan tiket yang belum di-assign kepada mereka. |

---

## 4. Peraturan Emas Multi-Unit Job (`#MU...`)

### Peraturan 4.1: Pelaksanaan Kerja Selari (*Parallel Execution*)
* Dalam Multi-Unit job, setiap unit (cth: Unit A dan Unit B) boleh mempunyai kelajuan kelulusan dan agihan yang berbeza.
* **INVARIANT KRITIKAL**: Jika Unit A telah diluluskan oleh Pengurus A dan Ketua Unit A telah menetapkan Staf A, **Staf A WAJIB DIBENARKAN MULA BEKERJA DAN MENYIAPKAN BAHAGIANNYA SERTA-MERTA**.
* Staf A **TIDAK BOLEH DISEKAT** semata-mata kerana Pengurus B belum menekan kelulusan bagi Unit B.
* Staf A tidak boleh dipaparkan kotak kelabu *"Awaiting Manager Approval"*. Sebaliknya, sistem wajib memaparkan kad aktif **`Your Work Is Active (Unit A)`** bersama butang **`MARK MY PART AS DONE`**.

### Peraturan 4.2: Paparan Head of Unit Selepas Menetapkan Staf
* Apabila seorang Head of Unit telah menetapkan staf bagi unitnya:
  * Status unit bertukar kepada `status = 'accepted'` dan `assigned_staff_ids` mengandungi ID staf unitnya.
  * **INVARIANT KRITIKAL**: Sistem **DILARANG SAMA SEKALI** memaparkan semula butang hijau `ASSIGN STAFF TEAM` dan butang merah `REJECT REQUEST`.
  * Sistem wajib memaparkan kad pengesahan: **`[UNIT] TEAM ASSIGNED` [Active]** beserta butang sekunder **`MANAGE [UNIT] TEAM`**.

### Peraturan 4.3: Penamatan Tiket Selamat (*Safe Ticket Completion*)
* Apabila mana-mana staf menekan `MARK MY PART AS DONE`:
  * Tugasan individu staf tersebut dalam `job_tasks` ditandakan sebagai `completed`.
  * Tindakan direkodkan dalam `workflow_logs` sebagai `STAFF_DONE`.
  * **INVARIANT KRITIKAL**: Backend `/api/job-requests/:id/mark-done` **TIDAK BOLEH** menukar status keseluruhan tiket kepada `completed` sekiranya:
    1. Tiket masih berada dalam status `manager_approval`.
    2. Masih ada unit dalam `unit_assignments` yang belum diluluskan oleh pengurus.
    3. Masih ada unit dalam `unit_assignments` yang belum ditetapkan staf oleh ketua unit.
    4. Masih ada staf yang telah ditetapkan yang belum menyelesaikan bahagian masing-masing.
  * Tiket hanya bertukar status kepada `completed` secara global apabila **SEMUA unit telah diluluskan, SEMUA ketua unit telah assign staf, dan SEMUA staf telah menekan selesai**.

---

## 5. Peraturan Emas Inter-Unit Collaboration (`#IU...`)

1. **Agile Turn / Handoff**:
   * Tiket Inter-Unit menggunakan mekanisme giliran kerja (`handoff.current_holder_id`).
   * Staf unit asal boleh menyiapkan bahagian awalnya dan membuat *Hand Over* kepada staf unit sasaran, atau menekan *Finalize My Part*.
2. **Penyiapan Bebas Staf Asal (*Origin Staff Independence*)**:
   * Staf asal boleh memulakan dan menyiapkan kerjanya tanpa menunggu kelulusan atau penetapan daripada ketua unit sasaran.

---

## 6. Peraturan Paparan Dashboard & Privasi Staf

1. **Elak Beban Staf Yang Belum Di-assign**:
   * Staf biasa (bukan unit head) **TIDAK BOLEH MELIHAT** sebarang tiket yang berstatus `manager_approval` atau tiket yang belum selesai agihan staf oleh Head Unit, **KECUALI** nama/ID staf tersebut telah tersenarai secara eksplisit dalam `assigned_staff_ids`.
   * Ini memastikan staf seperti Jana, Leen, dan Haziq tidak terganggu atau keliru dengan tiket yang belum diputuskan oleh ketua unit mereka (seperti Azni).
2. **Badge 'NEW' Pada Senarai Kerja**:
   * Tiket yang baru di-assign kepada staf (dan belum dibuka) akan memaparkan badge ungu **`NEW`** sama ada status tiket adalah `staff_processing` mahupun `manager_approval` (dalam Multi-Unit).

---

## 7. Senarai Semak Ujian Regresi (*Regression Checklist*)

Sebelum sebarang kod baru dideploy ke *production*, sahkan senarai semak berikut:

- [ ] **Ujian 1 (Unit Head Assigning):**
  * Login sebagai Head Unit yang unitnya baru diluluskan pengurus.
  * Pastikan butang `ASSIGN STAFF TEAM` muncul.
  * Buka modal, pilih staf, dan sahkan.
  * **Semak:** Selepas reload, butang `ASSIGN STAFF TEAM` dan `REJECT REQUEST` **hilang** dan digantikan dengan kad `TEAM ASSIGNED` + `MANAGE TEAM`.
- [ ] **Ujian 2 (Parallel Staff Execution dalam Multi-Unit):**
  * Login sebagai Staf yang baru di-assign dalam Tiket Multi-Unit di mana unit kedua masih pending kelulusan pengurus kedua.
  * **Semak:** Staf **TIDAK** melihat kad kelabu pasif *"Awaiting Manager Approval"*.
  * **Semak:** Staf melihat kad aktif **`Your Work Is Active`** dan butang cyan **`MARK MY PART AS DONE`**.
- [ ] **Ujian 3 (Backend Safe Completion):**
  * Staf dari Unit A menekan `MARK MY PART AS DONE` semasa Unit B masih belum diluluskan.
  * **Semak:** Bahagian Staf A menjadi `PART COMPLETED`.
  * **Semak:** Status keseluruhan tiket **KEKAL AKTIF** dan tidak bertukar menjadi `Completed`.
- [ ] **Ujian 4 (Privasi Dashboard Staf):**
  * Pastikan staf lain dari unit yang sama yang **tidak** di-assign tidak melihat tiket tersebut dalam dashboard peribadi mereka.
