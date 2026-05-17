import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool, type PoolConfig } from "pg";

type GalleryStatus = "pending" | "processing" | "succeeded" | "failed";
export type GalleryGenerator = "codex" | "tryon" | "codex_then_tryon" | "gpt2" | "azure" | "json";

type GalleryRowRecord = {
  id: string;
  status: GalleryStatus;
  generator: GalleryGenerator;
  prompt: string | null;
  aspect_ratio: string | null;
  image_url: string | null;
  error: string | null;
  progress: number;
  message: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  status: GalleryStatus;
  generator: GalleryGenerator;
  prompt?: string;
  aspectRatio?: string;
  imageUrl?: string;
  error?: string;
  progress: number;
  message?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateGalleryItemInput = {
  id?: string;
  status?: GalleryStatus;
  generator: GalleryGenerator;
  prompt?: string;
  aspectRatio?: string;
  progress?: number;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateGalleryItemInput = {
  status?: GalleryStatus;
  prompt?: string;
  aspectRatio?: string;
  progress?: number;
  message?: string;
  imageUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

let pool: Pool | null = null;
let initialized = false;

function getEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  return val;
}

function getDecodedEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  try {
    const decoded = Buffer.from(val, "base64").toString("utf-8");
    const ratio = decoded.length / val.length;
    const validLength = ratio > 0.5 && ratio < 1.5;
    const validUtf8 = !decoded.includes("�");
    if (validUtf8 && decoded.trim() && validLength && decoded !== val) return decoded;
  } catch {}
  return val;
}

function readOptionalFile(pathValue?: string) {
  if (!pathValue) return undefined;
  return readFileSync(pathValue, "utf8");
}

function readCertsFromDir(dir?: string) {
  if (!dir) return null;
  const caPath = path.join(dir, "ca.crt");
  const certPath = path.join(dir, "client_grabber_user.crt");
  const keyPath = path.join(dir, "client_grabber_user.key");
  if (!existsSync(caPath) || !existsSync(certPath) || !existsSync(keyPath)) return null;
  return {
    ca: readFileSync(caPath, "utf8"),
    cert: readFileSync(certPath, "utf8"),
    key: readFileSync(keyPath, "utf8"),
  };
}

function getPool() {
  if (pool) return pool;

  const connectionString = getEnv("DATABASE_URL");
  const host = getEnv("DB_HOST") ?? "150.220.93.109";
  const port = Number(getEnv("DB_PORT") ?? "6767");
  const database = getEnv("DB_NAME") ?? "grabber_db";
  const user = getEnv("DB_USER") ?? "grabber_user";
  const password = getEnv("DB_PASSWORD") ?? "grabber2026secure";

  const certsFromDir = readCertsFromDir(getEnv("SSL_CERTS_DIR"));
  const sslCa = getDecodedEnv("SSL_CA") ?? getDecodedEnv("DB_SSL_CA") ?? certsFromDir?.ca ?? readOptionalFile(getEnv("DB_SSL_CA_PATH"));
  const sslCert = getDecodedEnv("SSL_CERT") ?? getDecodedEnv("DB_SSL_CERT") ?? certsFromDir?.cert ?? readOptionalFile(getEnv("DB_SSL_CERT_PATH"));
  const sslKey = getDecodedEnv("SSL_KEY") ?? getDecodedEnv("PGSSLKEY") ?? getDecodedEnv("DB_SSL_KEY") ?? certsFromDir?.key ?? readOptionalFile(getEnv("DB_SSL_KEY_PATH"));
  const ssl = sslCa
    ? sslCert && sslKey
      ? { rejectUnauthorized: true, ca: sslCa, cert: sslCert, key: sslKey }
      : { rejectUnauthorized: true, ca: sslCa }
    : false;

  const normalizedConnectionString = connectionString?.replace(/([?&])sslmode=[^&]*&?/i, "$1").replace(/[?&]$/, "");

  const config: PoolConfig = normalizedConnectionString
    ? {
        connectionString: normalizedConnectionString,
        max: 5,
        ssl,
      }
    : {
        host,
        port,
        database,
        user,
        password,
        max: 5,
        ssl,
      };

  pool = new Pool(config);
  return pool;
}

async function ensureSchema() {
  if (initialized) return;
  const client = await getPool().connect();
  try {
    await client.query("create schema if not exists codeximg");
    await client.query(`
      create table if not exists codeximg.generated_images (
        id uuid primary key,
        status text not null,
        generator text not null,
        prompt text,
        aspect_ratio text,
        image_url text,
        error text,
        progress integer not null default 0,
        message text,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    await client.query("create index if not exists generated_images_created_at_idx on codeximg.generated_images (created_at desc)");
    initialized = true;
  } finally {
    client.release();
  }
}

function mapRow(row: GalleryRowRecord): GalleryItem {
  return {
    id: row.id,
    status: row.status,
    generator: row.generator,
    prompt: row.prompt ?? undefined,
    aspectRatio: row.aspect_ratio ?? undefined,
    imageUrl: row.image_url ?? undefined,
    error: row.error ?? undefined,
    progress: row.progress,
    message: row.message ?? undefined,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createGalleryItem(input: CreateGalleryItemInput) {
  await ensureSchema();
  const id = input.id ?? crypto.randomUUID();
  const result = await getPool().query<GalleryRowRecord>(
    `
      insert into codeximg.generated_images (
        id, status, generator, prompt, aspect_ratio, progress, message, metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      returning *
    `,
    [
      id,
      input.status ?? "pending",
      input.generator,
      input.prompt ?? null,
      input.aspectRatio ?? null,
      input.progress ?? 0,
      input.message ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
  return mapRow(result.rows[0]);
}

export async function updateGalleryItem(id: string, updates: UpdateGalleryItemInput) {
  await ensureSchema();
  const result = await getPool().query<GalleryRowRecord>(
    `
      update codeximg.generated_images
      set
        status = coalesce($2, status),
        prompt = coalesce($3, prompt),
        aspect_ratio = coalesce($4, aspect_ratio),
        progress = coalesce($5, progress),
        message = coalesce($6, message),
        image_url = coalesce($7, image_url),
        error = coalesce($8, error),
        metadata = case when $9::jsonb is null then metadata else metadata || $9::jsonb end,
        updated_at = now()
      where id = $1
      returning *
    `,
    [
      id,
      updates.status ?? null,
      updates.prompt ?? null,
      updates.aspectRatio ?? null,
      updates.progress ?? null,
      updates.message ?? null,
      updates.imageUrl ?? null,
      updates.error ?? null,
      updates.metadata ? JSON.stringify(updates.metadata) : null,
    ]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getGalleryItem(id: string) {
  await ensureSchema();
  const result = await getPool().query<GalleryRowRecord>("select * from codeximg.generated_images where id = $1", [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function listGalleryItems(limit = 100) {
  await ensureSchema();
  const result = await getPool().query<GalleryRowRecord>(
    "select * from codeximg.generated_images order by created_at desc limit $1",
    [limit]
  );
  return result.rows.map(mapRow);
}
