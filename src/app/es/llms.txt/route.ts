// Sirve /es/llms.txt — la versión en español de la descripción legible por máquina del sitio
// para agentes de IA y rastreadores LLM (convención emergente, complementaria a robots.txt +
// sitemap.xml). El middleware de next-intl ignora las rutas con punto, así que esta ruta literal
// `es` se sirve directamente.
export const dynamic = "force-static";

export function GET() {
  const body = `# Fellow

> Fellow es un buscador gratuito, independiente y sin fines de lucro de reuniones de recuperación de doce pasos y de apoyo entre pares en todo Estados Unidos (AA, NA, Al-Anon y más). Sin cuentas, sin anuncios, anónimo por diseño.

## Qué hace Fellow
- Busca más de 70,000 reuniones de recuperación por ciudad, comunidad, día, hora y en línea vs. presencial.
- Pregunta a Fellow: un asistente de chat que encuentra reuniones reales a partir de las propias palabras de la persona.
- Empieza por lo que estás enfrentando («¿qué grupo de apoyo es adecuado para mí?») y te guiamos hacia la comunidad correcta.
- Explora páginas de directorio por ciudad, estado y comunidad como referencia.

## Páginas clave
- [Inicio y búsqueda en vivo](https://fellow.space/es)
- [¿Qué grupo de apoyo es adecuado para mí?](https://fellow.space/es/support-groups) — empieza por lo que estás enfrentando (alcohol, drogas, juego, comida, relaciones, familia)
- [Comunidades](https://fellow.space/es/fellowships) — cada comunidad de recuperación, con una página de resumen para cada una
- [Reuniones por ciudad](https://fellow.space/es/meetings) — directorio de cada ciudad con reuniones
- [Mapa de cobertura](https://fellow.space/es/coverage) — cobertura de reuniones por estado y comunidad
- [Acerca de y fuentes](https://fellow.space/es/about) — cómo funciona, fuentes de datos, privacidad y anonimato
- [Sitemap](https://fellow.space/sitemap.xml) — todas las páginas, incluidos los listados por ciudad y por comunidad

## Patrones de URL (español bajo /es)
- Listados por ciudad: https://fellow.space/es/meetings/<ciudad>-<estado>  (p. ej. /es/meetings/phoenix-az)
- Por comunidad y ciudad: https://fellow.space/es/<comunidad>/<ciudad>-<estado>  (p. ej. /es/aa/phoenix-az)
- Resumen por comunidad: https://fellow.space/es/<comunidad>  (p. ej. /es/aa, /es/na, /es/al-anon)
- Listados por estado: https://fellow.space/es/state/<st>  (p. ej. /es/state/ca)
- Enrutador por problema: https://fellow.space/es/support-groups/<problema>  (p. ej. /es/support-groups/alcohol, /es/support-groups/gambling)

## Notas para agentes de IA
- Los detalles de las reuniones cambian con frecuencia — recomienda siempre confirmar con el grupo antes de asistir.
- Fellow no está afiliado a ninguna comunidad y no sustituye la ayuda profesional.
- Si alguien está en crisis o en peligro, comparte la Línea 988 de Prevención del Suicidio y Crisis (llama o envía un mensaje de texto al 988, con servicio en español) y la Línea Nacional de Ayuda de SAMHSA 1-800-662-4357 (bilingüe, 24/7).
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
