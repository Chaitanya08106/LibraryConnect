import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Only POST requests
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Read body
    const body = await req.json();
    const email = body?.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400 }
      );
    }

    // IMPORTANT:
    // Supabase automatically injects these env vars
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Create Auth user with default password
    const { error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: "Welcome@123",
        email_confirm: true
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400 }
      );
    }

    // 2) Insert into admins table as sub-admin
    const { error: dbError } = await supabaseAdmin
      .from("admins")
      .insert({
        email,
        role: "sub"
      });

    if (dbError) {
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin created with default password Welcome@123"
      }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
