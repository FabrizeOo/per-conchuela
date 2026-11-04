# Matriz de Hardening y Cumplimiento de Seguridad — Perú Conchuela

Este repositorio implementa una línea base de endurecimiento (*Security Hardening*) de grado empresarial para **peruconchuela.com**, alineada con los cuatro marcos normativos solicitados:

1. **SOC 2 Type II** (*AICPA Trust Services Criteria*: Seguridad `CC6/CC7/CC8`, Integridad de Procesamiento `PI1` y Privacidad `P1–P8`).
2. **ISO/IEC 27071:2023** (*Cybersecurity — Security recommendations for establishing trusted connections between devices and services*).
3. **ISO/IEC 27001:2022** (*Sistema de Gestión de Seguridad de la Información — Controles del Anexo A*).
4. **OWASP** (*OWASP Top 10:2021/2025*, *OWASP ASVS v4.0.3 Nivel 2* y *OWASP Secure Headers Project*).

---

## 1. Matriz de Controles Implementados

| Dominio de Control | Implementación Técnica en el Código | SOC 2 | ISO/IEC 27071:2023 | ISO/IEC 27001:2022 | OWASP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Eliminación de Cadena de Suministro Externa (Zero-CDN JS)** | Alojamiento local de `js/vendor/gsap.min.js` y `js/vendor/ScrollTrigger.min.js` verificados mediante hash criptográfico SHA-384 e inmutabilidad binaria en `.gitattributes` (`-text`). Se elimina por completo la carga de JS desde CDNs externos. | CC6.6, CC7.1 | Cláusulas 6 y 7 (Autenticidad de origen y confianza extremo a extremo) | A.8.28, A.5.21 | A06, A08 (Software & Data Integrity) |
| **Content Security Policy (CSP) Estricta** | Directiva `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` y `upgrade-insecure-requests` aplicada en `index.html`, `vercel.json`, `_headers`, `.htaccess` y `nginx-security.conf`. Cero `'unsafe-inline'` y cero `'unsafe-eval'` en scripts. | CC6.1, CC6.6 | Cláusula 7.3 (Restricción de canales no autorizados) | A.8.20, A.8.21, A.8.26 | A03, A05, ASVS V14.4 |
| **Transporte Cifrado y Cabeceras HTTP Endurecidas** | `Strict-Transport-Security` (HSTS 2 años + `includeSubDomains` + `preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara, micrófono, geolocalización, USB, pagos bloqueados) y aislamiento `COOP`/`CORP`. | CC6.7 | Cláusula 7.2 (Protección criptográfica del canal) | A.8.24, A.8.9 | A02, A05, Secure Headers |
| **Aislamiento de Servicios y Embebidos Externos** | Atributos `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"` y `referrerpolicy="strict-origin-when-cross-origin"` en iframes de Instagram y Google Maps; `rel="noopener noreferrer"` forzado estática y dinámicamente en el 100% de enlaces `target="_blank"`. | CC6.6 | Cláusula 6.4 (Fronteras de confianza con servicios externos) | A.8.21, A.8.23 | A01, A05 |
| **Prevención de DOM XSS e Inmutabilidad en Memoria** | Eliminación del 100% de `innerHTML`, `outerHTML`, `document.write` y `eval()` en `js/main.js` y `js/scroll-video.js`. Construcción DOM con `createElement` + `textContent`. Congelamiento recursivo (`deepFreeze`) de catálogos (`GRAIN_DATA`, `ALLOWED_MAP_OFFICES`, `ALLOWED_SECTORS`) y validación regex de rutas locales en Lightbox. | PI1.2, CC6.1 | Cláusula 7.4 (Integridad de datos en el cliente) | A.8.28 | A03 (Injection / DOM XSS), ASVS V5.3 |
| **Validación de Entradas, Sanitización y Anti-Automatización** | Límites estrictos `minlength`/`maxlength`/`min`/`max`, sanitización de caracteres de control ASCII, saltos CRLF (anti-inyección en cabeceras `mailto:`) y caracteres Unicode BiDi de suplantación. Protección anti-bots mediante *honeypot* (`#website_url`), tiempo mínimo de llenado humano y *rate limiting* local (15 s). | PI1.1, CC7.2 | Cláusula 7.4 | A.8.26, A.8.28 | A04, Automated Threats OAT-010, ASVS V5.1 |
| **Privacidad por Diseño y Consentimiento Informado** | Cero cookies de rastreo, cero persistencia de PII en `localStorage`/`sessionStorage`, casilla obligatoria de consentimiento informado (`#privacidad-consent`) y modal accesible de Política de Privacidad y Seguridad alineado con SOC 2 Privacy y Ley N° 29733. | P1.1, P3.1, P4.1 | Cláusula 6.2 (Protección de identidad del usuario) | A.5.34, A.8.11 | ASVS V8 (Data Protection) |
| **Gestión de Vulnerabilidades y Prevención de Fuga de Secretos** | Archivo estándar RFC 9116 en `.well-known/security.txt`, `.gitignore` endurecido contra claves privadas y `.env*`, bloqueo de archivos sensibles en servidor y auditoría automatizada mediante `security-audit.js`. | CC7.1, CC7.3, CC8.1 | Cláusula 8 (Monitoreo y mantenimiento de confianza) | A.5.24, A.8.8, A.8.9, A.8.12 | A05, A09, ASVS V14.2 |

---

## 2. Verificación Automatizada Continua

Para ejecutar la auditoría técnica completa de controles de seguridad antes de cada despliegue:

```bash
node security-audit.js
```

El script valida criptográficamente los hashes SHA-384 de las dependencias locales, verifica cero sinks inseguros en JavaScript, audita las cabeceras CSP/HSTS/Permissions-Policy en todos los perfiles de servidor, inspecciona el aislamiento `sandbox` de iframes y escanea el repositorio en busca de credenciales expuestas.

---

## 3. Divulgación Responsable de Vulnerabilidades

Si identifica alguna vulnerabilidad de seguridad en **peruconchuela.com**, por favor repórtela de forma confidencial a través de:
- **Correo oficial**: `contactos@peruconchuela.com`
- **Descriptor RFC 9116**: `https://peruconchuela.com/.well-known/security.txt`
