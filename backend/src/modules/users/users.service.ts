import bcrypt from "bcryptjs";
import { pool } from "../../config/db";
import { HttpError } from "../../utils/http-error";

type UserRole = "admin" | "customer" | "cashier";

type UserRow = {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: Date | string | null;
  created_at: Date | string;
  orders_count: string | number;
};

type UserPayload = {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  isActive: boolean;
};

function formatDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function mapUser(row: UserRow) {
  return {
    id: row.id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    phone: row.phone,
    isActive: row.is_active,
    lastLoginAt: formatDate(row.last_login_at),
    createdAt: formatDate(row.created_at),
    ordersCount: Number(row.orders_count ?? 0)
  };
}

async function getUserById(userId: string) {
  const result = await pool.query<UserRow>("SELECT * FROM app_get_user_detail($1)", [userId]);

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

async function ensureEmailAvailable(email: string, ignoredUserId?: string) {
  const result = await pool.query<{ app_find_email_conflict: string | null }>(
    "SELECT app_find_email_conflict($1, $2)",
    [email, ignoredUserId ?? null]
  );

  if (result.rows[0]?.app_find_email_conflict) {
    throw new HttpError(400, "Ya existe un usuario con ese correo.");
  }
}

async function ensureAdminCanBeDeactivated(userId: string) {
  const result = await pool.query<{ role: UserRole; is_active: boolean }>(
    "SELECT * FROM app_get_user_role_state($1)",
    [userId]
  );

  const user = result.rows[0];

  if (!user || user.role !== "admin" || !user.is_active) {
    return;
  }

  const adminsResult = await pool.query<{ app_count_active_admins: string | number }>(
    "SELECT app_count_active_admins($1)",
    [userId]
  );

  if (Number(adminsResult.rows[0]?.app_count_active_admins ?? 0) === 0) {
    throw new HttpError(400, "Debe existir al menos un administrador activo.");
  }
}

export async function listUsers() {
  const result = await pool.query<UserRow>("SELECT * FROM app_list_users()");

  return result.rows.map(mapUser);
}

export async function createUser(payload: UserPayload) {
  await ensureEmailAvailable(payload.email);

  const passwordHash = await bcrypt.hash(payload.password ?? "Demo123*", 10);
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO users (
        role,
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      payload.role,
      payload.firstName,
      payload.lastName,
      payload.email.toLowerCase(),
      passwordHash,
      payload.phone ?? null,
      payload.isActive
    ]
  );

  return getUserById(result.rows[0].id);
}

export async function updateUser(userId: string, payload: UserPayload, actorId: string) {
  const existingUser = await getUserById(userId);

  if (!existingUser) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  await ensureEmailAvailable(payload.email, userId);

  if (!payload.isActive || payload.role !== "admin") {
    await ensureAdminCanBeDeactivated(userId);
  }

  if (actorId === userId && !payload.isActive) {
    throw new HttpError(400, "No puedes desactivar tu propia cuenta.");
  }

  const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : null;

  await pool.query(
    `
      UPDATE users
      SET
        role = $2,
        first_name = $3,
        last_name = $4,
        email = $5,
        password_hash = COALESCE($6, password_hash),
        phone = $7,
        is_active = $8,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      userId,
      payload.role,
      payload.firstName,
      payload.lastName,
      payload.email.toLowerCase(),
      passwordHash,
      payload.phone ?? null,
      payload.isActive
    ]
  );

  return getUserById(userId);
}

export async function deactivateUser(userId: string, actorId: string) {
  if (actorId === userId) {
    throw new HttpError(400, "No puedes desactivar tu propia cuenta.");
  }

  await ensureAdminCanBeDeactivated(userId);

  const result = await pool.query<{ id: string }>(
    `
      UPDATE users
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [userId]
  );

  if (!result.rows[0]) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  return getUserById(userId);
}
