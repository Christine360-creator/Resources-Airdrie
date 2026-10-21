// =========================================
// AIRDRIE COMMUNITY RESOURCES DIRECTORY
// Connected to Live Google Sheet CSV
// =========================================

"use strict";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBAoUdhRVsTr4vIEgFWNbAl40_L8DlgBZMAuG4lU9YDvt__SKGM7Ck6bfl0CCehPVGlpTxE9w6bHCQ/pub?gid=0&single=true&output=csv";

// Elements
const resourceGrid = document.getElementById("resource-grid");
const searchInput = document.getElementById("resource-search");
const categoryFilter = document.getElementById("category-filter");
const areaFilter = document.getElementById("area-filter");
const resultsCount = document.getElementById("results-count");
const clearSearchBtn = document.getElementById("clear-search");
const resetFiltersBtn = document.getElementById("reset-filters");
const emptyResetBtn = document.getElementById("empty-reset");
const noResults = document.getElementById("no-results");
const loadError = document.getElementById("load-error");
const retryLoadBtn = document.getElementById("retry-load");
const quickPills = document.getElementById("quickPills");

// Modals
const resourceDialog = document.getElementById("resource-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogContent = document.getElementById("dialog-content");
const dialogClose = document.getElementById("dialog-close");
const dialogDone = document.getElementById("dialog-done");

const contributeDialog = document.getElementById("contribute-dialog");
const contributeModalTitle = document.getElementById("contributeModalTitle");
const contributeClose = document.getElementById("contribute-close");
const suggestResource = document.getElementById("suggestResource");
const reportProblem = document.getElementById("reportProblem");
const contributionForm = document.getElementById("contributionForm");
const contributionType = document.getElementById("contributionType");
const contributionBody = document.getElementById("contributionBody");

let resources = [];
let lastFocusedElement = null;

// Helpers
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function splitList(value) {
    return String(value ?? "")
        .split(/[|;]/)
        .map(item => item.trim())
        .filter(Boolean);
}

function safeWebsiteURL(value) {
    const urlText = String(value ?? "").trim();
    if (!urlText) return "";
    try {
        const url = new URL(urlText);
        if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {}
    return "";
}

function safePhoneLink(value) {
    const phone = String(value ?? "").trim();
    if (!phone) return "";
    const cleaned = phone.replace(/[^\d+]/g, "");
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length < 3 || digits.length > 15) return "";
    return "tel:" + cleaned;
}

function getCategoryBadgeClass(categories) {
    const text = categories.join(" ").toLowerCase();
    if (text.includes("food")) return "tag-food";
    if (text.includes("health") || text.includes("mental")) return "tag-health";
    if (text.includes("housing")) return "tag-housing";
    if (text.includes("family") || text.includes("children")) return "tag-family";
    return "tag-default";
}

// Robust CSV Parser
function parseCSV(text) {
    const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rows = [];
    let row = [];
    let cell = "";
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const next = cleanText[i + 1];

        if (char === '"' && insideQuotes && next === '"') {
            cell += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
            row.push(cell);
            cell = "";
        } else if (char === "\n" && !insideQuotes) {
            row.push(cell);
            if (row.some(c => c.trim() !== "")) rows.push(row);
            row = [];
            cell = "";
        } else {
            cell += char;
        }
    }
    if (cell !== "" || row.length > 0) {
        row.push(cell);
        if (row.some(c => c.trim() !== "")) rows.push(row);
    }
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
    return rows.slice(1).map(values => {
        const record = {};
        headers.forEach((header, index) => {
            record[header] = (values[index] ?? "").trim().replace(/^"|"$/g, '');
        });
        return record;
    });
}

function prepareResources(rows) {
    const seenIDs = new Set();
    return rows.map((row, index) => {
        const id = String(row.id || index + 1).trim();
        const organization = String(row.organization ?? "").trim();

        // Filter out "Emergency & Crisis" from tags so it doesn't duplicate the top bar
        const cleanedCategories = splitList(row.category).filter(
            cat => !cat.toLowerCase().includes("emergency") && !cat.toLowerCase().includes("crisis")
        );

        return {
            id,
            organization,
            category: cleanedCategories.length > 0 ? cleanedCategories : ["Community Support"],
            area: splitList(row.area),
            offer: String(row.offer ?? "").trim(),
            who: String(row.who ?? "").trim(),
            serviceType: String(row.serviceType ?? "").trim(),
            cost: String(row.cost ?? "").trim(),
            phone: String(row.phone ?? "").trim(),
            address: String(row.address ?? "").trim(),
            website: String(row.website ?? "").trim(),
            keywords: splitList(row.keywords),
            verifiedDate: String(row.verifiedDate ?? "").trim(),
            sourceUrl: String(row.sourceUrl ?? "").trim(),
            icon: String(row.icon ?? "").trim() || "📍"
        };
    }).filter(resource => {
        if (!resource.organization || seenIDs.has(resource.id)) return false;
        seenIDs.add(resource.id);
        return true;
    });
}

// Fetch Data
async function loadResources() {
    loadError.hidden = true;
    noResults.hidden = true;
    resourceGrid.innerHTML = '<p class="loading-state">Loading community resources…</p>';
    resultsCount.textContent = "Loading resources…";

    try {
        const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not connect to Google Sheet");

        const csvText = await response.text();
        const rows = parseCSV(csvText);
        const loaded = prepareResources(rows);

        if (loaded.length === 0) throw new Error("No readable rows found");

        resources = loaded;
        buildFiltersFromData(resources);
        filterResources();
    } catch (error) {
        console.error("Loading error:", error);
        resourceGrid.innerHTML = "";
        resultsCount.textContent = "Resources could not be loaded.";
        loadError.hidden = false;
    }
}

// Build Filter Options
function buildFiltersFromData(data) {
    const categories = [...new Set(data.flatMap(r => r.category))].sort((a, b) => a.localeCompare(b));
    const areas = [...new Set(data.flatMap(r => r.area))].sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML = '<option value="all">All categories</option>';
    areaFilter.innerHTML = '<option value="all">All areas</option>';

    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
    });

    areas.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        areaFilter.appendChild(opt);
    });
}

// Render Card
function createResourceCard(resource) {
    const badgeClass = getCategoryBadgeClass(resource.category);
    const categoriesMarkup = resource.category.map(cat => 
        `<span class="card-tag ${badgeClass}">${escapeHTML(cat)}</span>`
    ).join("");

    const areasMarkup = resource.area.length ? resource.area.join(", ") : "Airdrie";
    const phoneLink = safePhoneLink(resource.phone);
    const website = safeWebsiteURL(resource.website);

    return `
        <article class="resource-card">
            <div class="card-top">
                <span class="card-icon" aria-hidden="true">${escapeHTML(resource.icon)}</span>
                <h3>${escapeHTML(resource.organization)}</h3>
            </div>

            <div class="tag-cloud">${categoriesMarkup}</div>

            <p class="card-desc">${escapeHTML(resource.offer || "Contact organization for details.")}</p>

            <div class="card-meta-list">
                <p><strong>Area:</strong> ${escapeHTML(areasMarkup)}</p>
                ${resource.who ? `<p><strong>Who:</strong> ${escapeHTML(resource.who)}</p>` : ""}
                ${resource.phone ? `<p><strong>Phone:</strong> ${escapeHTML(resource.phone)}</p>` : ""}
            </div>

            <div class="card-actions-row">
                <button class="btn-primary" type="button" data-resource-id="${escapeHTML(resource.id)}">Details &rarr;</button>
                ${phoneLink ? `<a href="${escapeHTML(phoneLink)}" class="btn-call" title="Call directly">📞 Call</a>` : ""}
                ${website ? `<a class="btn-web" href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer" title="Visit website">🌐 Web</a>` : ""}
            </div>
        </article>
    `;
}

function displayResources(data) {
    resourceGrid.innerHTML = data.map(createResourceCard).join("");
    const total = data.length;
    resultsCount.textContent = `${total} ${total === 1 ? "resource" : "resources"} found`;
    noResults.hidden = total !== 0;
}

// Filter Logic
function filterResources() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedArea = areaFilter.value;

    clearSearchBtn.hidden = query.length === 0;

    const filtered = resources.filter(resource => {
        const searchableText = [
            resource.organization,
            resource.offer,
            resource.who,
            resource.cost,
            resource.address,
            resource.phone,
            resource.serviceType,
            ...resource.category,
            ...resource.area,
            ...resource.keywords
        ].join(" ").toLocaleLowerCase();

        const matchesSearch = !query || searchableText.includes(query);
        const matchesCategory = selectedCategory === "all" || resource.category.includes(selectedCategory);
        const matchesArea = selectedArea === "all" || resource.area.includes(selectedArea);

        return matchesSearch && matchesCategory && matchesArea;
    });

    displayResources(filtered);
}

// Modal Details
function openResourceModal(id, triggerElement) {
    const resource = resources.find(item => item.id === id);
    if (!resource) return;

    lastFocusedElement = triggerElement || document.activeElement;
    dialogTitle.textContent = resource.organization;

    const website = safeWebsiteURL(resource.website);
    const source = safeWebsiteURL(resource.sourceUrl);
    const phoneLink = safePhoneLink(resource.phone);

    dialogContent.innerHTML = `
        <div class="modal-section">
            <h4>What They Offer</h4>
            <p>${escapeHTML(resource.offer)}</p>
        </div>
        <div class="modal-section">
            <h4>Eligibility & Target Group</h4>
            <p>${escapeHTML(resource.who || "Open to community residents")}</p>
        </div>
        <div class="modal-section">
            <h4>Location & Access</h4>
            <p>📍 ${escapeHTML(resource.address || resource.area.join(", "))} ${resource.serviceType ? `(${escapeHTML(resource.serviceType)})` : ""}</p>
        </div>
        ${resource.phone ? `
        <div class="modal-section">
            <h4>Phone Contact</h4>
            <p>📞 <a href="${escapeHTML(phoneLink)}">${escapeHTML(resource.phone)}</a></p>
        </div>` : ""}
        ${resource.cost ? `
        <div class="modal-section">
            <h4>Cost</h4>
            <p>${escapeHTML(resource.cost)}</p>
        </div>` : ""}
        ${website ? `
        <div class="modal-section">
            <h4>Website</h4>
            <p><a href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">Visit Official Website &rarr;</a></p>
        </div>` : ""}
        ${resource.verifiedDate ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">Information last verified: ${escapeHTML(resource.verifiedDate)}</p>` : ""}
    `;

    if (!resourceDialog.open) resourceDialog.showModal();
    dialogClose.focus();
}

function closeResourceModal() {
    if (resourceDialog.open) resourceDialog.close();
    if (lastFocusedElement) lastFocusedElement.focus();
}

// Reset Controls
function resetAll() {
    searchInput.value = "";
    categoryFilter.value = "all";
    areaFilter.value = "all";
    document.querySelectorAll(".pill-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.category === "all"));
    filterResources();
    searchInput.focus();
}

// Events
searchInput.addEventListener("input", filterResources);
categoryFilter.addEventListener("change", () => {
    document.querySelectorAll(".pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.category === categoryFilter.value);
    });
    filterResources();
});
areaFilter.addEventListener("change", filterResources);

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterResources();
    searchInput.focus();
});

resetFiltersBtn.addEventListener("click", resetAll);
emptyResetBtn.addEventListener("click", resetAll);
retryLoadBtn.addEventListener("click", loadResources);

quickPills.addEventListener("click", e => {
    const pill = e.target.closest(".pill-btn");
    if (!pill) return;
    document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
    pill.classList.add("active");
    categoryFilter.value = pill.dataset.category;
    filterResources();
});

document.addEventListener("click", event => {
    const button = event.target.closest("[data-resource-id]");
    if (button) openResourceModal(button.dataset.resourceId, button);
});

resourceDialog.addEventListener("click", event => {
    const rect = resourceDialog.getBoundingClientRect();
    const inDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
    if (!inDialog) closeResourceModal();
});

dialogClose.addEventListener("click", closeResourceModal);
dialogDone.addEventListener("click", closeResourceModal);

// Contribution Modal
function openContribution(type) {
    contributionType.value = type;
    contributeModalTitle.textContent = type === "report" ? "Report an Update" : "Suggest a Resource";
    contributeDialog.showModal();
    document.getElementById("organizationName").focus();
}

suggestResource.addEventListener("click", () => openContribution("suggest"));
reportProblem.addEventListener("click", () => openContribution("report"));
contributeClose.addEventListener("click", () => contributeDialog.close());

contributeDialog.addEventListener("click", event => {
    const rect = contributeDialog.getBoundingClientRect();
    const inDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
    if (!inDialog) contributeDialog.close();
});

contributionForm.addEventListener("submit", event => {
    event.preventDefault();
    contributionBody.innerHTML = `
        <div class="empty-state" style="border:none; padding:20px 10px;">
            <div style="font-size:2.2rem; color:var(--gold); margin-bottom:10px;">✓</div>
            <h3>Thank you!</h3>
            <p>Your submission has been received and will be reviewed before updates are made to the live directory.</p>
            <button type="button" class="btn-primary" onclick="document.getElementById('contribute-dialog').close()">Done</button>
        </div>
    `;
});

// Run
loadResources();
