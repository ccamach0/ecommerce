export type UserRole = "admin" | "customer" | "cashier";

export type SessionUser = {
  id: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type AuthResponse = {
  token: string;
  user: SessionUser;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  category: string;
  color: string;
  sizes: string[];
  stock: number;
  basePrice: number;
  salePrice: number | null;
  likes: number;
  rating: number;
  image: string;
  imageAltText?: string | null;
  images?: ProductImage[];
  description: string;
  status: string;
  featured: boolean;
  brand?: string | null;
  material?: string | null;
  gender?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: ProductVariant[];
};

export type ProductImage = {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  reservedStock: number;
  barcode?: string | null;
  weightGrams?: number | null;
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ProductMetaResponse = {
  categories: ProductCategory[];
};

export type ProductPayload = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number | null;
  color: string;
  status: "draft" | "active" | "archived";
  featured: boolean;
  brand?: string;
  material?: string;
  gender?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAltText?: string;
  imagesMeta: Array<{
    id?: string;
    altText?: string;
    isPrimary: boolean;
    sortOrder: number;
    uploadIndex?: number;
  }>;
  variants: Array<{
    id?: string;
    size: string;
    stock: number;
    sku?: string;
    barcode?: string;
    weightGrams?: number | null;
  }>;
  imageFiles?: File[];
};

export type UserRecord = {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  ordersCount: number;
};

export type UserPayload = {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  isActive: boolean;
};

export type BillingDraftSummary = {
  id: string;
  documentType: "boleta" | "factura";
  documentLabel: string;
  status: string;
  statusLabel: string;
  reference: string;
  total: number;
  createdAt: string;
};

export type Order = {
  orderId: string;
  total: number;
  status: string;
  items: number;
  createdAt: string;
  customerName?: string;
  billingDraft?: BillingDraftSummary | null;
};

export type PosOrderPayload = {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  documentType: "none" | "boleta" | "factura";
  customerDocumentType?: "DNI" | "RUC" | "CE" | "PASSPORT" | "OTHER";
  customerDocumentNumber?: string;
  customerLegalName?: string;
  customerAddress?: string;
  paymentMethod: "cash" | "card" | "transfer";
  amountReceived?: number;
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
};

export type BillingProfile = {
  id: string | null;
  countryCode: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  taxIdType: string;
  fiscalAddress: string;
  department: string;
  province: string;
  district: string;
  ubigeo: string;
  establishmentCode: string;
  currencyCode: string;
  igvRate: number;
  pricesIncludeTax: boolean;
  invoiceSeries: string;
  receiptSeries: string;
  creditNoteSeries: string;
  debitNoteSeries: string;
  sunatEnvironment: "beta" | "production";
  emissionSystem: "own_software" | "sunat" | "pse";
  solUser: string;
  certificateAlias: string;
  supportEmail: string;
  supportPhone: string;
  sendAutomatically: boolean;
  isActive: boolean;
};

export type BillingChecklistItem = {
  key: string;
  label: string;
  detail: string;
  ready: boolean;
};

export type BillingRecentDocument = {
  id: string;
  orderNumber: string;
  documentType: "boleta" | "factura" | "credit_note" | "debit_note";
  documentLabel: string;
  status: string;
  statusLabel: string;
  reference: string;
  total: number;
  customerName: string;
  createdAt: string;
};

export type BillingSettingsResponse = {
  profile: BillingProfile;
  readiness: {
    ready: boolean;
    readyCount: number;
    total: number;
    checks: BillingChecklistItem[];
  };
  recentDocuments: BillingRecentDocument[];
};

export type BillingSettingsPayload = Omit<BillingProfile, "id">;

export type Review = {
  id: string;
  user: string;
  comment: string;
  score: number;
};

export type DashboardStats = {
  revenueMonth: number;
  activeOrders: number;
  lowStockProducts: number;
  conversionRate: number;
  topProducts: Array<{ name: string; sold: number }>;
};

export type StoreHomeResponse = {
  hero: {
    title: string;
    subtitle: string;
  };
  stats: DashboardStats;
  products: Product[];
  orders: Order[];
  reviews: Review[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = "No fue posible completar la solicitud.";

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchStoreHome() {
  return request<StoreHomeResponse>("/store/home");
}

export async function fetchProducts() {
  return request<Product[]>("/products");
}

export async function fetchAdminProducts(token: string) {
  return request<Product[]>("/products/admin", { token });
}

export async function fetchProductMeta(token: string) {
  return request<ProductMetaResponse>("/products/meta", { token });
}

export async function fetchOrders(token: string) {
  return request<Order[]>("/orders", { token });
}

export async function fetchDashboard(token: string) {
  return request<DashboardStats>("/reports/dashboard", { token });
}

export async function fetchBillingSettings(token: string) {
  return request<BillingSettingsResponse>("/billing/settings", { token });
}

export async function updateBillingSettings(token: string, payload: BillingSettingsPayload) {
  return request<BillingSettingsResponse>("/billing/settings", {
    method: "PUT",
    token,
    body: JSON.stringify(payload)
  });
}

export async function login(credentials: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export async function fetchCurrentSession(token: string) {
  return request<{ user: SessionUser }>("/auth/me", { token });
}

function buildProductFormData(payload: ProductPayload) {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("slug", payload.slug);
  formData.append("description", payload.description);
  formData.append("categoryId", payload.categoryId);
  formData.append("basePrice", String(payload.basePrice));
  formData.append("salePrice", payload.salePrice ? String(payload.salePrice) : "");
  formData.append("color", payload.color);
  formData.append("status", payload.status);
  formData.append("featured", String(payload.featured));
  formData.append("brand", payload.brand ?? "");
  formData.append("material", payload.material ?? "");
  formData.append("gender", payload.gender ?? "");
  formData.append("seoTitle", payload.seoTitle ?? "");
  formData.append("seoDescription", payload.seoDescription ?? "");
  formData.append("imageAltText", payload.imageAltText ?? "");
  formData.append("imagesMeta", JSON.stringify(payload.imagesMeta));
  formData.append("variants", JSON.stringify(payload.variants));

  for (const imageFile of payload.imageFiles ?? []) {
    formData.append("images", imageFile);
  }

  return formData;
}

export async function createProduct(token: string, payload: ProductPayload) {
  return request<Product>("/products", {
    method: "POST",
    token,
    body: buildProductFormData(payload)
  });
}

export async function updateProduct(token: string, productId: string, payload: ProductPayload) {
  return request<Product>(`/products/${productId}`, {
    method: "PUT",
    token,
    body: buildProductFormData(payload)
  });
}

export async function deleteProduct(token: string, productId: string) {
  return request<{ message: string }>(`/products/${productId}`, {
    method: "DELETE",
    token
  });
}

export async function createPosOrder(token: string, payload: PosOrderPayload) {
  return request<{ message: string; order: Order }>("/orders/pos", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function fetchUsers(token: string) {
  return request<UserRecord[]>("/users", { token });
}

export async function createUser(token: string, payload: UserPayload) {
  return request<UserRecord>("/users", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function updateUser(token: string, userId: string, payload: UserPayload) {
  return request<UserRecord>(`/users/${userId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload)
  });
}

export async function deleteUser(token: string, userId: string) {
  return request<UserRecord>(`/users/${userId}`, {
    method: "DELETE",
    token
  });
}
