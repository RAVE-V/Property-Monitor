import { pgTable, uuid, text, integer, timestamp, geometry, jsonb, boolean } from 'drizzle-orm/pg-core';

export const article4Zones = pgTable('article4_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  councilId: text('council_id').notNull(),
  zoneType: text('zone_type').notNull(), // HMO, SA, etc.
  boundary: geometry('boundary', { type: 'polygon', srid: 4326 }).notNull(),
});

export const properties = pgTable('properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  portalId: text('portal_id').unique().notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  price: integer('price').notNull(),
  bedrooms: integer('bedrooms'),
  propertyType: text('property_type'),
  location: geometry('location', { type: 'point', srid: 4326 }).notNull(),
  rawData: jsonb('raw_data'),
  scrapedAt: timestamp('scraped_at').defaultNow(),
  firstSeenAt: timestamp('first_seen_at').defaultNow(),
  originalPrice: integer('original_price'),
  timeOnMarket: integer('time_on_market'), // in days
  isTiredLandlord: boolean('is_tired_landlord').default(false),
  isArticle4: boolean('is_article4').default(false),
  article4ZoneId: uuid('article4_zone_id').references(() => article4Zones.id),
  source: text('source').default('unknown'),
  status: text('status').default('active'), // active | stale | sold
  tenure: text('tenure').default('rent'), // rent | sale
});

export const demandPoints = pgTable('demand_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  location: geometry('location', { type: 'point', srid: 4326 }).notNull(),
  occupancy: integer('occupancy').notNull(), // 0-100 percentage
  source: text('source').notNull(), // airbnb, booking, etc.
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scrapingJobs = pgTable('scraping_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyUrl: text('property_url').notNull(),
  status: text('status').notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  status: text('status').notNull().default('New'), // New, Interested, Contacted, Viewing, Offered
  notes: text('notes'),
  assumptionsOverride: jsonb('assumptions_override'),
  outreachCount: integer('outreach_count').default(0),
  lastOutreachAt: timestamp('last_outreach_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
