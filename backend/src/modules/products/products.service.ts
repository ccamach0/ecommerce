import { PoolClient } from "pg";
import { randomUUID } from "crypto";
import { pool } from "../../config/db";
import { mockProducts } from "../../data/mock-store";
import { HttpError } from "../../utils/http-error";

type ListProductsOptions = {
  includeInactive?: boolean;
  productId?: string;
};

type ProductVariantRecord = {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  reservedStock: number;
  barcode: string | null;
  weightGrams: number | null;
};

type ProductRecord = {
  id: string;
  category_id: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  material: string | null;
  gender: string | null;
  base_price: string | number;
  sale_price: string | number | null;
  status: "draft" | "active" | "archived";
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  image: string | null;
  image_alt_text: string | null;
  likes: string | number;
  rating: string | number;
  variants: ProductVariantRecord[] | string | null;
};

type ProductImageRecord = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
};

type ExistingVariantRow = {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  reserved_stock: number;
  barcode: string | null;
  weight_grams: number | null;
  has_orders: boolean;
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
};

type ProductPayload = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number;
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
    weightGrams?: number;
  }>;
};

function normalizeSizes(variants: ProductVariantRecord[]) {
  return Array.from(
    new Set(
      variants.flatMap((variant) =>
        variant.size
          .split("|")
          .map((size) => size.trim())
          .filter(Boolean)
      )
    )
  );
}

function parseVariants(value: ProductRecord["variants"]) {
  if (!value) {
    return [];
  }

  const parsedValue = typeof value === "string" ? (JSON.parse(value) as ProductVariantRecord[]) : value;

  return parsedValue.map((variant) => ({
    ...variant,
    stock: Number(variant.stock ?? 0),
    reservedStock: Number(variant.reservedStock ?? 0),
    weightGrams: variant.weightGrams === null ? null : Number(variant.weightGrams)
  }));
}

function mapImages(images: ProductImageRecord[]) {
  return images
    .map((image) => ({
      id: image.id,
      url: image.image_url,
      altText: image.alt_text,
      isPrimary: Boolean(image.is_primary),
      sortOrder: Number(image.sort_order ?? 0)
    }))
    .sort((left, right) => {
      if (Number(right.isPrimary) !== Number(left.isPrimary)) {
        return Number(right.isPrimary) - Number(left.isPrimary);
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id.localeCompare(right.id);
    });
}

async function listProductImagesByProductIds(productIds: string[], client?: PoolClient) {
  if (productIds.length === 0) {
    return new Map<string, ProductImageRecord[]>();
  }

  const executor = client ?? pool;
  const result = await executor.query<ProductImageRecord>(
    `
      SELECT id, product_id, image_url, alt_text, is_primary, sort_order
      FROM product_images
      WHERE product_id = ANY($1::uuid[])
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `,
    [productIds]
  );

  return result.rows.reduce<Map<string, ProductImageRecord[]>>((accumulator, image) => {
    const current = accumulator.get(image.product_id) ?? [];
    current.push(image);
    accumulator.set(image.product_id, current);
    return accumulator;
  }, new Map<string, ProductImageRecord[]>());
}

function mapRow(row: ProductRecord, productImages: ProductImageRecord[] = []) {
  const variants = parseVariants(row.variants);
  const images = mapImages(productImages);
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;

  return {
    id: row.id,
    categoryId: row.category_id,
    category: row.category,
    name: row.name,
    slug: row.slug,
    description: row.description,
    brand: row.brand,
    material: row.material,
    gender: row.gender,
    color: variants[0]?.color ?? "Unico",
    sizes: normalizeSizes(variants),
    stock: variants.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0),
    basePrice: Number(row.base_price ?? 0),
    salePrice: row.sale_price === null ? null : Number(row.sale_price),
    likes: Number(row.likes ?? 0),
    rating: Number(row.rating ?? 4.7),
    image: primaryImage?.url ?? row.image ?? mockProducts[0].image,
    imageAltText: primaryImage?.altText ?? row.image_alt_text,
    images,
    status: row.status,
    featured: Boolean(row.featured),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    variants
  };
}

function buildSku(slug: string, size: string, index: number) {
  const base = slug
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 12);

  const sizePart = size
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 8);

  return `${base || "ITEM"}-${sizePart || "UNI"}-${String(index + 1).padStart(2, "0")}`;
}

async function getProductById(productId: string, client?: PoolClient) {
  const executor = client ?? pool;
  const result = await executor.query<ProductRecord>("SELECT * FROM app_get_products(TRUE, $1)", [productId]);

  if (!result.rows[0]) {
    return null;
  }

  const imagesMap = await listProductImagesByProductIds([productId], client);
  return mapRow(result.rows[0], imagesMap.get(productId) ?? []);
}

async function listExistingVariants(productId: string, client: PoolClient) {
  const result = await client.query<ExistingVariantRow>(
    `
      SELECT
        v.id,
        v.sku,
        v.color,
        v.size,
        v.stock,
        v.reserved_stock,
        v.barcode,
        v.weight_grams,
        EXISTS (
          SELECT 1
          FROM order_items oi
          WHERE oi.product_variant_id = v.id
        ) AS has_orders
      FROM product_variants v
      WHERE v.product_id = $1
      ORDER BY v.created_at ASC, v.id ASC
    `,
    [productId]
  );

  return result.rows;
}

async function listExistingImages(productId: string, client: PoolClient) {
  const result = await client.query<ProductImageRecord>(
    `
      SELECT id, product_id, image_url, alt_text, is_primary, sort_order
      FROM product_images
      WHERE product_id = $1
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `,
    [productId]
  );

  return result.rows;
}

function normalizeImagesMeta(payload: ProductPayload, uploadedImageUrls: string[]) {
  const rawItems = payload.imagesMeta.length > 0
    ? payload.imagesMeta
    : uploadedImageUrls.map((_, index) => ({
        id: undefined,
        altText: payload.imageAltText,
        isPrimary: index === 0,
        sortOrder: index,
        uploadIndex: index
      }));

  const normalized = rawItems.map((image, index) => ({
    id: image.id,
    altText: image.altText,
    isPrimary: Boolean(image.isPrimary),
    sortOrder: Number.isFinite(image.sortOrder) ? image.sortOrder : index,
    uploadIndex: image.uploadIndex
  }));

  if (normalized.length > 0 && !normalized.some((image) => image.isPrimary)) {
    normalized[0].isPrimary = true;
  }

  return normalized
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image, index) => ({
      ...image,
      isPrimary: normalized.some((item) => item.isPrimary) ? image.isPrimary : index === 0,
      sortOrder: index
    }));
}

async function syncProductImages(productId: string, payload: ProductPayload, uploadedImageUrls: string[], client: PoolClient) {
  const existingImages = await listExistingImages(productId, client);
  const normalizedMeta = normalizeImagesMeta(payload, uploadedImageUrls);
  const existingMap = new Map(existingImages.map((image) => [image.id, image]));
  const incomingIds = new Set(normalizedMeta.map((image) => image.id).filter(Boolean) as string[]);
  const removedImageUrls: string[] = [];

  for (const existingImage of existingImages) {
    if (!incomingIds.has(existingImage.id)) {
      removedImageUrls.push(existingImage.image_url);
      await client.query("DELETE FROM product_images WHERE id = $1", [existingImage.id]);
    }
  }

  for (const image of normalizedMeta) {
    const imageUrl =
      image.uploadIndex === undefined ? undefined : uploadedImageUrls[image.uploadIndex];

    if (image.uploadIndex !== undefined && !imageUrl) {
      throw new HttpError(400, "Una de las imagenes nuevas no pudo asociarse correctamente.");
    }

    if (image.id && existingMap.has(image.id)) {
      await client.query(
        `
          UPDATE product_images
          SET
            alt_text = $2,
            is_primary = $3,
            sort_order = $4
          WHERE id = $1
        `,
        [image.id, image.altText ?? null, image.isPrimary, image.sortOrder]
      );

      continue;
    }

    if (!imageUrl) {
      continue;
    }

    await client.query(
      `
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [productId, imageUrl, image.altText ?? null, image.isPrimary, image.sortOrder]
    );
  }

  return removedImageUrls;
}

async function syncVariants(productId: string, payload: ProductPayload, client: PoolClient) {
  const existingVariants = await listExistingVariants(productId, client);
  const existingMap = new Map(existingVariants.map((variant) => [variant.id, variant]));
  const incomingIds = new Set(payload.variants.map((variant) => variant.id).filter(Boolean) as string[]);

  for (const existingVariant of existingVariants) {
    if (!incomingIds.has(existingVariant.id)) {
      if (existingVariant.has_orders) {
        throw new HttpError(400, "No puedes eliminar variantes con historial de venta.");
      }

      await client.query("DELETE FROM product_variants WHERE id = $1", [existingVariant.id]);
    }
  }

  for (const [index, variant] of payload.variants.entries()) {
    const sku = variant.sku?.trim() || buildSku(payload.slug, variant.size, index);

    if (variant.id && existingMap.has(variant.id)) {
      const existingVariant = existingMap.get(variant.id)!;

      if (existingVariant.has_orders && existingVariant.size !== variant.size) {
        throw new HttpError(400, "No puedes cambiar la talla de una variante con historial de venta.");
      }

      await client.query(
        `
          UPDATE product_variants
          SET
            sku = $2,
            color = $3,
            size = $4,
            stock = $5,
            barcode = $6,
            weight_grams = $7
          WHERE id = $1
        `,
        [
          variant.id,
          sku,
          payload.color,
          variant.size,
          variant.stock,
          variant.barcode ?? null,
          variant.weightGrams ?? null
        ]
      );

      continue;
    }

    await client.query(
      `
        INSERT INTO product_variants (
          product_id,
          sku,
          color,
          size,
          stock,
          reserved_stock,
          barcode,
          weight_grams
        )
        VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
      `,
      [productId, sku, payload.color, variant.size, variant.stock, variant.barcode ?? null, variant.weightGrams ?? null]
    );
  }
}

async function listProductImageUrls(productId: string, client: PoolClient) {
  const result = await client.query<{ image_url: string | null }>(
    `
      SELECT image_url
      FROM product_images
      WHERE product_id = $1
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `,
    [productId]
  );

  return result.rows.map((row) => row.image_url).filter((value): value is string => Boolean(value));
}

export async function listProducts(options: ListProductsOptions = {}) {
  try {
    const result = await pool.query<ProductRecord>("SELECT * FROM app_get_products($1, $2)", [
      Boolean(options.includeInactive),
      options.productId ?? null
    ]);

    if (result.rows.length > 0) {
      const imagesMap = await listProductImagesByProductIds(result.rows.map((row) => row.id));
      return result.rows.map((row) => mapRow(row, imagesMap.get(row.id) ?? []));
    }

    return mockProducts;
  } catch {
    return mockProducts;
  }
}

export async function listProductCategories() {
  const result = await pool.query<CategoryRecord>("SELECT * FROM app_get_active_categories()");

  return result.rows;
}

export async function createProduct(payload: ProductPayload, imageUrls: string[] = []) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productId = randomUUID();

    await client.query(
      `
        INSERT INTO products (
          id,
          category_id,
          name,
          slug,
          description,
          brand,
          material,
          gender,
          base_price,
          sale_price,
          status,
          is_featured,
          seo_title,
          seo_description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
      [
        productId,
        payload.categoryId,
        payload.name,
        payload.slug,
        payload.description,
        payload.brand ?? null,
        payload.material ?? null,
        payload.gender ?? null,
        payload.basePrice,
        payload.salePrice ?? null,
        payload.status,
        payload.featured,
        payload.seoTitle ?? null,
        payload.seoDescription ?? null
      ]
    );

    await syncVariants(productId, payload, client);
    await syncProductImages(productId, payload, imageUrls, client);

    await client.query("COMMIT");

    return getProductById(productId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProduct(productId: string, payload: ProductPayload, imageUrls: string[] = []) {
  const client = await pool.connect();

  try {
    const existingProduct = await getProductById(productId, client);

    if (!existingProduct) {
      throw new HttpError(404, "Producto no encontrado.");
    }

    await client.query("BEGIN");

    await client.query(
      `
        UPDATE products
        SET
          category_id = $2,
          name = $3,
          slug = $4,
          description = $5,
          brand = $6,
          material = $7,
          gender = $8,
          base_price = $9,
          sale_price = $10,
          status = $11,
          is_featured = $12,
          seo_title = $13,
          seo_description = $14,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        productId,
        payload.categoryId,
        payload.name,
        payload.slug,
        payload.description,
        payload.brand ?? null,
        payload.material ?? null,
        payload.gender ?? null,
        payload.basePrice,
        payload.salePrice ?? null,
        payload.status,
        payload.featured,
        payload.seoTitle ?? null,
        payload.seoDescription ?? null
      ]
    );

    await syncVariants(productId, payload, client);
    const removedImageUrls = await syncProductImages(productId, payload, imageUrls, client);

    await client.query("COMMIT");

    return {
      product: await getProductById(productId),
      removedImageUrls
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProduct(productId: string) {
  const client = await pool.connect();

  try {
    const existingProduct = await getProductById(productId, client);

    if (!existingProduct) {
      throw new HttpError(404, "Producto no encontrado.");
    }

    const imageUrls = await listProductImageUrls(productId, client);
    const result = await client.query<{ related_orders: string | number }>(
      `
        SELECT COUNT(*) AS related_orders
        FROM order_items oi
        INNER JOIN product_variants v ON v.id = oi.product_variant_id
        WHERE v.product_id = $1
      `,
      [productId]
    );

    const relatedOrders = Number(result.rows[0]?.related_orders ?? 0);

    await client.query("BEGIN");

    if (relatedOrders > 0) {
      await client.query(
        `
          UPDATE products
          SET status = 'archived', is_featured = FALSE, updated_at = NOW()
          WHERE id = $1
        `,
        [productId]
      );

      await client.query("COMMIT");

      return {
        mode: "archived" as const,
        imageUrls: [] as string[]
      };
    }

    await client.query("DELETE FROM products WHERE id = $1", [productId]);
    await client.query("COMMIT");

    return {
      mode: "deleted" as const,
      imageUrls
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
