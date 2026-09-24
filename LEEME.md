# Vizcaína Living Home · Golf

Landing responsive en HTML, CSS y JavaScript puro, sin instalación ni compilación.

## Archivos

- `index.html`: estructura, textos, metadatos y formulario.
- `style.css`: estilos mobile-first, tipografía, estados y adaptación a escritorio.
- `script.js`: validación, envío POST, confirmación y redirección opcional.
- `assets/`: logotipo e ilustración originales proporcionados.

Abre `index.html` para ver el diseño, o sirve esta carpeta con cualquier servidor estático.
Las tipografías usan Google Fonts; si no hay conexión se usan Georgia y Arial.

## Conectar el formulario

1. En `script.js`, sustituye `const API_URL = "PENDIENTE_CONFIGURAR"` por la URL HTTPS del servicio. En Apps Script, utiliza la URL de despliegue terminada en `/exec`.
2. El servicio recibe un POST `text/plain;charset=utf-8` cuyo cuerpo es JSON con `nombre`, `empresa`, `correo`, `telefono`, `fecha` (ISO UTC) y `origen` (`vizcaina-golf`).
3. El servidor debe validar los datos, guardarlos y devolver HTTP 2xx con JSON `{"success":true}` únicamente después del guardado. Debe permitir que el navegador lea la respuesta mediante CORS. No usar `no-cors`, ya que no permite verificar el guardado.
4. El correo con el descuento debe enviarse desde el servicio que se conecte: esta landing no envía correos por sí misma.
5. Si quieres redirigir a otra página después de 4.5 segundos, configura `REDIRECT_URL` con una URL HTTPS. Por defecto se pasa a una confirmación visual dentro de la misma página.

Con la API pendiente no se transmiten ni guardan datos, ni se simula un registro exitoso. Se presenta un aviso claro. La validación activa el botón cuando nombre, correo y teléfono son válidos; empresa es opcional. Los errores conservan los datos. El envío en curso bloquea duplicados por clic; para reintentos tras una pérdida de conexión, el servidor debe gestionar duplicados.

Antes de captar registros reales, configura el destino y el envío de correo, y adapta el texto de confidencialidad a tu tratamiento de datos. El porcentaje, vigencia y condiciones del descuento no se inventaron: el beneficio se comunica de forma genérica.

## Accesibilidad y comportamiento

Etiquetas, autocompletado, errores asociados a cada campo, estados anunciados, foco visible, confirmación con foco y compatibilidad con movimiento reducido. El teléfono acepta entre 10 y 15 dígitos, incluyendo formatos con prefijo internacional.

Se incluye una mejora progresiva WebMCP para preparar los campos sin enviar datos. El formulario funciona en navegadores que no la soportan.
