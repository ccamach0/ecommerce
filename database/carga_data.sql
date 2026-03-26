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

BEGIN;

TRUNCATE TABLE public.addresses, public.billing_profiles, public.cart_items, public.carts, public.categories, public.coupons, public.electronic_document_lines, public.electronic_documents, public.inventory_movements, public.order_billing_profiles, public.order_items, public.orders, public.payments, public.product_images, public.product_variants, public.products, public.reviews, public.users, public.wishlists RESTART IDENTITY CASCADE;

-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('33333333-3333-3333-3333-333333333333', 'customer', 'Miguel', 'Rojas', 'miguel@example.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', '3000000003', true, '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('44444444-4444-4444-4444-444444444444', 'customer', 'Sara', 'Lopez', 'sara@example.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', '3000000004', true, '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('55555555-5555-4555-8555-555555555550', 'customer', 'Lucia', 'Perez', 'lucia@example.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', '3000000005', true, '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('66666666-6666-4666-8666-666666666660', 'customer', 'Daniel', 'Torres', 'daniel@example.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', '3000000006', true, '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('22222222-2222-2222-2222-222222222222', 'customer', 'Andrea', 'Diaz', 'andrea@example.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', '3000000002', true, '2026-03-26 12:21:00.559794-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 12:21:00.559794-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('a8787397-5474-49e4-9f29-74cbd130c7ee', 'customer', 'Cliente', 'Mostrador QA', 'mostrador@fashioncommerce.local', '$2a$10$ZkQ4nKK4QbjX9DB1e6FvnOg.qUT8eZ73d7smrAZERAUYFKld/rVQO', NULL, true, NULL, '2026-03-26 13:04:51.184737-05', '2026-03-26 13:04:51.184737-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('11111111-1111-1111-1111-111111111111', 'admin', 'Admin', 'Principal', 'admin@fashioncommerce.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', '3000000001', true, '2026-03-26 13:34:44.576544-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 13:34:44.576544-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('03bc620e-deba-4c8d-b328-9d4589805392', 'customer', 'Empresa', 'QA Peru SAC', 'compras@empresaqa.pe', '$2a$10$Bf0Guo83qN2zEV4eSpSUCOMxQhIAFdDYQ8qO4gKfL.51tlYQp.yt6', '999999999', true, NULL, '2026-03-26 13:34:47.862824-05', '2026-03-26 13:34:47.862824-05');
INSERT INTO public.users (id, role, first_name, last_name, email, password_hash, phone, is_active, last_login_at, created_at, updated_at) VALUES ('55555555-5555-5555-5555-555555555555', 'cashier', 'Camila', 'Caja', 'cashier@fashioncommerce.com', '$2a$10$wbeox8ddioA5yTZ.oWoBXu97DAHX0E58/i23c8RcA4oHRZNqWB9XS', NULL, true, '2026-03-26 17:15:54.748163-05', '2026-03-26 13:03:50.896059-05', '2026-03-26 17:15:54.748163-05');


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.addresses (id, user_id, label, recipient_name, phone, line1, line2, city, state, country, postal_code, is_default, created_at) VALUES ('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'Casa', 'Andrea Diaz', '3000000002', 'Calle 10 # 20-30', NULL, 'Bogota', 'Cundinamarca', 'Colombia', '110111', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.addresses (id, user_id, label, recipient_name, phone, line1, line2, city, state, country, postal_code, is_default, created_at) VALUES ('aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '33333333-3333-3333-3333-333333333333', 'Casa', 'Miguel Rojas', '3000000003', 'Carrera 15 # 45-20', NULL, 'Medellin', 'Antioquia', 'Colombia', '050001', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.addresses (id, user_id, label, recipient_name, phone, line1, line2, city, state, country, postal_code, is_default, created_at) VALUES ('aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '44444444-4444-4444-4444-444444444444', 'Oficina', 'Sara Lopez', '3000000004', 'Calle 72 # 8-15', NULL, 'Bogota', 'Cundinamarca', 'Colombia', '110221', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.addresses (id, user_id, label, recipient_name, phone, line1, line2, city, state, country, postal_code, is_default, created_at) VALUES ('aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '55555555-5555-4555-8555-555555555550', 'Apartamento', 'Lucia Perez', '3000000005', 'Calle 30 # 52-18', NULL, 'Medellin', 'Antioquia', 'Colombia', '050021', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.addresses (id, user_id, label, recipient_name, phone, line1, line2, city, state, country, postal_code, is_default, created_at) VALUES ('aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '66666666-6666-4666-8666-666666666660', 'Casa', 'Daniel Torres', '3000000006', 'Avenida 5N # 18-40', NULL, 'Cali', 'Valle del Cauca', 'Colombia', '760045', true, '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: billing_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.billing_profiles (id, country_code, legal_name, trade_name, tax_id, tax_id_type, fiscal_address, department, province, district, ubigeo, establishment_code, currency_code, igv_rate, prices_include_tax, invoice_series, receipt_series, credit_note_series, debit_note_series, sunat_environment, emission_system, sol_user, certificate_alias, support_email, support_phone, send_automatically, is_active, created_at, updated_at) VALUES ('125dd91d-c225-4585-a3dd-09a7b41a6b34', 'PE', 'Fashion Commerce Peru SAC', 'Fashion Commerce Peru', '20123456789', 'RUC', 'Av. Larco 123 Oficina 402', 'Lima', 'Lima', 'Miraflores', '150122', '0000', 'PEN', 18.00, true, 'F001', 'B001', 'FC01', 'FD01', 'beta', 'own_software', 'MODDATOS', 'CERT-DEMO', 'facturacion@fashioncommerce.pe', '999999999', false, true, '2026-03-26 13:34:09.298158-05', '2026-03-26 13:34:45.863469-05');


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.carts (id, user_id, status, created_at, updated_at) VALUES ('aaa11111-ca11-4111-8111-111111111111', '22222222-2222-2222-2222-222222222222', 'active', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.carts (id, user_id, status, created_at, updated_at) VALUES ('bbb11111-ca11-4111-8111-111111111111', '55555555-5555-4555-8555-555555555550', 'active', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at) VALUES ('aaa11111-1111-4111-8111-111111111111', 'Chaquetas', 'chaquetas', 'Prendas exteriores con estilo urbano.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at) VALUES ('bbb22222-2222-4222-8222-222222222222', 'Vestidos', 'vestidos', 'Vestidos frescos y elegantes.', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at) VALUES ('ccc33333-3333-4333-8333-333333333333', 'Calzado', 'calzado', 'Tenis y calzado casual premium.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at) VALUES ('ddd44444-4444-4444-8444-444444444444', 'Camisas', 'camisas', 'Camisas versatiles para dia a dia.', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at) VALUES ('eee55555-5555-4555-8555-555555555555', 'Pantalones', 'pantalones', 'Pantalones de corte limpio para looks contemporaneos.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at) VALUES ('fff66666-6666-4666-8666-666666666666', 'Accesorios', 'accesorios', 'Bolsos y piezas de complemento con enfoque premium.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', true, '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('aaa11111-aaaa-4111-8111-111111111111', 'aaa11111-1111-4111-8111-111111111111', 'Chaqueta Urban Motion', 'chaqueta-urban-motion', 'Chaqueta premium con silueta urbana, tacto suave y look contemporaneo.', 'Fashion Commerce', 'Poliester reciclado', 'Unisex', 219000.00, 199000.00, 'active', true, 'Chaqueta Urban Motion', 'Chaqueta urbana premium para looks modernos.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('bbb22222-bbbb-4222-8222-222222222222', 'bbb22222-2222-4222-8222-222222222222', 'Vestido Aura Linen', 'vestido-aura-linen', 'Vestido fresco con caida natural para dias calidos y ocasiones especiales.', 'Fashion Commerce', 'Lino', 'Mujer', 189000.00, NULL, 'active', false, 'Vestido Aura Linen', 'Vestido de lino elegante y ligero.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('ccc33333-cccc-4333-8333-333333333333', 'ccc33333-3333-4333-8333-333333333333', 'Sneakers Nova Run', 'sneakers-nova-run', 'Tenis ligeros con gran soporte y una estetica deportiva muy limpia.', 'Fashion Commerce', 'Sintetico', 'Unisex', 249000.00, 219000.00, 'active', true, 'Sneakers Nova Run', 'Tenis urbanos comodos para uso diario.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('ddd44444-dddd-4444-8444-444444444444', 'ddd44444-4444-4444-8444-444444444444', 'Camisa Studio Fit', 'camisa-studio-fit', 'Camisa versatil con patron moderno para oficina o salida casual.', 'Fashion Commerce', 'Algodon', 'Hombre', 129000.00, NULL, 'active', false, 'Camisa Studio Fit', 'Camisa moderna de algodon.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('eee55555-aaaa-4555-8555-555555555555', 'eee55555-5555-4555-8555-555555555555', 'Pantalon Atlas Tailored', 'pantalon-atlas-tailored', 'Pantalon de silueta recta con caida limpia y acabado premium para diario.', 'Fashion Commerce', 'Gabardina stretch', 'Hombre', 159000.00, 139000.00, 'active', false, 'Pantalon Atlas Tailored', 'Pantalon moderno con fit pulido para looks casuales y formales.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('fff66666-bbbb-4666-8666-666666666666', 'fff66666-6666-4666-8666-666666666666', 'Bolso Terra Mini', 'bolso-terra-mini', 'Bolso compacto con textura suave y presencia elegante para uso diario.', 'Fashion Commerce', 'Cuero vegano', 'Mujer', 149000.00, NULL, 'active', true, 'Bolso Terra Mini', 'Bolso mini premium para elevar cualquier outfit.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('aaa55555-aaaa-4555-8555-777777777777', 'aaa11111-1111-4111-8111-111111111111', 'Chaqueta Horizon Denim', 'chaqueta-horizon-denim', 'Chaqueta denim con estructura ligera y lavado oscuro de aspecto sofisticado.', 'Fashion Commerce', 'Denim premium', 'Unisex', 289000.00, 259000.00, 'active', false, 'Chaqueta Horizon Denim', 'Chaqueta denim urbana con look depurado y actual.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('bbb66666-bbbb-4666-8666-888888888888', 'ddd44444-4444-4444-8444-444444444444', 'Camisa Linen Flow', 'camisa-linen-flow', 'Camisa relajada de lino con cuello suave para clima calido.', 'Fashion Commerce', 'Lino premium', 'Hombre', 119000.00, 109000.00, 'active', true, 'Camisa Linen Flow', 'Camisa ligera de lino para outfits frescos y refinados.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('ccc77777-cccc-4777-8777-999999999999', 'ccc33333-3333-4333-8333-333333333333', 'Sneakers Pulse Street', 'sneakers-pulse-street', 'Tenis de perfil bajo con amortiguacion comoda y look streetwear limpio.', 'Fashion Commerce', 'Sintetico premium', 'Unisex', 239000.00, 229000.00, 'active', false, 'Sneakers Pulse Street', 'Sneakers urbanos con perfil limpio y comodidad superior.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.products (id, category_id, name, slug, description, brand, material, gender, base_price, sale_price, status, is_featured, seo_title, seo_description, created_at, updated_at) VALUES ('ddd88888-dddd-4888-8888-aaaaaaaaaaaa', 'bbb22222-2222-4222-8222-222222222222', 'Vestido Solstice Midi', 'vestido-solstice-midi', 'Vestido midi con movimiento fluido y cinturon ajustable para una silueta elegante.', 'Fashion Commerce', 'Viscosa', 'Mujer', 209000.00, NULL, 'active', true, 'Vestido Solstice Midi', 'Vestido midi fresco y sofisticado para ocasiones especiales.', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('aaa11111-a002-4111-8111-111111111112', 'aaa11111-aaaa-4111-8111-111111111111', 'CHAQ-URB-BLK-M', 'Negro', 'M', 7, 0, '770000000002', 700, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('aaa11111-a003-4111-8111-111111111113', 'aaa11111-aaaa-4111-8111-111111111111', 'CHAQ-URB-BLK-L', 'Negro', 'L', 5, 0, '770000000003', 700, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('bbb22222-b001-4222-8222-222222222221', 'bbb22222-bbbb-4222-8222-222222222222', 'VEST-AUR-BEI-XS', 'Beige', 'XS', 3, 0, '770000000004', 350, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('bbb22222-b002-4222-8222-222222222222', 'bbb22222-bbbb-4222-8222-222222222222', 'VEST-AUR-BEI-S', 'Beige', 'S', 3, 0, '770000000005', 350, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('bbb22222-b003-4222-8222-222222222223', 'bbb22222-bbbb-4222-8222-222222222222', 'VEST-AUR-BEI-M', 'Beige', 'M', 3, 0, '770000000006', 350, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc33333-c001-4333-8333-333333333331', 'ccc33333-cccc-4333-8333-333333333333', 'SNK-NOV-WHT-38', 'Blanco', '38', 6, 0, '770000000007', 500, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc33333-c002-4333-8333-333333333332', 'ccc33333-cccc-4333-8333-333333333333', 'SNK-NOV-WHT-39', 'Blanco', '39', 6, 0, '770000000008', 500, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc33333-c003-4333-8333-333333333333', 'ccc33333-cccc-4333-8333-333333333333', 'SNK-NOV-WHT-40', 'Blanco', '40', 7, 0, '770000000009', 500, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc33333-c004-4333-8333-333333333334', 'ccc33333-cccc-4333-8333-333333333333', 'SNK-NOV-WHT-41', 'Blanco', '41', 6, 0, '770000000010', 500, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd44444-d001-4444-8444-444444444441', 'ddd44444-dddd-4444-8444-444444444444', 'CAM-STD-BLU-S', 'Azul', 'S', 8, 0, '770000000011', 300, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd44444-d002-4444-8444-444444444442', 'ddd44444-dddd-4444-8444-444444444444', 'CAM-STD-BLU-M', 'Azul', 'M', 8, 0, '770000000012', 300, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd44444-d003-4444-8444-444444444443', 'ddd44444-dddd-4444-8444-444444444444', 'CAM-STD-BLU-L', 'Azul', 'L', 7, 0, '770000000013', 300, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd44444-d004-4444-8444-444444444444', 'ddd44444-dddd-4444-8444-444444444444', 'CAM-STD-BLU-XL', 'Azul', 'XL', 8, 0, '770000000014', 300, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('eee55555-a001-4555-8555-555555555551', 'eee55555-aaaa-4555-8555-555555555555', 'PAN-ATL-GRA-30', 'Gris', '30', 5, 0, '770000000015', 420, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('eee55555-a002-4555-8555-555555555552', 'eee55555-aaaa-4555-8555-555555555555', 'PAN-ATL-GRA-32', 'Gris', '32', 6, 0, '770000000016', 420, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('eee55555-a003-4555-8555-555555555553', 'eee55555-aaaa-4555-8555-555555555555', 'PAN-ATL-GRA-34', 'Gris', '34', 4, 0, '770000000017', 420, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('fff66666-b001-4666-8666-666666666661', 'fff66666-bbbb-4666-8666-666666666666', 'BAG-TER-COG-U', 'Cognac', 'U', 12, 0, '770000000018', 680, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('aaa55555-c001-4555-8555-777777777771', 'aaa55555-aaaa-4555-8555-777777777777', 'CHA-HOR-DNM-S', 'Denim oscuro', 'S', 5, 0, '770000000019', 820, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('aaa55555-c002-4555-8555-777777777772', 'aaa55555-aaaa-4555-8555-777777777777', 'CHA-HOR-DNM-M', 'Denim oscuro', 'M', 6, 0, '770000000020', 820, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('aaa55555-c003-4555-8555-777777777773', 'aaa55555-aaaa-4555-8555-777777777777', 'CHA-HOR-DNM-L', 'Denim oscuro', 'L', 5, 0, '770000000021', 820, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('bbb66666-d001-4666-8666-888888888881', 'bbb66666-bbbb-4666-8666-888888888888', 'CAM-LIN-BEI-S', 'Beige', 'S', 9, 0, '770000000022', 240, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('bbb66666-d002-4666-8666-888888888882', 'bbb66666-bbbb-4666-8666-888888888888', 'CAM-LIN-BEI-M', 'Beige', 'M', 8, 0, '770000000023', 240, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('bbb66666-d003-4666-8666-888888888883', 'bbb66666-bbbb-4666-8666-888888888888', 'CAM-LIN-BEI-L', 'Beige', 'L', 7, 0, '770000000024', 240, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc77777-e001-4777-8777-999999999991', 'ccc77777-cccc-4777-8777-999999999999', 'SNK-PLS-BLK-37', 'Negro', '37', 5, 0, '770000000025', 520, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc77777-e002-4777-8777-999999999992', 'ccc77777-cccc-4777-8777-999999999999', 'SNK-PLS-BLK-38', 'Negro', '38', 6, 0, '770000000026', 520, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc77777-e003-4777-8777-999999999993', 'ccc77777-cccc-4777-8777-999999999999', 'SNK-PLS-BLK-39', 'Negro', '39', 6, 0, '770000000027', 520, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ccc77777-e004-4777-8777-999999999994', 'ccc77777-cccc-4777-8777-999999999999', 'SNK-PLS-BLK-40', 'Negro', '40', 5, 0, '770000000028', 520, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd88888-f001-4888-8888-aaaaaaaaaaa1', 'ddd88888-dddd-4888-8888-aaaaaaaaaaaa', 'VES-SOL-SAG-XS', 'Sage', 'XS', 4, 0, '770000000029', 360, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd88888-f002-4888-8888-aaaaaaaaaaa2', 'ddd88888-dddd-4888-8888-aaaaaaaaaaaa', 'VES-SOL-SAG-S', 'Sage', 'S', 5, 0, '770000000030', 360, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('ddd88888-f003-4888-8888-aaaaaaaaaaa3', 'ddd88888-dddd-4888-8888-aaaaaaaaaaaa', 'VES-SOL-SAG-M', 'Sage', 'M', 4, 0, '770000000031', 360, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.product_variants (id, product_id, sku, color, size, stock, reserved_stock, barcode, weight_grams, created_at) VALUES ('aaa11111-a001-4111-8111-111111111111', 'aaa11111-aaaa-4111-8111-111111111111', 'CHAQ-URB-BLK-S', 'Negro', 'S', 4, 0, '770000000001', 700, '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cart_items (id, cart_id, product_variant_id, quantity, unit_price, created_at) VALUES ('aaa11111-ca21-4111-8111-111111111111', 'aaa11111-ca11-4111-8111-111111111111', 'ccc33333-c003-4333-8333-333333333333', 1, 219000.00, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.cart_items (id, cart_id, product_variant_id, quantity, unit_price, created_at) VALUES ('bbb22222-ca22-4222-8222-222222222222', 'aaa11111-ca11-4111-8111-111111111111', 'ddd44444-d002-4444-8444-444444444442', 1, 129000.00, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.cart_items (id, cart_id, product_variant_id, quantity, unit_price, created_at) VALUES ('bbb11111-ca21-4111-8111-111111111111', 'bbb11111-ca11-4111-8111-111111111111', 'fff66666-b001-4666-8666-666666666661', 1, 149000.00, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.cart_items (id, cart_id, product_variant_id, quantity, unit_price, created_at) VALUES ('bbb11111-ca22-4111-8111-111111111112', 'bbb11111-ca11-4111-8111-111111111111', 'bbb66666-d002-4666-8666-888888888882', 1, 109000.00, '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.coupons (id, code, description, discount_type, discount_value, starts_at, ends_at, usage_limit, usage_count, is_active) VALUES ('aaa11111-c111-4111-8111-111111111111', 'BIENVENIDO10', '10 por ciento en primera compra', 'percentage', 10.00, '2026-03-16 11:43:35.168533-05', '2026-06-24 11:43:35.168533-05', 500, 12, true);
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, starts_at, ends_at, usage_limit, usage_count, is_active) VALUES ('bbb22222-c222-4222-8222-222222222222', 'ENVIOGRATIS', 'Descuento fijo para envio', 'fixed', 14000.00, '2026-03-21 11:43:35.168533-05', '2026-04-25 11:43:35.168533-05', 300, 22, true);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('aaa11111-0111-4111-8111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aaa11111-c111-4111-8111-111111111111', 'ORD-2001', 'delivered', 348000.00, 29000.00, 14000.00, 0.00, 333000.00, 'Entrega completada', '2026-03-18 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('bbb22222-0222-4222-8222-222222222222', '33333333-3333-3333-3333-333333333333', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', NULL, 'ORD-1984', 'shipped', 249000.00, 0.00, 14000.00, 0.00, 263000.00, 'En camino', '2026-03-14 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('ccc33333-0333-4333-8333-333333333333', '44444444-4444-4444-4444-444444444444', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', NULL, 'ORD-1940', 'delivered', 518000.00, 0.00, 0.00, 0.00, 518000.00, 'Entregado sin novedad', '2026-03-06 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('ddd11111-0444-4444-8444-111111111111', '55555555-5555-4555-8555-555555555550', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'bbb22222-c222-4222-8222-222222222222', 'ORD-2034', 'delivered', 378000.00, 14000.00, 0.00, 0.00, 364000.00, 'Entrega premium completada', '2026-03-22 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('eee22222-0555-4555-8555-222222222222', '66666666-6666-4666-8666-666666666660', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', NULL, 'ORD-2042', 'delivered', 368000.00, 0.00, 0.00, 0.00, 368000.00, 'Cliente satisfecho con la entrega', '2026-03-24 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('fff33333-0666-4666-8666-333333333333', '22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', NULL, 'ORD-2038', 'processing', 139000.00, 0.00, 14000.00, 0.00, 153000.00, 'Empaque en curso', '2026-03-25 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('077a1290-ba64-4212-86a9-15b21faee003', 'a8787397-5474-49e4-9f29-74cbd130c7ee', NULL, NULL, 'POS-48291399-D3D86E', 'paid', 199000.00, 0.00, 0.00, 0.00, 199000.00, 'Venta presencial POS | Cliente: Cliente Mostrador QA | Medio de pago: cash | Recibido: 209000 | Prueba automatizada POS', '2026-03-26 13:04:51.396808-05', '2026-03-26 13:04:51.396808-05', '2026-03-26 13:04:51.396808-05');
INSERT INTO public.orders (id, user_id, address_id, coupon_id, order_number, status, subtotal, discount_total, shipping_total, tax_total, grand_total, notes, paid_at, created_at, updated_at) VALUES ('2b70debb-46d4-4c59-bfd6-70ecb2575f62', '03bc620e-deba-4c8d-b328-9d4589805392', NULL, NULL, 'POS-50087955-BE208A', 'paid', 168644.07, 0.00, 0.00, 30355.93, 199000.00, 'Venta presencial POS | Cliente: Cliente Empresa QA | Comprobante: factura | Medio de pago: cash | Recibido: 199050 | Prueba fiscal Peru', '2026-03-26 13:34:47.954777-05', '2026-03-26 13:34:47.954777-05', '2026-03-26 13:34:47.954777-05');


--
-- Data for Name: electronic_documents; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.electronic_documents (id, order_id, billing_profile_id, document_type, series, correlative, issue_date, currency_code, taxable_amount, igv_amount, total_amount, status, payload, sunat_ticket, sunat_reference, hash_code, qr_payload, last_error, created_by, created_at, updated_at) VALUES ('85bd9f52-55ee-46f2-8bff-32080e89362d', '2b70debb-46d4-4c59-bfd6-70ecb2575f62', '125dd91d-c225-4585-a3dd-09a7b41a6b34', 'factura', 'F001', NULL, '2026-03-26', 'PEN', 168644.07, 30355.93, 199000.00, 'draft', '{"lines": [{"sku": "CHAQ-URB-BLK-S", "quantity": 1, "igvAmount": 30355.93, "unitPrice": 199000, "unitValue": 168644.07, "description": "Chaqueta Urban Motion - S", "orderItemId": "cf05e9a9-ada4-46b3-957f-f150b5bc5c85", "totalAmount": 199000, "taxableAmount": 168644.07}], "order": {"orderId": "2b70debb-46d4-4c59-bfd6-70ecb2575f62", "orderNumber": "POS-50087955-BE208A"}, "issuer": {"taxId": "20123456789", "ubigeo": "150122", "district": "Miraflores", "province": "Lima", "legalName": "Fashion Commerce Peru SAC", "taxIdType": "RUC", "tradeName": "Fashion Commerce Peru", "department": "Lima", "fiscalAddress": "Av. Larco 123 Oficina 402", "establishmentCode": "0000"}, "summary": {"igvAmount": 30355.93, "totalAmount": 199000, "currencyCode": "PEN", "taxableAmount": 168644.07}, "customer": {"name": "Empresa QA Peru SAC", "email": "compras@empresaqa.pe", "address": "Av. Javier Prado 456", "documentType": "RUC", "documentNumber": "20123456789"}}', NULL, NULL, NULL, NULL, NULL, '55555555-5555-5555-5555-555555555555', '2026-03-26 13:34:47.954777-05', '2026-03-26 13:34:47.954777-05');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('aaa11111-0a11-4111-8111-111111111111', 'aaa11111-0111-4111-8111-111111111111', 'ccc33333-c003-4333-8333-333333333333', 'Sneakers Nova Run', 'SNK-NOV-WHT-40', 1, 219000.00, 219000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('aaa11111-0a12-4111-8111-111111111112', 'aaa11111-0111-4111-8111-111111111111', 'ddd44444-d002-4444-8444-444444444442', 'Camisa Studio Fit', 'CAM-STD-BLU-M', 1, 129000.00, 129000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('bbb22222-0b21-4222-8222-222222222221', 'bbb22222-0222-4222-8222-222222222222', 'ccc33333-c002-4333-8333-333333333332', 'Sneakers Nova Run', 'SNK-NOV-WHT-39', 1, 249000.00, 249000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('ccc33333-0c31-4333-8333-333333333331', 'ccc33333-0333-4333-8333-333333333333', 'aaa11111-a002-4111-8111-111111111112', 'Chaqueta Urban Motion', 'CHAQ-URB-BLK-M', 1, 199000.00, 199000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('ccc33333-0c32-4333-8333-333333333332', 'ccc33333-0333-4333-8333-333333333333', 'bbb22222-b002-4222-8222-222222222222', 'Vestido Aura Linen', 'VEST-AUR-BEI-S', 1, 189000.00, 189000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('ccc33333-0c33-4333-8333-333333333333', 'ccc33333-0333-4333-8333-333333333333', 'ddd44444-d003-4444-8444-444444444443', 'Camisa Studio Fit', 'CAM-STD-BLU-L', 1, 130000.00, 130000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('ddd11111-0a41-4555-8555-111111111111', 'ddd11111-0444-4444-8444-111111111111', 'fff66666-b001-4666-8666-666666666661', 'Bolso Terra Mini', 'BAG-TER-COG-U', 1, 149000.00, 149000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('ddd11111-0a42-4555-8555-111111111112', 'ddd11111-0444-4444-8444-111111111111', 'ccc77777-e002-4777-8777-999999999992', 'Sneakers Pulse Street', 'SNK-PLS-BLK-38', 1, 229000.00, 229000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('eee22222-0b51-4555-8555-222222222221', 'eee22222-0555-4555-8555-222222222222', 'aaa55555-c002-4555-8555-777777777772', 'Chaqueta Horizon Denim', 'CHA-HOR-DNM-M', 1, 259000.00, 259000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('eee22222-0b52-4555-8555-222222222222', 'eee22222-0555-4555-8555-222222222222', 'bbb66666-d002-4666-8666-888888888882', 'Camisa Linen Flow', 'CAM-LIN-BEI-M', 1, 109000.00, 109000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('fff33333-0c61-4666-8666-333333333331', 'fff33333-0666-4666-8666-333333333333', 'eee55555-a002-4555-8555-555555555552', 'Pantalon Atlas Tailored', 'PAN-ATL-GRA-32', 1, 139000.00, 139000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('ee06c316-248f-47ed-8c3d-416600f90926', '077a1290-ba64-4212-86a9-15b21faee003', 'aaa11111-a001-4111-8111-111111111111', 'Chaqueta Urban Motion - S', 'CHAQ-URB-BLK-S', 1, 199000.00, 199000.00);
INSERT INTO public.order_items (id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, quantity, unit_price, line_total) VALUES ('cf05e9a9-ada4-46b3-957f-f150b5bc5c85', '2b70debb-46d4-4c59-bfd6-70ecb2575f62', 'aaa11111-a001-4111-8111-111111111111', 'Chaqueta Urban Motion - S', 'CHAQ-URB-BLK-S', 1, 199000.00, 199000.00);


--
-- Data for Name: electronic_document_lines; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.electronic_document_lines (id, electronic_document_id, order_item_id, line_number, item_code, description, unit_code, quantity, unit_value, unit_price, taxable_amount, igv_amount, line_total) VALUES ('e62cc4fd-617f-46e1-a9cb-9b5e40678320', '85bd9f52-55ee-46f2-8bff-32080e89362d', 'cf05e9a9-ada4-46b3-957f-f150b5bc5c85', 1, 'CHAQ-URB-BLK-S', 'Chaqueta Urban Motion - S', 'NIU', 1.00, 168644.07, 199000.00, 168644.07, 30355.93, 199000.00);


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('aaa11111-f001-4111-8111-111111111111', 'aaa11111-a001-4111-8111-111111111111', 'in', 6, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('ccc33333-f001-4333-8333-333333333333', 'ccc33333-c003-4333-8333-333333333333', 'in', 7, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('ddd44444-f001-4444-8444-444444444442', 'ddd44444-d002-4444-8444-444444444442', 'in', 8, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('eee55555-f101-4555-8555-555555555555', 'eee55555-a002-4555-8555-555555555552', 'in', 6, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('fff66666-f101-4666-8666-666666666666', 'fff66666-b001-4666-8666-666666666661', 'in', 12, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('aaa55555-f101-4555-8555-777777777777', 'aaa55555-c002-4555-8555-777777777772', 'in', 6, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('bbb66666-f101-4666-8666-888888888888', 'bbb66666-d002-4666-8666-888888888882', 'in', 8, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('ccc77777-f101-4777-8777-999999999999', 'ccc77777-e003-4777-8777-999999999993', 'in', 6, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('ddd88888-f101-4888-8888-aaaaaaaaaaaa', 'ddd88888-f002-4888-8888-aaaaaaaaaaa2', 'in', 5, 'Carga inicial', 'seed', NULL, '11111111-1111-1111-1111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('7b59f09a-f8e6-4437-98df-988e22483547', 'aaa11111-a001-4111-8111-111111111111', 'out', 1, 'Venta presencial POS', 'order', '077a1290-ba64-4212-86a9-15b21faee003', '55555555-5555-5555-5555-555555555555', '2026-03-26 13:04:51.396808-05');
INSERT INTO public.inventory_movements (id, product_variant_id, movement_type, quantity, reason, reference_type, reference_id, created_by, created_at) VALUES ('1a212e19-7f54-4a45-95b0-f9c13914ba4b', 'aaa11111-a001-4111-8111-111111111111', 'out', 1, 'Venta presencial POS', 'order', '2b70debb-46d4-4c59-bfd6-70ecb2575f62', '55555555-5555-5555-5555-555555555555', '2026-03-26 13:34:47.954777-05');


--
-- Data for Name: order_billing_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_billing_profiles (id, order_id, document_type, customer_document_type, customer_document_number, customer_legal_name, customer_address, customer_email, currency_code, taxable_amount, igv_amount, total_amount, is_final_consumer, created_at, updated_at) VALUES ('61dcd563-3f6c-444c-8a6d-df76d2f35f44', '2b70debb-46d4-4c59-bfd6-70ecb2575f62', 'factura', 'RUC', '20123456789', 'Empresa QA Peru SAC', 'Av. Javier Prado 456', 'compras@empresaqa.pe', 'PEN', 168644.07, 30355.93, 199000.00, false, '2026-03-26 13:34:47.954777-05', '2026-03-26 13:34:47.954777-05');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('aaa11111-0d11-4111-8111-111111111111', 'aaa11111-0111-4111-8111-111111111111', 'wompi', 'WOMPI-2001', 'paid', 333000.00, 'PEN', '2026-03-18 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('bbb22222-0d22-4222-8222-222222222222', 'bbb22222-0222-4222-8222-222222222222', 'mercado_pago', 'MP-1984', 'paid', 263000.00, 'PEN', '2026-03-14 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('ccc33333-0d33-4333-8333-333333333333', 'ccc33333-0333-4333-8333-333333333333', 'stripe', 'STR-1940', 'paid', 518000.00, 'PEN', '2026-03-06 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('ddd11111-0d41-4555-8555-111111111111', 'ddd11111-0444-4444-8444-111111111111', 'wompi', 'WOMPI-2034', 'paid', 364000.00, 'PEN', '2026-03-22 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('eee22222-0d52-4555-8555-222222222222', 'eee22222-0555-4555-8555-222222222222', 'stripe', 'STR-2042', 'paid', 368000.00, 'PEN', '2026-03-24 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('fff33333-0d63-4666-8666-333333333333', 'fff33333-0666-4666-8666-333333333333', 'mercado_pago', 'MP-2038', 'paid', 153000.00, 'PEN', '2026-03-25 11:43:35.168533-05', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('fe34626d-47e8-4226-9975-64179754ea7e', '077a1290-ba64-4212-86a9-15b21faee003', 'manual', 'cash', 'paid', 199000.00, 'PEN', '2026-03-26 13:04:51.396808-05', '2026-03-26 13:04:51.396808-05');
INSERT INTO public.payments (id, order_id, provider, provider_reference, status, amount, currency, paid_at, created_at) VALUES ('fc65d598-ae99-472e-a9d6-3f66acdc5466', '2b70debb-46d4-4c59-bfd6-70ecb2575f62', 'manual', 'cash', 'paid', 199000.00, 'PEN', '2026-03-26 13:34:47.954777-05', '2026-03-26 13:34:47.954777-05');


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('aaa11111-eeee-4111-8111-111111111111', 'aaa11111-aaaa-4111-8111-111111111111', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', 'Chaqueta Urban Motion', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('bbb22222-eeee-4222-8222-222222222222', 'bbb22222-bbbb-4222-8222-222222222222', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 'Vestido Aura Linen', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('ccc33333-eeee-4333-8333-333333333333', 'ccc33333-cccc-4333-8333-333333333333', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 'Sneakers Nova Run', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('ddd44444-eeee-4444-8444-444444444444', 'ddd44444-dddd-4444-8444-444444444444', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80', 'Camisa Studio Fit', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('eee55555-eeee-4555-8555-555555555555', 'eee55555-aaaa-4555-8555-555555555555', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'Pantalon Atlas Tailored', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('fff66666-eeee-4666-8666-666666666666', 'fff66666-bbbb-4666-8666-666666666666', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80', 'Bolso Terra Mini', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('aaa55555-eeee-4555-8555-777777777777', 'aaa55555-aaaa-4555-8555-777777777777', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80', 'Chaqueta Horizon Denim', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('bbb66666-eeee-4666-8666-888888888888', 'bbb66666-bbbb-4666-8666-888888888888', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80', 'Camisa Linen Flow', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('ccc77777-eeee-4777-8777-999999999999', 'ccc77777-cccc-4777-8777-999999999999', 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80', 'Sneakers Pulse Street', true, 1);
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES ('ddd88888-eeee-4888-8888-aaaaaaaaaaaa', 'ddd88888-dddd-4888-8888-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80', 'Vestido Solstice Midi', true, 1);


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('aaa11111-0e11-4111-8111-111111111111', '22222222-2222-2222-2222-222222222222', 'ccc33333-cccc-4333-8333-333333333333', 'aaa11111-0a11-4111-8111-111111111111', 5, 'Excelente compra', 'Excelente calidad y envio muy rapido.', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('bbb22222-0e22-4222-8222-222222222222', '33333333-3333-3333-3333-333333333333', 'ccc33333-cccc-4333-8333-333333333333', 'bbb22222-0b21-4222-8222-222222222221', 4, 'Muy comodos', 'La talla coincide perfecto y el acabado se siente premium.', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('ccc33333-0e33-4333-8333-333333333333', '44444444-4444-4444-4444-444444444444', 'aaa11111-aaaa-4111-8111-111111111111', 'ccc33333-0c31-4333-8333-333333333331', 5, 'Gran experiencia', 'Muy buena experiencia de compra y una presentacion impecable.', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('ddd11111-0e41-4555-8555-111111111111', '55555555-5555-4555-8555-555555555550', 'fff66666-bbbb-4666-8666-666666666666', 'ddd11111-0a41-4555-8555-111111111111', 5, 'Ideal para diario', 'El tamano es perfecto y los acabados se sienten muy bien.', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('ddd11111-0e42-4555-8555-111111111112', '55555555-5555-4555-8555-555555555550', 'ccc77777-cccc-4777-8777-999999999999', 'ddd11111-0a42-4555-8555-111111111112', 4, 'Comodos y ligeros', 'Muy comodos para caminar y con una silueta muy limpia.', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('eee22222-0e51-4555-8555-222222222221', '66666666-6666-4666-8666-666666666660', 'aaa55555-aaaa-4555-8555-777777777777', 'eee22222-0b51-4555-8555-222222222221', 5, 'Denim impecable', 'La chaqueta tiene gran estructura y el tono combina con todo.', true, '2026-03-26 11:43:35.168533-05');
INSERT INTO public.reviews (id, user_id, product_id, order_item_id, rating, title, comment, is_verified_purchase, created_at) VALUES ('eee22222-0e52-4555-8555-222222222222', '66666666-6666-4666-8666-666666666660', 'bbb66666-bbbb-4666-8666-888888888888', 'eee22222-0b52-4555-8555-222222222222', 4, 'Muy fresca', 'La tela es ligera y el fit queda muy bien para clima calido.', true, '2026-03-26 11:43:35.168533-05');


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('aaa11111-0f11-4111-8111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaa11111-aaaa-4111-8111-111111111111', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('bbb22222-0f22-4222-8222-222222222222', '22222222-2222-2222-2222-222222222222', 'ccc33333-cccc-4333-8333-333333333333', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('ccc33333-0f33-4333-8333-333333333333', '33333333-3333-3333-3333-333333333333', 'bbb22222-bbbb-4222-8222-222222222222', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('ddd11111-0f41-4555-8555-111111111111', '55555555-5555-4555-8555-555555555550', 'ddd88888-dddd-4888-8888-aaaaaaaaaaaa', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('ddd11111-0f42-4555-8555-111111111112', '55555555-5555-4555-8555-555555555550', 'aaa55555-aaaa-4555-8555-777777777777', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('eee22222-0f51-4555-8555-222222222221', '66666666-6666-4666-8666-666666666660', 'eee55555-aaaa-4555-8555-555555555555', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('eee22222-0f52-4555-8555-222222222222', '66666666-6666-4666-8666-666666666660', 'ccc77777-cccc-4777-8777-999999999999', '2026-03-26 11:43:35.168533-05');
INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ('fff33333-0f63-4666-8666-333333333333', '44444444-4444-4444-4444-444444444444', 'fff66666-bbbb-4666-8666-666666666666', '2026-03-26 11:43:35.168533-05');


--
-- PostgreSQL database dump complete
--



COMMIT;

-- Restore the default search_path for interactive sessions such as Neon SQL Editor.
RESET search_path;
