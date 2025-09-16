import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthOrDemo, json, redact } from "../_shared/guards.ts";

serve(
  withAuthOrDemo(
    async ({ req, user, demo }) => {
      try {
        if (demo) {
          return json({
            message: "Demo mode active",
            user: {
              id: "demo-user-123",
              email: redact.email("demo@example.com"),
              name: redact.name("Demo User"),
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Normal authenticated flow
        return json({
          message: "Authenticated request successful",
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || "User",
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error in demo-protected function:", error);
        return json({ error: "Internal server error" }, 500);
      }
    },
    { allowDemo: true }
  )
);