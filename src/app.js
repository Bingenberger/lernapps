import { portalApps } from "./apps.js";

const portalState = {
  subject: "all",
  grade: "all",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderAppCard(app) {
  return `
    <article class="panel app-card ${escapeHtml(app.themeClass || "")}">
      <div class="app-card-top">
        <div class="app-emoji" aria-hidden="true">${escapeHtml(app.emoji || "📦")}</div>
        <div>
          <h2>${escapeHtml(app.title)}</h2>
          <p class="hint">${escapeHtml(app.subtitle || "")}</p>
        </div>
      </div>
      <p class="app-desc">${escapeHtml(app.description || "")}</p>
      <div class="app-meta">
        ${(app.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="inline-actions">
        ${(app.links || [])
          .map(
            (link) => `
              <a class="${escapeHtml(link.variant || "secondary")} link-btn" href="${escapeHtml(link.href)}">
                ${escapeHtml(link.label)}
              </a>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), "de"));
}

function filterApps(apps, filters) {
  return apps.filter((app) => {
    const subjectOk = filters.subject === "all" || app.subject === filters.subject;
    const gradeOk = filters.grade === "all" || (app.grades || []).includes(filters.grade);
    return subjectOk && gradeOk;
  });
}

function renderOptions(options, selected, allLabel) {
  return [
    `<option value="all"${selected === "all" ? " selected" : ""}>${escapeHtml(allLabel)}</option>`,
    ...options.map(
      (value) => `<option value="${escapeHtml(value)}"${selected === value ? " selected" : ""}>${escapeHtml(value)}</option>`,
    ),
  ].join("");
}

function renderFilters(apps, filters) {
  const subjects = uniqueSorted(apps.map((app) => app.subject).filter(Boolean));
  const grades = uniqueSorted(apps.flatMap((app) => app.grades || []));

  return `
    <section class="panel filter-panel" aria-label="Filter">
      <div class="filter-head">
        <h2>Apps filtern</h2>
        <p class="hint">Nach Fach und Klassenstufe auswählen</p>
      </div>
      <form id="portal-filter-form" class="filter-grid">
        <label>Fach
          <select name="subject" aria-label="Nach Fach filtern">
            ${renderOptions(subjects, filters.subject, "Alle Fächer")}
          </select>
        </label>
        <label>Klassenstufe
          <select name="grade" aria-label="Nach Klassenstufe filtern">
            ${renderOptions(grades, filters.grade, "Alle Klassen")}
          </select>
        </label>
        <div class="filter-actions">
          <button type="button" class="secondary" id="clear-filters-btn">Filter zurücksetzen</button>
        </div>
      </form>
    </section>
  `;
}

function renderPortal(root) {
  const visibleApps = filterApps(portalApps, portalState);
  root.innerHTML = `
    <header class="app-header">
      <div>
        <h1>Schul-Apps</h1>
        <p>Lern-Apps für Kinder und Unterricht an der Schule</p>
      </div>
      <div class="pill">Für Klasse 1 bis 3</div>
    </header>

    <main class="portal-layout" aria-label="App-Auswahl">
      <section class="panel hero-panel" aria-label="Hinweis">
        <div class="hero-row">
          <div class="hero-icon" aria-hidden="true">🏫</div>
          <div>
            <h2>Willkommen</h2>
            <p class="hint">
              Wählt eine App aus und startet direkt.
              Die Übungen sind für Kinder verständlich aufgebaut und lassen sich gut im Unterricht einsetzen.
            </p>
          </div>
        </div>
      </section>

      ${renderFilters(portalApps, portalState)}

      <section class="apps-grid" aria-label="Verfügbare Apps">
        ${
          visibleApps.length > 0
            ? visibleApps.map(renderAppCard).join("")
            : '<section class="panel empty-panel"><h2>Keine Apps gefunden</h2><p class="hint">Passe die Filter an oder setze sie zurück.</p></section>'
        }
      </section>
    </main>
  `;

  bindPortalEvents(root);
}

function bindPortalEvents(root) {
  const form = root.querySelector("#portal-filter-form");
  if (!form) {
    return;
  }

  ["subject", "grade"].forEach((name) => {
    form.elements[name]?.addEventListener("change", (event) => {
      portalState[name] = event.target.value;
      renderPortal(root);
    });
  });

  root.querySelector("#clear-filters-btn")?.addEventListener("click", () => {
    portalState.subject = "all";
    portalState.grade = "all";
    renderPortal(root);
  });
}

const root = document.getElementById("app");
renderPortal(root);
