// ─────────────────────────────────────────────────────────────────────────────
// NEHA CROCKERY HOUSE — PRISMA SEED SCRIPT
// Creates initial admin account, product categories, and Taroba brand.
// Run: npx prisma db seed
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient, UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

async function main() {
  console.log('🌱  Starting database seed...');

  // ── Admin User (Supabase Auth + local role record) ──────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@nehacrockery.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Change_Me_Now_123!';
  const adminName = process.env.ADMIN_NAME ?? 'Admin';

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed the admin user');
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find existing Supabase auth user (by email) or create one
  let authId: string | undefined;
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  authId = list.users.find((u) => u.email?.toLowerCase() === adminEmail)?.id;

  if (!authId) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });
    if (createErr || !created.user) throw createErr ?? new Error('Failed to create Supabase user');
    authId = created.user.id;
    console.log(`✅  Supabase Auth user created: ${adminEmail}`);
  } else {
    console.log(`ℹ️   Supabase Auth user already exists: ${adminEmail}`);
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { authId, isActive: true },
    create: {
      name: adminName,
      email: adminEmail,
      authId,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅  Admin role record ready: ${adminEmail}`);

  // ── Product Categories ──────────────────────────────────────────────────────
  const categories = [
    { name: 'Crockery & Dinnerware', sortOrder: 1 },
    { name: 'Cutlery', sortOrder: 2 },
    { name: 'Glassware & Bottles', sortOrder: 3 },
    { name: 'Melamineware', sortOrder: 4 },
    { name: 'Acrylicware', sortOrder: 5 },
    { name: 'Kitchenware', sortOrder: 6 },
    { name: 'Hotelware & Institutional Supply', sortOrder: 7 },
    { name: 'Wooden Handicrafts', sortOrder: 8 },
    { name: 'New Arrivals', sortOrder: 9 },
  ];

  for (const cat of categories) {
    const slug = makeSlug(cat.name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
      });
      console.log(`✅  Category created: ${cat.name}`);
    } else {
      console.log(`ℹ️   Category already exists: ${cat.name}`);
    }
  }

  // ── Taroba Brand (own registered trademark) ────────────────────────────────
  const tarobaSlug = 'taroba';
  const existingTaroba = await prisma.brand.findUnique({ where: { slug: tarobaSlug } });
  if (!existingTaroba) {
    await prisma.brand.create({
      data: {
        name: 'Taroba',
        slug: tarobaSlug,
        description:
          'Taroba is an officially registered in-house trademark owned by Neha Crockery House, ' +
          'filed in 2016. The brand covers crockery & glassware, ceramic products, flasks, and cutleries.',
        isOwnBrand: true,
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log('✅  Brand created: Taroba');
  } else {
    console.log('ℹ️   Brand already exists: Taroba');
  }

  // ── Site Settings (initial placeholder) ───────────────────────────────────
  const settingsCount = await prisma.siteSettings.count();
  if (settingsCount === 0) {
    await prisma.siteSettings.create({
      data: {
        businessName: 'Neha Crockery House',
        tagline: 'Premium Glassware & Crockery Wholesaler',
        // Fill real values via admin panel — do not hardcode sensitive info
      },
    });
    console.log('✅  Site settings initialised (placeholder)');
  } else {
    console.log('ℹ️   Site settings already exist');
  }

  console.log('🎉  Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
