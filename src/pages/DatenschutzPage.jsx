export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-300 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-2">Datenschutzerklärung</h1>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          <br />
          Werner Glück, Rebenstr. 16, 94424 Arnstorf
          <br />
          E-Mail:{" "}
          <a href="mailto:werner.glueck@gmx.net" className="text-teal-400 underline">
            werner.glueck@gmx.net
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">2. Deine Rechte als betroffene Person</h2>
        <p>Du hast jederzeit das Recht auf:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Auskunft über die zu deiner Person gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
        </ul>
        <p className="mt-2">
          Wende dich dazu einfach an die oben genannte Kontakt-E-Mail. Zudem steht dir ein Beschwerderecht bei
          einer Datenschutzaufsichtsbehörde zu.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">3. Welche Daten wir erheben</h2>

        <h3 className="font-medium text-gray-100 mt-3 mb-1">Anmeldung zu einer Veranstaltung</h3>
        <p>
          Bei der Anmeldung zu einer Veranstaltung erheben wir Vorname, Nachname und E-Mail-Adresse sowie den
          gewählten Slot. Diese Daten werden zur Organisation der Veranstaltung, zur Platzverwaltung und
          zur Zahlungszuordnung verwendet. Rechtsgrundlage ist die Erfüllung eines Vertrags bzw. vorvertraglicher
          Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO).
        </p>

        <h3 className="font-medium text-gray-100 mt-3 mb-1">Interessenten- und Warteliste</h3>
        <p>
          Für Veranstaltungen ohne feste Anmeldung ("Coming Soon") oder bei ausgebuchten Slots kannst du dich
          unverbindlich auf eine Liste eintragen. Dabei werden Vorname, Nachname und E-Mail-Adresse gespeichert,
          um dich bei Verfügbarkeit zu informieren.
        </p>

        <h3 className="font-medium text-gray-100 mt-3 mb-1">Newsletter</h3>
        <p>
          Bei der Newsletter-Anmeldung speichern wir deine E-Mail-Adresse, um dich über kommende
          Veranstaltungen zu informieren. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
          Jede Newsletter-Mail enthält einen individuellen Abmelde-Link, mit dem du deine Einwilligung
          jederzeit widerrufen kannst.
        </p>

        <h3 className="font-medium text-gray-100 mt-3 mb-1">Kontaktformular</h3>
        <p>
          Bei Nutzung des Kontaktformulars erheben wir Vorname, Nachname, E-Mail-Adresse und deine Nachricht.
          Diese werden ausschließlich per E-Mail an uns weitergeleitet und zur Bearbeitung deiner Anfrage
          genutzt (Art. 6 Abs. 1 lit. b bzw. f DSGVO), nicht dauerhaft in einer Datenbank gespeichert.
        </p>

        <h3 className="font-medium text-gray-100 mt-3 mb-1">Zahlung</h3>
        <p>
          Die Bezahlung erfolgt direkt über PayPal (bzw. PayPal.me) einer Privatperson. Wir erhalten und
          speichern dabei keine Zahlungsdaten (z. B. Kontoinformationen); es gelten die
          Datenschutzbestimmungen von PayPal.
        </p>

        <h3 className="font-medium text-gray-100 mt-3 mb-1">Server-Logfiles</h3>
        <p>
          Beim Aufruf dieser Website erhebt unser Hosting-Provider automatisch technische Informationen (z. B.
          IP-Adresse, Datum/Uhrzeit, aufgerufene Seite) in Server-Logfiles. Dies dient dem sicheren und
          stabilen Betrieb der Website (Art. 6 Abs. 1 lit. f DSGVO) und erfolgt automatisiert ohne
          Zuordnung zu deiner Person.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">4. Cookies und lokale Speicherung</h2>
        <p>
          Diese Website verwendet keine Tracking- oder Werbe-Cookies. Im Browser wird lediglich lokal
          gespeichert (localStorage), ob du den Hinweisbanner am oberen Seitenrand bereits geschlossen hast.
          Für den Admin-Bereich wird ein technisch notwendiges Sitzungs-Cookie gesetzt, das ausschließlich der
          Anmeldung von Administratoren dient und nach spätestens 8 Stunden abläuft.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">5. Eingesetzte Dienstleister</h2>
        <p>Zum Betrieb dieser Website nutzen wir folgende Dienstleister als Auftragsverarbeiter:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>
            <strong>Vercel Inc.</strong> (Hosting der Website und Server-Infrastruktur)
          </li>
          <li>
            <strong>Neon</strong> (Datenbank-Hosting, Serverstandort EU)
          </li>
          <li>
            <strong>Resend</strong> (Versand von Bestätigungs- und Newsletter-E-Mails)
          </li>
        </ul>
        <p className="mt-2">
          Dabei kann es zu einer Übermittlung personenbezogener Daten in Länder außerhalb der EU/des EWR
          (insbesondere die USA) kommen. Die genannten Anbieter sind vertraglich zur Einhaltung eines
          angemessenen Datenschutzniveaus verpflichtet.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">6. Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die Organisation der jeweiligen
          Veranstaltung erforderlich ist, oder bis du der Speicherung widersprichst bzw. deine Löschung
          verlangst. Newsletter-Daten werden bis zur Abmeldung gespeichert.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-100 mb-1">7. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder bei
          Änderungen des Angebots anzupassen.
        </p>
      </section>
    </div>
  );
}
