ALTER TABLE "leads" ADD COLUMN "outreach_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "last_outreach_at" timestamp;