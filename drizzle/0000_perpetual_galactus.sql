CREATE TABLE IF NOT EXISTS "article4_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"council_id" text NOT NULL,
	"zone_type" text NOT NULL,
	"boundary" geometry(point) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demand_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" geometry(point) NOT NULL,
	"occupancy" integer NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"property_id" uuid NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"roi_at_save" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"price" integer NOT NULL,
	"bedrooms" integer,
	"property_type" text,
	"location" geometry(point) NOT NULL,
	"raw_data" jsonb,
	"scraped_at" timestamp DEFAULT now(),
	"is_article4" boolean DEFAULT false,
	"article4_zone_id" uuid,
	CONSTRAINT "properties_portal_id_unique" UNIQUE("portal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scraping_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_url" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_article4_zone_id_article4_zones_id_fk" FOREIGN KEY ("article4_zone_id") REFERENCES "public"."article4_zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
