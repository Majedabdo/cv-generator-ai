import apiServerClient from "@/lib/apiServerClient";
import pb from "@/lib/pocketbaseClient";

async function call(path, { method = "GET", body } = {}) {
  const res = await apiServerClient.fetch(`/admin${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pb.authStore.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {
      /* noop */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const adminApi = {
  get: (p) => call(p),
  post: (p, body) => call(p, { method: "POST", body }),
  patch: (p, body) => call(p, { method: "PATCH", body }),
  put: (p, body) => call(p, { method: "PUT", body }),
  del: (p) => call(p, { method: "DELETE" }),
};

export default adminApi;
