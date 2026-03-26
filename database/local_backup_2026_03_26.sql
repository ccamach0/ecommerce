--
-- PostgreSQL database dump
--

\restrict FfdzbJpTk803gC0cf5HicRYjzJYnLaQgK8KC8mqxnGTCCgNGm1OORBmE0UYiaH9

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: billing_document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_document_status AS ENUM (
    'draft',
    'ready',
    'queued',
    'sent',
    'accepted',
    'rejected',
    'voided'
);


--
-- Name: billing_document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_document_type AS ENUM (
    'none',
    'boleta',
    'factura',
    'credit_note',
    'debit_note'
);


--
-- Name: inventory_movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_movement_type AS ENUM (
    'in',
    'out',
    'adjustment'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


--
-- Name: payment_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_provider AS ENUM (
    'manual',
    'stripe',
    'mercado_pago',
    'wompi'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'authorized',
    'paid',
    'failed',
    'refunded'
);


--
-- Name: product_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_status AS ENUM (
    'draft',
    'active',
    'archived'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'customer',
    'cashier'
);


--
-- Name: app_count_active_admins(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_count_active_admins(excluded_user_id uuid DEFAULT NULL::uuid) RETURNS bigint
    LANGUAGE sql STABLE
    AS $$
  SELECT COUNT(*)
  FROM users u
  WHERE u.role = 'admin'
    AND u.is_active = TRUE
    AND (excluded_user_id IS NULL OR u.id <> excluded_user_id);
$$;


--
-- Name: app_find_email_conflict(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_find_email_conflict(request_email text, ignored_user_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT u.id
  FROM users u
  WHERE LOWER(u.email) = LOWER(request_email)
    AND (ignored_user_id IS NULL OR u.id <> ignored_user_id)
  LIMIT 1;
$$;


--
-- Name: app_get_active_categories(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_active_categories() RETURNS TABLE(id uuid, name text, slug text)
    LANGUAGE sql STABLE
    AS $$
  SELECT c.id, c.name, c.slug
  FROM categories c
  WHERE c.is_active = TRUE
  ORDER BY c.name ASC;
$$;


--
-- Name: app_get_auth_user_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_auth_user_by_email(request_email text) RETURNS TABLE(id uuid, role public.user_role, first_name text, last_name text, email text, password_hash text, is_active boolean)
    LANGUAGE sql STABLE
    AS $$
  SELECT u.id, u.role, u.first_name, u.last_name, u.email, u.password_hash, u.is_active
  FROM users u
  WHERE LOWER(u.email) = LOWER(request_email)
  LIMIT 1;
$$;


--
-- Name: app_get_auth_user_by_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_auth_user_by_id(request_user_id uuid) RETURNS TABLE(id uuid, role public.user_role, first_name text, last_name text, email text, password_hash text, is_active boolean)
    LANGUAGE sql STABLE
    AS $$
  SELECT u.id, u.role, u.first_name, u.last_name, u.email, u.password_hash, u.is_active
  FROM users u
  WHERE u.id = request_user_id
  LIMIT 1;
$$;


--
-- Name: app_get_dashboard_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_dashboard_metrics() RETURNS TABLE(revenue_month numeric, active_orders bigint, low_stock_products bigint, conversion_rate numeric)
    LANGUAGE sql STABLE
    AS $$
  WITH inventory AS (
    SELECT
      p.id,
      COALESCE(SUM(v.stock - v.reserved_stock), 0) AS available_stock
    FROM products p
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE p.status = 'active'
    GROUP BY p.id
  ),
  recent_orders AS (
    SELECT COUNT(*) AS total
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND status NOT IN ('cancelled', 'refunded')
  ),
  recent_carts AS (
    SELECT COUNT(*) AS total
    FROM carts
    WHERE created_at >= NOW() - INTERVAL '30 days'
  )
  SELECT
    (
      SELECT COALESCE(SUM(grand_total), 0)
      FROM orders
      WHERE status NOT IN ('cancelled', 'refunded')
        AND DATE_TRUNC('month', COALESCE(paid_at, created_at)) = DATE_TRUNC('month', CURRENT_DATE)
    ) AS revenue_month,
    (
      SELECT COUNT(*)
      FROM orders
      WHERE status IN ('pending', 'paid', 'processing', 'shipped')
    ) AS active_orders,
    (
      SELECT COUNT(*)
      FROM inventory
      WHERE available_stock BETWEEN 0 AND 5
    ) AS low_stock_products,
    (
      SELECT CASE
        WHEN ((SELECT total FROM recent_orders) + (SELECT total FROM recent_carts)) = 0 THEN 0
        ELSE ROUND(
          ((SELECT total FROM recent_orders)::numeric /
            ((SELECT total FROM recent_orders) + (SELECT total FROM recent_carts))::numeric) * 100,
          1
        )
      END
    ) AS conversion_rate;
$$;


--
-- Name: app_get_dashboard_top_products(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_dashboard_top_products(limit_rows integer DEFAULT 5) RETURNS TABLE(name text, sold bigint)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    oi.product_name_snapshot AS name,
    SUM(oi.quantity) AS sold
  FROM order_items oi
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE o.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_name_snapshot
  ORDER BY sold DESC, oi.product_name_snapshot ASC
  LIMIT limit_rows;
$$;


--
-- Name: app_get_orders(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_orders(request_user_id uuid DEFAULT NULL::uuid, request_role text DEFAULT 'admin'::text, limit_rows integer DEFAULT 12) RETURNS TABLE(order_number text, grand_total numeric, status text, items bigint, created_at timestamp with time zone, customer_name text)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    o.order_number,
    o.grand_total,
    o.status::text,
    COUNT(oi.id) AS items,
    o.created_at,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name
  FROM orders o
  INNER JOIN users u ON u.id = o.user_id
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE request_role <> 'customer'
    OR request_user_id IS NULL
    OR o.user_id = request_user_id
  GROUP BY o.id, u.first_name, u.last_name
  ORDER BY o.created_at DESC
  LIMIT limit_rows;
$$;


--
-- Name: app_get_products(boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_products(include_inactive boolean DEFAULT false, only_product_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, category_id uuid, category text, name text, slug text, description text, brand text, material text, gender text, base_price numeric, sale_price numeric, status public.product_status, featured boolean, seo_title text, seo_description text, image text, image_alt_text text, likes bigint, rating numeric, variants jsonb)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    p.id,
    p.category_id,
    c.name AS category,
    p.name,
    p.slug,
    p.description,
    p.brand,
    p.material,
    p.gender,
    p.base_price,
    p.sale_price,
    p.status,
    p.is_featured AS featured,
    p.seo_title,
    p.seo_description,
    (
      SELECT pi.image_url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ) AS image,
    (
      SELECT pi.alt_text
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ) AS image_alt_text,
    (
      SELECT COUNT(*)
      FROM wishlists w
      WHERE w.product_id = p.id
    ) AS likes,
    COALESCE(
      (
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM reviews r
        WHERE r.product_id = p.id
      ),
      4.7
    ) AS rating,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', v.id,
            'sku', v.sku,
            'color', v.color,
            'size', v.size,
            'stock', v.stock,
            'reservedStock', v.reserved_stock,
            'barcode', v.barcode,
            'weightGrams', v.weight_grams
          )
          ORDER BY v.created_at ASC, v.id ASC
        )
        FROM product_variants v
        WHERE v.product_id = p.id
      ),
      '[]'::jsonb
    ) AS variants
  FROM products p
  INNER JOIN categories c ON c.id = p.category_id
  WHERE (include_inactive OR p.status = 'active')
    AND (only_product_id IS NULL OR p.id = only_product_id)
  ORDER BY p.created_at DESC;
$$;


--
-- Name: app_get_reviews(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_reviews(limit_rows integer DEFAULT 6) RETURNS TABLE(id uuid, user_name text, comment text, rating integer)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    r.id,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    r.comment,
    r.rating
  FROM reviews r
  INNER JOIN users u ON u.id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT limit_rows;
$$;


--
-- Name: app_get_user_detail(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_user_detail(target_user_id uuid) RETURNS TABLE(id uuid, role public.user_role, first_name text, last_name text, email text, phone text, is_active boolean, last_login_at timestamp with time zone, created_at timestamp with time zone, orders_count bigint)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    u.id,
    u.role,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.is_active,
    u.last_login_at,
    u.created_at,
    COUNT(o.id) AS orders_count
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  WHERE u.id = target_user_id
  GROUP BY u.id;
$$;


--
-- Name: app_get_user_role_state(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_get_user_role_state(target_user_id uuid) RETURNS TABLE(role public.user_role, is_active boolean)
    LANGUAGE sql STABLE
    AS $$
  SELECT u.role, u.is_active
  FROM users u
  WHERE u.id = target_user_id
  LIMIT 1;
$$;


--
-- Name: app_list_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_list_users() RETURNS TABLE(id uuid, role public.user_role, first_name text, last_name text, email text, phone text, is_active boolean, last_login_at timestamp with time zone, created_at timestamp with time zone, orders_count bigint)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    u.id,
    u.role,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.is_active,
    u.last_login_at,
    u.created_at,
    COUNT(o.id) AS orders_count
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  GROUP BY u.id
  ORDER BY u.created_at DESC;
$$;


--
-- Name: app_touch_last_login(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_touch_last_login(request_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users
  SET last_login_at = NOW(), updated_at = NOW()
  WHERE id = request_user_id;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label character varying(80) NOT NULL,
    recipient_name character varying(180) NOT NULL,
    phone character varying(30),
    line1 character varying(180) NOT NULL,
    line2 character varying(180),
    city character varying(100) NOT NULL,
    state character varying(100),
    country character varying(100) NOT NULL,
    postal_code character varying(30),
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_code character varying(2) DEFAULT 'PE'::character varying NOT NULL,
    legal_name character varying(180),
    trade_name character varying(180),
    tax_id character varying(20),
    tax_id_type character varying(20) DEFAULT 'RUC'::character varying NOT NULL,
    fiscal_address character varying(255),
    department character varying(100),
    province character varying(100),
    district character varying(100),
    ubigeo character varying(6),
    establishment_code character varying(4) DEFAULT '0000'::character varying NOT NULL,
    currency_code character varying(3) DEFAULT 'PEN'::character varying NOT NULL,
    igv_rate numeric(5,2) DEFAULT 18.00 NOT NULL,
    prices_include_tax boolean DEFAULT true NOT NULL,
    invoice_series character varying(4) DEFAULT 'F001'::character varying NOT NULL,
    receipt_series character varying(4) DEFAULT 'B001'::character varying NOT NULL,
    credit_note_series character varying(4) DEFAULT 'FC01'::character varying NOT NULL,
    debit_note_series character varying(4) DEFAULT 'FD01'::character varying NOT NULL,
    sunat_environment character varying(20) DEFAULT 'beta'::character varying NOT NULL,
    emission_system character varying(30) DEFAULT 'own_software'::character varying NOT NULL,
    sol_user character varying(40),
    certificate_alias character varying(120),
    support_email character varying(180),
    support_phone character varying(30),
    send_automatically boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT billing_profiles_igv_rate_check CHECK ((igv_rate >= (0)::numeric))
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    product_variant_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT cart_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(120) NOT NULL,
    slug character varying(140) NOT NULL,
    description text,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(60) NOT NULL,
    description character varying(255),
    discount_type character varying(20) NOT NULL,
    discount_value numeric(12,2) NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    usage_limit integer,
    usage_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT coupons_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['fixed'::character varying, 'percentage'::character varying])::text[]))),
    CONSTRAINT coupons_discount_value_check CHECK ((discount_value >= (0)::numeric))
);


--
-- Name: electronic_document_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.electronic_document_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    electronic_document_id uuid NOT NULL,
    order_item_id uuid,
    line_number integer NOT NULL,
    item_code character varying(120),
    description character varying(180) NOT NULL,
    unit_code character varying(10) DEFAULT 'NIU'::character varying NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit_value numeric(12,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    taxable_amount numeric(12,2) NOT NULL,
    igv_amount numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    CONSTRAINT electronic_document_lines_igv_amount_check CHECK ((igv_amount >= (0)::numeric)),
    CONSTRAINT electronic_document_lines_line_number_check CHECK ((line_number > 0)),
    CONSTRAINT electronic_document_lines_line_total_check CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT electronic_document_lines_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT electronic_document_lines_taxable_amount_check CHECK ((taxable_amount >= (0)::numeric)),
    CONSTRAINT electronic_document_lines_unit_price_check CHECK ((unit_price >= (0)::numeric)),
    CONSTRAINT electronic_document_lines_unit_value_check CHECK ((unit_value >= (0)::numeric))
);


--
-- Name: electronic_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.electronic_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    billing_profile_id uuid,
    document_type public.billing_document_type NOT NULL,
    series character varying(4) NOT NULL,
    correlative bigint,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    currency_code character varying(3) DEFAULT 'PEN'::character varying NOT NULL,
    taxable_amount numeric(12,2) DEFAULT 0 NOT NULL,
    igv_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status public.billing_document_status DEFAULT 'draft'::public.billing_document_status NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    sunat_ticket character varying(120),
    sunat_reference character varying(120),
    hash_code character varying(120),
    qr_payload text,
    last_error text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT electronic_documents_igv_amount_check CHECK ((igv_amount >= (0)::numeric)),
    CONSTRAINT electronic_documents_taxable_amount_check CHECK ((taxable_amount >= (0)::numeric)),
    CONSTRAINT electronic_documents_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_variant_id uuid NOT NULL,
    movement_type public.inventory_movement_type NOT NULL,
    quantity integer NOT NULL,
    reason character varying(180),
    reference_type character varying(80),
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_billing_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_billing_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    document_type public.billing_document_type DEFAULT 'none'::public.billing_document_type NOT NULL,
    customer_document_type character varying(20),
    customer_document_number character varying(20),
    customer_legal_name character varying(180),
    customer_address character varying(255),
    customer_email character varying(180),
    currency_code character varying(3) DEFAULT 'PEN'::character varying NOT NULL,
    taxable_amount numeric(12,2) DEFAULT 0 NOT NULL,
    igv_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    is_final_consumer boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_billing_profiles_igv_amount_check CHECK ((igv_amount >= (0)::numeric)),
    CONSTRAINT order_billing_profiles_taxable_amount_check CHECK ((taxable_amount >= (0)::numeric)),
    CONSTRAINT order_billing_profiles_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_variant_id uuid NOT NULL,
    product_name_snapshot character varying(180) NOT NULL,
    sku_snapshot character varying(120) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    CONSTRAINT order_items_line_total_check CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    address_id uuid,
    coupon_id uuid,
    order_number character varying(40) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    discount_total numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_total numeric(12,2) DEFAULT 0 NOT NULL,
    tax_total numeric(12,2) DEFAULT 0 NOT NULL,
    grand_total numeric(12,2) NOT NULL,
    notes text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_discount_total_check CHECK ((discount_total >= (0)::numeric)),
    CONSTRAINT orders_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT orders_shipping_total_check CHECK ((shipping_total >= (0)::numeric)),
    CONSTRAINT orders_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT orders_tax_total_check CHECK ((tax_total >= (0)::numeric))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    provider public.payment_provider DEFAULT 'manual'::public.payment_provider NOT NULL,
    provider_reference character varying(180),
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'PEN'::character varying NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric))
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    image_url text NOT NULL,
    alt_text character varying(180),
    is_primary boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    sku character varying(120) NOT NULL,
    color character varying(80) NOT NULL,
    size character varying(40) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    reserved_stock integer DEFAULT 0 NOT NULL,
    barcode character varying(80),
    weight_grams integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_variants_reserved_stock_check CHECK ((reserved_stock >= 0)),
    CONSTRAINT product_variants_stock_check CHECK ((stock >= 0)),
    CONSTRAINT product_variants_weight_grams_check CHECK ((weight_grams >= 0))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name character varying(180) NOT NULL,
    slug character varying(200) NOT NULL,
    description text NOT NULL,
    brand character varying(120),
    material character varying(120),
    gender character varying(40),
    base_price numeric(12,2) NOT NULL,
    sale_price numeric(12,2),
    status public.product_status DEFAULT 'draft'::public.product_status NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    seo_title character varying(180),
    seo_description character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT products_sale_price_check CHECK ((sale_price >= (0)::numeric))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    order_item_id uuid,
    rating integer NOT NULL,
    title character varying(180),
    comment text,
    is_verified_purchase boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(180) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(30),
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.addresses (id, user_id, label, recipient_name, phone, line1, line2, city, state, country, postal_code, is_default, created_at) FROM stdin;
aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1	22222222-2222-2222-2222-222222222222	Casa	Andrea Diaz	3000000002	Calle 10 # 20-30	\N	Bogota	Cundinamarca	Colombia	110111	t	2026-03-26 11:43:35.168533-05
aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2	33333333-3333-3333-3333-333333333333	Casa	Miguel Rojas	3000000003	Carrera 15 # 45-20	\N	Medellin	Antioquia	Colombia	050001	t	2026-03-26 11:43:35.168533-05
aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3	44444444-4444-4444-4444-444444444444	Oficina	Sara Lopez	3000000004	Calle 72 # 8-15	\N	Bogota	Cundinamarca	Colombia	110221	t	2026-03-26 11:43:35.168533-05
aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4	55555555-5555-4555-8555-555555555550	Apartamento	Lucia Perez	3000000005	Calle 30 # 52-18	\N	Medellin	Antioquia	Colombia	050021	t	2026-03-26 11:43:35.168533-05
aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5	66666666-6666-4666-8666-666666666660	Casa	Daniel Torres	3000000006	Avenida 5N # 18-40	\N	Cali	Valle del Cauca	Colombia	760045	t	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: billing_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_profiles (id, country_code, legal_name, trade_name, tax_id, tax_id_type, fiscal_address, department, province, district, ubigeo, establishment_code, currency_code, igv_rate, prices_include_tax, invoice_series, receipt_series, credit_note_series, debit_note_series, sunat_environment, emission_system, sol_user, certificate_alias, support_email, support_phone, send_automatically, is_active, created_at, updated_at) FROM stdin;
125dd91d-c225-4585-a3dd-09a7b41a6b34	PE	Fashion Commerce Peru SAC	Fashion Commerce Peru	20123456789	RUC	Av. Larco 123 Oficina 402	Lima	Lima	Miraflores	150122	0000	PEN	18.00	t	F001	B001	FC01	FD01	beta	own_software	MODDATOS	CERT-DEMO	facturacion@fashioncommerce.pe	999999999	f	t	2026-03-26 13:34:09.298158-05	2026-03-26 13:34:45.863469-05
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, cart_id, product_variant_id, quantity, unit_price, created_at) FROM stdin;
aaa11111-ca21-4111-8111-111111111111	aaa11111-ca11-4111-8111-111111111111	ccc33333-c003-4333-8333-333333333333	1	219000.00	2026-03-26 11:43:35.168533-05
bbb22222-ca22-4222-8222-222222222222	aaa11111-ca11-4111-8111-111111111111	ddd44444-d002-4444-8444-444444444442	1	129000.00	2026-03-26 11:43:35.168533-05
bbb11111-ca21-4111-8111-111111111111	bbb11111-ca11-4111-8111-111111111111	fff66666-b001-4666-8666-666666666661	1	149000.00	2026-03-26 11:43:35.168533-05
bbb11111-ca22-4111-8111-111111111112	bbb11111-ca11-4111-8111-111111111111	bbb66666-d002-4666-8666-888888888882	1	109000.00	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (id, user_id, status, created_at, updated_at) FROM stdin;
aaa11111-ca11-4111-8111-111111111111	22222222-2222-2222-2222-222222222222	active	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
bbb11111-ca11-4111-8111-111111111111	55555555-5555-4555-8555-555555555550	active	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, description, image_url, is_active, created_at) FROM stdin;
aaa11111-1111-4111-8111-111111111111	Chaquetas	chaquetas	Prendas exteriores con estilo urbano.	https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80	t	2026-03-26 11:43:35.168533-05
bbb22222-2222-4222-8222-222222222222	Vestidos	vestidos	Vestidos frescos y elegantes.	https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80	t	2026-03-26 11:43:35.168533-05
ccc33333-3333-4333-8333-333333333333	Calzado	calzado	Tenis y calzado casual premium.	https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80	t	2026-03-26 11:43:35.168533-05
ddd44444-4444-4444-8444-444444444444	Camisas	camisas	Camisas versatiles para dia a dia.	https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80	t	2026-03-26 11:43:35.168533-05
eee55555-5555-4555-8555-555555555555	Pantalones	pantalones	Pantalones de corte limpio para looks contemporaneos.	https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80	t	2026-03-26 11:43:35.168533-05
fff66666-6666-4666-8666-666666666666	Accesorios	accesorios	Bolsos y piezas de complemento con enfoque premium.	https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80	t	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (id, code, description, discount_type, discount_value, starts_at, ends_at, usage_limit, usage_count, is_active) FROM stdin;
aaa11111-c111-4111-8111-111111111111	BIENVENIDO10	10 por ciento en primera compra	percentage	10.00	2026-03-16 11:43:35.168533-05	2026-06-24 11:43:35.168533-05	500	12	t
bbb22222-c222-4222-8222-222222222222	ENVIOGRATIS	Descuento fijo para envio	fixed	14000.00	2026-03-21 11:43:35.168533-05	2026-04-25 11:43:35.168533-05	300	22	t
\.


--
-- Data for Name: electronic_document_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.electronic_document_lines (id, electronic_document_id, order_item_id, line_number, item_code, description, unit_code, quantity, unit_value, unit_price, taxable_amount, igv_amount, line_total) FROM stdin;
e62cc4fd-617f-46e1-a9cb-9b5e40678320	85bd9f52-55ee-46f2-8bff-32080e89362d	cf05e9a9-ada4-46b3-957f-f150b5bc5c85	1	CHAQ-URB-BLK-S	Chaqueta Urban Motion - S	NIU	1.00	168644.07	199000.00	168644.07	30355.93	199000.00
\.


--
-- Data for Name: electronic_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.electronic_documents (id, order_id, billing_profile_id, document_type, series, correlative, issue_date, currency_code, taxable_amount, igv_amount, total_amount, status, payload, sunat_ticket, sunat_reference, hash_code, qr_payload, last_error, created_by, created_at, updated_at) FROM stdin;
85bd9f52-55ee-46f2-8bff-32080e89362d	2b70debb-46d4-4c59-bfd6-70ecb2575f62	125dd91d-c225-4585-a3dd-09a7b41a6b34	factura	F001	\N	2026-03-26	PEN	168644.07	30355.93	199000.00	draft	{"lines": [{"sku": "CHAQ-URB-BLK-S", "quantity": 1, "igvAmount": 30355.93, "unitPrice": 199000, "unitValue": 168644.07, "description": "Chaqueta Urban Motion - S", "orderItemId": "cf05e9a9-ada4-46b3-957f-f150b5bc5c85", "totalAmount": 199000, "taxableAmount": 168644.07}], "order": {"orderId": "2b70debb-46d4-4c59-bfd6-70ecb2575f62", "orderNumber": "POS-50087955-BE208A"}, "issuer": {"taxId": "20123456789", "ubigeo": "150122", "district": "Miraflores", "province": "Lima", "legalName": "Fashion Commerce Peru SAC", "taxIdType": "RUC", "tradeName": "Fashion Commerce Peru", "department": "Lima", "fiscalAddress": "Av. Larco 123 Oficina 402", "establishmentCode": "0000"}, "summary": {"igvAmount": 30355.93, "totalAmount": 199000, "currencyCode": "PEN", "taxableAmount": 168644.07}, "customer": {"name": "Empresa QA Peru SAC", "email": "compras@empresaqa.pe", "address": "Av. Javier Prado 456", "documentType": "RUC", "documentNumber": "20123456789"}}	\N	\N	\N	\N	\N	55555555-5555-5555-5555-555555555555	2026-03-26 13:34:47.954777-05	2026-03-26 13:34:47.954777-05
\.


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) FROM stdin;
aaa11111-f001-4111-8111-111111111111	aaa11111-a001-4111-8111-111111111111	in	6	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
ccc33333-f001-4333-8333-333333333333	ccc33333-c003-4333-8333-333333333333	in	7	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
ddd44444-f001-4444-8444-444444444442	ddd44444-d002-4444-8444-444444444442	in	8	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
eee55555-f101-4555-8555-555555555555	eee55555-a002-4555-8555-555555555552	in	6	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
fff66666-f101-4666-8666-666666666666	fff66666-b001-4666-8666-666666666661	in	12	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
aaa55555-f101-4555-8555-777777777777	aaa55555-c002-4555-8555-777777777772	in	6	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
bbb66666-f101-4666-8666-888888888888	bbb66666-d002-4666-8666-888888888882	in	8	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
ccc77777-f101-4777-8777-999999999999	ccc77777-e003-4777-8777-999999999993	in	6	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
ddd88888-f101-4888-8888-aaaaaaaaaaaa	ddd88888-f002-4888-8888-aaaaaaaaaaa2	in	5	Carga inicial	seed	\N	11111111-1111-1111-1111-111111111111	2026-03-26 11:43:35.168533-05
7b59f09a-f8e6-4437-98df-988e22483547	aaa11111-a001-4111-8111-111111111111	out	1	Venta presencial POS	order	077a1290-ba64-4212-86a9-15b21faee003	55555555-5555-5555-5555-555555555555	2026-03-26 13:04:51.396808-05
1a212e19-7f54-4a45-95b0-f9c13914ba4b	aaa11111-a001-4111-8111-111111111111	out	1	Venta presencial POS	order	2b70debb-46d4-4c59-bfd6-70ecb2575f62	55555555-5555-5555-5555-555555555555	2026-03-26 13:34:47.954777-05
\.


--
-- Data for Name: order_billing_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_billing_profiles (id, order_id, document_type, customer_document_type, customer_document_number, customer_legal_name, customer_address, customer_email, currency_code, taxable_amount, igv_amount, total_amount, is_final_consumer, created_at, updated_at) FROM stdin;
61dcd563-3f6c-444c-8a6d-df76d2f35f44	2b70debb-46d4-4c59-bfd6-70ecb2575f62	factura	RUC	20123456789	Empresa QA Peru SAC	Av. Javier Prado 456	compras@empresaqa.pe	PEN	168644.07	30355.93	199000.00	f	2026-03-26 13:34:47.954777-05	2026-03-26 13:34:47.954777-05
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) FROM stdin;
aaa11111-0a11-4111-8111-111111111111	aaa11111-0111-4111-8111-111111111111	ccc33333-c003-4333-8333-333333333333	Sneakers Nova Run	SNK-NOV-WHT-40	1	219000.00	219000.00
aaa11111-0a12-4111-8111-111111111112	aaa11111-0111-4111-8111-111111111111	ddd44444-d002-4444-8444-444444444442	Camisa Studio Fit	CAM-STD-BLU-M	1	129000.00	129000.00
bbb22222-0b21-4222-8222-222222222221	bbb22222-0222-4222-8222-222222222222	ccc33333-c002-4333-8333-333333333332	Sneakers Nova Run	SNK-NOV-WHT-39	1	249000.00	249000.00
ccc33333-0c31-4333-8333-333333333331	ccc33333-0333-4333-8333-333333333333	aaa11111-a002-4111-8111-111111111112	Chaqueta Urban Motion	CHAQ-URB-BLK-M	1	199000.00	199000.00
ccc33333-0c32-4333-8333-333333333332	ccc33333-0333-4333-8333-333333333333	bbb22222-b002-4222-8222-222222222222	Vestido Aura Linen	VEST-AUR-BEI-S	1	189000.00	189000.00
ccc33333-0c33-4333-8333-333333333333	ccc33333-0333-4333-8333-333333333333	ddd44444-d003-4444-8444-444444444443	Camisa Studio Fit	CAM-STD-BLU-L	1	130000.00	130000.00
ddd11111-0a41-4555-8555-111111111111	ddd11111-0444-4444-8444-111111111111	fff66666-b001-4666-8666-666666666661	Bolso Terra Mini	BAG-TER-COG-U	1	149000.00	149000.00
ddd11111-0a42-4555-8555-111111111112	ddd11111-0444-4444-8444-111111111111	ccc77777-e002-4777-8777-999999999992	Sneakers Pulse Street	SNK-PLS-BLK-38	1	229000.00	229000.00
eee22222-0b51-4555-8555-222222222221	eee22222-0555-4555-8555-222222222222	aaa55555-c002-4555-8555-777777777772	Chaqueta Horizon Denim	CHA-HOR-DNM-M	1	259000.00	259000.00
eee22222-0b52-4555-8555-222222222222	eee22222-0555-4555-8555-222222222222	bbb66666-d002-4666-8666-888888888882	Camisa Linen Flow	CAM-LIN-BEI-M	1	109000.00	109000.00
fff33333-0c61-4666-8666-333333333331	fff33333-0666-4666-8666-333333333333	eee55555-a002-4555-8555-555555555552	Pantalon Atlas Tailored	PAN-ATL-GRA-32	1	139000.00	139000.00
ee06c316-248f-47ed-8c3d-416600f90926	077a1290-ba64-4212-86a9-15b21faee003	aaa11111-a001-4111-8111-111111111111	Chaqueta Urban Motion - S	CHAQ-URB-BLK-S	1	199000.00	199000.00
cf05e9a9-ada4-46b3-957f-f150b5bc5c85	2b70debb-46d4-4c59-bfd6-70ecb2575f62	aaa11111-a001-4111-8111-111111111111	Chaqueta Urban Motion - S	CHAQ-URB-BLK-S	1	199000.00	199000.00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) FROM stdin;
aaa11111-0111-4111-8111-111111111111	22222222-2222-2222-2222-222222222222	aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1	aaa11111-c111-4111-8111-111111111111	ORD-2001	delivered	348000.00	29000.00	14000.00	0.00	333000.00	Entrega completada	2026-03-18 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
bbb22222-0222-4222-8222-222222222222	33333333-3333-3333-3333-333333333333	aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2	\N	ORD-1984	shipped	249000.00	0.00	14000.00	0.00	263000.00	En camino	2026-03-14 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ccc33333-0333-4333-8333-333333333333	44444444-4444-4444-4444-444444444444	aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3	\N	ORD-1940	delivered	518000.00	0.00	0.00	0.00	518000.00	Entregado sin novedad	2026-03-06 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ddd11111-0444-4444-8444-111111111111	55555555-5555-4555-8555-555555555550	aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4	bbb22222-c222-4222-8222-222222222222	ORD-2034	delivered	378000.00	14000.00	0.00	0.00	364000.00	Entrega premium completada	2026-03-22 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
eee22222-0555-4555-8555-222222222222	66666666-6666-4666-8666-666666666660	aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5	\N	ORD-2042	delivered	368000.00	0.00	0.00	0.00	368000.00	Cliente satisfecho con la entrega	2026-03-24 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
fff33333-0666-4666-8666-333333333333	22222222-2222-2222-2222-222222222222	aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1	\N	ORD-2038	processing	139000.00	0.00	14000.00	0.00	153000.00	Empaque en curso	2026-03-25 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
077a1290-ba64-4212-86a9-15b21faee003	a8787397-5474-49e4-9f29-74cbd130c7ee	\N	\N	POS-48291399-D3D86E	paid	199000.00	0.00	0.00	0.00	199000.00	Venta presencial POS | Cliente: Cliente Mostrador QA | Medio de pago: cash | Recibido: 209000 | Prueba automatizada POS	2026-03-26 13:04:51.396808-05	2026-03-26 13:04:51.396808-05	2026-03-26 13:04:51.396808-05
2b70debb-46d4-4c59-bfd6-70ecb2575f62	03bc620e-deba-4c8d-b328-9d4589805392	\N	\N	POS-50087955-BE208A	paid	168644.07	0.00	0.00	30355.93	199000.00	Venta presencial POS | Cliente: Cliente Empresa QA | Comprobante: factura | Medio de pago: cash | Recibido: 199050 | Prueba fiscal Peru	2026-03-26 13:34:47.954777-05	2026-03-26 13:34:47.954777-05	2026-03-26 13:34:47.954777-05
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) FROM stdin;
aaa11111-0d11-4111-8111-111111111111	aaa11111-0111-4111-8111-111111111111	wompi	WOMPI-2001	paid	333000.00	PEN	2026-03-18 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
bbb22222-0d22-4222-8222-222222222222	bbb22222-0222-4222-8222-222222222222	mercado_pago	MP-1984	paid	263000.00	PEN	2026-03-14 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ccc33333-0d33-4333-8333-333333333333	ccc33333-0333-4333-8333-333333333333	stripe	STR-1940	paid	518000.00	PEN	2026-03-06 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ddd11111-0d41-4555-8555-111111111111	ddd11111-0444-4444-8444-111111111111	wompi	WOMPI-2034	paid	364000.00	PEN	2026-03-22 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
eee22222-0d52-4555-8555-222222222222	eee22222-0555-4555-8555-222222222222	stripe	STR-2042	paid	368000.00	PEN	2026-03-24 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
fff33333-0d63-4666-8666-333333333333	fff33333-0666-4666-8666-333333333333	mercado_pago	MP-2038	paid	153000.00	PEN	2026-03-25 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
fe34626d-47e8-4226-9975-64179754ea7e	077a1290-ba64-4212-86a9-15b21faee003	manual	cash	paid	199000.00	PEN	2026-03-26 13:04:51.396808-05	2026-03-26 13:04:51.396808-05
fc65d598-ae99-472e-a9d6-3f66acdc5466	2b70debb-46d4-4c59-bfd6-70ecb2575f62	manual	cash	paid	199000.00	PEN	2026-03-26 13:34:47.954777-05	2026-03-26 13:34:47.954777-05
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) FROM stdin;
aaa11111-eeee-4111-8111-111111111111	aaa11111-aaaa-4111-8111-111111111111	https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80	Chaqueta Urban Motion	t	1
bbb22222-eeee-4222-8222-222222222222	bbb22222-bbbb-4222-8222-222222222222	https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80	Vestido Aura Linen	t	1
ccc33333-eeee-4333-8333-333333333333	ccc33333-cccc-4333-8333-333333333333	https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80	Sneakers Nova Run	t	1
ddd44444-eeee-4444-8444-444444444444	ddd44444-dddd-4444-8444-444444444444	https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80	Camisa Studio Fit	t	1
eee55555-eeee-4555-8555-555555555555	eee55555-aaaa-4555-8555-555555555555	https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80	Pantalon Atlas Tailored	t	1
fff66666-eeee-4666-8666-666666666666	fff66666-bbbb-4666-8666-666666666666	https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80	Bolso Terra Mini	t	1
aaa55555-eeee-4555-8555-777777777777	aaa55555-aaaa-4555-8555-777777777777	https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80	Chaqueta Horizon Denim	t	1
bbb66666-eeee-4666-8666-888888888888	bbb66666-bbbb-4666-8666-888888888888	https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80	Camisa Linen Flow	t	1
ccc77777-eeee-4777-8777-999999999999	ccc77777-cccc-4777-8777-999999999999	https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80	Sneakers Pulse Street	t	1
ddd88888-eeee-4888-8888-aaaaaaaaaaaa	ddd88888-dddd-4888-8888-aaaaaaaaaaaa	https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80	Vestido Solstice Midi	t	1
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) FROM stdin;
aaa11111-a002-4111-8111-111111111112	aaa11111-aaaa-4111-8111-111111111111	CHAQ-URB-BLK-M	Negro	M	7	0	770000000002	700	2026-03-26 11:43:35.168533-05
aaa11111-a003-4111-8111-111111111113	aaa11111-aaaa-4111-8111-111111111111	CHAQ-URB-BLK-L	Negro	L	5	0	770000000003	700	2026-03-26 11:43:35.168533-05
bbb22222-b001-4222-8222-222222222221	bbb22222-bbbb-4222-8222-222222222222	VEST-AUR-BEI-XS	Beige	XS	3	0	770000000004	350	2026-03-26 11:43:35.168533-05
bbb22222-b002-4222-8222-222222222222	bbb22222-bbbb-4222-8222-222222222222	VEST-AUR-BEI-S	Beige	S	3	0	770000000005	350	2026-03-26 11:43:35.168533-05
bbb22222-b003-4222-8222-222222222223	bbb22222-bbbb-4222-8222-222222222222	VEST-AUR-BEI-M	Beige	M	3	0	770000000006	350	2026-03-26 11:43:35.168533-05
ccc33333-c001-4333-8333-333333333331	ccc33333-cccc-4333-8333-333333333333	SNK-NOV-WHT-38	Blanco	38	6	0	770000000007	500	2026-03-26 11:43:35.168533-05
ccc33333-c002-4333-8333-333333333332	ccc33333-cccc-4333-8333-333333333333	SNK-NOV-WHT-39	Blanco	39	6	0	770000000008	500	2026-03-26 11:43:35.168533-05
ccc33333-c003-4333-8333-333333333333	ccc33333-cccc-4333-8333-333333333333	SNK-NOV-WHT-40	Blanco	40	7	0	770000000009	500	2026-03-26 11:43:35.168533-05
ccc33333-c004-4333-8333-333333333334	ccc33333-cccc-4333-8333-333333333333	SNK-NOV-WHT-41	Blanco	41	6	0	770000000010	500	2026-03-26 11:43:35.168533-05
ddd44444-d001-4444-8444-444444444441	ddd44444-dddd-4444-8444-444444444444	CAM-STD-BLU-S	Azul	S	8	0	770000000011	300	2026-03-26 11:43:35.168533-05
ddd44444-d002-4444-8444-444444444442	ddd44444-dddd-4444-8444-444444444444	CAM-STD-BLU-M	Azul	M	8	0	770000000012	300	2026-03-26 11:43:35.168533-05
ddd44444-d003-4444-8444-444444444443	ddd44444-dddd-4444-8444-444444444444	CAM-STD-BLU-L	Azul	L	7	0	770000000013	300	2026-03-26 11:43:35.168533-05
ddd44444-d004-4444-8444-444444444444	ddd44444-dddd-4444-8444-444444444444	CAM-STD-BLU-XL	Azul	XL	8	0	770000000014	300	2026-03-26 11:43:35.168533-05
eee55555-a001-4555-8555-555555555551	eee55555-aaaa-4555-8555-555555555555	PAN-ATL-GRA-30	Gris	30	5	0	770000000015	420	2026-03-26 11:43:35.168533-05
eee55555-a002-4555-8555-555555555552	eee55555-aaaa-4555-8555-555555555555	PAN-ATL-GRA-32	Gris	32	6	0	770000000016	420	2026-03-26 11:43:35.168533-05
eee55555-a003-4555-8555-555555555553	eee55555-aaaa-4555-8555-555555555555	PAN-ATL-GRA-34	Gris	34	4	0	770000000017	420	2026-03-26 11:43:35.168533-05
fff66666-b001-4666-8666-666666666661	fff66666-bbbb-4666-8666-666666666666	BAG-TER-COG-U	Cognac	U	12	0	770000000018	680	2026-03-26 11:43:35.168533-05
aaa55555-c001-4555-8555-777777777771	aaa55555-aaaa-4555-8555-777777777777	CHA-HOR-DNM-S	Denim oscuro	S	5	0	770000000019	820	2026-03-26 11:43:35.168533-05
aaa55555-c002-4555-8555-777777777772	aaa55555-aaaa-4555-8555-777777777777	CHA-HOR-DNM-M	Denim oscuro	M	6	0	770000000020	820	2026-03-26 11:43:35.168533-05
aaa55555-c003-4555-8555-777777777773	aaa55555-aaaa-4555-8555-777777777777	CHA-HOR-DNM-L	Denim oscuro	L	5	0	770000000021	820	2026-03-26 11:43:35.168533-05
bbb66666-d001-4666-8666-888888888881	bbb66666-bbbb-4666-8666-888888888888	CAM-LIN-BEI-S	Beige	S	9	0	770000000022	240	2026-03-26 11:43:35.168533-05
bbb66666-d002-4666-8666-888888888882	bbb66666-bbbb-4666-8666-888888888888	CAM-LIN-BEI-M	Beige	M	8	0	770000000023	240	2026-03-26 11:43:35.168533-05
bbb66666-d003-4666-8666-888888888883	bbb66666-bbbb-4666-8666-888888888888	CAM-LIN-BEI-L	Beige	L	7	0	770000000024	240	2026-03-26 11:43:35.168533-05
ccc77777-e001-4777-8777-999999999991	ccc77777-cccc-4777-8777-999999999999	SNK-PLS-BLK-37	Negro	37	5	0	770000000025	520	2026-03-26 11:43:35.168533-05
ccc77777-e002-4777-8777-999999999992	ccc77777-cccc-4777-8777-999999999999	SNK-PLS-BLK-38	Negro	38	6	0	770000000026	520	2026-03-26 11:43:35.168533-05
ccc77777-e003-4777-8777-999999999993	ccc77777-cccc-4777-8777-999999999999	SNK-PLS-BLK-39	Negro	39	6	0	770000000027	520	2026-03-26 11:43:35.168533-05
ccc77777-e004-4777-8777-999999999994	ccc77777-cccc-4777-8777-999999999999	SNK-PLS-BLK-40	Negro	40	5	0	770000000028	520	2026-03-26 11:43:35.168533-05
ddd88888-f001-4888-8888-aaaaaaaaaaa1	ddd88888-dddd-4888-8888-aaaaaaaaaaaa	VES-SOL-SAG-XS	Sage	XS	4	0	770000000029	360	2026-03-26 11:43:35.168533-05
ddd88888-f002-4888-8888-aaaaaaaaaaa2	ddd88888-dddd-4888-8888-aaaaaaaaaaaa	VES-SOL-SAG-S	Sage	S	5	0	770000000030	360	2026-03-26 11:43:35.168533-05
ddd88888-f003-4888-8888-aaaaaaaaaaa3	ddd88888-dddd-4888-8888-aaaaaaaaaaaa	VES-SOL-SAG-M	Sage	M	4	0	770000000031	360	2026-03-26 11:43:35.168533-05
aaa11111-a001-4111-8111-111111111111	aaa11111-aaaa-4111-8111-111111111111	CHAQ-URB-BLK-S	Negro	S	4	0	770000000001	700	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) FROM stdin;
aaa11111-aaaa-4111-8111-111111111111	aaa11111-1111-4111-8111-111111111111	Chaqueta Urban Motion	chaqueta-urban-motion	Chaqueta premium con silueta urbana, tacto suave y look contemporaneo.	Fashion Commerce	Poliester reciclado	Unisex	219000.00	199000.00	active	t	Chaqueta Urban Motion	Chaqueta urbana premium para looks modernos.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
bbb22222-bbbb-4222-8222-222222222222	bbb22222-2222-4222-8222-222222222222	Vestido Aura Linen	vestido-aura-linen	Vestido fresco con caida natural para dias calidos y ocasiones especiales.	Fashion Commerce	Lino	Mujer	189000.00	\N	active	f	Vestido Aura Linen	Vestido de lino elegante y ligero.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ccc33333-cccc-4333-8333-333333333333	ccc33333-3333-4333-8333-333333333333	Sneakers Nova Run	sneakers-nova-run	Tenis ligeros con gran soporte y una estetica deportiva muy limpia.	Fashion Commerce	Sintetico	Unisex	249000.00	219000.00	active	t	Sneakers Nova Run	Tenis urbanos comodos para uso diario.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ddd44444-dddd-4444-8444-444444444444	ddd44444-4444-4444-8444-444444444444	Camisa Studio Fit	camisa-studio-fit	Camisa versatil con patron moderno para oficina o salida casual.	Fashion Commerce	Algodon	Hombre	129000.00	\N	active	f	Camisa Studio Fit	Camisa moderna de algodon.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
eee55555-aaaa-4555-8555-555555555555	eee55555-5555-4555-8555-555555555555	Pantalon Atlas Tailored	pantalon-atlas-tailored	Pantalon de silueta recta con caida limpia y acabado premium para diario.	Fashion Commerce	Gabardina stretch	Hombre	159000.00	139000.00	active	f	Pantalon Atlas Tailored	Pantalon moderno con fit pulido para looks casuales y formales.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
fff66666-bbbb-4666-8666-666666666666	fff66666-6666-4666-8666-666666666666	Bolso Terra Mini	bolso-terra-mini	Bolso compacto con textura suave y presencia elegante para uso diario.	Fashion Commerce	Cuero vegano	Mujer	149000.00	\N	active	t	Bolso Terra Mini	Bolso mini premium para elevar cualquier outfit.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
aaa55555-aaaa-4555-8555-777777777777	aaa11111-1111-4111-8111-111111111111	Chaqueta Horizon Denim	chaqueta-horizon-denim	Chaqueta denim con estructura ligera y lavado oscuro de aspecto sofisticado.	Fashion Commerce	Denim premium	Unisex	289000.00	259000.00	active	f	Chaqueta Horizon Denim	Chaqueta denim urbana con look depurado y actual.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
bbb66666-bbbb-4666-8666-888888888888	ddd44444-4444-4444-8444-444444444444	Camisa Linen Flow	camisa-linen-flow	Camisa relajada de lino con cuello suave para clima calido.	Fashion Commerce	Lino premium	Hombre	119000.00	109000.00	active	t	Camisa Linen Flow	Camisa ligera de lino para outfits frescos y refinados.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ccc77777-cccc-4777-8777-999999999999	ccc33333-3333-4333-8333-333333333333	Sneakers Pulse Street	sneakers-pulse-street	Tenis de perfil bajo con amortiguacion comoda y look streetwear limpio.	Fashion Commerce	Sintetico premium	Unisex	239000.00	229000.00	active	f	Sneakers Pulse Street	Sneakers urbanos con perfil limpio y comodidad superior.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
ddd88888-dddd-4888-8888-aaaaaaaaaaaa	bbb22222-2222-4222-8222-222222222222	Vestido Solstice Midi	vestido-solstice-midi	Vestido midi con movimiento fluido y cinturon ajustable para una silueta elegante.	Fashion Commerce	Viscosa	Mujer	209000.00	\N	active	t	Vestido Solstice Midi	Vestido midi fresco y sofisticado para ocasiones especiales.	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) FROM stdin;
aaa11111-0e11-4111-8111-111111111111	22222222-2222-2222-2222-222222222222	ccc33333-cccc-4333-8333-333333333333	aaa11111-0a11-4111-8111-111111111111	5	Excelente compra	Excelente calidad y envio muy rapido.	t	2026-03-26 11:43:35.168533-05
bbb22222-0e22-4222-8222-222222222222	33333333-3333-3333-3333-333333333333	ccc33333-cccc-4333-8333-333333333333	bbb22222-0b21-4222-8222-222222222221	4	Muy comodos	La talla coincide perfecto y el acabado se siente premium.	t	2026-03-26 11:43:35.168533-05
ccc33333-0e33-4333-8333-333333333333	44444444-4444-4444-4444-444444444444	aaa11111-aaaa-4111-8111-111111111111	ccc33333-0c31-4333-8333-333333333331	5	Gran experiencia	Muy buena experiencia de compra y una presentacion impecable.	t	2026-03-26 11:43:35.168533-05
ddd11111-0e41-4555-8555-111111111111	55555555-5555-4555-8555-555555555550	fff66666-bbbb-4666-8666-666666666666	ddd11111-0a41-4555-8555-111111111111	5	Ideal para diario	El tamano es perfecto y los acabados se sienten muy bien.	t	2026-03-26 11:43:35.168533-05
ddd11111-0e42-4555-8555-111111111112	55555555-5555-4555-8555-555555555550	ccc77777-cccc-4777-8777-999999999999	ddd11111-0a42-4555-8555-111111111112	4	Comodos y ligeros	Muy comodos para caminar y con una silueta muy limpia.	t	2026-03-26 11:43:35.168533-05
eee22222-0e51-4555-8555-222222222221	66666666-6666-4666-8666-666666666660	aaa55555-aaaa-4555-8555-777777777777	eee22222-0b51-4555-8555-222222222221	5	Denim impecable	La chaqueta tiene gran estructura y el tono combina con todo.	t	2026-03-26 11:43:35.168533-05
eee22222-0e52-4555-8555-222222222222	66666666-6666-4666-8666-666666666660	bbb66666-bbbb-4666-8666-888888888888	eee22222-0b52-4555-8555-222222222222	4	Muy fresca	La tela es ligera y el fit queda muy bien para clima calido.	t	2026-03-26 11:43:35.168533-05
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) FROM stdin;
33333333-3333-3333-3333-333333333333	customer	Miguel	Rojas	miguel@example.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	3000000003	t	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
44444444-4444-4444-4444-444444444444	customer	Sara	Lopez	sara@example.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	3000000004	t	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
55555555-5555-4555-8555-555555555550	customer	Lucia	Perez	lucia@example.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	3000000005	t	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
66666666-6666-4666-8666-666666666660	customer	Daniel	Torres	daniel@example.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	3000000006	t	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05	2026-03-26 11:43:35.168533-05
22222222-2222-2222-2222-222222222222	customer	Andrea	Diaz	andrea@example.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	3000000002	t	2026-03-26 12:21:00.559794-05	2026-03-26 11:43:35.168533-05	2026-03-26 12:21:00.559794-05
a8787397-5474-49e4-9f29-74cbd130c7ee	customer	Cliente	Mostrador QA	mostrador@fashioncommerce.local	$2a$10$ZkQ4nKK4QbjX9DB1e6FvnOg.qUT8eZ73d7smrAZERAUYFKld/rVQO	\N	t	\N	2026-03-26 13:04:51.184737-05	2026-03-26 13:04:51.184737-05
11111111-1111-1111-1111-111111111111	admin	Admin	Principal	admin@fashioncommerce.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	3000000001	t	2026-03-26 13:34:44.576544-05	2026-03-26 11:43:35.168533-05	2026-03-26 13:34:44.576544-05
03bc620e-deba-4c8d-b328-9d4589805392	customer	Empresa	QA Peru SAC	compras@empresaqa.pe	$2a$10$Bf0Guo83qN2zEV4eSpSUCOMxQhIAFdDYQ8qO4gKfL.51tlYQp.yt6	999999999	t	\N	2026-03-26 13:34:47.862824-05	2026-03-26 13:34:47.862824-05
55555555-5555-5555-5555-555555555555	cashier	Camila	Caja	cashier@fashioncommerce.com	$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS	\N	t	2026-03-26 17:15:54.748163-05	2026-03-26 13:03:50.896059-05	2026-03-26 17:15:54.748163-05
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wishlists (id, user_id, product_id, created_at) FROM stdin;
aaa11111-0f11-4111-8111-111111111111	22222222-2222-2222-2222-222222222222	aaa11111-aaaa-4111-8111-111111111111	2026-03-26 11:43:35.168533-05
bbb22222-0f22-4222-8222-222222222222	22222222-2222-2222-2222-222222222222	ccc33333-cccc-4333-8333-333333333333	2026-03-26 11:43:35.168533-05
ccc33333-0f33-4333-8333-333333333333	33333333-3333-3333-3333-333333333333	bbb22222-bbbb-4222-8222-222222222222	2026-03-26 11:43:35.168533-05
ddd11111-0f41-4555-8555-111111111111	55555555-5555-4555-8555-555555555550	ddd88888-dddd-4888-8888-aaaaaaaaaaaa	2026-03-26 11:43:35.168533-05
ddd11111-0f42-4555-8555-111111111112	55555555-5555-4555-8555-555555555550	aaa55555-aaaa-4555-8555-777777777777	2026-03-26 11:43:35.168533-05
eee22222-0f51-4555-8555-222222222221	66666666-6666-4666-8666-666666666660	eee55555-aaaa-4555-8555-555555555555	2026-03-26 11:43:35.168533-05
eee22222-0f52-4555-8555-222222222222	66666666-6666-4666-8666-666666666660	ccc77777-cccc-4777-8777-999999999999	2026-03-26 11:43:35.168533-05
fff33333-0f63-4666-8666-333333333333	44444444-4444-4444-4444-444444444444	fff66666-bbbb-4666-8666-666666666666	2026-03-26 11:43:35.168533-05
\.


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: billing_profiles billing_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_profiles
    ADD CONSTRAINT billing_profiles_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_cart_id_product_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_product_variant_id_key UNIQUE (cart_id, product_variant_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: electronic_document_lines electronic_document_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_document_lines
    ADD CONSTRAINT electronic_document_lines_pkey PRIMARY KEY (id);


--
-- Name: electronic_documents electronic_documents_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_documents
    ADD CONSTRAINT electronic_documents_order_id_key UNIQUE (order_id);


--
-- Name: electronic_documents electronic_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_documents
    ADD CONSTRAINT electronic_documents_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: order_billing_profiles order_billing_profiles_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_billing_profiles
    ADD CONSTRAINT order_billing_profiles_order_id_key UNIQUE (order_id);


--
-- Name: order_billing_profiles order_billing_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_billing_profiles
    ADD CONSTRAINT order_billing_profiles_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_user_id_product_id_order_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_product_id_order_item_id_key UNIQUE (user_id, product_id, order_item_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: idx_electronic_document_lines_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_electronic_document_lines_document_id ON public.electronic_document_lines USING btree (electronic_document_id);


--
-- Name: idx_electronic_documents_issue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_electronic_documents_issue_date ON public.electronic_documents USING btree (issue_date DESC);


--
-- Name: idx_electronic_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_electronic_documents_status ON public.electronic_documents USING btree (status);


--
-- Name: idx_order_billing_profiles_document_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_billing_profiles_document_type ON public.order_billing_profiles USING btree (document_type);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_product_variants_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_product_id ON public.product_variants USING btree (product_id);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_reviews_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product_id ON public.reviews USING btree (product_id);


--
-- Name: idx_wishlists_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_user_id ON public.wishlists USING btree (user_id);


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: electronic_document_lines electronic_document_lines_electronic_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_document_lines
    ADD CONSTRAINT electronic_document_lines_electronic_document_id_fkey FOREIGN KEY (electronic_document_id) REFERENCES public.electronic_documents(id) ON DELETE CASCADE;


--
-- Name: electronic_document_lines electronic_document_lines_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_document_lines
    ADD CONSTRAINT electronic_document_lines_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- Name: electronic_documents electronic_documents_billing_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_documents
    ADD CONSTRAINT electronic_documents_billing_profile_id_fkey FOREIGN KEY (billing_profile_id) REFERENCES public.billing_profiles(id);


--
-- Name: electronic_documents electronic_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_documents
    ADD CONSTRAINT electronic_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: electronic_documents electronic_documents_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electronic_documents
    ADD CONSTRAINT electronic_documents_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: inventory_movements inventory_movements_product_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: order_billing_profiles order_billing_profiles_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_billing_profiles
    ADD CONSTRAINT order_billing_profiles_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: orders orders_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- Name: orders orders_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: reviews reviews_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FfdzbJpTk803gC0cf5HicRYjzJYnLaQgK8KC8mqxnGTCCgNGm1OORBmE0UYiaH9

