// Edge function: migrate-images-batch
// Migra imágenes base64 del campo `images` (jsonb) al bucket `estudios_imagenes`
// y guarda las URLs públicas en `image_urls`.
// IMPORTANTE: NO borra el campo `images` — eso se hace en un segundo paso manual
// después de que el usuario confirme visualmente que las imágenes se ven bien.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MigrationResult {
  appointmentId: string;
  status: "ok" | "skipped" | "error";
  uploaded: number;
  urls?: string[];
  error?: string;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseDataUrl(
  dataUrl: string
): { mime: string; ext: string; bytes: Uint8Array } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const b64 = match[2];
  const ext =
    mime === "image/jpeg" ? "jpg" :
    mime === "image/png"  ? "png" :
    mime === "image/webp" ? "webp" :
    mime === "image/gif"  ? "gif" : "bin";
  return { mime, ext, bytes: base64ToBytes(b64) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0 || ids.length > 30) {
      return new Response(
        JSON.stringify({ error: "Se requiere 'ids' (array de 1 a 30 UUIDs)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cargar las citas a migrar
    const { data: appts, error: fetchErr } = await supabase
      .from("appointments")
      .select("id, images, image_urls")
      .in("id", ids);

    if (fetchErr) throw fetchErr;

    const results: MigrationResult[] = [];

    for (const apt of appts ?? []) {
      try {
        const imagesArr = Array.isArray(apt.images) ? apt.images : [];
        if (imagesArr.length === 0) {
          results.push({ appointmentId: apt.id, status: "skipped", uploaded: 0, error: "sin imágenes" });
          continue;
        }
        if (Array.isArray(apt.image_urls) && apt.image_urls.length > 0) {
          results.push({ appointmentId: apt.id, status: "skipped", uploaded: 0, error: "ya tiene image_urls" });
          continue;
        }

        const newUrls: string[] = [];
        for (let i = 0; i < imagesArr.length; i++) {
          const item = imagesArr[i];
          if (typeof item !== "string") continue;

          // Si ya es una URL (no base64), la respetamos tal cual
          if (!item.startsWith("data:")) {
            newUrls.push(item);
            continue;
          }

          const parsed = parseDataUrl(item);
          if (!parsed) continue;

          const path = `migrated/${apt.id}/${Date.now()}_${i}.${parsed.ext}`;
          const { error: upErr } = await supabase.storage
            .from("estudios_imagenes")
            .upload(path, parsed.bytes, {
              contentType: parsed.mime,
              upsert: false,
            });
          if (upErr) throw new Error(`upload[${i}]: ${upErr.message}`);

          const { data: pub } = supabase.storage
            .from("estudios_imagenes")
            .getPublicUrl(path);
          newUrls.push(pub.publicUrl);
        }

        // Guardar SOLO image_urls. NO tocamos `images` todavía.
        const { error: updErr } = await supabase
          .from("appointments")
          .update({ image_urls: newUrls })
          .eq("id", apt.id);
        if (updErr) throw updErr;

        results.push({
          appointmentId: apt.id,
          status: "ok",
          uploaded: newUrls.length,
          urls: newUrls,
        });
      } catch (e) {
        results.push({
          appointmentId: apt.id,
          status: "error",
          uploaded: 0,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
    };

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
