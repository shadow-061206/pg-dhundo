"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_MB = 5;

// Uploads photos straight from the browser to the public `pg-images` bucket
// (only admins are allowed to upload). The first photo is the cover image.
export default function ImageUploader({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setBusy(true);
    const supabase = createClient();
    const added: string[] = [];

    for (const file of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError("Only JPG, PNG or WebP photos are allowed."); continue; }
      if (file.size > MAX_MB * 1024 * 1024) { setError(`Each photo must be under ${MAX_MB} MB.`); continue; }
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("pg-images").upload(path, file, { contentType: file.type });
      if (upErr) { setError(`Upload failed: ${upErr.message}`); continue; }
      added.push(supabase.storage.from("pg-images").getPublicUrl(path).data.publicUrl);
    }
    if (added.length) onChange([...images, ...added]);
    setBusy(false);
  }

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-3">
        {images.map((url, i) => (
          <li key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="h-24 w-32 rounded-lg border border-line object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-deep px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span>}
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(images.filter((u) => u !== url))}
              className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white">
              <X className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
      <label className={`btn btn-outline cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
        <Upload className="mr-2 h-4 w-4" />
        {busy ? "Uploading…" : "Upload photos"}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={onFiles} />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
