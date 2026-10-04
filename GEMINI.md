<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `C:/Users/LENOVO/.gemini/config/plugins/antislop/skills/antislop-ui/SKILL.md`
- Copy & text: `C:/Users/LENOVO/.gemini/config/plugins/antislop/skills/antislop-copywriting/SKILL.md`
- People: `C:/Users/LENOVO/.gemini/config/plugins/antislop/skills/antislop-human/SKILL.md`
- Mobile / responsive: `C:/Users/LENOVO/.gemini/config/plugins/antislop/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `C:/Users/LENOVO/.gemini/config/plugins/antislop/skills/antislop-code/SKILL.md`

Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: download `antislop.md` again, or run `npx antislop-ai --update` if it was installed as skill folders.
<!-- antislop:end -->

## Project Asset Rules

- **Semua file di `app/public/images/` adalah milik user.** Jangan hapus, replace, atau overwrite file-file tersebut tanpa konfirmasi eksplisit dari user.
- Jika user meminta "hapus gambar yang bukan dari aku", yang dimaksud adalah: gambar yang muncul di **website/kode** tapi **TIDAK ada file-nya** di folder `app/public/images/`. Bukan menghapus file yang ada di folder tersebut.
- Sebelum melakukan operasi batch pada file aset (hapus, replace, rename), **selalu konfirmasi** daftar file yang akan diubah ke user terlebih dahulu.

## Workflow, Analysis, & Confirmation Guardrails

1. **Analisa vs Eksekusi:**
   - Jika pengguna meminta untuk "cek", "analisa", "tinjau", atau menanyakan error/status, **HANYA lakukan investigasi dan sajikan hasil analisa murni**.
   - DILARANG langsung memodifikasi kode, memperbaiki file, membuat commit, atau melakukan push tanpa perintah perbaikan eksplisit dari pengguna.

2. **Pemberitahuan Rencana & Konfirmasi Wajib:**
   - Sebelum melakukan modifikasi file atau tindakan berdampak pada sistem/server, **SELALU paparkan rencana tindakan secara rinci terlebih dahulu** (file mana yang akan disentuh, apa perubahannya, dan perintah apa yang akan dijalankan).
   - Tunggu konfirmasi/persetujuan eksplisit dari pengguna sebelum mengeksekusi rencana tersebut.

3. **Larangan Keras Git Commit & Push Otonom:**
   - DILARANG KERAS melakukan `git commit` maupun `git push` ke repositori (lokal maupun remote) secara otomatis tanpa instruksi langsung atau konfirmasi tertulis dari pengguna.

