import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || Infinity;
  
  // Mock properties in London
  const properties = [
    {
      id: 'prop-1',
      title: 'Modern 2 Bed Flat in Canary Wharf',
      price: 2500,
      bedrooms: 2,
      propertyType: 'Flat',
      url: 'https://example.com/prop-1',
      location: { lat: 51.5036, lng: -0.0185 },
      planningIndicators: ['Recently Renovated']
    },
    {
      id: 'prop-2',
      title: 'Spacious 4 Bed House for HMO',
      price: 3500,
      bedrooms: 4,
      propertyType: 'House',
      url: 'https://example.com/prop-2',
      location: { lat: 51.5154, lng: -0.0934 },
      planningIndicators: ['HMO Potential', 'Licensed']
    },
    {
      id: 'prop-3',
      title: 'Studio Apartment near Victoria',
      price: 1500,
      bedrooms: 1,
      propertyType: 'Flat',
      url: 'https://example.com/prop-3',
      location: { lat: 51.4964, lng: -0.1439 },
      planningIndicators: []
    }
  ];

  const filteredProperties = properties.filter(p => p.price >= minPrice && p.price <= maxPrice);

  const geoJson = {
    type: 'FeatureCollection',
    features: filteredProperties.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.location.lng, p.location.lat]
      },
      properties: {
        id: p.id,
        title: p.title,
        price: p.price,
        bedrooms: p.bedrooms,
        propertyType: p.propertyType,
        url: p.url,
        planningIndicators: p.planningIndicators
      }
    }))
  };

  return NextResponse.json(geoJson);
}
