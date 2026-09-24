"use strict";

/* CONFIGURACIÓN: reemplazar por la URL /exec de Apps Script o de tu API.
   El servidor debe validar los datos y devolver JSON { "success": true }
   SOLO después de guardarlos. Debe permitir CORS para el origen de esta web.
   No usar mode: "no-cors": impide comprobar que el registro fue guardado. */
const API_URL = "PENDIENTE_CONFIGURAR";
// Opcional: URL HTTPS de destino tras la confirmación. Vacía = permanecer aquí.
const REDIRECT_URL = "";
const REDIRECT_DELAY_MS = 4500;

const form = document.getElementById("registration-form");
const button = document.getElementById("submit-button");
const statusMessage = document.getElementById("form-status");
const fields = [...form.querySelectorAll("input")];
const touched = new Set();
let sending = false;
let completed = false;

// Las comprobaciones se comparten entre el botón, el envío y los mensajes.
function fieldError(field) {
  const value = field.value.trim();
  if (field.required && !value) return "Completa este campo para continuar.";
  if (field.id === "nombre" && value.length < 3) return "Escribe tu nombre completo (al menos 3 caracteres).";
  if (field.id === "correo" && (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || field.validity.typeMismatch)) return "Escribe un correo válido, como nombre@correo.com.";
  if (field.id === "telefono" && (!/^[+\d\s().-]+$/.test(value) || !/^\d{10,15}$/.test(value.replace(/\D/g, "")))) return "Escribe un teléfono de 10 a 15 dígitos, con lada si corresponde.";
  if (value.length > field.maxLength) return "El texto es demasiado largo.";
  return "";
}
function validate() {
  let valid = true;
  fields.forEach(field => {
    const error = fieldError(field);
    if (error) valid = false;
    if (touched.has(field.id)) {
      field.setAttribute("aria-invalid", String(Boolean(error)));
      const hint = document.getElementById(`${field.id}-error`);
      if (hint) hint.textContent = error;
    }
  });
  button.disabled = !valid || sending || completed;
  return valid;
}
fields.forEach(field => {
  field.addEventListener("input", () => { statusMessage.textContent = ""; validate(); });
  field.addEventListener("change", validate);
  field.addEventListener("blur", () => { touched.add(field.id); validate(); });
});
window.addEventListener("pageshow", validate);

// POST compatible con Apps Script: JSON dentro de text/plain evita un preflight.
// Un timeout o error conserva los datos y permite reintentar.
async function sendRegistration(data) {
  if (API_URL === "PENDIENTE_CONFIGURAR" || !API_URL) {
    throw new Error("El registro aún no está disponible. Inténtalo más tarde; tus datos no se han enviado.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      signal: controller.signal,
      credentials: "omit",
      redirect: "follow"
    });
    if (!response.ok) throw new Error("No pudimos confirmar tu registro. Inténtalo nuevamente.");
    const result = await response.json();
    if (result.success !== true) throw new Error("No pudimos confirmar tu registro. Inténtalo nuevamente.");
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
function showSuccess() {
  completed = true;
  form.hidden = true;
  document.getElementById("form-heading").hidden = true;
  const panel = document.getElementById("success-panel");
  panel.hidden = false;
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ behavior: "auto", block: "nearest" });
  // Sin destino configurado se muestra la confirmación en esta misma página.
  if (REDIRECT_URL) {
    try {
      const destination = new URL(REDIRECT_URL, window.location.href);
      if (destination.protocol !== "https:") return;
      document.getElementById("redirect-note").hidden = false;
      setTimeout(() => window.location.assign(destination.href), REDIRECT_DELAY_MS);
    } catch { /* Una URL incorrecta no invalida un registro confirmado. */ }
  }
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (sending || completed) return;
  fields.forEach(field => touched.add(field.id));
  if (!validate()) { fields.find(field => fieldError(field))?.focus(); return; }
  sending = true;
  validate();
  form.setAttribute("aria-busy", "true");
  button.querySelector("span").textContent = "ENVIANDO…";
  statusMessage.textContent = "Estamos procesando tu registro…";
  const data = Object.fromEntries(fields.map(field => [field.name, field.value.trim()]));
  data.fecha = new Date().toISOString();
  data.origen = "vizcaina-golf";
  try {
    await sendRegistration(data);
    showSuccess();
  } catch (error) {
    statusMessage.textContent = error.name === "AbortError"
      ? "La confirmación tardó demasiado. Revisa tu conexión e intenta nuevamente."
      : error instanceof TypeError || error instanceof SyntaxError
        ? "No pudimos confirmar el envío. Revisa tu conexión e inténtalo nuevamente."
        : error.message;
  } finally {
    sending = false;
    form.removeAttribute("aria-busy");
    button.querySelector("span").textContent = "OBTENER MI DESCUENTO";
    validate();
  }
});

// Mejora progresiva WebMCP: preparar datos deja el envío bajo control del usuario.
// No guarda ni transmite información al usar esta herramienta.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: "prepare_golf_registration",
      description: "Completa el formulario de Vizcaína para revisión, sin enviarlo.",
      inputSchema: { type: "object", properties: { nombre: { type: "string" }, empresa: { type: "string" }, correo: { type: "string" }, telefono: { type: "string" } }, required: ["nombre", "correo", "telefono"], additionalProperties: false },
      annotations: { readOnlyHint: false },
      execute(input) {
        if (sending || completed) throw new Error("El registro ya está en proceso o confirmado.");
        if (!input || typeof input !== "object" || fields.some(field => (field.required || field.name in input) && typeof input[field.name] !== "string")) throw new Error("Datos incompletos o inválidos.");
        fields.forEach(field => { field.value = input[field.name] || ""; touched.add(field.id); });
        return { valid: validate(), sent: false };
      }
    }, { signal: lifecycle.signal })).catch(() => {});
    window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
  } catch { /* El formulario funciona aunque el navegador no soporte WebMCP. */ }
}
validate();
