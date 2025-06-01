
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // This is just a placeholder - the bucket should be created via SQL
  return new Response(JSON.stringify({ message: "Use SQL to create storage bucket" }), {
    headers: { "Content-Type": "application/json" },
  });
});
