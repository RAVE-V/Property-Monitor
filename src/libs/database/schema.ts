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
  isArticle4: boolean('is_article4').default(false),
  article4ZoneId: uuid('article4_zone_id').references(() => article4Zones.id),
});

export const demandPoints = pgTable('demand_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  location: geometry('location', { type: 'point', srid: 4326 }).notNull(),
  occupancy: integer('occupancy').notNull(), // 0-100 percentage
  source: text('source').notNull(), // airbnb, booking, etc.
  updatedAt: timestamp('updated_at').defaultNow(),
});
