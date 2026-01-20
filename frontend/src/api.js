const API_BASE = process.env.REACT_APP_API_BASE || ""; // CRA proxy -> ""

export async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
