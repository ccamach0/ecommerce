import {
  ArrowRight,
  BarChart3,
  Boxes,
  CircleAlert,
  Compass,
  CreditCard,
  Crown,
  Eye,
  Gauge,
  Heart,
  LayoutDashboard,
  LogOut,
  PieChart,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Ticket,
  TrendingUp,
  Truck,
  X,
  Users
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  type AuthResponse,
  type BillingProfile,
  type BillingSettingsPayload,
  type BillingSettingsResponse,
  type DashboardStats,
  type Order,
  type ProductCategory,
  type ProductImage,
  type ProductPayload,
  type Product,
  type Review,
  type SessionUser,
  type StoreHomeResponse,
  type UserPayload,
  type UserRecord,
  type UserRole,
  createProduct,
  createPosOrder,
  createUser,
  deleteProduct,
  deleteUser,
  fetchAdminProducts,
  fetchBillingSettings,
  fetchCurrentSession,
  fetchDashboard,
  fetchOrders,
  fetchProductMeta,
  fetchProducts,
  fetchStoreHome,
  fetchUsers,
  login,
  updateBillingSettings,
  updateProduct,
  updateUser
} from "./api";

const SESSION_STORAGE_KEY = "fashion-commerce-session";

const emptyStore: StoreHomeResponse = {
  hero: {
    title: "Moda premium para un recorrido mas claro, moderno y rentable.",
    subtitle: "Conectando catalogo, compras, caja y gestion para un retail mas moderno en Peru."
  },
  stats: {
    revenueMonth: 0,
    activeOrders: 0,
    lowStockProducts: 0,
    conversionRate: 0,
    topProducts: []
  },
  products: [],
  orders: [],
  reviews: []
};

const emptyDashboard: DashboardStats = {
  revenueMonth: 0,
  activeOrders: 0,
  lowStockProducts: 0,
  conversionRate: 0,
  topProducts: []
};

function createEmptyBillingProfile(): BillingProfile {
  return {
    id: null,
    countryCode: "PE",
    legalName: "",
    tradeName: "",
    taxId: "",
    taxIdType: "RUC",
    fiscalAddress: "",
    department: "",
    province: "",
    district: "",
    ubigeo: "",
    establishmentCode: "0000",
    currencyCode: "PEN",
    igvRate: 18,
    pricesIncludeTax: true,
    invoiceSeries: "F001",
    receiptSeries: "B001",
    creditNoteSeries: "FC01",
    debitNoteSeries: "FD01",
    sunatEnvironment: "beta",
    emissionSystem: "own_software",
    solUser: "",
    certificateAlias: "",
    supportEmail: "",
    supportPhone: "",
    sendAutomatically: false,
    isActive: true
  };
}

const emptyBillingSettings: BillingSettingsResponse = {
  profile: createEmptyBillingProfile(),
  readiness: {
    ready: false,
    readyCount: 0,
    total: 5,
    checks: []
  },
  recentDocuments: []
};

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

type CustomerSection = "overview" | "catalog" | "favorites" | "cart" | "orders";
type AdminSection = "overview" | "inventory" | "sales" | "billing" | "reports" | "users";
type CashierSection = "overview" | "pos" | "sales";

type CartLine = {
  productId: string;
  quantity: number;
};

type CashierTicketLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

type SurfaceProps = {
  className?: string;
  children: ReactNode;
};

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
};

type PortalMenuItem = {
  id: string;
  label: string;
  note: string;
  badge: string;
  icon: ReactNode;
};

type TrendPoint = {
  label: string;
  value: number;
  note?: string;
};

type DistributionItem = {
  label: string;
  value: number;
  tone: string;
  detail: string;
};

type ProductVariantForm = {
  id?: string;
  size: string;
  stock: string;
  sku: string;
  barcode: string;
  weightGrams: string;
};

type ProductImageForm = {
  id?: string;
  key: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  file: File | null;
};

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: string;
  salePrice: string;
  color: string;
  status: "draft" | "active" | "archived";
  featured: boolean;
  brand: string;
  material: string;
  gender: string;
  seoTitle: string;
  seoDescription: string;
  gallery: ProductImageForm[];
  variants: ProductVariantForm[];
};

type UserFormState = {
  id?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
};

function currency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
    notation: "compact"
  }).format(value);
}

function productPrice(product: Product) {
  return product.salePrice ?? product.basePrice;
}

function productGallery(product: Product) {
  if (product.images && product.images.length > 0) {
    return [...product.images].sort((left, right) => {
      if (Number(right.isPrimary) !== Number(left.isPrimary)) {
        return Number(right.isPrimary) - Number(left.isPrimary);
      }

      return left.sortOrder - right.sortOrder;
    });
  }

  return [
    {
      id: `${product.id}-primary`,
      url: product.image,
      altText: product.imageAltText ?? product.name,
      isPrimary: true,
      sortOrder: 0
    }
  ];
}

function createClientKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeProductGallery(gallery: ProductImageForm[]) {
  const visibleGallery = gallery.filter((image) => Boolean(image.url));

  if (visibleGallery.length === 0) {
    return [];
  }

  const hasPrimary = visibleGallery.some((image) => image.isPrimary);

  return visibleGallery.map((image, index) => ({
    ...image,
    isPrimary: hasPrimary ? image.isPrimary : index === 0
  }));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function colorPalette(color: string) {
  const normalized = color.toLowerCase();

  if (normalized.includes("negro")) {
    return {
      accent: "#18212f",
      soft: "rgba(24, 33, 47, 0.22)",
      glow: "rgba(24, 33, 47, 0.44)"
    };
  }

  if (normalized.includes("blanco")) {
    return {
      accent: "#6c7b8c",
      soft: "rgba(170, 186, 201, 0.28)",
      glow: "rgba(229, 237, 243, 0.72)"
    };
  }

  if (normalized.includes("azul")) {
    return {
      accent: "#1d4f86",
      soft: "rgba(29, 79, 134, 0.2)",
      glow: "rgba(29, 79, 134, 0.46)"
    };
  }

  if (normalized.includes("beige") || normalized.includes("crema")) {
    return {
      accent: "#b6845a",
      soft: "rgba(182, 132, 90, 0.22)",
      glow: "rgba(182, 132, 90, 0.42)"
    };
  }

  if (normalized.includes("verde")) {
    return {
      accent: "#215b57",
      soft: "rgba(33, 91, 87, 0.22)",
      glow: "rgba(33, 91, 87, 0.42)"
    };
  }

  if (normalized.includes("rojo")) {
    return {
      accent: "#9f2f3f",
      soft: "rgba(159, 47, 63, 0.22)",
      glow: "rgba(159, 47, 63, 0.42)"
    };
  }

  return {
    accent: "#c86f3b",
    soft: "rgba(200, 111, 59, 0.22)",
    glow: "rgba(200, 111, 59, 0.42)"
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getPortalPath(role: UserRole) {
  if (role === "admin") {
    return "/portal/admin";
  }

  if (role === "cashier") {
    return "/portal/cajero";
  }

  return "/portal/cliente";
}

function roleLabel(role: UserRole) {
  if (role === "admin") {
    return "Administrador";
  }

  if (role === "cashier") {
    return "Cajero";
  }

  return "Cliente";
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("entregado") || normalized.includes("pagado")) {
    return "success";
  }

  if (normalized.includes("camino") || normalized.includes("prepar") || normalized.includes("oferta")) {
    return "warning";
  }

  if (normalized.includes("cancel") || normalized.includes("fall")) {
    return "danger";
  }

  return "neutral";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function emptyVariantForm(): ProductVariantForm {
  return {
    size: "",
    stock: "0",
    sku: "",
    barcode: "",
    weightGrams: ""
  };
}

function createEmptyProductForm(categories: ProductCategory[] = []): ProductFormState {
  return {
    name: "",
    slug: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    basePrice: "",
    salePrice: "",
    color: "",
    status: "draft",
    featured: false,
    brand: "",
    material: "",
    gender: "",
    seoTitle: "",
    seoDescription: "",
    gallery: [],
    variants: [emptyVariantForm()]
  };
}

function createEmptyUserForm(): UserFormState {
  return {
    role: "customer",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    isActive: true
  };
}

function mapProductToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    basePrice: String(product.basePrice),
    salePrice: product.salePrice ? String(product.salePrice) : "",
    color: product.color,
    status: product.status as ProductFormState["status"],
    featured: product.featured,
    brand: product.brand ?? "",
    material: product.material ?? "",
    gender: product.gender ?? "",
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    gallery: productGallery(product).map((image, index) => ({
      id: image.id,
      key: image.id ?? `${product.id}-gallery-${index}`,
      url: image.url,
      altText: image.altText ?? "",
      isPrimary: image.isPrimary,
      file: null
    })),
    variants:
      product.variants?.map((variant) => ({
        id: variant.id,
        size: variant.size,
        stock: String(variant.stock),
        sku: variant.sku ?? "",
        barcode: variant.barcode ?? "",
        weightGrams: variant.weightGrams ? String(variant.weightGrams) : ""
      })) ?? [emptyVariantForm()]
  };
}

function mapUserToForm(user: UserRecord): UserFormState {
  return {
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    password: "",
    isActive: user.isActive
  };
}

function buildProductPayload(form: ProductFormState): ProductPayload {
  const normalizedGallery = normalizeProductGallery(form.gallery);
  const imageFiles: File[] = [];

  return {
    name: form.name,
    slug: form.slug,
    description: form.description,
    categoryId: form.categoryId,
    basePrice: Number(form.basePrice),
    salePrice: form.salePrice ? Number(form.salePrice) : null,
    color: form.color,
    status: form.status,
    featured: form.featured,
    brand: form.brand,
    material: form.material,
    gender: form.gender,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    imageAltText: normalizedGallery[0]?.altText || undefined,
    imagesMeta: normalizedGallery.map((image, index) => {
      const uploadIndex = image.file ? imageFiles.push(image.file) - 1 : undefined;

      return {
        id: image.id,
        altText: image.altText || undefined,
        isPrimary: image.isPrimary,
        sortOrder: index,
        uploadIndex
      };
    }),
    imageFiles,
    variants: form.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      stock: Number(variant.stock),
      sku: variant.sku || undefined,
      barcode: variant.barcode || undefined,
      weightGrams: variant.weightGrams ? Number(variant.weightGrams) : null
    }))
  };
}

function buildUserPayload(form: UserFormState): UserPayload {
  return {
    role: form.role,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    password: form.password || undefined,
    isActive: form.isActive
  };
}

function Surface({ className = "", children }: SurfaceProps) {
  return <article className={`surface ${className}`.trim()}>{children}</article>;
}

function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Surface className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Surface>
  );
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-block">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge ${statusTone(value)}`}>{value}</span>;
}

function PortalMenu<T extends string>({
  items,
  active,
  onSelect
}: {
  items: PortalMenuItem[];
  active: T;
  onSelect: (next: T) => void;
}) {
  return (
    <nav className="portal-menu">
      {items.map((item) => (
        <button
          key={item.id}
          className={active === item.id ? "portal-menu-item active" : "portal-menu-item"}
          onClick={() => onSelect(item.id as T)}
          type="button"
        >
          <span className="portal-menu-icon">{item.icon}</span>
          <span className="portal-menu-copy">
            <strong>{item.label}</strong>
            <small>{item.note}</small>
          </span>
          <span className="portal-menu-badge">{item.badge}</span>
        </button>
      ))}
    </nav>
  );
}

function FullScreenLoader({ message }: { message: string }) {
  return (
    <div className="screen-loader">
      <div className="screen-loader-card">
        <Sparkles size={22} />
        <strong>{message}</strong>
      </div>
    </div>
  );
}

function TrendChart({
  eyebrow,
  title,
  summary,
  caption,
  points,
  formatValue
}: {
  eyebrow: string;
  title: string;
  summary: string;
  caption: string;
  points: TrendPoint[];
  formatValue: (value: number) => string;
}) {
  const safePoints = points.length > 0 ? points : [{ label: "Sin datos", value: 0, note: "Sin actividad" }];
  const max = Math.max(...safePoints.map((point) => point.value), 1);
  const min = Math.min(...safePoints.map((point) => point.value), 0);
  const range = max - min || 1;

  const chartPoints = safePoints.map((point, index) => {
    const x = safePoints.length === 1 ? 50 : (index / (safePoints.length - 1)) * 100;
    const y = 76 - ((point.value - min) / range) * 48;
    return { ...point, x, y };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1]?.x.toFixed(2) ?? "100"} 88 L ${
    chartPoints[0]?.x.toFixed(2) ?? "0"
  } 88 Z`;

  return (
    <div className="trend-panel">
      <div className="trend-panel-header">
        <div className="section-copy trend-panel-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="trend-panel-summary">
          <strong>{summary}</strong>
          <span>{caption}</span>
        </div>
      </div>

      <div className="trend-stage" aria-hidden="true">
        <svg className="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path className="trend-grid-line" d="M 0 24 L 100 24" />
          <path className="trend-grid-line" d="M 0 50 L 100 50" />
          <path className="trend-grid-line" d="M 0 76 L 100 76" />
          <path className="trend-area" d={areaPath} />
          <path className="trend-line" d={linePath} />
          {chartPoints.map((point) => (
            <circle className="trend-dot" cx={point.x} cy={point.y} key={`${point.label}-${point.value}`} r="2.6" />
          ))}
        </svg>
      </div>

      <div className="trend-panel-labels">
        {chartPoints.map((point) => (
          <div className="trend-panel-label" key={`${point.label}-${point.value}`}>
            <strong>{formatValue(point.value)}</strong>
            <span>{point.label}</span>
            <small>{point.note ?? "Dato activo"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionChart({
  eyebrow,
  title,
  centerValue,
  centerLabel,
  items
}: {
  eyebrow: string;
  title: string;
  centerValue: string;
  centerLabel: string;
  items: DistributionItem[];
}) {
  const visibleItems = items.filter((item) => item.value > 0);
  const fallbackItems =
    visibleItems.length > 0
      ? visibleItems
      : [
          {
            label: "Sin actividad",
            value: 1,
            tone: "rgba(24, 33, 47, 0.12)",
            detail: "Esperando datos"
          }
        ];
  const total = visibleItems.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;

  const gradient = fallbackItems
    .map((item) => {
      const slice = total === 0 ? 100 / fallbackItems.length : (item.value / total) * 100;
      const start = offset;
      offset += slice;
      return `${item.tone} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <div className="distribution-card">
      <div className="section-copy distribution-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      <div className="distribution-stage">
        <div className="distribution-ring" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="distribution-ring-center">
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>

        <div className="distribution-legend">
          {fallbackItems.map((item) => (
            <div className="distribution-legend-item" key={item.label}>
              <span className="distribution-tone" style={{ backgroundColor: item.tone }} />
              <div className="distribution-legend-copy">
                <strong>{item.label}</strong>
                <span>
                  {item.detail}
                  {total > 0 ? ` | ${percentage(item.value, total)}%` : ""}
                </span>
              </div>
              <strong className="distribution-legend-value">{visibleItems.length > 0 ? item.value : 0}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductExperienceModal({
  product,
  isLiked,
  relatedProducts,
  onClose,
  onToggleLike,
  onAddToCart,
  onSelectProduct
}: {
  product: Product;
  isLiked: boolean;
  relatedProducts: Product[];
  onClose: () => void;
  onToggleLike: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
}) {
  const gallery = productGallery(product);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "Unica");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const palette = colorPalette(product.color);
  const savings = product.salePrice ? product.basePrice - product.salePrice : 0;
  const desirabilityScore = clamp(
    Math.round(product.rating * 18 + (product.featured ? 7 : 0) + Math.min(product.likes / 12, 10)),
    52,
    98
  );
  const stockSignal =
    product.stock <= 5 ? "Ultimas unidades" : product.stock <= 12 ? "Alta rotacion" : "Despacho inmediato";

  useEffect(() => {
    setSelectedSize(product.sizes[0] ?? "Unica");
    setActiveImageIndex(0);
  }, [product.id, product.sizes]);

  function cycleGallery(delta: number) {
    setActiveImageIndex((current) => {
      if (gallery.length === 0) {
        return 0;
      }

      return (current + delta + gallery.length) % gallery.length;
    });
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div aria-labelledby={`product-experience-${product.id}`} aria-modal="true" className="product-modal-shell" role="dialog">
      <div className="product-modal-backdrop" onClick={onClose} />

      <div className="product-modal" onClick={(event) => event.stopPropagation()}>
        <button aria-label="Cerrar vista de producto" className="product-modal-close" onClick={onClose} type="button">
          <X size={18} />
        </button>

        <div
          className="product-modal-media"
          style={{
            background: `linear-gradient(180deg, ${palette.soft}, rgba(255, 255, 255, 0.08))`
          }}
        >
          <div
            className="product-modal-glow"
            style={{
              background: `radial-gradient(circle at top, ${palette.glow}, transparent 68%)`
            }}
          />

          <div className="product-modal-badges">
            <span className="status-badge neutral">Vista inmersiva</span>
            {product.salePrice ? <span className="status-badge warning">Ahorra {currency(savings)}</span> : null}
            {product.featured ? <span className="status-badge success">Curaduria premium</span> : null}
          </div>

          <div className="product-modal-carousel">
            <div className="product-modal-carousel-stage">
              <img
                src={gallery[activeImageIndex]?.url ?? product.image}
                alt={gallery[activeImageIndex]?.altText ?? product.imageAltText ?? product.name}
              />

              {gallery.length > 1 ? (
                <div className="product-carousel-controls">
                  <button className="carousel-arrow previous" onClick={() => cycleGallery(-1)} type="button">
                    <ArrowRight size={16} />
                  </button>
                  <button className="carousel-arrow" onClick={() => cycleGallery(1)} type="button">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : null}
            </div>

            {gallery.length > 1 ? (
              <div className="product-carousel-thumbs">
                {gallery.map((image, index) => (
                  <button
                    className={index === activeImageIndex ? "product-carousel-thumb active" : "product-carousel-thumb"}
                    key={image.id ?? `${product.id}-thumb-${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    type="button"
                  >
                    <img src={image.url} alt={image.altText ?? `${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="product-modal-sidefacts">
            <div className="product-modal-fact">
              <span>Compatibilidad</span>
              <strong>{desirabilityScore}%</strong>
              <small>match visual y comercial</small>
            </div>
            <div className="product-modal-fact">
              <span>Entrega</span>
              <strong>{stockSignal}</strong>
              <small>{product.stock} unidades disponibles</small>
            </div>
            <div className="product-modal-fact">
              <span>Popularidad</span>
              <strong>{product.likes + (isLiked ? 1 : 0)} likes</strong>
              <small>rating {product.rating.toFixed(1)} / 5</small>
            </div>
          </div>
        </div>

        <div className="product-modal-content">
          <div className="product-modal-header">
            <span className="eyebrow">Producto destacado</span>
            <h2 id={`product-experience-${product.id}`}>{product.name}</h2>
            <p>{product.description}</p>
          </div>

          <div className="product-modal-price-row">
            <div className="product-modal-price">
              <strong>{currency(productPrice(product))}</strong>
              {product.salePrice ? <span className="product-modal-previous">{currency(product.basePrice)}</span> : null}
            </div>
            <div className="rating-line">
              <span>
                <Star fill="currentColor" size={14} />
                {product.rating.toFixed(1)}
              </span>
              <span>{product.category}</span>
            </div>
          </div>

          <div className="product-modal-kpis">
            <div className="product-modal-kpi">
              <span>Color</span>
              <strong>{product.color}</strong>
            </div>
            <div className="product-modal-kpi">
              <span>Stock</span>
              <strong>{product.stock}</strong>
            </div>
            <div className="product-modal-kpi">
              <span>Oferta</span>
              <strong>{product.salePrice ? "Activa" : "Regular"}</strong>
            </div>
          </div>

          <div className="product-modal-section">
            <div className="product-modal-section-head">
              <strong>Selecciona talla</strong>
              <span>{selectedSize}</span>
            </div>
            <div className="size-chip-row">
              {product.sizes.map((size) => (
                <button
                  className={selectedSize === size ? "size-chip active" : "size-chip"}
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={
                    selectedSize === size
                      ? {
                          background: `linear-gradient(135deg, ${palette.accent}, var(--teal))`
                        }
                      : undefined
                  }
                  type="button"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="product-modal-spec-grid">
            <div className="product-modal-spec">
              <span>Material</span>
              <strong>{product.material ?? "Textura premium seleccionada"}</strong>
            </div>
            <div className="product-modal-spec">
              <span>Uso ideal</span>
              <strong>{product.gender ?? "Estilo versatil y urbano"}</strong>
            </div>
            <div className="product-modal-spec">
              <span>Proteccion</span>
              <strong>Compra segura y validada</strong>
            </div>
            <div className="product-modal-spec">
              <span>Despacho</span>
              <strong>Envio nacional con seguimiento</strong>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="product-modal-section">
              <div className="product-modal-section-head">
                <strong>Combina con estas referencias</strong>
                <span>Curaduria automatica</span>
              </div>
              <div className="product-modal-related-list">
                {relatedProducts.map((related) => (
                  <button className="product-related-card" key={related.id} onClick={() => onSelectProduct(related.id)} type="button">
                    <img src={related.image} alt={related.imageAltText ?? related.name} />
                    <div>
                      <strong>{related.name}</strong>
                      <span>
                        {related.category} | {currency(productPrice(related))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="product-modal-note">
            <ShieldCheck size={16} />
            <span>Tu seleccion queda lista para carrito, favoritos y seguimiento sin perder el contexto.</span>
          </div>

          <div className="product-modal-actions">
            <button className="button primary" onClick={() => onAddToCart(product.id)} type="button">
              <ShoppingBag size={16} />
              Anadir talla {selectedSize}
            </button>
            <button className="button secondary" onClick={() => onToggleLike(product.id)} type="button">
              <Heart fill={isLiked ? "currentColor" : "none"} size={16} />
              {isLiked ? "Guardado en favoritos" : "Guardar producto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({
  user,
  booting,
  allowedRole,
  children
}: {
  user: SessionUser | null;
  booting: boolean;
  allowedRole: UserRole;
  children: ReactNode;
}) {
  if (booting) {
    return <FullScreenLoader message="Recuperando tu sesion..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={getPortalPath(user.role)} replace />;
  }

  return <>{children}</>;
}

function LandingPage({
  store,
  loading,
  error,
  booting,
  user,
  onLogout
}: {
  store: StoreHomeResponse;
  loading: boolean;
  error: string | null;
  booting: boolean;
  user: SessionUser | null;
  onLogout: () => void;
}) {
  const featuredProducts = store.products.slice(0, 3);
  const primaryAction = user ? getPortalPath(user.role) : "/login";
  const accessLabel = user ? "Ir a mi portal" : "Entrar al sistema";
  const categoryHighlights = useMemo(() => {
    const groups = store.products.reduce<
      Record<
        string,
        {
          count: number;
          totalPrice: number;
          lead: Product;
        }
      >
    >((accumulator, product) => {
      const current = accumulator[product.category];

      if (!current) {
        accumulator[product.category] = {
          count: 1,
          totalPrice: productPrice(product),
          lead: product
        };

        return accumulator;
      }

      current.count += 1;
      current.totalPrice += productPrice(product);

      if (product.featured) {
        current.lead = product;
      }

      return accumulator;
    }, {});

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        count: data.count,
        averagePrice: Math.round(data.totalPrice / data.count),
        lead: data.lead
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 3);
  }, [store.products]);

  const topSignals = useMemo(() => {
    return store.stats.topProducts.slice(0, 3).map((entry) => {
      const product = store.products.find((item) => item.name === entry.name);
      return {
        ...entry,
        category: product?.category ?? "Catalogo",
        image: product?.image ?? store.products[0]?.image ?? ""
      };
    });
  }, [store.products, store.stats.topProducts]);
  const maxTopSignalSold = Math.max(...topSignals.map((signal) => signal.sold), 1);

  return (
    <div className="marketing-shell">
      <header className="marketing-hero">
        <nav className="marketing-nav">
          <div className="brand-block">
            <span className="brand-mark">FC</span>
            <div>
              <strong>Fashion Commerce</strong>
              <small>Commerce suite para cliente y administrador</small>
            </div>
          </div>

          <div className="marketing-nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Inicio
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Login
            </NavLink>
            <NavLink to={primaryAction} className="button secondary">
              {accessLabel}
            </NavLink>
            {user ? (
              <button className="button ghost" onClick={onLogout} type="button">
                <LogOut size={16} />
                Salir
              </button>
            ) : null}
          </div>
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Operacion redisenada</span>
            <h1>{store.hero.title}</h1>
            <p>{store.hero.subtitle}</p>

            <div className="hero-actions">
              <NavLink to={primaryAction} className="button primary">
                {accessLabel}
                <ArrowRight size={16} />
              </NavLink>
              <NavLink to="/login" className="button ghost">
                Ver credenciales demo
              </NavLink>
            </div>

            <div className="metric-grid compact">
              <MetricCard
                label="Ingresos del mes"
                value={currency(store.stats.revenueMonth)}
                detail="Lectura directa del backend"
              />
              <MetricCard
                label="Ordenes activas"
                value={String(store.stats.activeOrders)}
                detail="Operacion en seguimiento"
              />
              <MetricCard
                label="Conversion"
                value={`${store.stats.conversionRate}%`}
                detail="Indicador comercial"
              />
            </div>
          </div>

          <Surface className="hero-spotlight">
            <div className="hero-spotlight-copy">
              <span className="eyebrow">Dos experiencias, una sola plataforma</span>
              <h3>Cliente final, administrador y caja presencial operan sobre recorridos claros y seguros.</h3>
            </div>

            <div className="role-preview-grid">
              <div className="role-preview customer">
                <div className="role-preview-head">
                  <ShoppingBag size={18} />
                  <strong>Portal cliente</strong>
                </div>
                <p>Catalogo, favoritos, carrito, checkout visual y compras recientes.</p>
              </div>

              <div className="role-preview admin">
                <div className="role-preview-head">
                  <LayoutDashboard size={18} />
                  <strong>Portal administrador</strong>
                </div>
                <p>Dashboard operativo, inventario, ventas y reportes protegidos por rol.</p>
              </div>

              <div className="role-preview cashier">
                <div className="role-preview-head">
                  <CreditCard size={18} />
                  <strong>Portal cajero</strong>
                </div>
                <p>Venta presencial, ticket rapido, cobro manual y cierre inmediato de mostrador.</p>
              </div>
            </div>

            <div className="hero-status">
              <span className={loading ? "status-badge warning" : "status-badge success"}>
                {loading ? "Sincronizando datos..." : "Backend conectado"}
              </span>
              {error ? <span className="status-badge danger">{error}</span> : null}
              {booting ? <span className="status-badge neutral">Validando sesion</span> : null}
            </div>
          </Surface>
        </section>
      </header>

      <main className="marketing-content">
        <section className="split-section">
          <Surface className="access-card">
            <div className="section-copy">
              <span className="eyebrow">Flujo cliente</span>
              <h2>Compra intuitiva con decisiones mas rapidas y menos friccion.</h2>
            </div>
            <ul className="feature-list">
              <li>Menu lateral para ordenar catalogo, favoritos, carrito e historial.</li>
              <li>Filtros, ordenamiento y detalle ampliado sin perder contexto.</li>
              <li>Resumen de compra visible para acelerar el checkout.</li>
            </ul>
          </Surface>

          <Surface className="access-card">
            <div className="section-copy">
              <span className="eyebrow">Flujo admin</span>
              <h2>Control profesional del negocio con una interfaz mas ejecutiva.</h2>
            </div>
            <ul className="feature-list">
              <li>Dashboard con metricas reales del backend.</li>
              <li>Separacion estricta de permisos por token y rol.</li>
              <li>Inventario, ventas y reportes organizados por menu interactivo.</li>
            </ul>
          </Surface>
        </section>

        <section className="card-grid two">
          <Surface className="editorial-card">
            <div className="section-copy">
              <span className="eyebrow">Curaduria activa</span>
              <h2>Lineas del catalogo pensadas para orientar la compra desde el primer vistazo.</h2>
            </div>
            <div className="curation-grid">
              {categoryHighlights.map((item) => (
                <NavLink className="curation-card" key={item.name} to={primaryAction}>
                  <img src={item.lead.image} alt={item.lead.name} />
                  <div className="curation-card-body">
                    <div className="curation-card-head">
                      <strong>{item.name}</strong>
                      <span>{item.count} referencias</span>
                    </div>
                    <p>{item.lead.description}</p>
                    <div className="curation-card-foot">
                      <span>Desde {currency(item.averagePrice)}</span>
                      <span>Ver recorrido</span>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </Surface>

          <Surface className="editorial-card">
            <div className="section-copy">
              <span className="eyebrow">Pulso comercial</span>
              <h2>Senales rapidas para entender que esta moviendo la tienda hoy.</h2>
            </div>
            <div className="signal-strip">
              <div className="signal-chip">
                <span>Catalogo activo</span>
                <strong>{store.products.length} productos</strong>
              </div>
              <div className="signal-chip">
                <span>Backoffice separado</span>
                <strong>Cliente y admin</strong>
              </div>
              <div className="signal-chip">
                <span>Insight principal</span>
                <strong>{store.stats.topProducts[0]?.name ?? "Sin dato"}</strong>
              </div>
            </div>

            <div className="signal-list">
              {topSignals.map((signal) => (
                <div className="signal-row" key={signal.name}>
                  <div className="signal-row-copy">
                    {signal.image ? <img src={signal.image} alt={signal.name} /> : null}
                    <div>
                      <strong>{signal.name}</strong>
                      <span>{signal.category}</span>
                    </div>
                  </div>
                  <div className="signal-row-metric">
                    <strong>{signal.sold} uds</strong>
                    <div className="signal-bar">
                      <span style={{ width: `${(signal.sold / maxTopSignalSold) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </section>

        <section className="section-head">
          <div>
            <span className="eyebrow">Preview del catalogo</span>
            <h2>La vitrina publica ya refleja la experiencia premium del producto.</h2>
          </div>
        </section>

        <section className="card-grid three">
          {featuredProducts.map((product) => (
            <Surface className="product-showcase" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div className="product-showcase-body">
                <div className="product-meta">
                  <span>{product.category}</span>
                  <StatusBadge value={product.salePrice ? "Oferta" : "Disponible"} />
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price-line">
                  <strong>{currency(productPrice(product))}</strong>
                  {product.salePrice ? <small>{currency(product.basePrice)}</small> : null}
                </div>
              </div>
            </Surface>
          ))}
        </section>

        <section className="section-head">
          <div>
            <span className="eyebrow">Feedback del cliente</span>
            <h2>Senales rapidas para validar experiencia y confianza.</h2>
          </div>
        </section>

        <section className="card-grid three">
          {store.reviews.slice(0, 3).map((review: Review) => (
            <Surface key={review.id}>
              <div className="review-head">
                <strong>{review.user}</strong>
                <span>{Array.from({ length: review.score }, () => "\u2605").join("")}</span>
              </div>
              <p>{review.comment}</p>
            </Surface>
          ))}
        </section>
      </main>
    </div>
  );
}

function LoginPage({
  user,
  booting,
  onLogin
}: {
  user: SessionUser | null;
  booting: boolean;
  onLogin: (email: string, password: string) => Promise<AuthResponse>;
}) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("andrea@example.com");
  const [password, setPassword] = useState("Demo123*");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoCredentials = {
    customer: {
      title: "Cliente demo",
      email: "andrea@example.com",
      password: "Demo123*"
    },
    admin: {
      title: "Administrador demo",
      email: "admin@fashioncommerce.com",
      password: "Demo123*"
    },
    cashier: {
      title: "Cajero demo",
      email: "cashier@fashioncommerce.com",
      password: "Demo123*"
    }
  };

  useEffect(() => {
    const credentials = demoCredentials[selectedRole];
    setEmail(credentials.email);
    setPassword(credentials.password);
  }, [selectedRole]);

  if (booting) {
    return <FullScreenLoader message="Comprobando si ya existe una sesion activa..." />;
  }

  if (user) {
    return <Navigate to={getPortalPath(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      const auth = await onLogin(email, password);
      navigate(getPortalPath(auth.user.role), { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible iniciar sesion.");
    } finally {
      setSubmitting(false);
    }
  }

  function applyDemo(role: UserRole) {
    setSelectedRole(role);
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-copy">
          <span className="eyebrow">Acceso profesional</span>
          <h1>Inicia sesion segun tu rol y entra al recorrido correcto.</h1>
          <p>
            El login ahora valida usuarios reales del backend y dirige automaticamente al portal de cliente o de
            administracion.
          </p>

          <div className="demo-grid">
            <button
              className={selectedRole === "customer" ? "role-card active" : "role-card"}
              onClick={() => applyDemo("customer")}
              type="button"
            >
              <ShoppingBag size={18} />
              <div>
                <strong>Cliente</strong>
                <small>Catalogo, favoritos y compras</small>
              </div>
            </button>

            <button
              className={selectedRole === "admin" ? "role-card active" : "role-card"}
              onClick={() => applyDemo("admin")}
              type="button"
            >
              <Crown size={18} />
              <div>
                <strong>Administrador</strong>
                <small>Dashboard, ventas e inventario</small>
              </div>
            </button>

            <button
              className={selectedRole === "cashier" ? "role-card active" : "role-card"}
              onClick={() => applyDemo("cashier")}
              type="button"
            >
              <CreditCard size={18} />
              <div>
                <strong>Cajero</strong>
                <small>Venta presencial y ticket rapido</small>
              </div>
            </button>
          </div>

            <div className="credential-stack">
              {Object.entries(demoCredentials).map(([role, credentials]) => (
                <Surface className="credential-card" key={role}>
                  <div className="credential-card-copy">
                    <div className="credential-card-head">
                      <strong>{credentials.title}</strong>
                      <span className={selectedRole === role ? "status-badge success" : "status-badge neutral"}>
                        {selectedRole === role ? "Activo" : "Demo"}
                      </span>
                    </div>
                    <p>{credentials.email}</p>
                    <small>
                      {role === "admin"
                        ? "Dashboard, inventario y decisiones operativas."
                        : role === "cashier"
                          ? "Caja presencial, cobro y registro de ventas."
                          : "Catalogo, favoritos y recorrido de compra."}
                    </small>
                  </div>
                  <button
                    className={selectedRole === role ? "button secondary active credential-action" : "button ghost credential-action"}
                    onClick={() => applyDemo(role as UserRole)}
                    type="button"
                  >
                    Usar acceso
                  </button>
                </Surface>
              ))}
            </div>
        </div>

        <Surface className="auth-form-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="section-copy">
              <span className="eyebrow">Credenciales demo</span>
              <h2>
                {selectedRole === "admin"
                  ? "Ingreso administrativo"
                  : selectedRole === "cashier"
                    ? "Ingreso de caja"
                    : "Ingreso cliente"}
              </h2>
            </div>

            <label>
              Correo
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>

            <label>
              Contrasena
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
            </label>

            {error ? <div className="status-badge danger full-width">{error}</div> : null}

            <button className="button primary full-width" disabled={submitting} type="submit">
              {submitting ? "Ingresando..." : "Entrar al portal"}
              <ArrowRight size={16} />
            </button>

            <p className="form-hint">
              Todas las credenciales demo usan la contrasena <strong>Demo123*</strong>.
            </p>
          </form>
        </Surface>
      </div>
    </div>
  );
}

function CustomerPortal({
  user,
  token,
  storeState,
  onLogout,
  onRefreshStore
}: {
  user: SessionUser;
  token: string;
  storeState: AsyncState<StoreHomeResponse>;
  onLogout: () => void;
  onRefreshStore: () => Promise<void>;
}) {
  const [activeSection, setActiveSection] = useState<CustomerSection>("overview");
  const [ordersState, setOrdersState] = useState<AsyncState<Order[]>>({
    data: [],
    loading: true,
    error: null
  });
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [priceCap, setPriceCap] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productExperienceId, setProductExperienceId] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    void loadOrders();
  }, [token]);

  useEffect(() => {
    if (storeState.data.products.length > 0) {
      setSelectedProductId((current) => current ?? storeState.data.products[0].id);
    }
  }, [storeState.data.products]);

  async function loadOrders() {
    try {
      setOrdersState((current) => ({ ...current, loading: true, error: null }));
      const orders = await fetchOrders(token);
      setOrdersState({
        data: orders,
        loading: false,
        error: null
      });
    } catch (loadError) {
      setOrdersState({
        data: [],
        loading: false,
        error: loadError instanceof Error ? loadError.message : "No fue posible cargar tus compras."
      });
    }
  }

  const products = storeState.data.products;
  const reviews = storeState.data.reviews;
  const maxProductPrice = useMemo(() => products.reduce((max, product) => Math.max(max, productPrice(product)), 0), [products]);
  const freeShippingThreshold = 350000;

  useEffect(() => {
    if (maxProductPrice === 0) {
      return;
    }

    setPriceCap((current) => current ?? maxProductPrice);
  }, [maxProductPrice]);

  const categories = useMemo(() => ["Todos", ...new Set(products.map((product) => product.category))], [products]);
  const categoryOverview = useMemo(() => {
    const counts = products.reduce<Record<string, number>>((summary, product) => {
      summary[product.category] = (summary[product.category] ?? 0) + 1;
      return summary;
    }, {});

    return [
      { name: "Todos", count: products.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count }))
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const loweredQuery = deferredQuery.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const text = `${product.name} ${product.category} ${product.color} ${product.description}`.toLowerCase();
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery = loweredQuery.length === 0 || text.includes(loweredQuery);
      const matchesFavorite = !favoritesOnly || liked[product.id];
      const matchesPrice = priceCap === null || productPrice(product) <= priceCap;
      return matchesCategory && matchesQuery && matchesFavorite && matchesPrice;
    });

    const sorted = [...filtered];

    sorted.sort((left, right) => {
      if (sortBy === "price-asc") return productPrice(left) - productPrice(right);
      if (sortBy === "price-desc") return productPrice(right) - productPrice(left);
      if (sortBy === "rating") return right.rating - left.rating;
      if (Number(right.featured) !== Number(left.featured)) return Number(right.featured) - Number(left.featured);
      return right.likes - left.likes;
    });

    return sorted;
  }, [category, deferredQuery, favoritesOnly, liked, priceCap, products, sortBy]);

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? filteredProducts[0] ?? products[0] ?? null;
  const productExperience = productExperienceId
    ? products.find((product) => product.id === productExperienceId) ?? null
    : null;

  useEffect(() => {
    if (productExperienceId && !products.some((product) => product.id === productExperienceId)) {
      setProductExperienceId(null);
    }
  }, [productExperienceId, products]);

  const favoriteProducts = useMemo(() => products.filter((product) => liked[product.id]), [liked, products]);
  const favoriteCount = favoriteProducts.length;
  const offerProducts = useMemo(() => products.filter((product) => product.salePrice), [products]);
  const featuredProduct = products.find((product) => product.featured) ?? products[0] ?? null;
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    const scoreProduct = (product: Product) => {
      let score = 0;

      if (product.category === selectedProduct.category) {
        score += 3;
      }

      if (product.color === selectedProduct.color) {
        score += 2;
      }

      if (product.salePrice) {
        score += 1;
      }

      return score;
    };

    return products
      .filter((product) => product.id !== selectedProduct.id)
      .sort((left, right) => {
        const difference = scoreProduct(right) - scoreProduct(left);
        if (difference !== 0) {
          return difference;
        }

        return right.rating - left.rating;
      })
      .slice(0, 3);
  }, [products, selectedProduct]);

  const cartLines = useMemo(() => {
    return cart
      .map((line) => {
        const product = products.find((item) => item.id === line.productId);

        if (!product) return null;

        return {
          ...line,
          product,
          total: productPrice(product) * line.quantity
        };
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line));
  }, [cart, products]);

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const subtotal = useMemo(() => cartLines.reduce((sum, line) => sum + line.total, 0), [cartLines]);
  const savings = useMemo(
    () =>
      cartLines.reduce((sum, line) => {
        const original = line.product.basePrice * line.quantity;
        return sum + (original - line.total);
      }, 0),
    [cartLines]
  );
  const shipping = cartCount > 0 ? (subtotal >= freeShippingThreshold ? 0 : 14000) : 0;
  const total = subtotal + shipping;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = cartCount === 0 ? 0 : Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const activeFilterCount =
    Number(category !== "Todos") +
    Number(deferredQuery.trim().length > 0) +
    Number(favoritesOnly) +
    Number(priceCap !== null && priceCap < maxProductPrice);
  const priceCapLabel =
    priceCap === null || priceCap >= maxProductPrice ? "Sin tope" : `Hasta ${currency(priceCap)}`;
  const checkoutMessage =
    cartCount === 0
      ? "Agrega productos para activar el resumen."
      : amountToFreeShipping === 0
        ? "Ya desbloqueaste envio gratis para este pedido."
        : `Te faltan ${currency(amountToFreeShipping)} para desbloquear envio gratis.`;

  const menuItems: PortalMenuItem[] = [
    {
      id: "overview",
      label: "Resumen",
      note: "Vista general de tu cuenta",
      badge: `${ordersState.data.length} compras`,
      icon: <Compass size={16} />
    },
    {
      id: "catalog",
      label: "Catalogo",
      note: "Explora y compara productos",
      badge: `${products.length} items`,
      icon: <Store size={16} />
    },
    {
      id: "favorites",
      label: "Favoritos",
      note: "Tu lista rapida",
      badge: `${favoriteCount}`,
      icon: <Heart size={16} />
    },
    {
      id: "cart",
      label: "Carrito",
      note: "Checkout y resumen",
      badge: `${cartCount}`,
      icon: <ShoppingBag size={16} />
    },
    {
      id: "orders",
      label: "Mis compras",
      note: "Historial y seguimiento",
      badge: `${ordersState.data.length}`,
      icon: <ReceiptText size={16} />
    }
  ];

  function changeSection(next: CustomerSection) {
    startTransition(() => setActiveSection(next));
  }

  function openProductExperience(productId: string) {
    setSelectedProductId(productId);
    setProductExperienceId(productId);
  }

  function closeProductExperience() {
    setProductExperienceId(null);
  }

  function toggleLike(productId: string) {
    setLiked((current) => ({
      ...current,
      [productId]: !current[productId]
    }));
  }

  function addToCart(productId: string) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);

      if (existing) {
        return current.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function clearCatalogFilters() {
    setQuery("");
    setCategory("Todos");
    setSortBy("featured");
    setFavoritesOnly(false);
    setPriceCap(maxProductPrice);
  }

  function renderContent() {
    if (activeSection === "overview") {
      return (
        <>
          <Surface className="workspace-hero customer-theme">
            <div>
              <span className="eyebrow">Portal cliente</span>
              <h1>Hola, {user.firstName}. Ahora tu compra esta organizada por prioridades.</h1>
              <p>
                Usa el menu lateral para saltar entre catalogo, favoritos, carrito y compras sin perder el hilo de tu
                decision.
              </p>
            </div>

            <div className="hero-actions">
              <button className="button primary" onClick={() => changeSection("catalog")} type="button">
                Explorar catalogo
              </button>
              <button className="button ghost" onClick={() => changeSection("orders")} type="button">
                Ver mis compras
              </button>
            </div>
          </Surface>

          <section className="metric-grid">
            <MetricCard label="Favoritos" value={String(favoriteCount)} detail="Productos guardados" />
            <MetricCard label="Carrito" value={String(cartCount)} detail="Items listos para checkout" />
            <MetricCard label="Compras" value={String(ordersState.data.length)} detail="Historial reciente" />
            <MetricCard label="Ofertas" value={String(offerProducts.length)} detail="Descuentos activos" />
          </section>

          <section className="card-grid two">
            <Surface className="spotlight-card">
              <div className="section-copy spotlight-copy">
                <span className="eyebrow">Seleccion destacada</span>
                <h2>{featuredProduct?.name ?? "Catalogo activo"}</h2>
              </div>
              {featuredProduct ? (
                <>
                  <img src={featuredProduct.image} alt={featuredProduct.name} />
                  <div className="spotlight-footer">
                    <div>
                      <strong>{currency(productPrice(featuredProduct))}</strong>
                      <p>{featuredProduct.description}</p>
                    </div>
                    <div className="hero-actions">
                      <button className="button secondary" onClick={() => openProductExperience(featuredProduct.id)} type="button">
                        <Eye size={16} />
                        Vista inmersiva
                      </button>
                      <button className="button primary" onClick={() => addToCart(featuredProduct.id)} type="button">
                        Agregar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Aun no hay producto destacado"
                  description="Cuando carguen datos, aqui veras una recomendacion principal."
                />
              )}
            </Surface>

            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Compras recientes</span>
                <h2>Seguimiento en un solo vistazo</h2>
              </div>

              {ordersState.loading ? (
                <EmptyState title="Cargando compras..." description="Estamos trayendo tu historial desde el backend." />
              ) : ordersState.data.length === 0 ? (
                <EmptyState title="Sin compras aun" description="Cuando hagas tu primera orden, aparecera aqui." />
              ) : (
                <div className="stack-list">
                  {ordersState.data.slice(0, 4).map((order) => (
                    <div className="timeline-row" key={order.orderId}>
                      <div>
                        <strong>#{order.orderId}</strong>
                        <p>
                          {order.items} productos | {order.createdAt}
                        </p>
                      </div>
                      <div className="timeline-meta">
                        <StatusBadge value={order.status} />
                        <strong>{currency(order.total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </section>

          <section className="card-grid three customer-insight-grid">
            <Surface className="overview-utility-card category-overview-card">
              <div className="section-copy">
                <span className="eyebrow">Categorias</span>
                <h2>Explora por linea</h2>
              </div>
              <div className="category-overview-grid">
                {categoryOverview.map((item) => (
                  <button
                    className={category === item.name ? "category-chip active" : "category-chip"}
                    key={item.name}
                    onClick={() => {
                      setCategory(item.name);
                      changeSection("catalog");
                    }}
                    type="button"
                  >
                    <strong>{item.name}</strong>
                    <span>{item.name === "Todos" ? `${item.count} productos` : `${item.count} referencias`}</span>
                  </button>
                ))}
              </div>
              <p className="section-note">Cada acceso te lleva directo al catalogo con el filtro preparado.</p>
            </Surface>

            <Surface className="overview-utility-card checkout-overview-card">
              <div className="section-copy">
                <span className="eyebrow">Momento de compra</span>
                <h2>Asi va tu checkout</h2>
              </div>
              <div className="progress-card">
                <div className="progress-copy">
                  <strong>{checkoutMessage}</strong>
                  <p>Envio gratis a partir de {currency(freeShippingThreshold)}.</p>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${shippingProgress}%` }} />
                </div>
              </div>
              <div className="checkout-facts">
                <div className="checkout-fact">
                  <ShoppingBag size={16} />
                  <span>{cartCount} items listos para checkout</span>
                </div>
                <div className="checkout-fact">
                  <Ticket size={16} />
                  <span>{offerProducts.length} ofertas activas hoy</span>
                </div>
                <div className="checkout-fact">
                  <ShieldCheck size={16} />
                  <span>Pago protegido y resumen visible</span>
                </div>
              </div>
            </Surface>

            <Surface className="overview-utility-card reviews-overview-card">
              <div className="section-copy">
                <span className="eyebrow">Resenas</span>
                <h2>Que estan diciendo</h2>
              </div>
              <div className="review-snippet-list">
                {reviews.slice(0, 2).map((review) => (
                  <article className="review-snippet" key={review.id}>
                    <div className="review-snippet-head">
                      <strong>{review.user}</strong>
                      <span>{Array.from({ length: review.score }, () => "\u2605").join("")}</span>
                    </div>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            </Surface>
          </section>
        </>
      );
    }

    if (activeSection === "catalog") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Catalogo inteligente</span>
              <h2>Filtra, compara y compra sin salir de tu flujo.</h2>
            </div>
            <button className="button ghost" onClick={() => void onRefreshStore()} type="button">
              <RefreshCcw size={16} />
              Recargar
            </button>
          </section>

          <div className="toolbar">
            <label className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, categoria, color o descripcion..."
              />
            </label>

            <div className="toolbar-actions">
              <label className="range-box">
                <span>Presupuesto</span>
                <input
                  max={maxProductPrice || 0}
                  min={0}
                  onChange={(event) => setPriceCap(Number(event.target.value))}
                  step={1000}
                  type="range"
                  value={priceCap ?? maxProductPrice}
                />
                <strong>{priceCapLabel}</strong>
              </label>

              <label className="select-box">
                <span>Ordenar</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="rating">Mejor valorados</option>
                </select>
              </label>

              <button
                className={favoritesOnly ? "button secondary active" : "button secondary"}
                onClick={() => setFavoritesOnly((current) => !current)}
                type="button"
              >
                <Heart size={16} />
                Solo favoritos
              </button>

              <button className="button ghost" onClick={clearCatalogFilters} type="button">
                Limpiar
              </button>
            </div>
          </div>

          <div className="pill-row">
            {categories.map((item) => (
              <button
                className={category === item ? "pill active" : "pill"}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="filter-summary">
            <span>{filteredProducts.length} resultados visibles</span>
            <span>{activeFilterCount} filtros activos</span>
            <span>{priceCapLabel}</span>
          </div>

          <section className="catalog-layout">
            <div className="product-grid">
              {filteredProducts.length === 0 ? (
                <Surface className="full-span">
                  <EmptyState
                    title="No encontramos productos con esos filtros"
                    description="Prueba con otra categoria o limpia la busqueda."
                  />
                </Surface>
              ) : (
                filteredProducts.map((product) => {
                  const isLiked = liked[product.id] ?? false;

                  return (
                    <Surface className="product-tile" key={product.id}>
                      <button className="product-hit" onClick={() => openProductExperience(product.id)} type="button">
                        <img src={product.image} alt={product.name} />
                        <div className="product-body">
                          <div className="product-meta">
                            <span>{product.category}</span>
                            {product.salePrice ? <StatusBadge value="Oferta" /> : null}
                          </div>
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                          <div className="rating-line">
                            <span>
                              <Star size={14} fill="currentColor" />
                              {product.rating.toFixed(1)}
                            </span>
                            <span>{product.stock} en stock</span>
                          </div>
                          <div className="price-line">
                            <strong>{currency(productPrice(product))}</strong>
                            {product.salePrice ? <small>{currency(product.basePrice)}</small> : null}
                          </div>
                        </div>
                      </button>

                      <div className="product-actions">
                        <button className="button ghost" onClick={() => openProductExperience(product.id)} type="button">
                          <Eye size={16} />
                          Ver popup
                        </button>
                        <button className="button secondary" onClick={() => toggleLike(product.id)} type="button">
                          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                          {isLiked ? "Guardado" : "Favorito"}
                        </button>
                        <button className="button primary" onClick={() => addToCart(product.id)} type="button">
                          Agregar
                        </button>
                      </div>
                    </Surface>
                  );
                })
              )}
            </div>

            <div className="sticky-stack">
              <Surface className="detail-card inspector-card">
                {selectedProduct ? (
                  <>
                    <div
                      className="inspector-media"
                      style={{
                        background: `linear-gradient(180deg, ${colorPalette(selectedProduct.color).soft}, rgba(255, 255, 255, 0.12))`
                      }}
                    >
                      <img src={selectedProduct.image} alt={selectedProduct.name} />
                      <div className="inspector-pill-row">
                        <span className="status-badge neutral">{selectedProduct.category}</span>
                        <span className="status-badge success">{selectedProduct.color}</span>
                        <span className="status-badge warning">
                          {selectedProduct.salePrice ? "Oferta activa" : "Coleccion estable"}
                        </span>
                      </div>
                    </div>
                    <div className="detail-body inspector-body">
                      <div className="section-copy">
                        <span className="eyebrow">Preview del producto</span>
                        <h2>{selectedProduct.name}</h2>
                      </div>
                      <div className="rating-line">
                        <span>
                          <Star size={14} fill="currentColor" />
                          {selectedProduct.rating.toFixed(1)}
                        </span>
                        <span>{selectedProduct.likes + (liked[selectedProduct.id] ? 1 : 0)} likes</span>
                      </div>
                      <p>{selectedProduct.description}</p>
                      <div className="inspector-score-grid">
                        <div className="inspector-score">
                          <span>Precio</span>
                          <strong>{currency(productPrice(selectedProduct))}</strong>
                        </div>
                        <div className="inspector-score">
                          <span>Tallas</span>
                          <strong>{selectedProduct.sizes.join(", ")}</strong>
                        </div>
                        <div className="inspector-score">
                          <span>Stock</span>
                          <strong>{selectedProduct.stock}</strong>
                        </div>
                        <div className="inspector-score">
                          <span>Match</span>
                          <strong>{clamp(Math.round(selectedProduct.rating * 18 + selectedProduct.likes / 18), 54, 98)}%</strong>
                        </div>
                      </div>
                      <div className="info-list compact">
                        <div>
                          <ShieldCheck size={16} />
                          <span>Compra segura</span>
                        </div>
                        <div>
                          <Truck size={16} />
                          <span>Envio nacional</span>
                        </div>
                        <div>
                          <Sparkles size={16} />
                          <span>Popup con recomendaciones y tallas</span>
                        </div>
                      </div>

                      {relatedProducts.length > 0 ? (
                        <div className="mini-stack">
                          <strong className="mini-title">Tambien podria combinar con</strong>
                          {relatedProducts.map((product) => (
                            <button
                              className="mini-product"
                              key={product.id}
                              onClick={() => setSelectedProductId(product.id)}
                              type="button"
                            >
                              <div>
                                <strong>{product.name}</strong>
                                <span>
                                  {product.category} | {currency(productPrice(product))}
                                </span>
                              </div>
                              <span className="mini-product-action">Ver</span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <div className="hero-actions">
                        <button className="button primary" onClick={() => openProductExperience(selectedProduct.id)} type="button">
                          <Eye size={16} />
                          Abrir popup interactivo
                        </button>
                        <button className="button ghost" onClick={() => addToCart(selectedProduct.id)} type="button">
                          <ShoppingBag size={16} />
                          Anadir
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Selecciona un producto"
                    description="El panel derecho se actualiza con el detalle ampliado."
                  />
                )}
              </Surface>

              <Surface>
                <div className="section-copy">
                  <span className="eyebrow">Carrito visible</span>
                  <h2>Resumen rapido</h2>
                </div>
                {cartLines.length === 0 ? (
                  <EmptyState
                    title="Tu carrito esta vacio"
                    description="Agrega productos desde el catalogo para ver el resumen aqui."
                  />
                ) : (
                  <div className="stack-list">
                    {cartLines.map((line) => (
                      <div className="cart-row" key={line.productId}>
                        <div>
                          <strong>{line.product.name}</strong>
                          <p>{currency(productPrice(line.product))}</p>
                        </div>
                        <div className="qty-control">
                          <button onClick={() => changeQuantity(line.productId, -1)} type="button">
                            -
                          </button>
                          <span>{line.quantity}</span>
                          <button onClick={() => changeQuantity(line.productId, 1)} type="button">
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="summary-box">
                      <div>
                        <span>Total estimado</span>
                        <strong>{currency(total)}</strong>
                      </div>
                      <button className="button primary full-width" onClick={() => changeSection("cart")} type="button">
                        Ir al checkout
                      </button>
                    </div>
                  </div>
                )}
              </Surface>
            </div>
          </section>
        </>
      );
    }

    if (activeSection === "favorites") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Favoritos</span>
              <h2>Tu shortlist para decidir mas rapido.</h2>
            </div>
          </section>

          <section className="product-grid">
            {favoriteProducts.length === 0 ? (
              <Surface className="full-span">
                <EmptyState
                  title="Todavia no guardas favoritos"
                  description="Usa el corazon en el catalogo para construir tu lista personal."
                />
              </Surface>
            ) : (
              favoriteProducts.map((product) => (
                <Surface className="product-tile" key={product.id}>
                  <img src={product.image} alt={product.name} />
                  <div className="product-body">
                    <div className="product-meta">
                      <span>{product.category}</span>
                      <span>{product.color}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="price-line">
                      <strong>{currency(productPrice(product))}</strong>
                      <small>{product.sizes.join(", ")}</small>
                    </div>
                  </div>
                  <div className="product-actions">
                    <button className="button secondary" onClick={() => openProductExperience(product.id)} type="button">
                      <Eye size={16} />
                      Ver popup
                    </button>
                    <button className="button ghost" onClick={() => toggleLike(product.id)} type="button">
                      Quitar
                    </button>
                    <button className="button primary" onClick={() => addToCart(product.id)} type="button">
                      Agregar al carrito
                    </button>
                  </div>
                </Surface>
              ))
            )}
          </section>
        </>
      );
    }

    if (activeSection === "cart") {
      const recommendations = products.filter((product) => !cart.some((line) => line.productId === product.id)).slice(0, 3);

      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Checkout</span>
              <h2>Resumen listo para confirmar tu compra.</h2>
            </div>
          </section>

          <section className="card-grid two">
            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Items del carrito</span>
                <h2>{cartCount} productos en tu resumen</h2>
              </div>

              {cartLines.length === 0 ? (
                <EmptyState
                  title="No hay productos agregados"
                  description="Vuelve al catalogo y agrega items para continuar."
                />
              ) : (
                <div className="stack-list">
                  {cartLines.map((line) => (
                    <div className="cart-card" key={line.productId}>
                      <img src={line.product.image} alt={line.product.name} />
                      <div>
                        <strong>{line.product.name}</strong>
                        <p>{line.product.category}</p>
                        <p>{currency(line.total)}</p>
                      </div>
                      <div className="qty-control">
                        <button onClick={() => changeQuantity(line.productId, -1)} type="button">
                          -
                        </button>
                        <span>{line.quantity}</span>
                        <button onClick={() => changeQuantity(line.productId, 1)} type="button">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>

            <div className="stack-column">
              <Surface>
                <div className="section-copy">
                  <span className="eyebrow">Totales</span>
                  <h2>Decision transparente</h2>
                </div>
                <div className="progress-card">
                  <div className="progress-copy">
                    <strong>{checkoutMessage}</strong>
                    <p>
                      {shipping === 0 && cartCount > 0
                        ? "Tu pedido ya viaja con envio gratis."
                        : "Cada producto suma para mejorar la condicion de despacho."}
                    </p>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${shippingProgress}%` }} />
                  </div>
                </div>
                <div className="summary-list">
                  <div>
                    <span>Subtotal</span>
                    <strong>{currency(subtotal)}</strong>
                  </div>
                  <div>
                    <span>Ahorro</span>
                    <strong>{currency(-savings)}</strong>
                  </div>
                  <div>
                    <span>Envio</span>
                    <strong>{currency(shipping)}</strong>
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <strong>{currency(total)}</strong>
                  </div>
                </div>
                <button className="button primary full-width" disabled={cartCount === 0} type="button">
                  Continuar al pago
                </button>
              </Surface>

              <Surface>
                <div className="section-copy">
                  <span className="eyebrow">Sugerencias</span>
                  <h2>Tambien podria interesarte</h2>
                </div>
                <div className="stack-list">
                  {recommendations.map((product) => (
                    <div className="timeline-row" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.category}</p>
                      </div>
                      <button className="button secondary" onClick={() => addToCart(product.id)} type="button">
                        {currency(productPrice(product))}
                      </button>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </section>
        </>
      );
    }

    return (
      <>
        <section className="section-head">
          <div>
            <span className="eyebrow">Historial</span>
            <h2>Compras recientes y senales de satisfaccion.</h2>
          </div>
          <button className="button ghost" onClick={() => void loadOrders()} type="button">
            <RefreshCcw size={16} />
            Actualizar
          </button>
        </section>

        <section className="card-grid two">
          <Surface>
            <div className="section-copy">
              <span className="eyebrow">Mis ordenes</span>
              <h2>Seguimiento de pedidos</h2>
            </div>

            {ordersState.loading ? (
              <EmptyState title="Cargando ordenes..." description="Consultando tus compras protegidas por sesion." />
            ) : ordersState.error ? (
              <EmptyState title="No pudimos cargar tus ordenes" description={ordersState.error} />
            ) : ordersState.data.length === 0 ? (
              <EmptyState title="Sin historial de compras" description="Aun no hay pedidos asociados a tu cuenta." />
            ) : (
              <div className="stack-list">
                {ordersState.data.map((order) => (
                  <div className="timeline-row" key={order.orderId}>
                    <div>
                      <strong>#{order.orderId}</strong>
                      <p>
                        {order.items} productos | {order.createdAt}
                      </p>
                    </div>
                    <div className="timeline-meta">
                      <StatusBadge value={order.status} />
                      <strong>{currency(order.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface>
            <div className="section-copy">
              <span className="eyebrow">Resenas</span>
              <h2>Prueba social de la tienda</h2>
            </div>
            <div className="stack-list">
              {reviews.map((review) => (
                <div className="review-row" key={review.id}>
                  <div className="review-head">
                    <strong>{review.user}</strong>
                    <span>{Array.from({ length: review.score }, () => "\u2605").join("")}</span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          </Surface>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="portal-shell customer-portal">
        <aside className="portal-sidebar">
          <div className="brand-block portal-brand">
            <span className="brand-mark">FC</span>
            <div>
              <strong>Portal cliente</strong>
              <small>Compra ordenada y fluida</small>
            </div>
          </div>

          <Surface className="profile-card">
            <div className="avatar">{initials(user.fullName)}</div>
            <div>
              <strong>{user.fullName}</strong>
              <p>{user.email}</p>
            </div>
          </Surface>

          <PortalMenu active={activeSection} items={menuItems} onSelect={changeSection} />

          <Surface className="sidebar-note">
            <strong>Tips para comprar mejor</strong>
            <p>Usa favoritos para comparar rapido y deja el carrito visible mientras decides.</p>
          </Surface>
        </aside>

        <main className="portal-main">
          <header className="portal-header">
            <div>
              <span className="eyebrow">Experiencia separada por rol</span>
              <h2>Cliente final</h2>
            </div>
            <div className="header-actions">
              <button className="button ghost" onClick={() => void onRefreshStore()} type="button">
                <RefreshCcw size={16} />
                Recargar datos
              </button>
              <button className="button secondary" onClick={onLogout} type="button">
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          </header>

          {storeState.error ? <div className="status-badge danger full-width">{storeState.error}</div> : null}
          {ordersState.error && activeSection !== "orders" ? (
            <div className="status-badge warning full-width">{ordersState.error}</div>
          ) : null}

          {renderContent()}
        </main>
      </div>

      {productExperience ? (
        <ProductExperienceModal
          isLiked={liked[productExperience.id] ?? false}
          onAddToCart={addToCart}
          onClose={closeProductExperience}
          onSelectProduct={openProductExperience}
          onToggleLike={toggleLike}
          product={productExperience}
          relatedProducts={relatedProducts.filter((product) => product.id !== productExperience.id)}
        />
      ) : null}
    </>
  );
}

function CashierPortal({
  user,
  token,
  storeState,
  onLogout,
  onRefreshStore
}: {
  user: SessionUser;
  token: string;
  storeState: AsyncState<StoreHomeResponse>;
  onLogout: () => void;
  onRefreshStore: () => Promise<void>;
}) {
  const [activeSection, setActiveSection] = useState<CashierSection>("overview");
  const [ordersState, setOrdersState] = useState<AsyncState<Order[]>>({
    data: [],
    loading: true,
    error: null
  });
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [variantSelection, setVariantSelection] = useState<Record<string, string>>({});
  const [ticket, setTicket] = useState<CashierTicketLine[]>([]);
  const [customerName, setCustomerName] = useState("Consumidor final");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [documentType, setDocumentType] = useState<"none" | "boleta" | "factura">("none");
  const [customerDocumentType, setCustomerDocumentType] = useState<"DNI" | "RUC" | "CE" | "PASSPORT" | "OTHER">("DNI");
  const [customerDocumentNumber, setCustomerDocumentNumber] = useState("");
  const [customerLegalName, setCustomerLegalName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cashierMessage, setCashierMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
  }, [token]);

  const products = storeState.data.products;
  const filteredProducts = useMemo(() => {
    const loweredQuery = deferredQuery.trim().toLowerCase();

    if (!loweredQuery) {
      return products;
    }

    return products.filter((product) => {
      const text = `${product.name} ${product.category} ${product.color} ${product.description}`.toLowerCase();
      return text.includes(loweredQuery);
    });
  }, [deferredQuery, products]);

  const ticketLines = useMemo(() => {
    return ticket
      .map((line) => {
        const product = products.find((item) => item.id === line.productId);
        const variant = product?.variants?.find((item) => item.id === line.variantId);

        if (!product || !variant) {
          return null;
        }

        return {
          ...line,
          product,
          variant,
          unitPrice: productPrice(product),
          lineTotal: productPrice(product) * line.quantity
        };
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line));
  }, [products, ticket]);

  const subtotal = useMemo(() => ticketLines.reduce((sum, line) => sum + line.lineTotal, 0), [ticketLines]);
  const totalItems = useMemo(() => ticketLines.reduce((sum, line) => sum + line.quantity, 0), [ticketLines]);
  const amountReceivedValue = Number(amountReceived || 0);
  const changeDue = paymentMethod === "cash" ? Math.max(0, amountReceivedValue - subtotal) : 0;
  const salesToday = ordersState.data.length;
  const avgTicket =
    ordersState.data.length === 0
      ? 0
      : Math.round(ordersState.data.reduce((sum, order) => sum + order.total, 0) / ordersState.data.length);

  const menuItems: PortalMenuItem[] = [
    {
      id: "overview",
      label: "Resumen",
      note: "Pulso de mostrador",
      badge: `${salesToday} ventas`,
      icon: <LayoutDashboard size={16} />
    },
    {
      id: "pos",
      label: "Caja POS",
      note: "Venta presencial",
      badge: `${totalItems} items`,
      icon: <CreditCard size={16} />
    },
    {
      id: "sales",
      label: "Historial",
      note: "Ventas recientes",
      badge: `${ordersState.data.length}`,
      icon: <ReceiptText size={16} />
    }
  ];

  async function loadOrders() {
    try {
      setOrdersState((current) => ({ ...current, loading: true, error: null }));
      const orders = await fetchOrders(token);
      setOrdersState({
        data: orders,
        loading: false,
        error: null
      });
    } catch (loadError) {
      setOrdersState({
        data: [],
        loading: false,
        error: loadError instanceof Error ? loadError.message : "No fue posible cargar las ventas recientes."
      });
    }
  }

  function changeSection(next: CashierSection) {
    startTransition(() => setActiveSection(next));
  }

  function selectVariant(productId: string, variantId: string) {
    setVariantSelection((current) => ({
      ...current,
      [productId]: variantId
    }));
  }

  function addProductToTicket(product: Product) {
    const variantId = variantSelection[product.id] ?? product.variants?.[0]?.id;

    if (!variantId) {
      setCashierMessage("Este producto no tiene variantes disponibles para vender.");
      return;
    }

    setCashierMessage(null);
    setTicket((current) => {
      const existing = current.find((line) => line.variantId === variantId);

      if (existing) {
        return current.map((line) =>
          line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line
        );
      }

      return [...current, { productId: product.id, variantId, quantity: 1 }];
    });
  }

  function changeTicketQuantity(variantId: string, delta: number) {
    setTicket((current) =>
      current
        .map((line) =>
          line.variantId === variantId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function resetTicket() {
    setTicket([]);
    setCustomerName("Consumidor final");
    setCustomerEmail("");
    setCustomerPhone("");
    setDocumentType("none");
    setCustomerDocumentType("DNI");
    setCustomerDocumentNumber("");
    setCustomerLegalName("");
    setCustomerAddress("");
    setPaymentMethod("cash");
    setAmountReceived("");
    setNotes("");
  }

  async function handleCreateSale() {
    if (ticketLines.length === 0) {
      setCashierMessage("Agrega al menos un producto al ticket antes de cobrar.");
      return;
    }

    try {
      setSubmitting(true);
      setCashierMessage(null);

      const response = await createPosOrder(token, {
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        documentType,
        customerDocumentType: documentType === "none" ? undefined : customerDocumentType,
        customerDocumentNumber: customerDocumentNumber || undefined,
        customerLegalName: customerLegalName || undefined,
        customerAddress: customerAddress || undefined,
        paymentMethod,
        amountReceived: paymentMethod === "cash" && amountReceived ? Number(amountReceived) : undefined,
        notes: notes || undefined,
        items: ticketLines.map((line) => ({
          variantId: line.variant.id,
          quantity: line.quantity
        }))
      });

      setCashierMessage(
        response.order.billingDraft
          ? `${response.message} Ticket ${response.order.orderId}. Borrador ${response.order.billingDraft.reference} listo para ${response.order.billingDraft.documentLabel.toLowerCase()}.`
          : `${response.message} Ticket ${response.order.orderId}.`
      );
      resetTicket();
      await Promise.all([loadOrders(), onRefreshStore()]);
      changeSection("sales");
    } catch (submitError) {
      setCashierMessage(submitError instanceof Error ? submitError.message : "No fue posible registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderContent() {
    if (activeSection === "overview") {
      return (
        <>
          <Surface className="workspace-hero customer-theme cashier-hero">
            <div>
              <span className="eyebrow">Caja presencial</span>
              <h1>Hola, {user.firstName}. Vende en mostrador con un flujo rapido y visual.</h1>
              <p>Consulta inventario activo, arma el ticket, cobra manualmente y deja la venta registrada al instante.</p>
            </div>

            <div className="hero-actions">
              <button className="button primary" onClick={() => changeSection("pos")} type="button">
                Abrir caja POS
              </button>
              <button className="button ghost" onClick={() => changeSection("sales")} type="button">
                Ver ventas recientes
              </button>
            </div>
          </Surface>

          <section className="metric-grid">
            <MetricCard label="Ventas recientes" value={String(salesToday)} detail="Movimientos visibles en caja" />
            <MetricCard label="Ticket actual" value={String(totalItems)} detail="Items listos para cobrar" />
            <MetricCard label="Promedio" value={currency(avgTicket)} detail="Lectura rapida de ventas" />
            <MetricCard label="Catalogo activo" value={String(products.length)} detail="Productos listos para mostrador" />
          </section>

          <section className="card-grid two">
            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Venta rapida</span>
                <h2>Tu ticket actual</h2>
              </div>

              {ticketLines.length === 0 ? (
                <EmptyState title="Sin productos en caja" description="Empieza agregando referencias desde el POS." />
              ) : (
                <div className="stack-list">
                  {ticketLines.map((line) => (
                    <div className="cashier-ticket-row" key={line.variant.id}>
                      <div>
                        <strong>{line.product.name}</strong>
                        <p>
                          {line.variant.size} | {currency(line.unitPrice)}
                        </p>
                      </div>
                      <div className="timeline-meta">
                        <span className="status-badge neutral">x{line.quantity}</span>
                        <strong>{currency(line.lineTotal)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>

            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Actividad reciente</span>
                <h2>Ventas registradas</h2>
              </div>

              {ordersState.loading ? (
                <EmptyState title="Cargando ventas..." description="Consultando las operaciones recientes." />
              ) : ordersState.data.length === 0 ? (
                <EmptyState title="Sin ventas registradas" description="Las ventas POS apareceran aqui cuando se registren." />
              ) : (
                <div className="stack-list">
                  {ordersState.data.slice(0, 5).map((order) => (
                    <div className="timeline-row" key={order.orderId}>
                      <div>
                        <strong>#{order.orderId}</strong>
                        <p>{order.customerName ?? "Cliente"} | {order.createdAt}</p>
                      </div>
                      <div className="timeline-meta">
                        <StatusBadge value={order.status} />
                        <strong>{currency(order.total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </section>
        </>
      );
    }

    if (activeSection === "sales") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Historial POS</span>
              <h2>Ventas presenciales recientes.</h2>
            </div>
            <button className="button ghost" onClick={() => void loadOrders()} type="button">
              <RefreshCcw size={16} />
              Actualizar
            </button>
          </section>

          <Surface>
            {ordersState.loading ? (
              <EmptyState title="Cargando ventas..." description="Traemos el historial de caja." />
            ) : ordersState.error ? (
              <EmptyState title="No pudimos cargar las ventas" description={ordersState.error} />
            ) : ordersState.data.length === 0 ? (
              <EmptyState title="Sin ventas aun" description="Cuando registres la primera venta aparecera aqui." />
            ) : (
              <div className="stack-list">
                {ordersState.data.map((order) => (
                  <div className="timeline-row" key={order.orderId}>
                    <div>
                      <strong>#{order.orderId}</strong>
                      <p>
                        {order.customerName ?? "Cliente"} | {order.items} items | {order.createdAt}
                      </p>
                    </div>
                    <div className="timeline-meta">
                      <StatusBadge value={order.status} />
                      <strong>{currency(order.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </>
      );
    }

    return (
      <>
        <section className="section-head">
          <div>
            <span className="eyebrow">Punto de venta</span>
            <h2>Arma el ticket, captura el cliente y confirma el cobro.</h2>
          </div>
          <button className="button ghost" onClick={() => void onRefreshStore()} type="button">
            <RefreshCcw size={16} />
            Recargar inventario
          </button>
        </section>

        <section className="cashier-layout">
          <Surface className="cashier-products-panel">
            <div className="section-copy">
              <span className="eyebrow">Catalogo disponible</span>
              <h2>{filteredProducts.length} productos listos para venta presencial</h2>
            </div>

            <label className="search-box cashier-search">
              <Search size={18} />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, color o categoria..."
                value={query}
              />
            </label>

            <div className="cashier-product-grid">
              {filteredProducts.map((product) => {
                const currentVariantId = variantSelection[product.id] ?? product.variants?.[0]?.id ?? "";
                const selectedVariant = product.variants?.find((variant) => variant.id === currentVariantId) ?? product.variants?.[0];

                return (
                  <article className="cashier-product-card" key={product.id}>
                    <img src={productGallery(product)[0]?.url ?? product.image} alt={product.imageAltText ?? product.name} />
                    <div className="cashier-product-body">
                      <div className="product-meta">
                        <span>{product.category}</span>
                        <StatusBadge value={`${product.stock} stock`} />
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="price-line">
                        <strong>{currency(productPrice(product))}</strong>
                        <small>{product.color}</small>
                      </div>

                      <label className="form-field">
                        <span>Variante para caja</span>
                        <select
                          onChange={(event) => selectVariant(product.id, event.target.value)}
                          value={selectedVariant?.id ?? ""}
                        >
                          {(product.variants ?? []).map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.size} | {variant.stock} und
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className="button primary full-width"
                        disabled={!selectedVariant || selectedVariant.stock <= 0}
                        onClick={() => addProductToTicket(product)}
                        type="button"
                      >
                        Agregar al ticket
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Surface>

          <div className="cashier-sidebar">
            <Surface className="cashier-ticket-panel">
              <div className="section-copy">
                <span className="eyebrow">Ticket en curso</span>
                <h2>{totalItems} items listos para cobrar</h2>
              </div>

              {ticketLines.length === 0 ? (
                <EmptyState title="Ticket vacio" description="Agrega productos desde el panel izquierdo para empezar." />
              ) : (
                <div className="stack-list">
                  {ticketLines.map((line) => (
                    <div className="cashier-ticket-row" key={line.variant.id}>
                      <div>
                        <strong>{line.product.name}</strong>
                        <p>
                          Talla {line.variant.size} | {currency(line.unitPrice)}
                        </p>
                      </div>
                      <div className="qty-control">
                        <button onClick={() => changeTicketQuantity(line.variant.id, -1)} type="button">
                          -
                        </button>
                        <span>{line.quantity}</span>
                        <button onClick={() => changeTicketQuantity(line.variant.id, 1)} type="button">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="cashier-summary-grid">
                <label className="form-field full-span">
                  <span>Nombre del cliente</span>
                  <input
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Consumidor final"
                    value={customerName}
                  />
                </label>
                <label className="form-field">
                  <span>Correo</span>
                  <input
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="cliente@correo.com"
                    value={customerEmail}
                  />
                </label>
                <label className="form-field">
                  <span>Telefono</span>
                  <input onChange={(event) => setCustomerPhone(event.target.value)} placeholder="999999999" value={customerPhone} />
                </label>
                <label className="form-field">
                  <span>Comprobante base</span>
                  <select
                    onChange={(event) => {
                      const nextDocumentType = event.target.value as "none" | "boleta" | "factura";
                      setDocumentType(nextDocumentType);

                      if (nextDocumentType === "factura") {
                        setCustomerDocumentType("RUC");
                      } else if (nextDocumentType === "none" && customerDocumentType === "RUC") {
                        setCustomerDocumentType("DNI");
                      }
                    }}
                    value={documentType}
                  >
                    <option value="none">Sin borrador tributario</option>
                    <option value="boleta">Boleta electronica</option>
                    <option value="factura">Factura electronica</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Tipo documento</span>
                  <select
                    disabled={documentType === "none"}
                    onChange={(event) =>
                      setCustomerDocumentType(event.target.value as "DNI" | "RUC" | "CE" | "PASSPORT" | "OTHER")
                    }
                    value={customerDocumentType}
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                    <option value="PASSPORT">Pasaporte</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>{customerDocumentType === "RUC" ? "Numero RUC" : "Numero documento"}</span>
                  <input
                    disabled={documentType === "none"}
                    onChange={(event) => setCustomerDocumentNumber(event.target.value)}
                    placeholder={customerDocumentType === "RUC" ? "20123456789" : "Documento del cliente"}
                    value={customerDocumentNumber}
                  />
                </label>
                <label className="form-field full-span">
                  <span>{documentType === "factura" ? "Razon social" : "Nombre fiscal opcional"}</span>
                  <input
                    disabled={documentType === "none"}
                    onChange={(event) => setCustomerLegalName(event.target.value)}
                    placeholder={documentType === "factura" ? "Empresa Peruana SAC" : "Nombre para boleta o comprobante"}
                    value={customerLegalName}
                  />
                </label>
                <label className="form-field full-span">
                  <span>Direccion fiscal opcional</span>
                  <input
                    disabled={documentType === "none"}
                    onChange={(event) => setCustomerAddress(event.target.value)}
                    placeholder="Av. principal 123, distrito y provincia"
                    value={customerAddress}
                  />
                </label>
                <label className="form-field">
                  <span>Medio de pago</span>
                  <select
                    onChange={(event) => setPaymentMethod(event.target.value as "cash" | "card" | "transfer")}
                    value={paymentMethod}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Recibido</span>
                  <input
                    disabled={paymentMethod !== "cash"}
                    min="0"
                    onChange={(event) => setAmountReceived(event.target.value)}
                    placeholder="0"
                    type="number"
                    value={amountReceived}
                  />
                </label>
                <label className="form-field full-span textarea-field">
                  <span>Notas</span>
                  <textarea
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Observaciones de la venta presencial."
                    rows={3}
                    value={notes}
                  />
                </label>
              </div>

              {documentType === "factura" ? (
                <p className="helper-text">La base de factura para Peru requiere RUC y razon social antes de emitir.</p>
              ) : null}

              <div className="summary-list">
                <div>
                  <span>Subtotal</span>
                  <strong>{currency(subtotal)}</strong>
                </div>
                <div>
                  <span>Cobro</span>
                  <strong>{paymentMethod === "cash" ? "Efectivo" : paymentMethod === "card" ? "Tarjeta" : "Transferencia"}</strong>
                </div>
                <div>
                  <span>Cambio</span>
                  <strong>{currency(changeDue)}</strong>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <strong>{currency(subtotal)}</strong>
                </div>
              </div>

              <div className="cashier-actions">
                <button className="button ghost" onClick={resetTicket} type="button">
                  Limpiar ticket
                </button>
                <button className="button primary" disabled={submitting || subtotal === 0} onClick={() => void handleCreateSale()} type="button">
                  {submitting ? "Registrando..." : "Confirmar venta"}
                </button>
              </div>
            </Surface>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="portal-shell cashier-portal">
      <aside className="portal-sidebar">
        <div className="brand-block portal-brand">
          <span className="brand-mark">FC</span>
          <div>
            <strong>Portal cajero</strong>
            <small>Venta presencial y ticket rapido</small>
          </div>
        </div>

        <Surface className="profile-card">
          <div className="avatar">{initials(user.fullName)}</div>
          <div>
            <strong>{user.fullName}</strong>
            <p>{user.email}</p>
          </div>
        </Surface>

        <PortalMenu active={activeSection} items={menuItems} onSelect={changeSection} />

        <Surface className="sidebar-note">
          <strong>Caja activa</strong>
          <p>Usa este recorrido para vender presencialmente sin entrar al backoffice administrativo.</p>
        </Surface>
      </aside>

      <main className="portal-main">
        <header className="portal-header">
          <div>
            <span className="eyebrow">Operacion por rol</span>
            <h2>Cajero</h2>
          </div>
          <div className="header-actions">
            <button className="button ghost" onClick={() => void loadOrders()} type="button">
              <RefreshCcw size={16} />
              Recargar ventas
            </button>
            <button className="button secondary" onClick={onLogout} type="button">
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </div>
        </header>

        {storeState.error ? <div className="status-badge warning full-width">{storeState.error}</div> : null}
        {ordersState.error && activeSection !== "sales" ? (
          <div className="status-badge warning full-width">{ordersState.error}</div>
        ) : null}
        {cashierMessage ? <div className="notice-banner">{cashierMessage}</div> : null}

        {renderContent()}
      </main>
    </div>
  );
}

function AdminPortal({
  user,
  token,
  reviews,
  onLogout
}: {
  user: SessionUser;
  token: string;
  reviews: Review[];
  onLogout: () => void;
}) {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [dashboardState, setDashboardState] = useState<AsyncState<DashboardStats>>({
    data: emptyDashboard,
    loading: true,
    error: null
  });
  const [productsState, setProductsState] = useState<AsyncState<Product[]>>({
    data: [],
    loading: true,
    error: null
  });
  const [categoriesState, setCategoriesState] = useState<AsyncState<ProductCategory[]>>({
    data: [],
    loading: true,
    error: null
  });
  const [usersState, setUsersState] = useState<AsyncState<UserRecord[]>>({
    data: [],
    loading: true,
    error: null
  });
  const [ordersState, setOrdersState] = useState<AsyncState<Order[]>>({
    data: [],
    loading: true,
    error: null
  });
  const [billingState, setBillingState] = useState<AsyncState<BillingSettingsResponse>>({
    data: emptyBillingSettings,
    loading: true,
    error: null
  });
  const [inventoryQuery, setInventoryQuery] = useState("");
  const deferredInventoryQuery = useDeferredValue(inventoryQuery);
  const [usersQuery, setUsersQuery] = useState("");
  const deferredUsersQuery = useDeferredValue(usersQuery);
  const [productForm, setProductForm] = useState<ProductFormState>(() => createEmptyProductForm());
  const [userForm, setUserForm] = useState<UserFormState>(() => createEmptyUserForm());
  const [billingForm, setBillingForm] = useState<BillingProfile>(() => createEmptyBillingProfile());
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadAdminData();
  }, [token]);

  useEffect(() => {
    if (categoriesState.data.length > 0 && !productForm.categoryId) {
      setProductForm((current) => ({
        ...current,
        categoryId: categoriesState.data[0].id
      }));
    }
  }, [categoriesState.data, productForm.categoryId]);

  async function loadAdminData() {
    setDashboardState((current) => ({ ...current, loading: true, error: null }));
    setProductsState((current) => ({ ...current, loading: true, error: null }));
    setCategoriesState((current) => ({ ...current, loading: true, error: null }));
    setUsersState((current) => ({ ...current, loading: true, error: null }));
    setOrdersState((current) => ({ ...current, loading: true, error: null }));
    setBillingState((current) => ({ ...current, loading: true, error: null }));

    const results = await Promise.allSettled([
      fetchDashboard(token),
      fetchAdminProducts(token),
      fetchProductMeta(token),
      fetchUsers(token),
      fetchOrders(token),
      fetchBillingSettings(token)
    ]);
    const [dashboardResult, productsResult, categoriesResult, usersResult, ordersResult, billingResult] = results;

    if (dashboardResult.status === "fulfilled") {
      setDashboardState({
        data: dashboardResult.value,
        loading: false,
        error: null
      });
    } else {
      setDashboardState({
        data: emptyDashboard,
        loading: false,
        error: dashboardResult.reason instanceof Error ? dashboardResult.reason.message : "Error cargando dashboard."
      });
    }

    if (productsResult.status === "fulfilled") {
      setProductsState({
        data: productsResult.value,
        loading: false,
        error: null
      });
    } else {
      setProductsState({
        data: [],
        loading: false,
        error: productsResult.reason instanceof Error ? productsResult.reason.message : "Error cargando inventario."
      });
    }

    if (categoriesResult.status === "fulfilled") {
      setCategoriesState({
        data: categoriesResult.value.categories,
        loading: false,
        error: null
      });
    } else {
      setCategoriesState({
        data: [],
        loading: false,
        error: categoriesResult.reason instanceof Error ? categoriesResult.reason.message : "Error cargando categorias."
      });
    }

    if (usersResult.status === "fulfilled") {
      setUsersState({
        data: usersResult.value,
        loading: false,
        error: null
      });
    } else {
      setUsersState({
        data: [],
        loading: false,
        error: usersResult.reason instanceof Error ? usersResult.reason.message : "Error cargando usuarios."
      });
    }

    if (ordersResult.status === "fulfilled") {
      setOrdersState({
        data: ordersResult.value,
        loading: false,
        error: null
      });
    } else {
      setOrdersState({
        data: [],
        loading: false,
        error: ordersResult.reason instanceof Error ? ordersResult.reason.message : "Error cargando ventas."
      });
    }

    if (billingResult.status === "fulfilled") {
      setBillingState({
        data: billingResult.value,
        loading: false,
        error: null
      });
      setBillingForm(billingResult.value.profile);
    } else {
      setBillingState({
        data: emptyBillingSettings,
        loading: false,
        error: billingResult.reason instanceof Error ? billingResult.reason.message : "Error cargando facturacion."
      });
    }
  }

  const inventoryProducts = useMemo(() => {
    const loweredQuery = deferredInventoryQuery.trim().toLowerCase();

    if (!loweredQuery) {
      return productsState.data;
    }

    return productsState.data.filter((product) => {
      const text = `${product.name} ${product.category} ${product.color} ${product.description}`.toLowerCase();
      return text.includes(loweredQuery);
    });
  }, [deferredInventoryQuery, productsState.data]);

  const filteredUsers = useMemo(() => {
    const loweredQuery = deferredUsersQuery.trim().toLowerCase();

    if (!loweredQuery) {
      return usersState.data;
    }

    return usersState.data.filter((userRecord) => {
      const text = `${userRecord.fullName} ${userRecord.email} ${userRecord.role}`.toLowerCase();
      return text.includes(loweredQuery);
    });
  }, [deferredUsersQuery, usersState.data]);

  const lowStockProducts = useMemo(
    () => productsState.data.filter((product) => product.status !== "archived" && product.stock <= 10),
    [productsState.data]
  );
  const activeProductsCount = useMemo(
    () => productsState.data.filter((product) => product.status === "active").length,
    [productsState.data]
  );
  const draftProducts = useMemo(
    () => productsState.data.filter((product) => product.status === "draft"),
    [productsState.data]
  );
  const inactiveUsers = useMemo(
    () => usersState.data.filter((userRecord) => !userRecord.isActive),
    [usersState.data]
  );
  const archivedProducts = useMemo(
    () => productsState.data.filter((product) => product.status === "archived"),
    [productsState.data]
  );

  const statusSummary = useMemo(() => {
    return ordersState.data.reduce<Record<string, number>>((summary, order) => {
      summary[order.status] = (summary[order.status] ?? 0) + 1;
      return summary;
    }, {});
  }, [ordersState.data]);
  const maxTopSales = useMemo(
    () => Math.max(...dashboardState.data.topProducts.map((product) => product.sold), 1),
    [dashboardState.data.topProducts]
  );
  const totalSalesValue = useMemo(() => ordersState.data.reduce((sum, order) => sum + order.total, 0), [ordersState.data]);
  const averageTicket = useMemo(
    () => (ordersState.data.length === 0 ? 0 : Math.round(totalSalesValue / ordersState.data.length)),
    [ordersState.data.length, totalSalesValue]
  );
  const reviewAverage = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    return reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length;
  }, [reviews]);
  const recentSalesPulse = useMemo<TrendPoint[]>(() => {
    const recentOrders = ordersState.data.slice(0, 6).reverse();

    if (recentOrders.length > 0) {
      return recentOrders.map((order) => ({
        label: `#${order.orderId.slice(-4)}`,
        value: order.total,
        note: order.status
      }));
    }

    return dashboardState.data.topProducts.slice(0, 6).map((product) => ({
      label: product.name.split(" ").slice(0, 2).join(" "),
      value: Math.max(product.sold * Math.max(averageTicket, 1), 1),
      note: `${product.sold} uds`
    }));
  }, [averageTicket, dashboardState.data.topProducts, ordersState.data]);
  const topDemandPoints = useMemo<TrendPoint[]>(() => {
    return dashboardState.data.topProducts.slice(0, 6).map((product) => ({
      label: product.name.split(" ").slice(0, 2).join(" "),
      value: product.sold,
      note: "rotacion"
    }));
  }, [dashboardState.data.topProducts]);
  const orderStatusItems = useMemo<DistributionItem[]>(() => {
    const chartTones = ["#c86f3b", "#215b57", "#15365b", "#a85c3d", "#6a7d97"];

    return Object.entries(statusSummary).map(([status, count], index) => ({
      label: status,
      value: count,
      tone: chartTones[index % chartTones.length],
      detail: `${count} registros activos`
    }));
  }, [statusSummary]);
  const inventoryMixItems = useMemo<DistributionItem[]>(() => {
    return [
      {
        label: "Activos",
        value: activeProductsCount,
        tone: "#215b57",
        detail: "Productos visibles en vitrina"
      },
      {
        label: "Borradores",
        value: draftProducts.length,
        tone: "#c86f3b",
        detail: "Pendientes por publicar"
      },
      {
        label: "Archivados",
        value: archivedProducts.length,
        tone: "#15365b",
        detail: "Fuera del catalogo principal"
      }
    ];
  }, [activeProductsCount, archivedProducts.length, draftProducts.length]);
  const topProductHighlights = useMemo(() => {
    return dashboardState.data.topProducts.slice(0, 5).map((product) => {
      const linkedProduct = productsState.data.find((item) => item.name === product.name);

      return {
        ...product,
        category: linkedProduct?.category ?? "Catalogo",
        stock: linkedProduct?.stock ?? 0
      };
    });
  }, [dashboardState.data.topProducts, productsState.data]);

  const menuItems: PortalMenuItem[] = [
    {
      id: "overview",
      label: "Resumen",
      note: "KPIs y alertas",
      badge: `${dashboardState.data.activeOrders} activas`,
      icon: <LayoutDashboard size={16} />
    },
    {
      id: "inventory",
      label: "Inventario",
      note: "Stock y catalogo",
      badge: `${productsState.data.length} productos`,
      icon: <Boxes size={16} />
    },
    {
      id: "sales",
      label: "Ventas",
      note: "Ordenes y estado",
      badge: `${ordersState.data.length} registros`,
      icon: <CreditCard size={16} />
    },
    {
      id: "billing",
      label: "Facturacion",
      note: "Base fiscal Peru",
      badge: `${billingState.data.readiness.readyCount}/${billingState.data.readiness.total}`,
      icon: <Ticket size={16} />
    },
    {
      id: "reports",
      label: "Reportes",
      note: "Top productos y conversion",
      badge: `${dashboardState.data.topProducts.length} tops`,
      icon: <BarChart3 size={16} />
    },
    {
      id: "users",
      label: "Usuarios",
      note: "Altas, edicion y estado",
      badge: `${usersState.data.length} cuentas`,
      icon: <Users size={16} />
    }
  ];

  function changeSection(next: AdminSection) {
    startTransition(() => setActiveSection(next));
  }

  function resetProductForm() {
    productForm.gallery.forEach((image) => {
      if (image.file && image.url.startsWith("blob:")) {
        URL.revokeObjectURL(image.url);
      }
    });

    setProductForm(createEmptyProductForm(categoriesState.data));
  }

  function resetUserForm() {
    setUserForm(createEmptyUserForm());
  }

  function resetBillingForm() {
    setBillingForm(billingState.data.profile);
  }

  function handleEditProduct(product: Product) {
    productForm.gallery.forEach((image) => {
      if (image.file && image.url.startsWith("blob:")) {
        URL.revokeObjectURL(image.url);
      }
    });

    setProductForm(mapProductToForm(product));
    changeSection("inventory");
  }

  function handleEditUser(userRecord: UserRecord) {
    setUserForm(mapUserToForm(userRecord));
    changeSection("users");
  }

  function updateProductField<Key extends keyof ProductFormState>(field: Key, value: ProductFormState[Key]) {
    setProductForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateUserField<Key extends keyof UserFormState>(field: Key, value: UserFormState[Key]) {
    setUserForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBillingField<Key extends keyof BillingProfile>(field: Key, value: BillingProfile[Key]) {
    setBillingForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateVariantField(index: number, field: keyof ProductVariantForm, value: string) {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    }));
  }

  function addVariantRow() {
    setProductForm((current) => ({
      ...current,
      variants: [...current.variants, emptyVariantForm()]
    }));
  }

  function addGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextImages = Array.from(files).map((file, index) => ({
      key: createClientKey(`gallery-${index}`),
      url: URL.createObjectURL(file),
      altText: "",
      isPrimary: false,
      file
    }));

    setProductForm((current) => {
      const gallery = [...current.gallery, ...nextImages];

      return {
        ...current,
        gallery: gallery.map((image, index) => ({
          ...image,
          isPrimary: gallery.some((item) => item.isPrimary) ? image.isPrimary : index === 0
        }))
      };
    });
  }

  function updateGalleryImage(key: string, field: "altText", value: string) {
    setProductForm((current) => ({
      ...current,
      gallery: current.gallery.map((image) => (image.key === key ? { ...image, [field]: value } : image))
    }));
  }

  function setPrimaryGalleryImage(key: string) {
    setProductForm((current) => ({
      ...current,
      gallery: current.gallery.map((image) => ({
        ...image,
        isPrimary: image.key === key
      }))
    }));
  }

  function removeGalleryImage(key: string) {
    setProductForm((current) => {
      const target = current.gallery.find((image) => image.key === key);

      if (target?.file && target.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }

      const gallery = current.gallery.filter((image) => image.key !== key);

      return {
        ...current,
        gallery: gallery.map((image, index) => ({
          ...image,
          isPrimary: gallery.some((item) => item.isPrimary) ? image.isPrimary : index === 0
        }))
      };
    });
  }

  function removeVariantRow(index: number) {
    setProductForm((current) => {
      if (current.variants.length === 1) {
        return current;
      }

      return {
        ...current,
        variants: current.variants.filter((_, variantIndex) => variantIndex !== index)
      };
    });
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setProductSubmitting(true);
      setAdminMessage(null);
      const payload = buildProductPayload(productForm);

      if (productForm.id) {
        await updateProduct(token, productForm.id, payload);
        setAdminMessage("Producto actualizado correctamente.");
      } else {
        await createProduct(token, payload);
        setAdminMessage("Producto creado correctamente.");
      }

      await loadAdminData();
      resetProductForm();
    } catch (submitError) {
      setAdminMessage(submitError instanceof Error ? submitError.message : "No fue posible guardar el producto.");
    } finally {
      setProductSubmitting(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!window.confirm("Deseas eliminar o archivar este producto?")) {
      return;
    }

    try {
      setAdminMessage(null);
      const result = await deleteProduct(token, productId);
      setAdminMessage(result.message);
      await loadAdminData();

      if (productForm.id === productId) {
        resetProductForm();
      }
    } catch (deleteError) {
      setAdminMessage(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el producto.");
    }
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setUserSubmitting(true);
      setAdminMessage(null);
      const payload = buildUserPayload(userForm);

      if (userForm.id) {
        await updateUser(token, userForm.id, payload);
        setAdminMessage("Usuario actualizado correctamente.");
      } else {
        await createUser(token, payload);
        setAdminMessage("Usuario creado correctamente.");
      }

      await loadAdminData();
      resetUserForm();
    } catch (submitError) {
      setAdminMessage(submitError instanceof Error ? submitError.message : "No fue posible guardar el usuario.");
    } finally {
      setUserSubmitting(false);
    }
  }

  async function handleBillingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBillingSubmitting(true);
      setAdminMessage(null);
      const { id, ...payload } = billingForm;
      const response = await updateBillingSettings(token, payload as BillingSettingsPayload);

      setBillingState({
        data: response,
        loading: false,
        error: null
      });
      setBillingForm(response.profile);
      setAdminMessage("Base de facturacion para Peru actualizada correctamente.");
    } catch (submitError) {
      setAdminMessage(submitError instanceof Error ? submitError.message : "No fue posible guardar la configuracion fiscal.");
    } finally {
      setBillingSubmitting(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm("Deseas desactivar este usuario?")) {
      return;
    }

    try {
      setAdminMessage(null);
      await deleteUser(token, userId);
      setAdminMessage("Usuario desactivado correctamente.");
      await loadAdminData();

      if (userForm.id === userId) {
        resetUserForm();
      }
    } catch (deleteError) {
      setAdminMessage(deleteError instanceof Error ? deleteError.message : "No fue posible desactivar el usuario.");
    }
  }

  function renderContent() {
    if (activeSection === "overview") {
      return (
        <>
          <Surface className="workspace-hero admin-theme dashboard-hero-card">
            <div className="dashboard-hero-copy">
              <span className="eyebrow">Control administrativo</span>
              <h1>Hola, {user.firstName}. El backoffice ahora esta separado del flujo de compra.</h1>
              <p>Gestiona indicadores, inventario y ventas desde un panel mas ejecutivo, visual y protegido por permisos.</p>

              <div className="hero-actions">
                <button className="button primary" onClick={() => void loadAdminData()} type="button">
                  <RefreshCcw size={16} />
                  Actualizar panel
                </button>
                <button className="button ghost" onClick={() => changeSection("inventory")} type="button">
                  Ir a inventario
                </button>
              </div>
            </div>

            <div className="dashboard-hero-grid">
              <div className="dashboard-hero-chip">
                <Gauge size={18} />
                <div>
                  <span>Conversion actual</span>
                  <strong>{dashboardState.data.conversionRate}%</strong>
                </div>
              </div>
              <div className="dashboard-hero-chip">
                <TrendingUp size={18} />
                <div>
                  <span>Ticket promedio</span>
                  <strong>{compactCurrency(averageTicket)}</strong>
                </div>
              </div>
              <div className="dashboard-hero-chip">
                <PieChart size={18} />
                <div>
                  <span>Catalogo activo</span>
                  <strong>{activeProductsCount} referencias</strong>
                </div>
              </div>
            </div>
          </Surface>

          <section className="metric-grid executive-metric-grid">
            <MetricCard
              label="Ventas del mes"
              value={currency(dashboardState.data.revenueMonth)}
              detail="Ingreso confirmado por el dashboard"
            />
            <MetricCard
              label="Ordenes activas"
              value={String(dashboardState.data.activeOrders)}
              detail="Pedidos que siguen en ejecucion"
            />
            <MetricCard
              label="Stock critico"
              value={String(dashboardState.data.lowStockProducts)}
              detail="Alertas que requieren seguimiento"
            />
            <MetricCard
              label="Conversion"
              value={`${dashboardState.data.conversionRate}%`}
              detail="Rendimiento comercial actual"
            />
          </section>

          <section className="dashboard-grid">
            <Surface className="dashboard-surface">
              <TrendChart
                caption="ingreso visible en la operacion"
                eyebrow="Pulso del negocio"
                formatValue={compactCurrency}
                points={recentSalesPulse}
                summary={compactCurrency(totalSalesValue || dashboardState.data.revenueMonth)}
                title="Flujo comercial reciente"
              />
            </Surface>

            <Surface className="dashboard-surface">
              <DistributionChart
                centerLabel="ordenes"
                centerValue={String(ordersState.data.length)}
                eyebrow="Distribucion operativa"
                items={orderStatusItems}
                title="Como se reparte el pipeline"
              />
            </Surface>
          </section>

          <section className="card-grid two">
            <Surface className="dashboard-surface">
              <div className="section-copy">
                <span className="eyebrow">Alertas</span>
                <h2>Productos que necesitan atencion</h2>
              </div>
              {lowStockProducts.length === 0 ? (
                <EmptyState
                  title="Sin alertas de stock"
                  description="El inventario actual no muestra productos por debajo del umbral."
                />
              ) : (
                <div className="stack-list">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div className="timeline-row" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.category}</p>
                      </div>
                      <div className="timeline-meta">
                        <CircleAlert size={16} />
                        <StatusBadge value={`${product.stock} unidades`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>

            <Surface className="dashboard-surface">
              <div className="section-copy">
                <span className="eyebrow">Top productos</span>
                <h2>Rendimiento comercial</h2>
              </div>
              {topProductHighlights.length === 0 ? (
                <EmptyState
                  title="Sin productos destacados"
                  description="Aun no tenemos datos suficientes para construir el ranking."
                />
              ) : (
                <div className="report-bar-list">
                  {topProductHighlights.map((product, index) => (
                    <div className="report-bar-card" key={product.name}>
                      <div className="report-bar-head">
                        <div>
                          <span className="eyebrow">#{String(index + 1).padStart(2, "0")}</span>
                          <strong>{product.name}</strong>
                          <p>
                            {product.category} · stock {product.stock}
                          </p>
                        </div>
                        <strong>{product.sold} uds</strong>
                      </div>
                      <div className="report-bar-track">
                        <span style={{ width: `${(product.sold / maxTopSales) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </section>

          <section className="card-grid two">
            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Prioridades del dia</span>
                <h2>Que conviene resolver primero para mantener sana la operacion.</h2>
              </div>
              <div className="priority-list">
                <button className="priority-card" onClick={() => changeSection("inventory")} type="button">
                  <div>
                    <strong>{lowStockProducts.length} productos con stock critico</strong>
                    <p>Revisa niveles bajos antes de afectar la conversion.</p>
                  </div>
                  <span>Inventario</span>
                </button>
                <button className="priority-card" onClick={() => changeSection("inventory")} type="button">
                  <div>
                    <strong>{draftProducts.length} borradores y {archivedProducts.length} archivados</strong>
                    <p>Publica pendientes o limpia referencias fuera de vitrina.</p>
                  </div>
                  <span>Catalogo</span>
                </button>
                <button className="priority-card" onClick={() => changeSection("users")} type="button">
                  <div>
                    <strong>{inactiveUsers.length} usuarios inactivos</strong>
                    <p>Verifica accesos, roles y altas administrativas recientes.</p>
                  </div>
                  <span>Usuarios</span>
                </button>
              </div>
            </Surface>

            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Acciones rapidas</span>
                <h2>Atajos utiles para operar sin perder contexto.</h2>
              </div>
              <div className="action-grid">
                <button
                  className="action-tile"
                  onClick={() => {
                    resetProductForm();
                    changeSection("inventory");
                  }}
                  type="button"
                >
                  <strong>Nuevo producto</strong>
                  <p>Abre una ficha limpia y ve directo al mantenimiento.</p>
                </button>
                <button
                  className="action-tile"
                  onClick={() => {
                    resetUserForm();
                    changeSection("users");
                  }}
                  type="button"
                >
                  <strong>Nuevo usuario</strong>
                  <p>Crea accesos de cliente o administrador desde el panel.</p>
                </button>
                <button className="action-tile" onClick={() => changeSection("sales")} type="button">
                  <strong>Ir a ventas</strong>
                  <p>Monitorea estados, tickets y ordenes en curso.</p>
                </button>
              </div>
            </Surface>
          </section>

          <section className="card-grid two">
            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Ventas recientes</span>
                <h2>Ultimos movimientos</h2>
              </div>
              <div className="stack-list">
                {ordersState.data.slice(0, 5).map((order) => (
                  <div className="timeline-row" key={order.orderId}>
                    <div>
                      <strong>#{order.orderId}</strong>
                      <p>{order.customerName ?? "Cliente"} | {order.createdAt}</p>
                    </div>
                    <div className="timeline-meta">
                      <StatusBadge value={order.status} />
                      <strong>{currency(order.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface>
              <div className="section-copy">
                <span className="eyebrow">Feedback</span>
                <h2>Percepcion del cliente</h2>
              </div>
              <div className="stack-list">
                {reviews.slice(0, 3).map((review) => (
                  <div className="review-row" key={review.id}>
                    <div className="review-head">
                      <strong>{review.user}</strong>
                      <span>{Array.from({ length: review.score }, () => "\u2605").join("")}</span>
                    </div>
                    <p>{review.comment}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </section>
        </>
      );
    }

    if (activeSection === "inventory") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Mantenimiento de productos</span>
              <h2>Controla catalogo, variantes, imagen principal y estado comercial.</h2>
            </div>
            <div className="maintenance-toolbar">
              <label className="search-box admin-search">
                <Search size={18} />
                <input
                  value={inventoryQuery}
                  onChange={(event) => setInventoryQuery(event.target.value)}
                  placeholder="Buscar por producto, categoria o color..."
                />
              </label>
              <button className="button secondary" onClick={resetProductForm} type="button">
                Nuevo producto
              </button>
            </div>
          </section>

          <section className="maintenance-layout">
            <Surface className="maintenance-panel">
              <div className="section-copy">
                <span className="eyebrow">Catalogo conectado</span>
                <h2>{inventoryProducts.length} productos listos para editar</h2>
                <p>Ajusta precios, descripcion, SEO, imagen principal y stock por talla desde una sola vista.</p>
              </div>

              <div className="insight-strip">
                <div className="insight-chip">
                  <span>Activos</span>
                  <strong>{productsState.data.filter((product) => product.status === "active").length}</strong>
                </div>
                <div className="insight-chip">
                  <span>Con alerta</span>
                  <strong>{lowStockProducts.length}</strong>
                </div>
                <div className="insight-chip">
                  <span>Categorias</span>
                  <strong>{categoriesState.data.length}</strong>
                </div>
              </div>

              {inventoryProducts.length === 0 ? (
                <EmptyState
                  title="Sin coincidencias"
                  description="Ajusta la busqueda para ver productos del inventario."
                />
              ) : (
                <div className="maintenance-list">
                  {inventoryProducts.map((product) => (
                    <article
                      className={
                        productForm.id === product.id
                          ? "maintenance-item product-maintenance-item selected"
                          : "maintenance-item product-maintenance-item"
                      }
                      key={product.id}
                    >
                      <div className="maintenance-item-media">
                        <img src={product.image} alt={product.imageAltText ?? product.name} />
                      </div>

                      <div className="maintenance-item-body">
                        <div className="maintenance-item-copy">
                          <div>
                            <span className="eyebrow">{product.category}</span>
                            <h3>{product.name}</h3>
                          </div>
                          <StatusBadge value={product.status} />
                        </div>

                        <p>{product.description}</p>

                        <div className="maintenance-item-meta">
                          <span>{currency(productPrice(product))}</span>
                          <span>{product.color || "Color unico"}</span>
                          <span>{product.variants?.length ?? product.sizes.length} variantes</span>
                        </div>

                        <div className="maintenance-item-footer">
                          <div className="maintenance-item-meta">
                            <span>{product.stock} unidades</span>
                            <span>{product.sizes.join(", ") || "Sin tallas"}</span>
                          </div>
                          <div className="maintenance-item-actions">
                            <button className="button secondary" onClick={() => handleEditProduct(product)} type="button">
                              Editar
                            </button>
                            <button
                              className="button ghost"
                              onClick={() => void handleDeleteProduct(product.id)}
                              type="button"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Surface>

            <Surface className="maintenance-form-panel">
              <div className="section-copy">
                <span className="eyebrow">{productForm.id ? "Edicion" : "Nuevo producto"}</span>
                <h2>{productForm.id ? "Actualiza la ficha principal" : "Crea un producto desde cero"}</h2>
                <p>Mantiene sincronizada la informacion comercial, la galeria visual y las variantes del producto.</p>
              </div>

              <form className="admin-form" onSubmit={handleProductSubmit}>
                <section className="gallery-manager">
                  <div className="variant-head">
                    <div>
                      <span className="eyebrow">Galeria visual</span>
                      <h3>Sube varias imagenes y define la principal</h3>
                    </div>
                    <label className="button secondary file-trigger" htmlFor="product-gallery-upload">
                      Agregar imagenes
                    </label>
                  </div>

                  <input
                    accept="image/*"
                    className="file-input"
                    id="product-gallery-upload"
                    multiple
                    onChange={(event) => {
                      addGalleryFiles(event.target.files);
                      event.target.value = "";
                    }}
                    type="file"
                  />

                  {productForm.gallery.length === 0 ? (
                    <div className="upload-placeholder gallery-empty">
                      <Sparkles size={28} />
                      <span>Agrega una o varias imagenes para habilitar la galeria del producto.</span>
                    </div>
                  ) : (
                    <div className="gallery-grid">
                      {normalizeProductGallery(productForm.gallery).map((image, index) => (
                        <div className={image.isPrimary ? "gallery-card primary" : "gallery-card"} key={image.key}>
                          <div className="gallery-card-media">
                            <img src={image.url} alt={image.altText || productForm.name || `Imagen ${index + 1}`} />
                            <div className="gallery-card-badge-row">
                              {image.isPrimary ? <span className="status-badge success">Principal</span> : null}
                              <span className="status-badge neutral">#{index + 1}</span>
                            </div>
                          </div>

                          <div className="gallery-card-body">
                            <label className="form-field">
                              <span>Alt de imagen</span>
                              <input
                                onChange={(event) => updateGalleryImage(image.key, "altText", event.target.value)}
                                placeholder="Vista frontal, detalle o lookbook"
                                value={image.altText}
                              />
                            </label>

                            <div className="gallery-card-actions">
                              <button
                                className={image.isPrimary ? "button secondary active" : "button secondary"}
                                onClick={() => setPrimaryGalleryImage(image.key)}
                                type="button"
                              >
                                Marcar principal
                              </button>
                              <button className="button ghost" onClick={() => removeGalleryImage(image.key)} type="button">
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <div className="form-grid two">
                  <label className="form-field">
                    <span>Nombre</span>
                    <input
                      onChange={(event) => {
                        const nextName = event.target.value;
                        setProductForm((current) => {
                          const shouldSyncSlug = !current.slug || current.slug === slugify(current.name);
                          return {
                            ...current,
                            name: nextName,
                            slug: shouldSyncSlug ? slugify(nextName) : current.slug
                          };
                        });
                      }}
                      placeholder="Chaqueta Capsule Studio"
                      required
                      value={productForm.name}
                    />
                  </label>

                  <label className="form-field">
                    <span>Slug</span>
                    <input
                      onChange={(event) => updateProductField("slug", slugify(event.target.value))}
                      placeholder="chaqueta-capsule-studio"
                      required
                      value={productForm.slug}
                    />
                  </label>

                  <label className="form-field">
                    <span>Categoria</span>
                    <select
                      onChange={(event) => updateProductField("categoryId", event.target.value)}
                      required
                      value={productForm.categoryId}
                    >
                      <option value="">Selecciona una categoria</option>
                      {categoriesState.data.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Estado</span>
                    <select
                      onChange={(event) =>
                        updateProductField("status", event.target.value as ProductFormState["status"])
                      }
                      value={productForm.status}
                    >
                      <option value="draft">Borrador</option>
                      <option value="active">Activo</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Precio base</span>
                    <input
                      min="0"
                      onChange={(event) => updateProductField("basePrice", event.target.value)}
                      required
                      type="number"
                      value={productForm.basePrice}
                    />
                  </label>

                  <label className="form-field">
                    <span>Precio oferta</span>
                    <input
                      min="0"
                      onChange={(event) => updateProductField("salePrice", event.target.value)}
                      type="number"
                      value={productForm.salePrice}
                    />
                  </label>

                  <label className="form-field">
                    <span>Color</span>
                    <input
                      onChange={(event) => updateProductField("color", event.target.value)}
                      placeholder="Negro obsidiana"
                      required
                      value={productForm.color}
                    />
                  </label>

                  <label className="form-field">
                    <span>Marca</span>
                    <input
                      onChange={(event) => updateProductField("brand", event.target.value)}
                      placeholder="Fashion Commerce"
                      value={productForm.brand}
                    />
                  </label>

                  <label className="form-field">
                    <span>Material</span>
                    <input
                      onChange={(event) => updateProductField("material", event.target.value)}
                      placeholder="Lino lavado"
                      value={productForm.material}
                    />
                  </label>

                  <label className="form-field">
                    <span>Genero</span>
                    <input
                      onChange={(event) => updateProductField("gender", event.target.value)}
                      placeholder="Unisex"
                      value={productForm.gender}
                    />
                  </label>

                  <label className="form-field checkbox-field">
                    <span>Vitrina</span>
                    <button
                      className={productForm.featured ? "toggle-chip active" : "toggle-chip"}
                      onClick={() => updateProductField("featured", !productForm.featured)}
                      type="button"
                    >
                      {productForm.featured ? "Destacado activo" : "Marcar como destacado"}
                    </button>
                  </label>

                  <label className="form-field full-span textarea-field">
                    <span>Descripcion</span>
                    <textarea
                      onChange={(event) => updateProductField("description", event.target.value)}
                      placeholder="Cuenta la propuesta de valor, el fit y el contexto de uso."
                      required
                      rows={4}
                      value={productForm.description}
                    />
                  </label>

                  <label className="form-field">
                    <span>SEO title</span>
                    <input
                      onChange={(event) => updateProductField("seoTitle", event.target.value)}
                      placeholder="Chaqueta premium urbana"
                      value={productForm.seoTitle}
                    />
                  </label>

                  <label className="form-field">
                    <span>SEO description</span>
                    <input
                      onChange={(event) => updateProductField("seoDescription", event.target.value)}
                      placeholder="Descripcion corta para buscadores y redes."
                      value={productForm.seoDescription}
                    />
                  </label>
                </div>

                <section className="variant-section">
                  <div className="variant-head">
                    <div>
                      <span className="eyebrow">Variantes y stock</span>
                      <h3>Control por talla o referencia</h3>
                    </div>
                    <button className="button secondary" onClick={addVariantRow} type="button">
                      Agregar variante
                    </button>
                  </div>

                  <div className="variant-list">
                    {productForm.variants.map((variant, index) => (
                      <div className="variant-row" key={variant.id ?? `variant-${index}`}>
                        <div className="variant-grid">
                          <label className="form-field">
                            <span>Talla</span>
                            <input
                              onChange={(event) => updateVariantField(index, "size", event.target.value)}
                              placeholder="M"
                              required
                              value={variant.size}
                            />
                          </label>

                          <label className="form-field">
                            <span>Stock</span>
                            <input
                              min="0"
                              onChange={(event) => updateVariantField(index, "stock", event.target.value)}
                              required
                              type="number"
                              value={variant.stock}
                            />
                          </label>

                          <label className="form-field">
                            <span>SKU</span>
                            <input
                              onChange={(event) => updateVariantField(index, "sku", event.target.value)}
                              placeholder="CHAQ-CAP-M-01"
                              value={variant.sku}
                            />
                          </label>

                          <label className="form-field">
                            <span>Codigo de barras</span>
                            <input
                              onChange={(event) => updateVariantField(index, "barcode", event.target.value)}
                              placeholder="770000001234"
                              value={variant.barcode}
                            />
                          </label>

                          <label className="form-field">
                            <span>Peso gramos</span>
                            <input
                              min="0"
                              onChange={(event) => updateVariantField(index, "weightGrams", event.target.value)}
                              type="number"
                              value={variant.weightGrams}
                            />
                          </label>
                        </div>

                        <div className="variant-row-footer">
                          <span className="helper-text">
                            {variant.id ? "Variante existente conectada al inventario" : "Nueva variante por crear"}
                          </span>
                          <button
                            className="button ghost"
                            disabled={productForm.variants.length === 1}
                            onClick={() => removeVariantRow(index)}
                            type="button"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="form-actions">
                  <button className="button ghost" onClick={resetProductForm} type="button">
                    Limpiar formulario
                  </button>
                  <button className="button primary" disabled={productSubmitting} type="submit">
                    {productSubmitting
                      ? "Guardando..."
                      : productForm.id
                        ? "Actualizar producto"
                        : "Crear producto"}
                  </button>
                </div>
              </form>
            </Surface>
          </section>
        </>
      );
    }

    if (activeSection === "sales") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Ventas</span>
              <h2>Monitorea estados y pedidos en un solo lugar.</h2>
            </div>
          </section>

          <section className="card-grid three">
            {Object.entries(statusSummary).map(([status, count]) => (
              <MetricCard key={status} label={status} value={String(count)} detail="Ordenes en este estado" />
            ))}
          </section>

          <Surface>
            <div className="stack-list">
              {ordersState.data.map((order) => (
                <div className="timeline-row" key={order.orderId}>
                  <div>
                    <strong>#{order.orderId}</strong>
                    <p>
                      {order.customerName ?? "Cliente"} | {order.items} productos | {order.createdAt}
                    </p>
                  </div>
                  <div className="timeline-meta">
                    <StatusBadge value={order.status} />
                    <strong>{currency(order.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </>
      );
    }

    if (activeSection === "users") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Mantenimiento de usuarios</span>
              <h2>Administra cuentas, roles, estado de acceso y datos principales.</h2>
            </div>
            <div className="maintenance-toolbar">
              <label className="search-box admin-search">
                <Search size={18} />
                <input
                  value={usersQuery}
                  onChange={(event) => setUsersQuery(event.target.value)}
                  placeholder="Buscar por nombre, correo o rol..."
                />
              </label>
              <button className="button secondary" onClick={resetUserForm} type="button">
                Nuevo usuario
              </button>
            </div>
          </section>

          <section className="maintenance-layout">
            <Surface className="maintenance-panel">
              <div className="section-copy">
                <span className="eyebrow">Accesos del sistema</span>
                <h2>{filteredUsers.length} cuentas visibles en esta busqueda</h2>
                <p>Define quien compra, quien administra y el estado operativo de cada sesion.</p>
              </div>

              <div className="insight-strip">
                <div className="insight-chip">
                  <span>Activos</span>
                  <strong>{usersState.data.filter((record) => record.isActive).length}</strong>
                </div>
                <div className="insight-chip">
                  <span>Admins</span>
                  <strong>
                    {usersState.data.filter((record) => record.role === "admin" && record.isActive).length}
                  </strong>
                </div>
                <div className="insight-chip">
                  <span>Cajeros</span>
                  <strong>{usersState.data.filter((record) => record.role === "cashier").length}</strong>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <EmptyState
                  title="Sin coincidencias"
                  description="Cambia el filtro para localizar una cuenta existente."
                />
              ) : (
                <div className="maintenance-list">
                  {filteredUsers.map((userRecord) => (
                    <article
                      className={
                        userForm.id === userRecord.id
                          ? "maintenance-item user-maintenance-item selected"
                          : "maintenance-item user-maintenance-item"
                      }
                      key={userRecord.id}
                    >
                      <div className="maintenance-item-body">
                        <div className="maintenance-item-copy">
                          <div className="maintenance-identity">
                            <div className="maintenance-avatar">{initials(userRecord.fullName)}</div>
                            <div>
                              <h3>{userRecord.fullName}</h3>
                              <p>{userRecord.email}</p>
                            </div>
                          </div>
                          <span className={userRecord.isActive ? "status-badge success" : "status-badge danger"}>
                            {userRecord.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <div className="maintenance-item-meta">
                          <span>{roleLabel(userRecord.role)}</span>
                          <span>{userRecord.ordersCount} ordenes</span>
                          <span>{userRecord.phone || "Sin telefono"}</span>
                        </div>

                        <div className="maintenance-item-footer">
                          <div className="maintenance-item-meta">
                            <span>Ingreso: {userRecord.createdAt ?? "Sin fecha"}</span>
                            <span>Ultimo acceso: {userRecord.lastLoginAt ?? "Sin registro"}</span>
                          </div>
                          <div className="maintenance-item-actions">
                            <button className="button secondary" onClick={() => handleEditUser(userRecord)} type="button">
                              Editar
                            </button>
                            <button
                              className="button ghost"
                              disabled={!userRecord.isActive || userRecord.id === user.id}
                              onClick={() => void handleDeleteUser(userRecord.id)}
                              type="button"
                            >
                              Desactivar
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Surface>

            <Surface className="maintenance-form-panel">
              <div className="section-copy">
                <span className="eyebrow">{userForm.id ? "Edicion" : "Nuevo usuario"}</span>
                <h2>{userForm.id ? "Actualiza la cuenta seleccionada" : "Crea una cuenta nueva"}</h2>
                <p>Configura el rol, los datos de contacto y el estado de acceso sin salir del panel.</p>
              </div>

              <form className="admin-form" onSubmit={handleUserSubmit}>
                <div className="form-grid two">
                  <label className="form-field">
                    <span>Rol</span>
                    <select
                      onChange={(event) => updateUserField("role", event.target.value as UserRole)}
                      value={userForm.role}
                    >
                      <option value="customer">Cliente</option>
                      <option value="admin">Administrador</option>
                      <option value="cashier">Cajero</option>
                    </select>
                  </label>

                  <label className="form-field checkbox-field">
                    <span>Estado</span>
                    <button
                      className={userForm.isActive ? "toggle-chip active" : "toggle-chip"}
                      onClick={() => updateUserField("isActive", !userForm.isActive)}
                      type="button"
                    >
                      {userForm.isActive ? "Cuenta activa" : "Cuenta inactiva"}
                    </button>
                  </label>

                  <label className="form-field">
                    <span>Nombres</span>
                    <input
                      onChange={(event) => updateUserField("firstName", event.target.value)}
                      placeholder="Andrea"
                      required
                      value={userForm.firstName}
                    />
                  </label>

                  <label className="form-field">
                    <span>Apellidos</span>
                    <input
                      onChange={(event) => updateUserField("lastName", event.target.value)}
                      placeholder="Diaz"
                      required
                      value={userForm.lastName}
                    />
                  </label>

                  <label className="form-field">
                    <span>Correo</span>
                    <input
                      onChange={(event) => updateUserField("email", event.target.value)}
                      placeholder="usuario@fashioncommerce.com"
                      required
                      type="email"
                      value={userForm.email}
                    />
                  </label>

                  <label className="form-field">
                    <span>Telefono</span>
                    <input
                      onChange={(event) => updateUserField("phone", event.target.value)}
                      placeholder="999999999"
                      value={userForm.phone}
                    />
                  </label>

                  <label className="form-field full-span">
                    <span>{userForm.id ? "Nueva contrasena opcional" : "Contrasena inicial"}</span>
                    <input
                      minLength={8}
                      onChange={(event) => updateUserField("password", event.target.value)}
                      placeholder={userForm.id ? "Deja vacio para conservar la actual" : "Minimo 8 caracteres"}
                      required={!userForm.id}
                      type="password"
                      value={userForm.password}
                    />
                  </label>
                </div>

                <p className="helper-text">
                  {userForm.id
                    ? "Si no escribes una nueva contrasena, el sistema mantiene la existente."
                    : "Las cuentas nuevas quedan listas para ingresar apenas se guarden."}
                </p>

                <div className="form-actions">
                  <button className="button ghost" onClick={resetUserForm} type="button">
                    Limpiar formulario
                  </button>
                  <button className="button primary" disabled={userSubmitting} type="submit">
                    {userSubmitting ? "Guardando..." : userForm.id ? "Actualizar usuario" : "Crear usuario"}
                  </button>
                </div>
              </form>
            </Surface>
          </section>
        </>
      );
    }

    if (activeSection === "billing") {
      return (
        <>
          <section className="section-head">
            <div>
              <span className="eyebrow">Base fiscal Peru</span>
              <h2>Prepara la configuracion SUNAT sin emitir todavia.</h2>
            </div>
            <button className="button ghost" onClick={() => void loadAdminData()} type="button">
              <RefreshCcw size={16} />
              Recargar base fiscal
            </button>
          </section>

          <section className="card-grid two">
            <Surface className="dashboard-surface">
              <div className="section-copy">
                <span className="eyebrow">Checklist</span>
                <h2>{billingState.data.readiness.readyCount} de {billingState.data.readiness.total} bloques listos</h2>
                <p>Este tablero valida lo minimo para evolucionar luego a boleta y factura electronica en Peru.</p>
              </div>

              <div className="report-pill-grid">
                {billingState.data.readiness.checks.map((check) => (
                  <div className={check.ready ? "report-pill accent" : "report-pill"} key={check.key}>
                    <span>{check.label}</span>
                    <strong>{check.ready ? "Listo" : "Pendiente"}</strong>
                    <small>{check.detail}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="dashboard-surface">
              <div className="section-copy">
                <span className="eyebrow">Borradores recientes</span>
                <h2>Comprobantes preparados desde caja</h2>
                <p>Estos documentos aun no se envian a SUNAT; solo dejan trazabilidad y estructura base.</p>
              </div>

              {billingState.data.recentDocuments.length === 0 ? (
                <EmptyState
                  title="Aun no hay borradores"
                  description="Cuando una venta de caja elija boleta o factura, el borrador aparecera aqui."
                />
              ) : (
                <div className="stack-list">
                  {billingState.data.recentDocuments.map((document) => (
                    <div className="timeline-row" key={document.id}>
                      <div>
                        <strong>{document.reference}</strong>
                        <p>{document.documentLabel} | {document.customerName} | {document.createdAt}</p>
                      </div>
                      <div className="timeline-meta">
                        <StatusBadge value={document.statusLabel} />
                        <strong>{currency(document.total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </section>

          <section className="maintenance-layout">
            <Surface className="maintenance-form-panel">
              <div className="section-copy">
                <span className="eyebrow">Perfil emisor</span>
                <h2>Configura la base del negocio para Peru</h2>
                <p>Guarda los datos tributarios y operativos que luego alimentaran la emision electronica ante SUNAT.</p>
              </div>

              <form className="admin-form" onSubmit={handleBillingSubmit}>
                <div className="form-grid two">
                  <label className="form-field">
                    <span>Pais</span>
                    <input disabled value={billingForm.countryCode} />
                  </label>

                  <label className="form-field">
                    <span>Moneda</span>
                    <input
                      onChange={(event) => updateBillingField("currencyCode", event.target.value.toUpperCase())}
                      value={billingForm.currencyCode}
                    />
                  </label>

                  <label className="form-field full-span">
                    <span>Razon social</span>
                    <input
                      onChange={(event) => updateBillingField("legalName", event.target.value)}
                      placeholder="Fashion Commerce Peru SAC"
                      value={billingForm.legalName}
                    />
                  </label>

                  <label className="form-field full-span">
                    <span>Nombre comercial</span>
                    <input
                      onChange={(event) => updateBillingField("tradeName", event.target.value)}
                      placeholder="Fashion Commerce Peru"
                      value={billingForm.tradeName}
                    />
                  </label>

                  <label className="form-field">
                    <span>Tipo identificacion</span>
                    <select
                      onChange={(event) => updateBillingField("taxIdType", event.target.value)}
                      value={billingForm.taxIdType}
                    >
                      <option value="RUC">RUC</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>RUC</span>
                    <input
                      onChange={(event) => updateBillingField("taxId", event.target.value)}
                      placeholder="20123456789"
                      value={billingForm.taxId}
                    />
                  </label>

                  <label className="form-field full-span">
                    <span>Direccion fiscal</span>
                    <input
                      onChange={(event) => updateBillingField("fiscalAddress", event.target.value)}
                      placeholder="Av. principal 123, oficina 402"
                      value={billingForm.fiscalAddress}
                    />
                  </label>

                  <label className="form-field">
                    <span>Departamento</span>
                    <input
                      onChange={(event) => updateBillingField("department", event.target.value)}
                      placeholder="Lima"
                      value={billingForm.department}
                    />
                  </label>

                  <label className="form-field">
                    <span>Provincia</span>
                    <input
                      onChange={(event) => updateBillingField("province", event.target.value)}
                      placeholder="Lima"
                      value={billingForm.province}
                    />
                  </label>

                  <label className="form-field">
                    <span>Distrito</span>
                    <input
                      onChange={(event) => updateBillingField("district", event.target.value)}
                      placeholder="Miraflores"
                      value={billingForm.district}
                    />
                  </label>

                  <label className="form-field">
                    <span>Ubigeo</span>
                    <input
                      onChange={(event) => updateBillingField("ubigeo", event.target.value)}
                      placeholder="150122"
                      value={billingForm.ubigeo}
                    />
                  </label>

                  <label className="form-field">
                    <span>Codigo establecimiento</span>
                    <input
                      onChange={(event) => updateBillingField("establishmentCode", event.target.value.toUpperCase())}
                      placeholder="0000"
                      value={billingForm.establishmentCode}
                    />
                  </label>

                  <label className="form-field">
                    <span>IGV %</span>
                    <input
                      min="0"
                      onChange={(event) => updateBillingField("igvRate", Number(event.target.value || 0))}
                      step="0.01"
                      type="number"
                      value={billingForm.igvRate}
                    />
                  </label>

                  <label className="form-field">
                    <span>Serie factura</span>
                    <input
                      onChange={(event) => updateBillingField("invoiceSeries", event.target.value.toUpperCase())}
                      placeholder="F001"
                      value={billingForm.invoiceSeries}
                    />
                  </label>

                  <label className="form-field">
                    <span>Serie boleta</span>
                    <input
                      onChange={(event) => updateBillingField("receiptSeries", event.target.value.toUpperCase())}
                      placeholder="B001"
                      value={billingForm.receiptSeries}
                    />
                  </label>

                  <label className="form-field">
                    <span>Serie nota credito</span>
                    <input
                      onChange={(event) => updateBillingField("creditNoteSeries", event.target.value.toUpperCase())}
                      placeholder="FC01"
                      value={billingForm.creditNoteSeries}
                    />
                  </label>

                  <label className="form-field">
                    <span>Serie nota debito</span>
                    <input
                      onChange={(event) => updateBillingField("debitNoteSeries", event.target.value.toUpperCase())}
                      placeholder="FD01"
                      value={billingForm.debitNoteSeries}
                    />
                  </label>

                  <label className="form-field">
                    <span>Entorno SUNAT</span>
                    <select
                      onChange={(event) => updateBillingField("sunatEnvironment", event.target.value as BillingProfile["sunatEnvironment"])}
                      value={billingForm.sunatEnvironment}
                    >
                      <option value="beta">Beta</option>
                      <option value="production">Produccion</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Sistema de emision</span>
                    <select
                      onChange={(event) => updateBillingField("emissionSystem", event.target.value as BillingProfile["emissionSystem"])}
                      value={billingForm.emissionSystem}
                    >
                      <option value="own_software">Software propio</option>
                      <option value="sunat">SEE SOL / SUNAT</option>
                      <option value="pse">PSE / OSE / tercero</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Usuario SOL</span>
                    <input
                      onChange={(event) => updateBillingField("solUser", event.target.value)}
                      placeholder="USUARIO SOL"
                      value={billingForm.solUser}
                    />
                  </label>

                  <label className="form-field">
                    <span>Alias certificado</span>
                    <input
                      onChange={(event) => updateBillingField("certificateAlias", event.target.value)}
                      placeholder="Certificado firma digital"
                      value={billingForm.certificateAlias}
                    />
                  </label>

                  <label className="form-field">
                    <span>Correo soporte</span>
                    <input
                      onChange={(event) => updateBillingField("supportEmail", event.target.value)}
                      placeholder="facturacion@empresa.pe"
                      type="email"
                      value={billingForm.supportEmail}
                    />
                  </label>

                  <label className="form-field">
                    <span>Telefono soporte</span>
                    <input
                      onChange={(event) => updateBillingField("supportPhone", event.target.value)}
                      placeholder="999999999"
                      value={billingForm.supportPhone}
                    />
                  </label>

                  <label className="form-field checkbox-field">
                    <span>Precios incluyen IGV</span>
                    <button
                      className={billingForm.pricesIncludeTax ? "toggle-chip active" : "toggle-chip"}
                      onClick={() => updateBillingField("pricesIncludeTax", !billingForm.pricesIncludeTax)}
                      type="button"
                    >
                      {billingForm.pricesIncludeTax ? "Incluido en precios" : "Pendiente por aplicar"}
                    </button>
                  </label>

                  <label className="form-field checkbox-field">
                    <span>Borradores automaticos</span>
                    <button
                      className={billingForm.sendAutomatically ? "toggle-chip active" : "toggle-chip"}
                      onClick={() => updateBillingField("sendAutomatically", !billingForm.sendAutomatically)}
                      type="button"
                    >
                      {billingForm.sendAutomatically ? "Caja prepara borradores" : "Solo manual desde caja"}
                    </button>
                  </label>

                  <label className="form-field checkbox-field">
                    <span>Perfil activo</span>
                    <button
                      className={billingForm.isActive ? "toggle-chip active" : "toggle-chip"}
                      onClick={() => updateBillingField("isActive", !billingForm.isActive)}
                      type="button"
                    >
                      {billingForm.isActive ? "Perfil activo" : "Perfil inactivo"}
                    </button>
                  </label>
                </div>

                <p className="helper-text">
                  Esta base no emite aun. Solo deja listo el maestro fiscal de Peru para el siguiente sprint SUNAT.
                </p>

                <div className="form-actions">
                  <button className="button ghost" onClick={resetBillingForm} type="button">
                    Restaurar datos
                  </button>
                  <button className="button primary" disabled={billingSubmitting} type="submit">
                    {billingSubmitting ? "Guardando..." : "Guardar base fiscal"}
                  </button>
                </div>
              </form>
            </Surface>

            <Surface className="maintenance-panel">
              <div className="section-copy">
                <span className="eyebrow">Preparacion operativa</span>
                <h2>Lo que ya queda cubierto en el sistema</h2>
                <p>Pedidos, caja y borradores ya pueden conservar la estructura tributaria sin transmitir a SUNAT.</p>
              </div>

              <div className="insight-strip">
                <div className="insight-chip">
                  <span>Pais activo</span>
                  <strong>{billingForm.countryCode}</strong>
                </div>
                <div className="insight-chip">
                  <span>Moneda base</span>
                  <strong>{billingForm.currencyCode}</strong>
                </div>
                <div className="insight-chip">
                  <span>IGV</span>
                  <strong>{billingForm.igvRate}%</strong>
                </div>
              </div>

              <div className="stack-list">
                <div className="timeline-row">
                  <div>
                    <strong>Emisor fiscal</strong>
                    <p>RUC, direccion, ubigeo, series y entorno quedan centralizados.</p>
                  </div>
                  <div className="timeline-meta">
                    <StatusBadge value={billingState.data.readiness.ready ? "Base lista" : "En preparacion"} />
                  </div>
                </div>
                <div className="timeline-row">
                  <div>
                    <strong>Caja POS</strong>
                    <p>La venta presencial ya puede pedir boleta o factura y guardar el borrador relacionado.</p>
                  </div>
                  <div className="timeline-meta">
                    <StatusBadge value="Integrado" />
                  </div>
                </div>
                <div className="timeline-row">
                  <div>
                    <strong>Documentos electronicos</strong>
                    <p>Se almacenan resumen, lineas y estado draft para preparar la futura emision.</p>
                  </div>
                  <div className="timeline-meta">
                    <StatusBadge value="Draft" />
                  </div>
                </div>
              </div>
            </Surface>
          </section>
        </>
      );
    }

    return (
      <>
        <section className="section-head">
          <div>
            <span className="eyebrow">Reportes</span>
            <h2>Lectura visual del comportamiento comercial.</h2>
          </div>
        </section>

        <section className="dashboard-grid">
          <Surface className="dashboard-surface">
            <TrendChart
              caption="traccion comparada por referencia"
              eyebrow="Demanda del catalogo"
              formatValue={(value) => `${value} uds`}
              points={topDemandPoints}
              summary={`${dashboardState.data.topProducts.reduce((sum, product) => sum + product.sold, 0)} uds`}
              title="Curva de top vendidos"
            />
          </Surface>

          <Surface className="dashboard-surface">
            <DistributionChart
              centerLabel="productos"
              centerValue={String(productsState.data.length)}
              eyebrow="Mix del inventario"
              items={inventoryMixItems}
              title="Estado del catalogo"
            />
          </Surface>
        </section>

        <section className="card-grid two">
          <Surface className="dashboard-surface">
            <div className="section-copy">
              <span className="eyebrow">Top vendidos</span>
              <h2>Ranking visual con intensidad</h2>
            </div>

            {topProductHighlights.length === 0 ? (
              <EmptyState
                title="Sin ranking disponible"
                description="Necesitamos ventas registradas para construir esta lectura."
              />
            ) : (
              <div className="chart-list elevated-chart-list">
                {topProductHighlights.map((product) => (
                  <div className="chart-row elevated-chart-row" key={product.name}>
                    <div className="chart-meta">
                      <strong>{product.name}</strong>
                      <span>
                        {product.category} · {product.sold} unidades
                      </span>
                    </div>
                    <div className="chart-bar">
                      <span style={{ width: `${(product.sold / maxTopSales) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface className="dashboard-surface">
            <div className="section-copy">
              <span className="eyebrow">Lecturas clave</span>
              <h2>Indicadores ejecutivos</h2>
            </div>
            <div className="report-pill-grid">
              <div className="report-pill">
                <span>Conversion</span>
                <strong>{dashboardState.data.conversionRate}%</strong>
                <small>meta operativa del portal</small>
              </div>
              <div className="report-pill">
                <span>Ticket promedio</span>
                <strong>{currency(averageTicket)}</strong>
                <small>promedio por orden registrada</small>
              </div>
              <div className="report-pill">
                <span>Feedback</span>
                <strong>{reviewAverage.toFixed(1)} / 5</strong>
                <small>percepcion media del cliente</small>
              </div>
              <div className="report-pill accent">
                <span>Ingreso del mes</span>
                <strong>{currency(dashboardState.data.revenueMonth)}</strong>
                <small>dato consolidado del dashboard</small>
              </div>
            </div>
          </Surface>
        </section>
      </>
    );
  }

  return (
    <div className="portal-shell admin-portal">
      <aside className="portal-sidebar admin-sidebar">
        <div className="brand-block portal-brand">
          <span className="brand-mark">FC</span>
          <div>
            <strong>Portal admin</strong>
            <small>Operaciones, ventas y analitica</small>
          </div>
        </div>

        <Surface className="profile-card admin-profile">
          <div className="avatar">{initials(user.fullName)}</div>
          <div>
            <strong>{user.fullName}</strong>
            <p>{user.email}</p>
          </div>
        </Surface>

        <PortalMenu active={activeSection} items={menuItems} onSelect={changeSection} />

        <Surface className="sidebar-note">
          <strong>Acceso protegido</strong>
          <p>Este panel solo responde a sesiones con rol administrador validadas por JWT.</p>
        </Surface>
      </aside>

      <main className="portal-main">
        <header className="portal-header">
          <div>
            <span className="eyebrow">Experiencia separada por rol</span>
            <h2>Administrador</h2>
          </div>
          <div className="header-actions">
            <button className="button ghost" onClick={() => void loadAdminData()} type="button">
              <RefreshCcw size={16} />
              Recargar panel
            </button>
            <button className="button secondary" onClick={onLogout} type="button">
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </div>
        </header>

        {dashboardState.error ? <div className="status-badge warning full-width">{dashboardState.error}</div> : null}
        {adminMessage ? <div className="notice-banner">{adminMessage}</div> : null}
        {productsState.error ? <div className="status-badge warning full-width">{productsState.error}</div> : null}
        {categoriesState.error ? <div className="status-badge warning full-width">{categoriesState.error}</div> : null}
        {usersState.error ? <div className="status-badge warning full-width">{usersState.error}</div> : null}
        {ordersState.error ? <div className="status-badge warning full-width">{ordersState.error}</div> : null}
        {billingState.error ? <div className="status-badge warning full-width">{billingState.error}</div> : null}

        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeState, setStoreState] = useState<AsyncState<StoreHomeResponse>>({
    data: emptyStore,
    loading: true,
    error: null
  });
  const [session, setSession] = useState<{
    booting: boolean;
    token: string | null;
    user: SessionUser | null;
  }>({
    booting: true,
    token: null,
    user: null
  });

  useEffect(() => {
    void loadStore();
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!token) {
      setSession({
        booting: false,
        token: null,
        user: null
      });
      return;
    }

    void restoreSession(token);
  }, []);

  async function loadStore() {
    try {
      setStoreState((current) => ({
        ...current,
        loading: true,
        error: null
      }));

      const store = await fetchStoreHome();

      setStoreState({
        data: store,
        loading: false,
        error: null
      });
    } catch (loadError) {
      setStoreState({
        data: emptyStore,
        loading: false,
        error: loadError instanceof Error ? loadError.message : "No fue posible cargar la vitrina."
      });
    }
  }

  async function restoreSession(token: string) {
    try {
      const response = await fetchCurrentSession(token);

      setSession({
        booting: false,
        token,
        user: response.user
      });
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession({
        booting: false,
        token: null,
        user: null
      });
    }
  }

  async function handleLogin(email: string, password: string) {
    const auth = await login({ email, password });
    window.localStorage.setItem(SESSION_STORAGE_KEY, auth.token);

    setSession({
      booting: false,
      token: auth.token,
      user: auth.user
    });

    return auth;
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession({
      booting: false,
      token: null,
      user: null
    });

    if (location.pathname.startsWith("/portal")) {
      navigate("/login", { replace: true });
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            store={storeState.data}
            loading={storeState.loading}
            error={storeState.error}
            booting={session.booting}
            user={session.user}
            onLogout={handleLogout}
          />
        }
      />
      <Route path="/login" element={<LoginPage booting={session.booting} user={session.user} onLogin={handleLogin} />} />
      <Route path="/portal" element={<Navigate to={session.user ? getPortalPath(session.user.role) : "/login"} replace />} />
      <Route
        path="/portal/cliente"
        element={
          <ProtectedRoute allowedRole="customer" booting={session.booting} user={session.user}>
            {session.user && session.token ? (
              <CustomerPortal
                onLogout={handleLogout}
                onRefreshStore={loadStore}
                storeState={storeState}
                token={session.token}
                user={session.user}
              />
            ) : null}
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/admin"
        element={
          <ProtectedRoute allowedRole="admin" booting={session.booting} user={session.user}>
            {session.user && session.token ? (
              <AdminPortal
                onLogout={handleLogout}
                reviews={storeState.data.reviews}
                token={session.token}
                user={session.user}
              />
            ) : null}
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/cajero"
        element={
          <ProtectedRoute allowedRole="cashier" booting={session.booting} user={session.user}>
            {session.user && session.token ? (
              <CashierPortal
                onLogout={handleLogout}
                onRefreshStore={loadStore}
                storeState={storeState}
                token={session.token}
                user={session.user}
              />
            ) : null}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
