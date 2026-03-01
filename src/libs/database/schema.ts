import { pgTable, uuid, text, integer, timestamp, geometry, jsonb, boolean, primaryKey } from 'drizzle-orm/pg-core';

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
  description: text('description'),
  status: text('status').default('active'), // active | stale | sold
  tenure: text('tenure').default('rent'), // rent | sale
  aiVerdict: text('ai_verdict'),
  aiVerdictUpdatedAt: timestamp('ai_verdict_updated_at'),
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

// ─── Auth.js Tables ────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  lastIp: text('last_ip'),
});

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));
