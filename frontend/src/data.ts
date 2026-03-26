export type Product = {
  id: number;
  name: string;
  category: string;
  color: string;
  size: string[];
  price: number;
  previousPrice?: number;
  stock: number;
  likes: number;
  rating: number;
  featured?: boolean;
  image: string;
  description: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Chaqueta Urban Motion",
    category: "Chaquetas",
    color: "Negro",
    size: ["S", "M", "L"],
    price: 219000,
    previousPrice: 279000,
    stock: 18,
    likes: 142,
    rating: 4.8,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    description: "Chaqueta de corte limpio para looks urbanos con textura premium."
  },
  {
    id: 2,
    name: "Vestido Aura Linen",
    category: "Vestidos",
    color: "Beige",
    size: ["XS", "S", "M"],
    price: 189000,
    stock: 9,
    likes: 87,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    description: "Vestido ligero con caída natural y silueta elegante."
  },
  {
    id: 3,
    name: "Sneakers Nova Run",
    category: "Calzado",
    color: "Blanco",
    size: ["38", "39", "40", "41"],
    price: 249000,
    previousPrice: 299000,
    stock: 25,
    likes: 210,
    rating: 4.9,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    description: "Tenis diseñados para estilo diario con gran confort y presencia."
  },
  {
    id: 4,
    name: "Camisa Studio Fit",
    category: "Camisas",
    color: "Azul",
    size: ["S", "M", "L", "XL"],
    price: 129000,
    stock: 31,
    likes: 64,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80",
    description: "Camisa versátil para oficina o look casual refinado."
  }
];

export const adminStats = [
  { label: "Ventas del mes", value: "$28.4M", change: "+16%" },
  { label: "Órdenes activas", value: "184", change: "+8%" },
  { label: "Productos bajos", value: "12", change: "-3%" },
  { label: "Conversión", value: "4.9%", change: "+1.2%" }
];

export const sales = [
  { order: "#A-1029", customer: "Laura Díaz", total: "$389.000", status: "Pagado" },
  { order: "#A-1030", customer: "Carlos Pérez", total: "$249.000", status: "Enviado" },
  { order: "#A-1031", customer: "Paula Rojas", total: "$518.000", status: "Preparación" }
];

export const reviews = [
  { user: "Andrea", comment: "Excelente calidad y envío muy rápido.", score: 5 },
  { user: "Miguel", comment: "La talla coincidió perfecto, volveré a comprar.", score: 4 },
  { user: "Sara", comment: "Muy buena experiencia y diseño premium.", score: 5 }
];
