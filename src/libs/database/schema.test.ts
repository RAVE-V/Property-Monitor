import { describe, it, expect } from 'vitest';
import * as schema from './schema';
import { getTableColumns } from 'drizzle-orm';

describe('Schema Definition', () => {
  it('should have article4Zones table defined', () => {
    expect(schema.article4Zones).toBeDefined();
  });

  it('should have isArticle4 and article4ZoneId in properties table', () => {
    const columns = getTableColumns(schema.properties);
    expect(columns).toHaveProperty('isArticle4');
    expect(columns).toHaveProperty('article4ZoneId');
  });

  it('should have article4Zones table with correct columns', () => {
    const columns = getTableColumns(schema.article4Zones);
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('councilId');
    expect(columns).toHaveProperty('zoneType');
    expect(columns).toHaveProperty('boundary');
  });
});
