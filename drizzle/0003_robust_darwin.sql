ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "tenure" text DEFAULT 'rent';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "ai_verdict" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "ai_verdict_updated_at" timestamp;