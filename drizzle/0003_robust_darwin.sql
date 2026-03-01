ALTER TABLE "properties" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "tenure" text DEFAULT 'rent';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ai_verdict" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ai_verdict_updated_at" timestamp;