// ─────────────────────────────────────────────────────────────────────────────
// Shared API types (mirror the Express/Prisma backend responses)
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export type CustomerType =
  | 'RETAILER'
  | 'WHOLESALER'
  | 'HOTEL'
  | 'RESTAURANT'
  | 'INSTITUTION'
  | 'INDIVIDUAL'
  | 'OTHER';

export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
export type SaleStatus = 'QUOTE' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin?: string | null;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  isOwnBrand: boolean;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  productCode?: string | null;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  brand?: { id?: string; name: string; slug?: string } | null;
  category?: { id?: string; name: string; slug: string } | null;
  material?: string | null;
  capacity?: string | null;
  dimensions?: string | null;
  colourFinish?: string | null;
  setContents?: string | null;
  piecesPerSet?: number | null;
  caseQty?: number | null;
  packagingInformation?: string | null;
  features: string[];
  collection?: string | null;
  subcategory?: string | null;
  mrp?: string | number | null;
  catalogueMrp?: string | number | null;
  wholesalePrice?: string | number | null;
  websitePrice?: string | number | null;
  priceUnit?: string | null;
  reviewStatus?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images: ProductImage[];
  createdAt?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  customerType: CustomerType;
  message?: string | null;
  quantity?: string | null;
  source?: string | null;
  status: EnquiryStatus;
  product?: { id?: string; name: string } | null;
  createdAt: string;
}

export interface Catalogue {
  id: string;
  title: string;
  fileUrl: string;
  version?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  businessName?: string | null;
  customerType: CustomerType;
  rating: number;
  reviewText: string;
  source?: string | null;
  isPublished: boolean;
}

export interface ShopMedia {
  id: string;
  title?: string | null;
  description?: string | null;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SaleItem {
  id?: string;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  quantity: number;
  unitPrice: number | string;
  total?: number | string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status: SaleStatus;
  totalAmount?: string | number | null;
  items: SaleItem[];
  createdAt: string;
}

export interface SiteSettings {
  id?: string;
  businessName: string;
  tagline?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  warehouseAddress?: string | null;
  businessHours?: string | null;
  googleMapsUrl?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
}

export interface AuditLog {
  id: string;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  products: { total: number; active: number; featured: number; newArrivals: number };
  categories: number;
  brands: number;
  enquiries: { total: number; new: number };
  catalogues: number;
  sales: number;
  recentEnquiries: Array<{
    id: string;
    name: string;
    companyName?: string | null;
    customerType: CustomerType;
    status: EnquiryStatus;
    createdAt: string;
    product?: { name: string } | null;
  }>;
  recentSales: Array<{
    id: string;
    saleNumber: string;
    customerName: string;
    companyName?: string | null;
    status: SaleStatus;
    totalAmount?: string | number | null;
    createdAt: string;
  }>;
}
