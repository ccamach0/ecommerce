--
-- PostgreSQL database dump
--


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

-- Restore the default search_path for interactive sessions such as Neon SQL Editor.
RESET search_path;


