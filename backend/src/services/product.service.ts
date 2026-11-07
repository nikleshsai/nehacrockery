// =============================================================================
// Product service - all business logic for product CRUD, search, filtering
// Updated: includes catalogue fields (collection, colourFinish, catalogueMrp, etc.)
// =============================================================================
import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../utils/AppError";
import { generateUniqueSlug } from "../utils/slugify";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from "../validators/product.validator";

// ── Shared image select ───────────────────────────────────────────────────────
const imageSelect = {
  id: true,
  imageUrl: true,
  altText: true,
  sortOrder: true,
};

// ── Shared product select (public) ────────────────────────────────────────────
const productPublicSelect = {
  id: true,
  name: true,
  slug: true,
  productCode: true,
  description: true,
  // Physical
  material: true,
  capacity: true,
  dimensions: true,
  colourFinish: true,
  setContents: true,
  piecesPerSet: true,
  caseQty: true,
  packagingInformation: true,
  features: true,
  // Classification
  collection: true,
  subcategory: true,
  // Pricing
  mrp: true,
  catalogueMrp: true,
  wholesalePrice: true,
  websitePrice: true,
  priceUnit: true,
  // Catalogue traceability
  cataloguePage: true,
  sourceFile: true,
  reviewStatus: true,
  nameVerified: true,
  // Flags
  isActive: true,
  isFeatured: true,
  isNewArrival: true,
  // SEO
  seoTitle: true,
  seoDescription: true,
  // Timestamps
  createdAt: true,
  updatedAt: true,
  // Relations
  brand: { select: { id: true, name: true, slug: true, logo: true, sortOrder: true } },
  category: { select: { id: true, name: true, slug: true, sortOrder: true } },
  images: { select: imageSelect, orderBy: { sortOrder: "asc" as const } },
};

// ── Build WHERE clause from public query params ───────────────────────────────
function buildProductWhere(
  query: ProductQueryInput
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (!query.active || query.active === "true") {
    where.isActive = true;
  } else if (query.active === "false") {
    where.isActive = false;
  }

  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { productCode: { contains: search, mode: "insensitive" } },
      { material: { contains: search, mode: "insensitive" } },
      { collection: { contains: search, mode: "insensitive" } },
    ];
  }

  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { id: query.category }],
    };
  }

  if (query.brand) {
    where.brand = {
      OR: [{ slug: query.brand }, { id: query.brand }],
    };
  }

  if (query.collection) {
    where.collection = { contains: query.collection, mode: "insensitive" };
  }

  if (query.featured === "true") where.isFeatured = true;
  if (query.newArrival === "true") where.isNewArrival = true;

  return where;
}

// ── Build ORDER BY ────────────────────────────────────────────────────────────
function buildProductOrderBy(
  sortBy: string,
  sortOrder: string
): Prisma.ProductOrderByWithRelationInput {
  const dir = sortOrder === "asc" ? "asc" : ("desc" as const);
  switch (sortBy) {
    case "name":
      return { name: dir };
    case "mrp":
      return { mrp: dir };
    case "catalogueMrp":
      return { catalogueMrp: dir };
    case "productCode":
      return { productCode: dir };
    case "collection":
      return { collection: dir };
    case "category":
      return { category: { sortOrder: dir } };
    default:
      return { createdAt: dir };
  }
}

// ── PUBLIC: List products ─────────────────────────────────────────────────────
export async function listProducts(query: ProductQueryInput) {
  const { page, pageSize, skip, take } = parsePagination(
    query.page,
    query.pageSize
  );
  const where = buildProductWhere(query);
  const orderBy = buildProductOrderBy(
    query.sortBy ?? "createdAt",
    query.sortOrder ?? "desc"
  );

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: productPublicSelect,
    }),
  ]);

  return { products, pagination: buildPaginationMeta(total, page, pageSize) };
}

// ── PUBLIC: Get product by slug ───────────────────────────────────────────────
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: productPublicSelect,
  });
  if (!product) throw AppError.notFound("Product");
  return product;
}

// ── ADMIN: Get product by ID (includes isActive=false) ───────────────────────
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { ...productPublicSelect, isActive: true },
  });
  if (!product) throw AppError.notFound("Product");
  return product;
}

// ── ADMIN: Create product ─────────────────────────────────────────────────────
export async function createProduct(data: CreateProductInput) {
  const slug = await generateUniqueSlug(data.name, "product");
  const cleanImageUrl = data.imageUrl?.trim() || null;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      productCode: data.productCode ?? null,
      description: data.description ?? null,
      brandId: data.brandId ?? null,
      categoryId: data.categoryId ?? null,
      material: data.material ?? null,
      capacity: data.capacity ?? null,
      dimensions: data.dimensions ?? null,
      colourFinish: data.colourFinish ?? null,
      setContents: data.setContents ?? null,
      piecesPerSet: data.piecesPerSet ?? null,
      caseQty: data.caseQty ?? null,
      packagingInformation: data.packagingInformation ?? null,
      features: data.features ?? [],
      collection: data.collection ?? null,
      subcategory: data.subcategory ?? null,
      mrp: data.mrp ?? null,
      catalogueMrp: data.catalogueMrp ?? data.mrp ?? null,
      wholesalePrice: data.wholesalePrice ?? null,
      websitePrice: data.websitePrice ?? null,
      priceUnit: data.priceUnit ?? null,
      cataloguePage: data.cataloguePage ?? null,
      sourceFile: data.sourceFile ?? null,
      isFeatured: data.isFeatured ?? false,
      isNewArrival: data.isNewArrival ?? false,
      isActive: data.isActive ?? true,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ...(cleanImageUrl && {
        images: {
          create: [
            {
              imageUrl: cleanImageUrl,
              altText: data.name,
              sortOrder: 0,
            },
          ],
        },
      }),
    },
    select: productPublicSelect,
  });

  return product;
}

// ── ADMIN: Update product ─────────────────────────────────────────────────────
export async function updateProduct(id: string, data: UpdateProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!existing) throw AppError.notFound("Product");

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    slug = await generateUniqueSlug(data.name, "product", id);
  }

  if (data.imageUrl !== undefined) {
    const cleanImageUrl = data.imageUrl?.trim() || null;
    const primaryImage = await prisma.productImage.findFirst({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    if (cleanImageUrl) {
      if (primaryImage) {
        await prisma.productImage.update({
          where: { id: primaryImage.id },
          data: { imageUrl: cleanImageUrl, altText: data.name ?? existing.name },
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: id,
            imageUrl: cleanImageUrl,
            altText: data.name ?? existing.name,
            sortOrder: 0,
          },
        });
      }
    } else if (primaryImage && data.imageUrl === null) {
      await prisma.productImage.delete({ where: { id: primaryImage.id } });
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name, slug }),
      ...(data.productCode !== undefined && { productCode: data.productCode }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.brandId !== undefined && { brandId: data.brandId }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.material !== undefined && { material: data.material }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.dimensions !== undefined && { dimensions: data.dimensions }),
      ...(data.colourFinish !== undefined && { colourFinish: data.colourFinish }),
      ...(data.setContents !== undefined && { setContents: data.setContents }),
      ...(data.piecesPerSet !== undefined && { piecesPerSet: data.piecesPerSet }),
      ...(data.caseQty !== undefined && { caseQty: data.caseQty }),
      ...(data.packagingInformation !== undefined && {
        packagingInformation: data.packagingInformation,
      }),
      ...(data.features !== undefined && { features: data.features }),
      ...(data.collection !== undefined && { collection: data.collection }),
      ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
      ...(data.mrp !== undefined && { mrp: data.mrp, catalogueMrp: data.mrp }),
      ...(data.catalogueMrp !== undefined && { catalogueMrp: data.catalogueMrp }),
      ...(data.wholesalePrice !== undefined && { wholesalePrice: data.wholesalePrice }),
      ...(data.websitePrice !== undefined && { websitePrice: data.websitePrice }),
      ...(data.priceUnit !== undefined && { priceUnit: data.priceUnit }),
      ...(data.cataloguePage !== undefined && { cataloguePage: data.cataloguePage }),
      ...(data.sourceFile !== undefined && { sourceFile: data.sourceFile }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isNewArrival !== undefined && { isNewArrival: data.isNewArrival }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
    },
    select: productPublicSelect,
  });

  return product;
}

// ── ADMIN: Delete product ─────────────────────────────────────────────────────
export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw AppError.notFound("Product");
  await prisma.product.delete({ where: { id } });
}

// ── ADMIN: Add product image ──────────────────────────────────────────────────
export async function addProductImage(
  productId: string,
  imageUrl: string,
  altText?: string,
  sortOrder?: number
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw AppError.notFound("Product");

  return prisma.productImage.create({
    data: {
      productId,
      imageUrl,
      altText: altText ?? null,
      sortOrder: sortOrder ?? 0,
    },
    select: imageSelect,
  });
}

// ── ADMIN: Get a single product image (for storage deletion) ──────────────────
export async function getProductImageById(imageId: string) {
  return prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, imageUrl: true },
  });
}

// ── ADMIN: Delete product image ───────────────────────────────────────────────
export async function deleteProductImage(imageId: string) {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true },
  });
  if (!image) throw AppError.notFound("Image");
  await prisma.productImage.delete({ where: { id: imageId } });
}