import { pgTable, uuid, text, integer, timestamp, geometry, jsonb } from 'drizzle-orm/pg-core';

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
});

export const scrapingJobs = pgTable('scraping_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyUrl: text('property_url').notNull(),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
