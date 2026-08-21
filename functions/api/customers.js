const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin"
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

function clean(value, maxLength) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().slice(0, maxLength);
}

function normalizeGstin(value) {
  return clean(value, 15).toUpperCase();
}

export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB
      .prepare(`
        SELECT
          id,
          name,
          address,
          gstin,
          state_code,
          phone,
          email,
          created_at,
          updated_at
        FROM customers
        WHERE is_active = 1
        ORDER BY name COLLATE NOCASE ASC
      `)
      .all();

    return json({
      success: true,
      customers: results
    });
  } catch (error) {
    console.error("GET /api/customers failed:", error);

    return json({
      success: false,
      error: "Unable to load customers."
    }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const name = clean(body.name, 150);
    const address = clean(body.address, 1000);
    const gstin = normalizeGstin(body.gstin);
    const stateCode = clean(body.state_code || "24", 2);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 150).toLowerCase();

    if (!name) {
      return json({
        success: false,
        error: "Customer name is required."
      }, 400);
    }

    if (!/^\d{2}$/.test(stateCode)) {
      return json({
        success: false,
        error: "State code must contain exactly 2 digits."
      }, 400);
    }

    // Prevent obvious duplicate GSTIN entries.
    if (gstin) {
      const existing = await context.env.DB
        .prepare(`
          SELECT id, name
          FROM customers
          WHERE UPPER(gstin) = ?1
            AND is_active = 1
          LIMIT 1
        `)
        .bind(gstin)
        .first();

      if (existing) {
        return json({
          success: false,
          error: `A customer with this GSTIN already exists: ${existing.name}`,
          customer_id: existing.id
        }, 409);
      }
    }

    const result = await context.env.DB
      .prepare(`
        INSERT INTO customers (
          name,
          address,
          gstin,
          state_code,
          phone,
          email
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      `)
      .bind(
        name,
        address,
        gstin || null,
        stateCode,
        phone || null,
        email || null
      )
      .run();

    const customerId = result.meta.last_row_id;

    const customer = await context.env.DB
      .prepare(`
        SELECT
          id,
          name,
          address,
          gstin,
          state_code,
          phone,
          email,
          created_at,
          updated_at
        FROM customers
        WHERE id = ?1
      `)
      .bind(customerId)
      .first();

    return json({
      success: true,
      customer
    }, 201);
  } catch (error) {
    console.error("POST /api/customers failed:", error);

    return json({
      success: false,
      error: "Unable to save customer."
    }, 500);
  }
}
