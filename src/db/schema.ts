import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────
export const inquiry_status = pgEnum('inquiry_status', ['pending', 'processing', 'replied', 'closed']);
export const review_status = pgEnum('review_status', ['pending', 'approved', 'rejected', 'hidden']);
export const user_role = pgEnum('user_role', ['customer', 'admin', 'super_admin', 'editor', 'viewer']);
export const product_status = pgEnum('product_status', ['draft', 'published', 'archived']);

// ─── Categories ──────────────────────────────────────────
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  image_url: varchar('image_url', { length: 500 }),
  parent_id: integer('parent_id'),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  parentIdx: index('idx_categories_parent_id').on(table.parent_id),
  slugIdx: uniqueIndex('idx_categories_slug').on(table.slug),
}));

// ─── Brands ──────────────────────────────────────────────
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logo_url: varchar('logo_url', { length: 500 }),
  description: text('description'),
  website: varchar('website', { length: 500 }),
  country: varchar('country', { length: 100 }),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('idx_brands_slug').on(table.slug),
}));

// ─── Products ────────────────────────────────────────────
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  short_description: varchar('short_description', { length: 500 }),
  category_id: integer('category_id').references(() => categories.id),
  brand_id: integer('brand_id').references(() => brands.id),
  price: decimal('price', { precision: 12, scale: 2 }),
  weight: varchar('weight', { length: 50 }),
  dimensions: varchar('dimensions', { length: 100 }),
  material: varchar('material', { length: 255 }),
  capacity: varchar('capacity', { length: 100 }),
  power: varchar('power', { length: 100 }),
  warranty: varchar('warranty', { length: 100 }),
  certification: varchar('certification', { length: 500 }),
  min_order_qty: integer('min_order_qty').default(1),
  main_image: varchar('main_image', { length: 500 }),
  images: jsonb('images').default([]),
  specifications: jsonb('specifications').default([]),
  features: jsonb('features').default([]),
  status: product_status('status').default('draft'),
  is_featured: boolean('is_featured').default(false),
  view_count: integer('view_count').default(0),
  inquiry_count: integer('inquiry_count').default(0),
  meta_title: varchar('meta_title', { length: 255 }),
  meta_description: text('meta_description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('idx_products_slug').on(table.slug),
  skuIdx: uniqueIndex('idx_products_sku').on(table.sku),
  categoryIdx: index('idx_products_category_id').on(table.category_id),
  brandIdx: index('idx_products_brand_id').on(table.brand_id),
  featuredIdx: index('idx_products_featured').on(table.is_featured),
  statusIdx: index('idx_products_status').on(table.status),
  searchIdx: index('idx_products_search').using('gin', sql`to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))`),
}));

// ─── Product Attributes ──────────────────────────────────
export const product_attributes = pgTable('product_attributes', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').references(() => products.id),
  name: varchar('name', { length: 255 }).notNull(),
  value: text('value').notNull(),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productIdx: index('idx_product_attributes_product_id').on(table.product_id),
}));

// ─── Users ───────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  company: varchar('company', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  country: varchar('country', { length: 100 }),
  role: user_role('role').default('customer'),
  avatar_url: varchar('avatar_url', { length: 500 }),
  is_active: boolean('is_active').default(true),
  email_verified_at: timestamp('email_verified_at'),
  last_login_at: timestamp('last_login_at'),
  login_attempts: integer('login_attempts').default(0),
  locked_until: timestamp('locked_until'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  emailIdx: uniqueIndex('idx_users_email').on(table.email),
}));

// ─── Inquiries (替代购物车 - B2B 询盘) ───────────────────
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  inquiry_no: varchar('inquiry_no', { length: 50 }).notNull().unique(),
  user_id: integer('user_id').references(() => users.id),
  product_id: integer('product_id').notNull().references(() => products.id),
  contact_name: varchar('contact_name', { length: 255 }).notNull(),
  contact_email: varchar('contact_email', { length: 255 }).notNull(),
  contact_phone: varchar('contact_phone', { length: 50 }),
  company_name: varchar('company_name', { length: 255 }),
  quantity: integer('quantity').default(1),
  message: text('message'),
  status: inquiry_status('status').default('pending'),
  admin_notes: text('admin_notes'),
  replied_at: timestamp('replied_at'),
  closed_at: timestamp('closed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  userIdx: index('idx_inquiries_user_id').on(table.user_id),
  productIdx: index('idx_inquiries_product_id').on(table.product_id),
  statusIdx: index('idx_inquiries_status').on(table.status),
  inquiryNoIdx: uniqueIndex('idx_inquiries_inquiry_no').on(table.inquiry_no),
}));

// ─── Inquiry History ───────────────────────────────────────
export const inquiry_history = pgTable('inquiry_history', {
  id: serial('id').primaryKey(),
  inquiry_id: integer('inquiry_id').notNull().references(() => inquiries.id, { onDelete: 'cascade' }),
  previous_status: inquiry_status('previous_status'),
  new_status: inquiry_status('new_status').notNull(),
  changed_by: integer('changed_by').references(() => users.id),
  admin_id: integer('admin_id').references(() => users.id),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  inquiryIdx: index('idx_inquiry_history_inquiry_id').on(table.inquiry_id),
  statusIdx: index('idx_inquiry_history_status').on(table.new_status),
}));

// ─── Reviews ─────────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => products.id),
  user_id: integer('user_id').references(() => users.id),
  customer_name: varchar('customer_name', { length: 255 }),
  company_name: varchar('company_name', { length: 255 }),
  rating: integer('rating').notNull().default(5),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  project_name: varchar('project_name', { length: 255 }),
  project_location: varchar('project_location', { length: 255 }),
  images: jsonb('images').default([]),
  status: review_status('status').default('pending'),
  is_featured: boolean('is_featured').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  productIdx: index('idx_reviews_product_id').on(table.product_id),
  statusIdx: index('idx_reviews_status').on(table.status),
  featuredIdx: index('idx_reviews_featured').on(table.is_featured),
}));

// ─── Certifications ──────────────────────────────────────
export const certifications = pgTable('certifications', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logo_url: varchar('logo_url', { length: 500 }),
  description: text('description'),
  issuing_body: varchar('issuing_body', { length: 255 }),
  certificate_number: varchar('certificate_number', { length: 100 }),
  issue_date: timestamp('issue_date'),
  expiry_date: timestamp('expiry_date'),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('idx_certifications_slug').on(table.slug),
}));

// ─── Partners ────────────────────────────────────────────
export const partners = pgTable('partners', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  logo_url: varchar('logo_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  description: text('description'),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
});

// ─── News / Articles ────────────────────────────────────
export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  summary: text('summary'),
  content: text('content'),
  cover_image: varchar('cover_image', { length: 500 }),
  category: varchar('category', { length: 50 }).default('company'), // company, industry, technology
  tags: jsonb('tags').default([]),
  author: varchar('author', { length: 255 }),
  is_published: boolean('is_published').default(false),
  published_at: timestamp('published_at'),
  view_count: integer('view_count').default(0),
  meta_title: varchar('meta_title', { length: 255 }),
  meta_description: text('meta_description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('idx_news_slug').on(table.slug),
  publishedIdx: index('idx_news_published').on(table.is_published),
  categoryIdx: index('idx_news_category').on(table.category),
}));

// ─── Company Info ────────────────────────────────────────
export const company_info = pgTable('company_info', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  type: varchar('type', { length: 50 }).default('text'), // text, image, rich_text, number
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Statistics ──────────────────────────────────────────
export const statistics = pgTable('statistics', {
  id: serial('id').primaryKey(),
  label: varchar('label', { length: 255 }).notNull(),
  value: varchar('value', { length: 50 }).notNull(),
  suffix: varchar('suffix', { length: 20 }),
  icon: varchar('icon', { length: 255 }),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Factory Info ────────────────────────────────────────
export const factory_info = pgTable('factory_info', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  image_url: varchar('image_url', { length: 500 }),
  icon: varchar('icon', { length: 255 }),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Features ────────────────────────────────────────────
export const features = pgTable('features', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Process Steps (询盘流程) ────────────────────────────
export const process_steps = pgTable('process_steps', {
  id: serial('id').primaryKey(),
  step_number: integer('step_number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Pages (CMS 页面) ────────────────────────────────────
export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  meta_title: varchar('meta_title', { length: 255 }),
  meta_description: text('meta_description'),
  is_published: boolean('is_published').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('idx_pages_slug').on(table.slug),
}));

// ─── Tags ────────────────────────────────────────────────
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_tags_slug').on(table.slug),
}));

// ─── Product Tags ────────────────────────────────────────
export const product_tags = pgTable('product_tags', {
  product_id: integer('product_id').notNull().references(() => products.id),
  tag_id: integer('tag_id').notNull().references(() => tags.id),
}, (table) => ({
  productTagIdx: uniqueIndex('idx_product_tags').on(table.product_id, table.tag_id),
}));

// ─── Favorites (收藏) ────────────────────────────────────
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  product_id: integer('product_id').notNull().references(() => products.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex('idx_favorites_user_product').on(table.user_id, table.product_id),
}));

// ─── Notifications ───────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  type: varchar('type', { length: 50 }).default('system'), // inquiry, system, promotion
  is_read: boolean('is_read').default(false),
  related_id: integer('related_id'),
  related_type: varchar('related_type', { length: 50 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_notifications_user_id').on(table.user_id),
  unreadIdx: index('idx_notifications_unread').on(table.user_id, table.is_read),
}));
// ─── Customer Addresses ───────────────────────────────
export const customer_addresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  label: varchar('label', { length: 50 }),
  receiver: varchar('receiver', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  country: varchar('country', { length: 100 }),
  province: varchar('province', { length: 100 }),
  city: varchar('city', { length: 100 }),
  district: varchar('district', { length: 100 }),
  address: varchar('address', { length: 500 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_addresses_user_id').on(table.userId),
}));

// ─── Review Images ────────────────────────────────────
export const review_images = pgTable('review_images', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  reviewIdx: index('idx_review_images_review_id').on(table.reviewId),
}));

// ─── Site Settings ────────────────────────────────────
export const site_settings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value'),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  type: varchar('type', { length: 50 }).default('text').notNull(),
  section: varchar('section', { length: 100 }).default('general').notNull(),
  label: varchar('label', { length: 255 }),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  keyLocaleIdx: uniqueIndex('idx_site_settings_key_locale').on(table.key, table.locale),
  sectionIdx: index('idx_site_settings_section').on(table.section),
}));

// ─── Team Members ─────────────────────────────────────
export const team_members = pgTable('team_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }),
  avatar: varchar('avatar', { length: 500 }),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
