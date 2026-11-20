/**
 * Renders structured data. The data is built only from our own content files,
 * never from visitor input; "<" is escaped anyway so no string can close the
 * script tag.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
