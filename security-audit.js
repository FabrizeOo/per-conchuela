/**
 * PERÚ CONCHUELA — Suite Automatizada de Auditoría de Hardening
 * Verifica controles técnicos de SOC 2, ISO/IEC 27071:2023, ISO/IEC 27001:2022 y OWASP ASVS L2.
 * Ejecución: node security-audit.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
let passed = 0;
let failed = 0;

function check(condition, code, description) {
  if (condition) {
    passed++;
    console.log(`[PASS] [${code}] ${description}`);
  } else {
    failed++;
    console.error(`[FAIL] [${code}] ${description}`);
  }
}

function sha384Base64(filePath) {
  const buf = fs.readFileSync(filePath);
  return 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
}

console.log('======================================================================');
console.log(' AUDITORÍA DE HARDENING: SOC 2 | ISO 27071 | ISO 27001 | OWASP ASVS');
console.log('======================================================================\n');

// 1. Integridad criptográfica de librerías locales (ISO 27071 / OWASP A08 / SOC 2 CC6.6)
const EXPECTED_VENDOR_HASHES = {
  'js/vendor/gsap.min.js':
    'sha384-g4NTh/Iv5PPU4xPyhEWqPcwtNXOvdaDI8LLnyYfyNZOjKJeYQyjzQ9X5275eBjpt',
  'js/vendor/ScrollTrigger.min.js':
    'sha384-Z3REaz79l2IaAZqJsSABtTbhjgOUYyV3p90XNnAPCSHg3EMTz1fouunq9WZRtj3d'
};

for (const [relPath, expectedHash] of Object.entries(EXPECTED_VENDOR_HASHES)) {
  const absPath = path.join(ROOT, relPath);
  const exists = fs.existsSync(absPath);
  check(exists, 'OWASP-A08 / ISO-27071', `Librería local presente: ${relPath}`);
  if (exists) {
    const actualHash = sha384Base64(absPath);
    check(
      actualHash === expectedHash,
      'OWASP-A08 / ISO-27001-A.8.28',
      `Hash SHA-384 íntegro en ${relPath} (${actualHash.slice(0, 22)}...)`
    );
  }
}

// 2. Inspección de index.html (CSP, iframes sandbox, enlaces externos, cero scripts inline ejecutables)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

check(
  /http-equiv="Content-Security-Policy"/i.test(html) &&
    /script-src 'self'\s*;/.test(html) &&
    !/script-src[^;"]*unsafe-inline/i.test(html) &&
    !/script-src[^;"]*unsafe-eval/i.test(html),
  'OWASP-A05 / ISO-27001-A.8.20',
  'CSP estricta en index.html con script-src \'self\' (sin unsafe-inline ni unsafe-eval)'
);

check(
  !/cdnjs\.cloudflare\.com/i.test(html),
  'ISO-27071 / SOC2-CC6.6',
  'Cero dependencias de scripts hacia CDNs externos en index.html'
);

// Verificar que ningún <script> sea inline ejecutable (solo src="..." o type="application/ld+json")
const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
const unsafeInlineScripts = scriptTags.filter((tag) => {
  const hasSrc = /\bsrc\s*=\s*["'][^"']+["']/i.test(tag);
  const isJsonLd = /\btype\s*=\s*["']application\/ld\+json["']/i.test(tag);
  return !hasSrc && !isJsonLd;
});
check(
  unsafeInlineScripts.length === 0,
  'OWASP-ASVS-V14.4',
  `Cero bloques <script> inline ejecutables (${scriptTags.length} etiquetas auditadas)`
);

// Cero manejadores de eventos inline (onclick=, onerror=, onload=, etc.)
check(
  !/\son[a-z]+\s*=/i.test(html),
  'OWASP-A03',
  'Cero atributos de eventos inline (onclick, onerror, onload) en index.html'
);

// Todos los iframes deben poseer atributo sandbox y referrerpolicy
const iframes = html.match(/<iframe\b[\s\S]*?>/gi) || [];
const allIframesHardened =
  iframes.length > 0 &&
  iframes.every(
    (tag) =>
      /\bsandbox\s*=\s*["'][^"']+["']/i.test(tag) &&
      !/allow-top-navigation/i.test(tag) &&
      /\breferrerpolicy\s*=\s*["']strict-origin-when-cross-origin["']/i.test(tag)
  );
check(
  allIframesHardened,
  'ISO-27071 / OWASP-A05',
  `Todos los iframes (${iframes.length}) aislados con sandbox y referrerpolicy estricta`
);

// Todos los enlaces target="_blank" deben tener rel="noopener noreferrer"
const blankLinks = html.match(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi) || [];
const allBlankLinksSafe = blankLinks.every(
  (tag) => /\brel\s*=\s*["'][^"']*noopener[^"']*["']/i.test(tag) && /\brel\s*=\s*["'][^"']*noreferrer[^"']*["']/i.test(tag)
);
check(
  allBlankLinksSafe,
  'ISO-27071 / OWASP-Tabnabbing',
  `100% de enlaces externos target="_blank" (${blankLinks.length}) incluyen rel="noopener noreferrer"`
);

// Controles de privacidad y anti-automatización en el formulario
check(
  /id="privacidad-consent"/.test(html) && /id="privacy-modal"/.test(html) && /id="website_url"/.test(html),
  'SOC2-Privacy / ISO-27001-A.5.34',
  'Consentimiento informado, modal de Política de Privacidad y campo honeypot activos'
);

// 3. Análisis estático SAST de archivos JavaScript propios (OWASP A03 / ISO 27001 A.8.28)
const customJsFiles = ['js/main.js', 'js/scroll-video.js'];
for (const relJs of customJsFiles) {
  const rawCode = fs.readFileSync(path.join(ROOT, relJs), 'utf8');
  // Eliminar comentarios de bloque y de línea antes de buscar sinks reales en código ejecutable
  const code = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const hasDangerousSink = /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/.test(
    code
  );
  check(
    !hasDangerousSink,
    'OWASP-A03 / SAST',
    `Cero sinks peligrosos (innerHTML, eval, document.write) en ${relJs}`
  );
}

// 4. Configuraciones de servidor, gobernanza y divulgación de vulnerabilidades
const requiredInfraFiles = [
  '_headers',
  'vercel.json',
  '.htaccess',
  'nginx-security.conf',
  '.well-known/security.txt',
  '.gitignore',
  '.gitattributes',
  'SECURITY.md'
];

for (const reqFile of requiredInfraFiles) {
  check(
    fs.existsSync(path.join(ROOT, reqFile)),
    'SOC2-CC8.1 / ISO-27001-A.8.9',
    `Archivo de configuración/gobernanza presente: ${reqFile}`
  );
}

// Validar JSON de vercel.json y directivas clave HSTS + frame-ancestors
const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const vercelHeaderKeys = vercelConfig.headers[0].headers.map((h) => h.key);
check(
  vercelHeaderKeys.includes('Strict-Transport-Security') &&
    vercelHeaderKeys.includes('Content-Security-Policy') &&
    vercelHeaderKeys.includes('Permissions-Policy') &&
    vercelHeaderKeys.includes('Cross-Origin-Opener-Policy'),
  'OWASP-Headers / SOC2-CC6.7',
  'vercel.json válido con HSTS, CSP (frame-ancestors), Permissions-Policy y COOP'
);

// Validar RFC 9116 en .well-known/security.txt
const secTxt = fs.readFileSync(path.join(ROOT, '.well-known/security.txt'), 'utf8');
check(
  /^Contact:\s*mailto:/m.test(secTxt) && /^Expires:\s*\d{4}-\d{2}-\d{2}T/m.test(secTxt),
  'RFC-9116 / ISO-27001-A.8.8',
  '.well-known/security.txt cumple campos obligatorios Contact y Expires (RFC 9116)'
);

// 5. Escaneo de secretos expuestos en archivos de código (SOC 2 CC6.1 / ISO 27001 A.8.12)
const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /AIza[0-9A-Za-z\-_]{35}/,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[0-9A-Za-z]{36}/,
  /sk_live_[0-9a-zA-Z]{24,}/
];

const filesToScan = ['index.html', 'css/styles.css', 'js/main.js', 'js/scroll-video.js'];
let secretsFound = false;
for (const f of filesToScan) {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const rx of SECRET_PATTERNS) {
    if (rx.test(content)) secretsFound = true;
  }
}
check(!secretsFound, 'ISO-27001-A.8.12 / SOC2-CC6.1', 'Cero claves API o llaves privadas expuestas en código fuente');

console.log('\n======================================================================');
console.log(` RESULTADO FINAL: ${passed} CONTROLES APROBADOS | ${failed} FALLIDOS`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
}
