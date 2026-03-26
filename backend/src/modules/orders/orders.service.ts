import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { pool } from "../../config/db";
import { mockOrders } from "../../data/mock-store";
import { HttpError } from "../../utils/http-error";
import { createOrderBillingDraft, findActiveBillingProfile } from "../billing/billing.service";

type OrderRow = {
  order_number: string;
  grand_total: string | number;
  status: string;
  items: string | number;
  created_at: Date | string;
  customer_name?: string;
};

type ListOrdersOptions = {
  userId?: string;
  role?: "admin" | "customer" | "cashier";
};

type PosOrderPayload = {
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

type PosVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  stock: number;
  reserved_stock: number;
  product_name: string;
  base_price: string | number;
  sale_price: string | number | null;
};

type PosCustomerRow = {
  id: string;
  role: "admin" | "customer" | "cashier";
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
};

type InsertedOrderItemRow = {
  id: string;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatOrderStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    processing: "Preparando",
    shipped: "En camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado"
  };

  return map[status] ?? status;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function splitCustomerName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const [firstName = "Cliente", ...rest] = normalized.split(" ");

  return {
    firstName,
    lastName: rest.join(" ") || "Mostrador"
  };
}

function buildOrderNumber(prefix: "ORD" | "POS" = "ORD") {
  const timestamp = Date.now().toString().slice(-8);
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `${prefix}-${timestamp}-${suffix}`;
}

async function resolveCashierActorId(actorId: string) {
  const result = await pool.query<{ id: string }>("SELECT id FROM users WHERE id = $1 LIMIT 1", [actorId]);
  return result.rows[0]?.id ?? null;
}

async function ensurePosCustomer(payload: PosOrderPayload) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (payload.customerEmail) {
      const existingUser = await client.query<PosCustomerRow>(
        `
          SELECT id, role, first_name, last_name, email, is_active
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [payload.customerEmail]
      );

      const foundUser = existingUser.rows[0];

      if (foundUser?.is_active) {
        await client.query("COMMIT");
        return {
          id: foundUser.id,
          fullName: `${foundUser.first_name} ${foundUser.last_name}`.trim()
        };
      }
    }

    const walkInEmail = payload.customerEmail?.trim().toLowerCase() || "tienda@fashioncommerce.pe";
    const { firstName, lastName } = splitCustomerName(payload.customerLegalName ?? payload.customerName);
    const generatedPasswordHash = await bcrypt.hash(randomUUID(), 10);

    const createdUser = await client.query<{ id: string; full_name: string }>(
      `
        INSERT INTO users (role, first_name, last_name, email, password_hash, phone, is_active)
        VALUES ('customer', $1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (email)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = COALESCE(EXCLUDED.phone, users.phone),
          is_active = TRUE,
          updated_at = NOW()
        RETURNING id, CONCAT(first_name, ' ', last_name) AS full_name
      `,
      [firstName, lastName, walkInEmail, generatedPasswordHash, payload.customerPhone ?? null]
    );

    await client.query("COMMIT");

    return {
      id: createdUser.rows[0].id,
      fullName: createdUser.rows[0].full_name
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrders(options: ListOrdersOptions = {}) {
  try {
    const limit = options.role === "customer" ? 6 : 12;
    const result = await pool.query<OrderRow>("SELECT * FROM app_get_orders($1, $2, $3)", [
      options.userId ?? null,
      options.role ?? "admin",
      limit
    ]);

    if (result.rows.length > 0) {
      return result.rows.map((row) => ({
        orderId: row.order_number,
        total: Number(row.grand_total),
        status: formatOrderStatus(row.status),
        items: Number(row.items),
        createdAt: formatDate(row.created_at),
        customerName: row.customer_name
      }));
    }

    return mockOrders;
  } catch {
    return mockOrders;
  }
}

export async function createPosOrder(payload: PosOrderPayload, actorId: string) {
  if (payload.items.length === 0) {
    throw new HttpError(400, "Debes agregar al menos un producto a la venta.");
  }

  const client = await pool.connect();

  try {
    const customer = await ensurePosCustomer(payload);
    const actorUserId = await resolveCashierActorId(actorId);
    const variantIds = payload.items.map((item) => item.variantId);
    const billingProfile = await findActiveBillingProfile(client);
    const igvRate = Number(billingProfile.igvRate ?? 18);
    const igvDivisor = 1 + igvRate / 100;

    await client.query("BEGIN");

    const variantsResult = await client.query<PosVariantRow>(
      `
        SELECT
          v.id,
          v.product_id,
          v.sku,
          v.size,
          v.stock,
          v.reserved_stock,
          p.name AS product_name,
          p.base_price,
          p.sale_price
        FROM product_variants v
        INNER JOIN products p ON p.id = v.product_id
        WHERE v.id = ANY($1::uuid[])
        FOR UPDATE
      `,
      [variantIds]
    );

    const variantsMap = new Map(variantsResult.rows.map((variant) => [variant.id, variant]));
    const orderLines = payload.items.map((item) => {
      const variant = variantsMap.get(item.variantId);

      if (!variant) {
        throw new HttpError(404, "Una variante seleccionada ya no existe.");
      }

      if (variant.stock < item.quantity) {
        throw new HttpError(400, `Stock insuficiente para ${variant.product_name} talla ${variant.size}.`);
      }

      const unitPrice = Number(variant.sale_price ?? variant.base_price ?? 0);
      const grossLineTotal = roundMoney(unitPrice * item.quantity);
      const taxableAmount = roundMoney(grossLineTotal / igvDivisor);
      const igvAmount = roundMoney(grossLineTotal - taxableAmount);

      return {
        ...item,
        variant,
        unitPrice,
        unitValue: roundMoney(unitPrice / igvDivisor),
        taxableAmount,
        igvAmount,
        lineTotal: grossLineTotal
      };
    });

    const subtotal = roundMoney(orderLines.reduce((sum, line) => sum + line.taxableAmount, 0));
    const taxTotal = roundMoney(orderLines.reduce((sum, line) => sum + line.igvAmount, 0));
    const grandTotal = roundMoney(orderLines.reduce((sum, line) => sum + line.lineTotal, 0));
    const totalItems = orderLines.reduce((sum, line) => sum + line.quantity, 0);

    if (payload.paymentMethod === "cash" && (payload.amountReceived ?? 0) < grandTotal) {
      throw new HttpError(400, "El efectivo recibido no cubre el total de la venta.");
    }

    const orderId = randomUUID();
    const orderNumber = buildOrderNumber("POS");
    const notes = [
      `Venta presencial POS`,
      `Cliente: ${payload.customerName}`,
      payload.documentType !== "none" ? `Comprobante: ${payload.documentType}` : null,
      `Medio de pago: ${payload.paymentMethod}`,
      payload.amountReceived ? `Recibido: ${payload.amountReceived}` : null,
      payload.notes?.trim() || null
    ]
      .filter(Boolean)
      .join(" | ");

    await client.query(
      `
        INSERT INTO orders (
          id,
          user_id,
          order_number,
          status,
          subtotal,
          discount_total,
          shipping_total,
          tax_total,
          grand_total,
          notes,
          paid_at
        )
        VALUES ($1, $2, $3, 'paid', $4, 0, 0, $5, $6, $7, NOW())
      `,
      [orderId, customer.id, orderNumber, subtotal, taxTotal, grandTotal, notes || null]
    );

    const insertedItems: Array<{
      id: string;
      sku: string;
      description: string;
      quantity: number;
      unitValue: number;
      unitPrice: number;
      taxableAmount: number;
      igvAmount: number;
      totalAmount: number;
    }> = [];

    for (const line of orderLines) {
      const orderItemResult = await client.query<InsertedOrderItemRow>(
        `
          INSERT INTO order_items (
            order_id,
            product_variant_id,
            product_name_snapshot,
            sku_snapshot,
            quantity,
            unit_price,
            line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          orderId,
          line.variant.id,
          `${line.variant.product_name} - ${line.variant.size}`,
          line.variant.sku,
          line.quantity,
          line.unitPrice,
          line.lineTotal
        ]
      );

      insertedItems.push({
        id: orderItemResult.rows[0].id,
        sku: line.variant.sku,
        description: `${line.variant.product_name} - ${line.variant.size}`,
        quantity: line.quantity,
        unitValue: line.unitValue,
        unitPrice: line.unitPrice,
        taxableAmount: line.taxableAmount,
        igvAmount: line.igvAmount,
        totalAmount: line.lineTotal
      });

      await client.query(
        `
          UPDATE product_variants
          SET stock = stock - $2
          WHERE id = $1
        `,
        [line.variant.id, line.quantity]
      );

      await client.query(
        `
          INSERT INTO inventory_movements (
            product_variant_id,
            movement_type,
            quantity,
            reason,
            reference_type,
            reference_id,
            created_by
          )
          VALUES ($1, 'out', $2, $3, 'order', $4, $5)
        `,
        [line.variant.id, line.quantity, "Venta presencial POS", orderId, actorUserId]
      );
    }

    await client.query(
      `
        INSERT INTO payments (order_id, provider, provider_reference, status, amount, currency, paid_at)
        VALUES ($1, 'manual', $2, 'paid', $3, $4, NOW())
      `,
      [orderId, payload.paymentMethod, grandTotal, billingProfile.currencyCode]
    );

    const billingDraft = await createOrderBillingDraft(
      {
        orderId,
        orderNumber,
        actorUserId,
        documentType: payload.documentType,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerDocumentType: payload.customerDocumentType,
        customerDocumentNumber: payload.customerDocumentNumber,
        customerLegalName: payload.customerLegalName,
        customerAddress: payload.customerAddress,
        taxableAmount: subtotal,
        igvAmount: taxTotal,
        totalAmount: grandTotal,
        lines: insertedItems.map((item) => ({
          orderItemId: item.id,
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          unitValue: item.unitValue,
          unitPrice: item.unitPrice,
          taxableAmount: item.taxableAmount,
          igvAmount: item.igvAmount,
          totalAmount: item.totalAmount
        }))
      },
      client
    );

    await client.query("COMMIT");

    return {
      orderId: orderNumber,
      total: grandTotal,
      status: formatOrderStatus("paid"),
      items: totalItems,
      createdAt: formatDate(new Date()),
      customerName: customer.fullName,
      billingDraft
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
