# Invii e acquisti esterni

Le tre voci del tracker che **non si chiudono con codice**: sono atti che deve compiere una persona
con un conto, una carta o una firma. Qui c'è tutto quello che serve per compierli, così il passo è
breve. Ogni sezione dice cosa è già pronto e cosa manca ancora, e si data da sola: se una riga qui
invecchia, è perché il prodotto è cambiato e questa pagina no.

*Ultimo controllo: 14 agosto 2026.*

---

## #4 · Pubblicazione dell'estensione negli store

**Cosa serve da te:** un account sviluppatore per ogni store e l'invio del pacchetto. Sono conti a
pagamento una tantum (Chrome ~5 USD, Edge gratis, Firefox gratis) e una revisione umana che dura
giorni.

**Cosa è pronto:** `browser-extension/` con due manifest (Chrome/Edge in `manifest.json`, Firefox in
`manifest.firefox.json`), le quattro icone (16/32/48/128) e la descrizione in italiano.

**I due punti che la revisione guarderà per primi — e la risposta onesta da dare:**

1. **`host_permissions: ["http://*/*", "https://*/*"]`** — l'accesso a ogni sito. È il permesso più
   scrutinato che ci sia, e va giustificato nella scheda: *l'estensione controlla l'indirizzo di ogni
   pagina prima che l'utente inserisca dei dati, quindi deve poter leggere l'host di qualunque sito.*
   Non legge il contenuto delle pagine tranne dove serve (finto supporto tecnico; messaggi privati su
   tre domini nominati), e il filtro di riservatezza toglie query e frammento prima che un indirizzo
   esca. Questo va **scritto** nella motivazione, o la revisione lo respinge.
2. **`nativeMessaging`** — il ponte verso il servizio locale. Va dichiarato l'host nativo
   (`it.cetrai.host`) e spiegato che l'analisi vera gira in un programma installato separatamente, non
   in un server remoto. Gli store chiedono conto di dove vanno i dati: la risposta è «da nessuna
   parte, restano sulla macchina».

**Checklist d'invio:**

- [ ] Chrome Web Store: account sviluppatore, `manifest.json`, screenshot, scheda con le due
      motivazioni sopra, privacy policy (il prodotto non raccoglie dati: dichiararlo).
- [ ] Edge Add-ons: stesso pacchetto di Chrome (Chromium), stessa scheda.
- [ ] Firefox AMO: `manifest.firefox.json`, che l'invio sia firmato da Mozilla.
- [ ] La versione del manifest (`0.3.0`) coincide con quella del prodotto al momento dell'invio.

**Resta in mano tua:** creare i conti e premere invia. Il codice non cambia.

---

## #5 · Firma del codice dell'MSI (certificato EV)

**Cosa serve da te:** comprare un certificato **EV code signing** da una CA (DigiCert, Sectigo,
GlobalSign). È un acquisto (~300–500 EUR/anno) con verifica dell'identità dell'organizzazione, e la
chiave arriva **su un token hardware** o in un HSM: non è un file che si copia.

**Perché conta:** senza firma, SmartScreen avvisa al primo avvio dell'installer — l'ha detto la build
stessa (*«non firmato: SmartScreen avviserà al primo avvio»*). Un EV, a differenza di un OV, dà
reputazione SmartScreen **immediata**, senza il periodo di rodaggio in cui gli avvisi continuano.

**Come si firma, una volta che il token c'è.** L'MSI si firma con `signtool` (Windows SDK), non con
`tools\Firma` — quello firma i *manifesti d'aggiornamento*, che è un'altra cosa (ADR-0013):

```
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a ^
  installer\out\CetrAI-<versione>-x64.msi
```

Il timestamp (`/tr`) è obbligatorio: senza, la firma scade quando scade il certificato, e un
installer già distribuito comincerebbe ad avvisare. Con `/a` signtool sceglie il certificato giusto
dal token.

**Cosa cambia nel build:** oggi `installer\build.ps1` produce un MSI non firmato e lo dice a voce. Il
passo di firma va aggiunto **dopo** il packaging e **prima** della distribuzione — non nel sorgente,
perché il token non è disponibile in build automatica e non deve esserlo. Quando il certificato
esiste, la riga sopra è tutto: la si esegue a mano sul pacchetto, o la si aggiunge come passo finale
di `build.ps1` protetto da un `if` sulla presenza del token.

**Resta in mano tua:** l'acquisto e la verifica d'identità. Il comando è già scritto.

---

## #7 · Validazione da un laboratorio terzo

**Cosa serve da te:** contattare AV-TEST o AV-Comparatives e sottomettere il prodotto. È un rapporto
commerciale (i test indipendenti si pagano) e un invio del pacchetto installabile.

**Cosa è pronto:** il prodotto e la sua misura. Un laboratorio serio non chiede «quanto rileva» ma
«come lo sai», e su questo il materiale c'è già:

- **cosa fa e come**, capacità per capacità, in `CETRAI.php` (verde = provato sul pacchetto) e nel
  dettaglio in `docs/cosa-fa.md`;
- **i numeri col loro denominatore** — la sezione «I numeri» di `docs/cosa-fa.md`: falsi allarmi su
  1.000.000 di siti veri (Tranco), phishing riconosciuto *dove il catalogo conosce il marchio* e
  *dove no*, i corpus scritti a mano con la metà legittima difficile;
- **i limiti dichiarati**, che sono la parte che un laboratorio rispetta: il motore a regole fuori
  dalla sua conoscenza si azzera (l'1,6% dichiarato), la prova su ransomware vero non è mai stata
  fatta (ADR-0014, ora con l'intermedio del simulatore benigno), e la lingua/paese per cui è scritto.

**Il punto onesto da mettere in cima al dossier.** CetrAI non è un antivirus e non compete sulla
detection di malware — quella è di Defender. La frase del prodotto è *«Windows ti protegge dai virus,
CetrAI ti protegge dalle truffe»*. Il test giusto non è un set di file infetti (li prende Defender):
è un corpus di **phishing e truffe** — indirizzi, messaggi, pagine — su marchi e lingua italiani.
Chiedere il test sbagliato produce un voto basso su una cosa che il prodotto non promette di fare.

**Checklist:**

- [ ] Scegliere il laboratorio e il tipo di test (anti-phishing / anti-scam, **non** anti-malware).
- [ ] Pacchetto installabile firmato (dipende da #5: un prodotto non firmato parte male anche in un test).
- [ ] Dossier: `docs/cosa-fa.md` + la presentazione da `tools\deck.ps1`, che legge la pagina invece
      di ricopiarla.
- [ ] Backend acceso (dipende da #6) se si vuole testare anche l'analisi approfondita; altrimenti si
      testa il solo motore locale, dichiarandolo.

**Resta in mano tua:** il contatto e l'invio. La misura che il laboratorio chiederà è già scritta e
si rigenera da sola.
