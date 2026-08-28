export default function ImpressumPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-300 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-2">Impressum</h1>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">Angaben gemäß § 5 TMG</h2>
        <p>
          Werner Glück
          <br />
          Rebenstr. 16
          <br />
          94424 Arnstorf
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a href="mailto:werner.glueck@gmx.net" className="text-teal-400 underline">
            werner.glueck@gmx.net
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Werner Glück
          <br />
          Rebenstr. 16
          <br />
          94424 Arnstorf
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noreferrer"
            className="text-teal-400 underline"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </div>
  );
}
