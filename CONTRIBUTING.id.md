# Berkontribusi ke DocuBook

Bahasa: [English](CONTRIBUTING.md) | Bahasa Indonesia

Terima kasih atas minat Anda untuk berkontribusi ke DocuBook.

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

- Cari issue dan pull request yang sudah ada sebelum membuka yang baru
- Untuk perubahan non-sepele, buka issue/diskusi terlebih dahulu untuk menyelaraskan scope
- Jaga pull request tetap fokus: satu concern per PR

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

## Apresiasi

Semua kontribusi bermakna sangat diapresiasi, termasuk kode, dokumentasi, triase issue, dan masukan desain.

Terima kasih telah membantu meningkatkan DocuBook.
