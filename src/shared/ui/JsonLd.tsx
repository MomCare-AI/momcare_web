/** Renders structured data. The content is built by this app from its own
 *  constants (never from user input), so serialising it is safe. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
