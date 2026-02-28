ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'New';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "assumptions_override" jsonb;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "first_seen_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "original_price" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "time_on_market" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_tired_landlord" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "source" text DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN IF EXISTS "roi_at_save";