import { PoolClient } from "pg";
import { pool } from "../../config/db";

type BillingProfileRow = {
  id: string;
  country_code: string;
  legal_name: string | null;
  trade_name: string | null;
  tax_id: string | null;
  tax_id_type: string;
  fiscal_address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  ubigeo: string | null;
  establishment_code: string;
  currency_code: string;
  igv_rate: string | number;
  prices_include_tax: boolean;
  invoice_series: string;
  receipt_series: string;
  credit_note_series: string;
  debit_note_series: string;
  sunat_environment: "beta" | "production";
  emission_system: "own_software" | "sunat" | "pse";
  sol_user: string | null;
  certificate_alias: string | null;
  support_email: string | null;
  support_phone: string | null;
  send_automatically: boolean;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

type BillingProfilePayload = {
  countryCode: string;
  legalName?: string;
  tradeName?: string;
  taxId?: string;
  taxIdType: string;
  fiscalAddress?: string;
  department?: string;
  province?: string;
  district?: string;
  ubigeo?: string;
  establishmentCode: string;
  currencyCode: string;
  igvRate?: number;
  pricesIncludeTax: boolean;
  invoiceSeries?: string;
  receiptSeries?: string;
  creditNoteSeries?: string;
  debitNoteSeries?: string;
  sunatEnvironment: "beta" | "production";
  emissionSystem: "own_software" | "sunat" | "pse";
  solUser?: string;
  certificateAlias?: string;
  supportEmail?: string;
  supportPhone?: string;
  sendAutomatically: boolean;
  isActive: boolean;
};

type RecentElectronicDocumentRow = {
  id: string;
  order_number: string;
  document_type: "boleta" | "factura" | "credit_note" | "debit_note";
  status: "draft" | "ready" | "queued" | "sent" | "accepted" | "rejected" | "voided";
  series: string;
  correlative: string | number | null;
  total_amount: string | number;
  created_at: Date | string;
  customer_name: string | null;
};

type OrderDraftLineInput = {
  orderItemId: string;
  sku: string;
  description: string;
  quantity: number;
  unitValue: number;
  unitPrice: number;
  taxableAmount: number;
  igvAmount: number;
  totalAmount: number;
};

type OrderBillingDraftRequest = {
  orderId: string;
  orderNumber: string;
  actorUserId: string | null;
  documentType: "none" | "boleta" | "factura";
  customerName: string;
  customerEmail?: string;
  customerDocumentType?: string;
  customerDocumentNumber?: string;
  customerLegalName?: string;
  customerAddress?: string;
  taxableAmount: number;
  igvAmount: number;
  totalAmount: number;
  lines: OrderDraftLineInput[];
};

const DEFAULT_BILLING_PROFILE = {
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
  sunatEnvironment: "beta" as const,
  emissionSystem: "own_software" as const,
  solUser: "",
  certificateAlias: "",
  supportEmail: "",
  supportPhone: "",
  sendAutomatically: false,
  isActive: true
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function mapBillingProfile(row?: BillingProfileRow | null) {
  if (!row) {
    return {
      id: null,
      ...DEFAULT_BILLING_PROFILE
    };
  }

  return {
    id: row.id,
    countryCode: row.country_code,
    legalName: row.legal_name ?? "",
    tradeName: row.trade_name ?? "",
    taxId: row.tax_id ?? "",
    taxIdType: row.tax_id_type,
    fiscalAddress: row.fiscal_address ?? "",
    department: row.department ?? "",
    province: row.province ?? "",
    district: row.district ?? "",
    ubigeo: row.ubigeo ?? "",
    establishmentCode: row.establishment_code,
    currencyCode: row.currency_code,
    igvRate: Number(row.igv_rate ?? DEFAULT_BILLING_PROFILE.igvRate),
    pricesIncludeTax: Boolean(row.prices_include_tax),
    invoiceSeries: row.invoice_series,
    receiptSeries: row.receipt_series,
    creditNoteSeries: row.credit_note_series,
    debitNoteSeries: row.debit_note_series,
    sunatEnvironment: row.sunat_environment,
    emissionSystem: row.emission_system,
    solUser: row.sol_user ?? "",
    certificateAlias: row.certificate_alias ?? "",
    supportEmail: row.support_email ?? "",
    supportPhone: row.support_phone ?? "",
    sendAutomatically: Boolean(row.send_automatically),
    isActive: Boolean(row.is_active)
  };
}

function buildReadiness(profile: ReturnType<typeof mapBillingProfile>) {
  const checks = [
    {
      key: "issuer",
      label: "Emisor",
      detail: "Razon social y RUC",
      ready: Boolean(profile.legalName && /^\d{11}$/.test(profile.taxId))
    },
    {
      key: "address",
      label: "Domicilio fiscal",
      detail: "Direccion, ubigeo y ubicacion",
      ready: Boolean(profile.fiscalAddress && profile.department && profile.province && profile.district && /^\d{6}$/.test(profile.ubigeo))
    },
    {
      key: "series",
      label: "Series SUNAT",
      detail: "Factura y boleta base",
      ready: Boolean(profile.invoiceSeries && profile.receiptSeries)
    },
    {
      key: "tax",
      label: "Impuestos",
      detail: "Moneda PEN e IGV",
      ready: profile.currencyCode === "PEN" && profile.igvRate >= 0
    },
    {
      key: "operation",
      label: "Operacion",
      detail: "Entorno y sistema listos",
      ready: Boolean(profile.sunatEnvironment && profile.emissionSystem)
    }
  ];

  const readyCount = checks.filter((check) => check.ready).length;

  return {
    ready: readyCount === checks.length,
    readyCount,
    total: checks.length,
    checks
  };
}

function formatDocumentStatus(status: RecentElectronicDocumentRow["status"]) {
  const labels: Record<RecentElectronicDocumentRow["status"], string> = {
    draft: "Borrador",
    ready: "Listo",
    queued: "En cola",
    sent: "Enviado",
    accepted: "Aceptado",
    rejected: "Rechazado",
    voided: "Anulado"
  };

  return labels[status] ?? status;
}

function formatDocumentType(documentType: RecentElectronicDocumentRow["document_type"] | "none") {
  const labels: Record<RecentElectronicDocumentRow["document_type"] | "none", string> = {
    none: "Sin comprobante",
    boleta: "Boleta",
    factura: "Factura",
    credit_note: "Nota de credito",
    debit_note: "Nota de debito"
  };

  return labels[documentType] ?? documentType;
}

function mapRecentDocument(row: RecentElectronicDocumentRow) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    documentType: row.document_type,
    documentLabel: formatDocumentType(row.document_type),
    status: row.status,
    statusLabel: formatDocumentStatus(row.status),
    reference: row.correlative ? `${row.series}-${row.correlative}` : `${row.series}-BORRADOR`,
    total: Number(row.total_amount ?? 0),
    customerName: row.customer_name ?? "Consumidor final",
    createdAt: formatDate(row.created_at)
  };
}

export async function findActiveBillingProfile(client?: PoolClient) {
  const executor = client ?? pool;
  const result = await executor.query<BillingProfileRow>(
    `
      SELECT *
      FROM billing_profiles
      WHERE is_active = TRUE
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `
  );

  return mapBillingProfile(result.rows[0] ?? null);
}

export async function getBillingSettings() {
  const [profile, recentDocumentsResult] = await Promise.all([
    findActiveBillingProfile(),
    pool.query<RecentElectronicDocumentRow>(
      `
        SELECT
          ed.id,
          o.order_number,
          ed.document_type,
          ed.status,
          ed.series,
          ed.correlative,
          ed.total_amount,
          ed.created_at,
          COALESCE(obp.customer_legal_name, CONCAT(u.first_name, ' ', u.last_name)) AS customer_name
        FROM electronic_documents ed
        INNER JOIN orders o ON o.id = ed.order_id
        INNER JOIN users u ON u.id = o.user_id
        LEFT JOIN order_billing_profiles obp ON obp.order_id = o.id
        ORDER BY ed.created_at DESC
        LIMIT 8
      `
    )
  ]);

  return {
    profile,
    readiness: buildReadiness(profile),
    recentDocuments: recentDocumentsResult.rows.map(mapRecentDocument)
  };
}

export async function upsertBillingSettings(payload: BillingProfilePayload) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentProfile = await client.query<{ id: string }>(
      `
        SELECT id
        FROM billing_profiles
        WHERE is_active = TRUE
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
      `
    );

    const values = [
      payload.countryCode,
      payload.legalName ?? null,
      payload.tradeName ?? null,
      payload.taxId ?? null,
      payload.taxIdType,
      payload.fiscalAddress ?? null,
      payload.department ?? null,
      payload.province ?? null,
      payload.district ?? null,
      payload.ubigeo ?? null,
      payload.establishmentCode,
      payload.currencyCode,
      payload.igvRate ?? DEFAULT_BILLING_PROFILE.igvRate,
      payload.pricesIncludeTax,
      payload.invoiceSeries ?? DEFAULT_BILLING_PROFILE.invoiceSeries,
      payload.receiptSeries ?? DEFAULT_BILLING_PROFILE.receiptSeries,
      payload.creditNoteSeries ?? DEFAULT_BILLING_PROFILE.creditNoteSeries,
      payload.debitNoteSeries ?? DEFAULT_BILLING_PROFILE.debitNoteSeries,
      payload.sunatEnvironment,
      payload.emissionSystem,
      payload.solUser ?? null,
      payload.certificateAlias ?? null,
      payload.supportEmail ?? null,
      payload.supportPhone ?? null,
      payload.sendAutomatically,
      payload.isActive
    ];

    if (currentProfile.rows[0]?.id) {
      await client.query(
        `
          UPDATE billing_profiles
          SET
            country_code = $2,
            legal_name = $3,
            trade_name = $4,
            tax_id = $5,
            tax_id_type = $6,
            fiscal_address = $7,
            department = $8,
            province = $9,
            district = $10,
            ubigeo = $11,
            establishment_code = $12,
            currency_code = $13,
            igv_rate = $14,
            prices_include_tax = $15,
            invoice_series = $16,
            receipt_series = $17,
            credit_note_series = $18,
            debit_note_series = $19,
            sunat_environment = $20,
            emission_system = $21,
            sol_user = $22,
            certificate_alias = $23,
            support_email = $24,
            support_phone = $25,
            send_automatically = $26,
            is_active = $27,
            updated_at = NOW()
          WHERE id = $1
        `,
        [currentProfile.rows[0].id, ...values]
      );
    } else {
      await client.query(
        `
          INSERT INTO billing_profiles (
            country_code,
            legal_name,
            trade_name,
            tax_id,
            tax_id_type,
            fiscal_address,
            department,
            province,
            district,
            ubigeo,
            establishment_code,
            currency_code,
            igv_rate,
            prices_include_tax,
            invoice_series,
            receipt_series,
            credit_note_series,
            debit_note_series,
            sunat_environment,
            emission_system,
            sol_user,
            certificate_alias,
            support_email,
            support_phone,
            send_automatically,
            is_active
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26
          )
        `,
        values
      );
    }

    await client.query("COMMIT");

    return getBillingSettings();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createOrderBillingDraft(request: OrderBillingDraftRequest, client: PoolClient) {
  const shouldPersistFiscalData =
    request.documentType !== "none" ||
    Boolean(request.customerDocumentNumber) ||
    Boolean(request.customerLegalName) ||
    Boolean(request.customerAddress);

  if (!shouldPersistFiscalData) {
    return null;
  }

  const profile = await findActiveBillingProfile(client);
  const customerName = request.customerLegalName?.trim() || request.customerName.trim() || "Consumidor final";
  const isFinalConsumer = request.documentType === "boleta" && !request.customerDocumentNumber;

  await client.query(
    `
      INSERT INTO order_billing_profiles (
        order_id,
        document_type,
        customer_document_type,
        customer_document_number,
        customer_legal_name,
        customer_address,
        customer_email,
        currency_code,
        taxable_amount,
        igv_amount,
        total_amount,
        is_final_consumer
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (order_id)
      DO UPDATE SET
        document_type = EXCLUDED.document_type,
        customer_document_type = EXCLUDED.customer_document_type,
        customer_document_number = EXCLUDED.customer_document_number,
        customer_legal_name = EXCLUDED.customer_legal_name,
        customer_address = EXCLUDED.customer_address,
        customer_email = EXCLUDED.customer_email,
        currency_code = EXCLUDED.currency_code,
        taxable_amount = EXCLUDED.taxable_amount,
        igv_amount = EXCLUDED.igv_amount,
        total_amount = EXCLUDED.total_amount,
        is_final_consumer = EXCLUDED.is_final_consumer,
        updated_at = NOW()
    `,
    [
      request.orderId,
      request.documentType,
      request.customerDocumentType ?? null,
      request.customerDocumentNumber ?? null,
      customerName,
      request.customerAddress ?? null,
      request.customerEmail ?? null,
      profile.currencyCode,
      roundMoney(request.taxableAmount),
      roundMoney(request.igvAmount),
      roundMoney(request.totalAmount),
      isFinalConsumer
    ]
  );

  if (request.documentType === "none") {
    return null;
  }

  const series =
    request.documentType === "factura" ? profile.invoiceSeries : profile.receiptSeries;
  const issueDate = new Date().toISOString().slice(0, 10);
  const payload = {
    issuer: {
      legalName: profile.legalName,
      tradeName: profile.tradeName,
      taxId: profile.taxId,
      taxIdType: profile.taxIdType,
      fiscalAddress: profile.fiscalAddress,
      ubigeo: profile.ubigeo,
      department: profile.department,
      province: profile.province,
      district: profile.district,
      establishmentCode: profile.establishmentCode
    },
    customer: {
      name: customerName,
      documentType: request.customerDocumentType ?? null,
      documentNumber: request.customerDocumentNumber ?? null,
      address: request.customerAddress ?? null,
      email: request.customerEmail ?? null
    },
    order: {
      orderId: request.orderId,
      orderNumber: request.orderNumber
    },
    summary: {
      currencyCode: profile.currencyCode,
      taxableAmount: roundMoney(request.taxableAmount),
      igvAmount: roundMoney(request.igvAmount),
      totalAmount: roundMoney(request.totalAmount)
    },
    lines: request.lines
  };

  const documentResult = await client.query<{
    id: string;
    document_type: "boleta" | "factura";
    status: "draft";
    series: string;
    issue_date: string;
  }>(
    `
      INSERT INTO electronic_documents (
        order_id,
        billing_profile_id,
        document_type,
        series,
        issue_date,
        currency_code,
        taxable_amount,
        igv_amount,
        total_amount,
        status,
        payload,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10::jsonb, $11)
      RETURNING id, document_type, status, series, issue_date
    `,
    [
      request.orderId,
      profile.id,
      request.documentType,
      series,
      issueDate,
      profile.currencyCode,
      roundMoney(request.taxableAmount),
      roundMoney(request.igvAmount),
      roundMoney(request.totalAmount),
      JSON.stringify(payload),
      request.actorUserId
    ]
  );

  const document = documentResult.rows[0];

  for (const [index, line] of request.lines.entries()) {
    await client.query(
      `
        INSERT INTO electronic_document_lines (
          electronic_document_id,
          order_item_id,
          line_number,
          item_code,
          description,
          unit_code,
          quantity,
          unit_value,
          unit_price,
          taxable_amount,
          igv_amount,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, 'NIU', $6, $7, $8, $9, $10, $11)
      `,
      [
        document.id,
        line.orderItemId,
        index + 1,
        line.sku || null,
        line.description,
        line.quantity,
        roundMoney(line.unitValue),
        roundMoney(line.unitPrice),
        roundMoney(line.taxableAmount),
        roundMoney(line.igvAmount),
        roundMoney(line.totalAmount)
      ]
    );
  }

  return {
    id: document.id,
    documentType: document.document_type,
    documentLabel: formatDocumentType(document.document_type),
    status: document.status,
    statusLabel: formatDocumentStatus(document.status),
    reference: `${document.series}-BORRADOR`,
    total: roundMoney(request.totalAmount),
    createdAt: formatDate(document.issue_date)
  };
}
