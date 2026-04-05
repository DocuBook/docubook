# Berkontribusi ke DocuBook

Bahasa: Indonesia | [EN](CONTRIBUTING.md)

Terima kasih atas minat Anda untuk berkontribusi ke DocuBook!

## Alur Kontribusi Cepat

1. **Cek issues yang ada**: Sebelum mulai bekerja, selalu cek daftar [issues](https://github.com/docubook-repo/issues) di repository. Jika ide, bug, atau fitur Anda belum ada, buat issue baru dengan label yang sesuai (misal: `bug`, `feature`, `docs`).
2. **Buat branch**: Setelah issue Anda dibuat, buat branch dengan nama deskriptif sesuai issue (lihat panduan penamaan branch di bawah).
3. **Buka Pull Request (PR)**: Setelah push branch Anda, buka PR dan referensikan issue terkait. Jangan buka PR tanpa issue yang terkait.

---

## Tentang DocuBook

DocuBook adalah platform dokumentasi berbasis monorepo untuk membantu tim membuat, mengelola, dan mempublikasikan dokumentasi teknis secara efisien.

Proyek ini menggabungkan aplikasi dokumentasi Next.js, CLI untuk scaffolding dan setup proyek, serta paket reusable untuk pemrosesan MDX dan pembuatan docs-tree.

Singkatnya, DocuBook berfokus pada pengiriman dokumentasi yang cepat, pengalaman developer yang bersih, dan alur rilis open-source yang skalabel.

## Kode Etik

Bersikaplah saling menghormati, konstruktif, dan kolaboratif.

Jika Anda melaporkan isu sensitif (keamanan, penyalahgunaan, data privat), hindari publikasi terbuka dan hubungi maintainer secara privat terlebih dahulu.

## Cara Berkontribusi

- Laporkan bug dengan langkah reproduksi yang jelas
- Usulkan fitur dan peningkatan
- Tingkatkan dokumentasi, contoh, dan DX
- Kirim pull request untuk perbaikan atau enhancement
- Bantu review diskusi issue dan PR


## Sebelum Memulai

- **Selalu cari issue dan pull request yang sudah ada sebelum membuka yang baru.**
- Jika belum ada issue serupa, buat issue baru dengan deskripsi jelas dan label yang tepat.
- Untuk perubahan non-sepele, buka issue/diskusi terlebih dahulu untuk menyelaraskan scope.
- Jaga pull request tetap fokus: satu concern per PR.

## Setup Pengembangan

### Kebutuhan

- Node.js `>=18`
- `pnpm` `>=10`

### Instalasi

```bash
pnpm install
```

### Perintah Umum

```bash
# Build semua package/app
pnpm build

# Jalankan web app pada mode development
pnpm dev:web

# Lint semua workspace
pnpm lint

# Type-check semua workspace
pnpm typecheck

# Bersihkan output turbo
pnpm clean
```

## Struktur Proyek (Level Tinggi)

- `apps/web`: aplikasi dokumentasi Next.js
- `packages/cli`: utilitas CLI untuk scaffold dan installer
- `packages/core`: utilitas compile/content bersama
- `packages/docs-tree`: paket generator docs tree
- `packages/mdx-content`: helper konten MDX
- `template/*`: starter template

## Panduan Branch dan Commit

- Buat branch dari default branch
- Gunakan nama branch yang deskriptif, misalnya:
  - `fix/search-modal-focus`
  - `feat/cli-template-update`
  - `docs/improve-installation`
- Disarankan memakai gaya Conventional Commit:
  - `feat: add docs-tree cache`
  - `fix(cli): handle invalid template name`
  - `docs: clarify release steps`


## Panduan Pull Request

### Sebelum Membuka PR

1. **Baca daftar issues**: Hanya buka PR jika sudah ada issue yang mendeskripsikan perubahan Anda. Jika belum ada, buat issue baru terlebih dahulu dan tunggu konfirmasi atau diskusi.
2. **Buat branch**: Namai branch Anda sesuai issue dan panduan di bawah.
3. **Pastikan branch Anda terupdate**: Selalu merge branch `main` terbaru ke branch fitur Anda sebelum membuka PR.

#### Cara Merge dengan `main`

Untuk repository ini, **selalu gunakan merge** untuk memperbarui branch Anda dengan branch `main` sebelum membuka pull request. Ini menjaga riwayat commit tetap transparan dan aman untuk kolaborasi open source.

- **Merge** menjaga riwayat commit dan membuat commit baru yang menggabungkan perubahan dari kedua branch. Grafik commit akan memperlihatkan percabangan dan titik penggabungan.

Untuk merge branch `main` terbaru ke branch Anda:

```bash
git fetch origin
git checkout nama-branch-anda
git merge origin/main
```

Jika ada konflik, selesaikan terlebih dahulu. Setelah itu, lakukan push ke branch Anda sendiri (bukan ke `main`):

```bash
git push origin nama-branch-anda
```

### Judul PR

Gunakan judul yang ringkas dan deskriptif. Gaya Conventional disarankan.

### Deskripsi PR

Sertakan:

- Apa yang berubah
- Alasan perubahan
- Scope dan package yang terdampak
- Screenshot atau output terminal (jika relevan)
- Issue terkait (contoh `Closes #123`)


### Checklist Sebelum PR

Sebelum meminta review, pastikan:

- [ ] `pnpm lint` lolos
- [ ] `pnpm typecheck` lolos
- [ ] Alur build/dev yang relevan berjalan di lokal
- [ ] Dokumen diperbarui jika perilaku berubah
- [ ] Perubahan tetap terfokus dan bebas refactor yang tidak terkait

## Testing dan Validasi

Repository ini menggunakan linting, type checking, dan validasi alur nyata sebagai quality gate utama.

Saat menyentuh perilaku runtime, validasi package/app yang terdampak secara lokal dan sertakan catatan verifikasi pada PR.

## Changeset dan Rilis

Monorepo ini menggunakan Changesets untuk versioning dan publishing.

Untuk setiap perubahan package yang berdampak ke pengguna, tambahkan changeset:

```bash
pnpm changeset
```

Lalu ikuti alur rilis yang didokumentasikan di [README.md](README.md).

## Kontribusi Dokumentasi

Peningkatan dokumentasi sangat dianjurkan.

Tolong jaga tulisan tetap ringkas, berbasis contoh, dan konsisten dengan tone serta organisasi file yang sudah ada.

## Proses Review

- Maintainer melakukan review berdasarkan kebenaran, scope, dan maintainability jangka panjang
- Feedback adalah hal yang wajar dalam kolaborasi open source
- Responsif terhadap masukan dan terbuka untuk iterasi

## Manfaat Kontributor

Berkontribusi di sini bukan soal insentif finansial. Nilai utamanya adalah menjaga ekosistem tetap sehat dan kualitas produk berkelanjutan.

Dengan berkontribusi, Anda ikut:

- Menjaga ekosistem DocuBook tetap andal untuk pengguna dan tim
- Meningkatkan maintainability jangka panjang serta mengurangi technical debt
- Menjaga stabilitas rilis lewat kualitas perubahan dan budaya review
- Memperkuat pengetahuan bersama melalui docs, contoh, dan diskusi issue
- Membangun rekam jejak open-source melalui kontribusi publik yang bermakna

## Sponsor dan Keadilan

DocuBook menerima sponsor dan donasi untuk mendukung pemeliharaan, dokumentasi, dan aktivitas komunitas.

CI/CD sudah di-handle oleh GitHub Actions, dan situs dokumentasi utama di-host gratis di Vercel. Dana sponsor terutama digunakan untuk mendukung kontributor aktif, koordinasi komunitas, dan biaya domain.

Dukungan sponsor dihargai, tetapi tidak memengaruhi proses review kontribusi. Semua issue dan pull request dinilai berdasarkan kualitas teknis, kelayakan, dan kesesuaian dengan tujuan proyek.

Manfaat sponsor dapat meliputi:

- ucapan terima kasih publik di repo atau catatan rilis
- akses ke ringkasan roadmap atau pembaruan sponsor
- undangan ke channel komunitas atau sesi sponsor

Keadilan adalah prioritas:

- semua orang mendapat proses review yang sama
- sponsor bukan jalan pintas untuk merge atau prioritas khusus
- transparansi penggunaan dana menjaga kepercayaan

> [!CATATAN]
> Karena keterbatasan tim maintainer, owner proyek ini kadang bekerja dengan agen seperti GitHub Copilot dan Anthropic Claude. Sebagian dana mungkin digunakan untuk membayar langganan token API yang diperlukan agen tersebut.

## Apresiasi

Semua kontribusi bermakna sangat diapresiasi, termasuk kode, dokumentasi, triase issue, dan masukan desain.

Terima kasih telah membantu meningkatkan DocuBook.
