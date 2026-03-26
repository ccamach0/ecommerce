export type StoreProduct = {
  id: string;
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
  description: string;
  status: "draft" | "active" | "archived";
  featured: boolean;
};

export const mockProducts: StoreProduct[] = [
  {
    id: "1b9267f3-7cd7-4c74-81ab-56b059b2a2af",
    name: "Chaqueta Urban Motion",
    slug: "chaqueta-urban-motion",
    category: "Chaquetas",
    color: "Negro",
    sizes: ["S", "M", "L"],
    stock: 18,
    basePrice: 219000,
    salePrice: 199000,
    likes: 142,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    description: "Chaqueta premium con silueta urbana, tacto suave y look contemporaneo.",
    status: "active",
    featured: true
  },
  {
    id: "5e422d2c-26b7-45cc-a02c-9491730b2d98",
    name: "Vestido Aura Linen",
    slug: "vestido-aura-linen",
    category: "Vestidos",
    color: "Beige",
    sizes: ["XS", "S", "M"],
    stock: 9,
    basePrice: 189000,
    salePrice: null,
    likes: 87,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    description: "Vestido fresco con caida natural para dias calidos y ocasiones especiales.",
    status: "active",
    featured: false
  },
  {
    id: "a5dcf0c6-5a4a-4e14-903e-0ee1dd07f9a7",
    name: "Sneakers Nova Run",
    slug: "sneakers-nova-run",
    category: "Calzado",
    color: "Blanco",
    sizes: ["38", "39", "40", "41"],
    stock: 25,
    basePrice: 249000,
    salePrice: 219000,
    likes: 210,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    description: "Tenis ligeros con gran soporte y una estetica deportiva muy limpia.",
    status: "active",
    featured: true
  },
  {
    id: "5513c188-bf17-448d-b102-9869b88c6b58",
    name: "Camisa Studio Fit",
    slug: "camisa-studio-fit",
    category: "Camisas",
    color: "Azul",
    sizes: ["S", "M", "L", "XL"],
    stock: 31,
    basePrice: 129000,
    salePrice: null,
    likes: 64,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80",
    description: "Camisa versatil con patron moderno para oficina o salida casual.",
    status: "active",
    featured: false
  }
];

export const mockOrders = [
  { orderId: "ORD-2001", total: 623000, status: "Entregado", items: 2, createdAt: "18 Mar 2026" },
  { orderId: "ORD-1984", total: 249000, status: "En camino", items: 1, createdAt: "12 Mar 2026" },
  { orderId: "ORD-1940", total: 518000, status: "Entregado", items: 3, createdAt: "03 Mar 2026" }
];

export const mockReviews = [
  { id: "r1", user: "Andrea", comment: "Excelente calidad y envio muy rapido.", score: 5 },
  { id: "r2", user: "Miguel", comment: "La talla coincide perfecto y el acabado se siente premium.", score: 4 },
  { id: "r3", user: "Sara", comment: "Muy buena experiencia de compra y una presentacion impecable.", score: 5 }
];

export const mockDashboard = {
  revenueMonth: 28400000,
  activeOrders: 184,
  lowStockProducts: 12,
  conversionRate: 4.9,
  topProducts: [
    { name: "Sneakers Nova Run", sold: 126 },
    { name: "Chaqueta Urban Motion", sold: 88 }
  ]
};
