import { db } from '@/db';
import {
  categories, brands, products, news,
  certifications, partners,
} from '@/db/schema';

async function main() {
  console.log('🌱 Seeding database...\n');

  // Categories
  const catData = [
    { name: 'Roller Coasters', slug: 'roller-coasters', description: 'High-speed thrill coasters', image_url: '/api/placeholder/400/300', sort_order: 1 },
    { name: 'Ferris Wheels', slug: 'ferris-wheels', description: 'Panoramic observation wheels', image_url: '/api/placeholder/400/300', sort_order: 2 },
    { name: 'Carousels', slug: 'carousels', description: 'Classic merry-go-rounds', image_url: '/api/placeholder/400/300', sort_order: 3 },
    { name: 'Bumper Cars', slug: 'bumper-cars', description: 'Electric bumper car arenas', image_url: '/api/placeholder/400/300', sort_order: 4 },
    { name: 'Water Park Rides', slug: 'water-rides', description: 'Water slides and wave pools', image_url: '/api/placeholder/400/300', sort_order: 5 },
    { name: "Kids' Rides", slug: 'kids-rides', description: 'Safe and fun rides for children', image_url: '/api/placeholder/400/300', sort_order: 6 },
  ];
  await db.insert(categories).values(catData).onConflictDoNothing({ target: categories.slug }).returning();
  console.log(`  ✅ ${catData.length} categories`);

  // Brands
  const brandData = [
    { name: 'ThrillWorks', slug: 'thrillworks', description: 'Innovative coaster & thrill ride builder', logo_url: '/api/placeholder/200/80', website: 'https://thrillworks.com', country: 'Switzerland' },
    { name: 'AquaFun', slug: 'aquafun', description: 'Water park equipment specialist', logo_url: '/api/placeholder/200/80', website: 'https://aquafun.com', country: 'USA' },
    { name: 'KidsPlay', slug: 'kidsplay', description: 'Children ride safety expert', logo_url: '/api/placeholder/200/80', website: 'https://kidsplay.com', country: 'China' },
    { name: 'SkyHigh', slug: 'skyhigh', description: 'Ferris wheel & observation tower builder', logo_url: '/api/placeholder/200/80', website: 'https://skyhigh.com', country: 'UK' },
    { name: 'EcoRide', slug: 'ecoride', description: 'Eco-friendly amusement ride solutions', logo_url: '/api/placeholder/200/80', website: 'https://ecoride.com', country: 'Sweden' },
  ];
  await db.insert(brands).values(brandData).onConflictDoNothing({ target: brands.slug }).returning();
  console.log(`  ✅ ${brandData.length} brands`);

  // Products
  const prodData = [
    { sku: 'RC-001', name: 'Thunder Bolt', slug: 'thunder-bolt', description: 'A heart-pounding steel coaster with 4 inversions reaching 90km/h.', category_id: 1, brand_id: 1, price: '2500000', main_image: '/api/placeholder/600/400', is_featured: true, sort_order: 1, status: 'published' as const },
    { sku: 'RC-002', name: 'Sky Serpent', slug: 'sky-serpent', description: 'Floorless coaster with 5 loops and a 40m drop.', category_id: 1, brand_id: 1, price: '3200000', main_image: '/api/placeholder/600/400', is_featured: true, sort_order: 2, status: 'published' as const },
    { sku: 'FW-001', name: 'Star Gazer', slug: 'star-gazer', description: '80m diameter observation wheel with 42 gondolas.', category_id: 2, brand_id: 4, price: '4800000', main_image: '/api/placeholder/600/400', is_featured: false, sort_order: 3, status: 'published' as const },
    { sku: 'CR-001', name: 'Enchanted Carousel', slug: 'enchanted-carousel', description: 'Classic 3-tier carousel with hand-painted animals.', category_id: 3, brand_id: 3, price: '850000', main_image: '/api/placeholder/600/400', is_featured: true, sort_order: 4, status: 'published' as const },
    { sku: 'BC-001', name: 'Bumper Bonanza', slug: 'bumper-bonanza', description: 'Electric bumper car arena with 16 cars and LED effects.', category_id: 4, brand_id: 2, price: '350000', main_image: '/api/placeholder/600/400', is_featured: false, sort_order: 5, status: 'published' as const },
    { sku: 'WR-001', name: 'Aqua Drop', slug: 'aqua-drop', description: 'High-speed water slide with a near-vertical drop.', category_id: 5, brand_id: 5, price: '1200000', main_image: '/api/placeholder/600/400', is_featured: true, sort_order: 6, status: 'published' as const },
  ];
  await db.insert(products).values(prodData).onConflictDoNothing({ target: products.sku }).returning();
  console.log(`  ✅ ${prodData.length} products`);

  // News
  const newsData = [
    { title: 'ThrillWorks Unveils World\'s Tallest Hybrid Coaster', slug: 'tallest-hybrid-coaster-2025', summary: 'Breaking records with a 150m hybrid coaster', cover_image: '/api/placeholder/800/400', category: 'industry', author: 'RideCraft News', is_published: true, published_at: new Date('2025-03-15') },
    { title: 'New Safety Standards for Amusement Rides Announced', slug: 'new-safety-standards-2025', summary: 'Industry-wide safety upgrades for 2025 season', cover_image: '/api/placeholder/800/400', category: 'industry', author: 'Safety Board', is_published: true, published_at: new Date('2025-03-10') },
    { title: 'RideCraft Expands into Southeast Asian Market', slug: 'sea-market-expansion', summary: 'New partnerships established in Thailand and Vietnam', cover_image: '/api/placeholder/800/400', category: 'company', author: 'RideCraft PR', is_published: true, published_at: new Date('2025-03-05') },
    { title: 'Top 10 Most Anticipated Theme Park Openings in 2025', slug: 'top-10-openings-2025', summary: 'Major theme parks set to open worldwide', cover_image: '/api/placeholder/800/400', category: 'industry', author: 'Industry Analyst', is_published: true, published_at: new Date('2025-02-28') },
    { title: 'Sustainable Amusement: Eco-Friendly Ride Technologies', slug: 'eco-friendly-ride-tech', summary: 'Green innovations shaping the future of amusement', cover_image: '/api/placeholder/800/400', category: 'technology', author: 'Tech Desk', is_published: true, published_at: new Date('2025-02-20') },
    { title: 'Inside RideCraft\'s 50,000㎡ Smart Factory', slug: 'inside-smart-factory', summary: 'A behind-the-scenes look at our manufacturing facility', cover_image: '/api/placeholder/800/400', category: 'company', author: 'RideCraft Engineering', is_published: true, published_at: new Date('2025-02-15') },
  ];
  await db.insert(news).values(newsData).onConflictDoNothing({ target: news.slug }).returning();
  console.log(`  ✅ ${newsData.length} news articles`);

  // Certifications
  const certData = [
    { name: 'ISO 9001:2025', slug: 'iso-9001', description: 'Quality Management System', logo_url: '/api/placeholder/200/100', issuing_body: 'TÜV Rheinland', issue_date: new Date('2024-01-01'), expiry_date: new Date('2027-01-01') },
    { name: 'CE', slug: 'ce-marking', description: 'European Conformity', logo_url: '/api/placeholder/200/100', issuing_body: 'European Commission', issue_date: new Date('2024-03-01'), expiry_date: new Date('2027-03-01') },
    { name: 'ASTM F2291', slug: 'astm-f2291', description: 'Amusement Ride Safety Standard', logo_url: '/api/placeholder/200/100', issuing_body: 'ASTM International', issue_date: new Date('2024-06-01'), expiry_date: new Date('2027-06-01') },
    { name: 'GB 8408', slug: 'gb-8408', description: 'China National Safety Standard', logo_url: '/api/placeholder/200/100', issuing_body: 'SAC', issue_date: new Date('2024-02-01'), expiry_date: new Date('2027-02-01') },
    { name: 'EN 13814', slug: 'en-13814', description: 'European Safety Standard for Amusement Rides', logo_url: '/api/placeholder/200/100', issuing_body: 'CEN', issue_date: new Date('2024-04-01'), expiry_date: new Date('2027-04-01') },
    { name: 'OHSAS 18001', slug: 'ohsas-18001', description: 'Occupational Health & Safety', logo_url: '/api/placeholder/200/100', issuing_body: 'BSI', issue_date: new Date('2024-05-01'), expiry_date: new Date('2027-05-01') },
  ];
  await db.insert(certifications).values(certData).onConflictDoNothing({ target: certifications.slug }).returning();
  console.log(`  ✅ ${certData.length} certifications`);

  // Partners
  const partnerData = [
    { name: 'Disney Parks', description: 'Global theme park leader', logo_url: '/api/placeholder/200/80', website: 'https://disney.com', sort_order: 1 },
    { name: 'Universal Studios', description: 'Movie-themed entertainment', logo_url: '/api/placeholder/200/80', website: 'https://universal.com', sort_order: 2 },
    { name: 'Six Flags', description: 'Regional theme park chain', logo_url: '/api/placeholder/200/80', website: 'https://sixflags.com', sort_order: 3 },
    { name: 'Merlin Entertainments', description: 'European attraction operator', logo_url: '/api/placeholder/200/80', website: 'https://merlin.com', sort_order: 4 },
    { name: 'OCT Group', description: 'China\'s largest theme park operator', logo_url: '/api/placeholder/200/80', website: 'https://oct.com', sort_order: 5 },
    { name: 'Chimelong', description: 'Guangzhou-based theme park group', logo_url: '/api/placeholder/200/80', website: 'https://chimelong.com', sort_order: 6 },
  ];
  await db.insert(partners).values(partnerData).returning();
  console.log(`  ✅ ${partnerData.length} partners`);

  console.log('\n🎉 Seeding complete!');
}

main().catch((error) => {
  console.error('❌ Failed to seed database:', error);
  process.exit(1);
});
