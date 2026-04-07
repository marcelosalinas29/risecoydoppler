import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create the viewer user
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email: "medico@medico.com",
      password: "medico",
      email_confirm: true,
    });

    if (authError) {
      // If user already exists, return success
      if (authError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ message: "User already exists" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw authError;
    }

    const userId = userData.user.id;

    // Assign viewer role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "viewer" });

    if (roleError) throw roleError;

    // Update profile name
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: "Médico Visualizador" })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
