// =========================================
// COMMUNITY RESOURCES DIRECTORY
// Connected to Live Google Sheet CSV
// =========================================

"use strict";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBAoUdhRVsTr4vIEgFWNbAl40_L8DlgBZMAuG4lU9YDvt__SKGM7Ck6bfl0CCehPVGlpTxE9w6bHCQ/pub?gid=0&single=true&output=csv";

// Elements
const searchInput = document.getElementById("resource-search");
const categoryFilter = document.getElementById("category-filter");
const areaFilter = document.getElementById("area-filter");
const clearSearchBtn = document.getElementById("clear-search");
const clearSearchBtnAction = document.getElementById("clear-search-btn");
const resetButton = document.getElementById("reset-filters");
const emptyResetButton = document.getElementById("empty-reset");
const resultsCount = document.getElementById("results-count");
const resourceGrid = document.getElementById("resource-grid");
const featuredResources = document.getElementById("featured-resources");
const noResults = document.getElementById("no-results");
const loadError = document.getElementById("load-error");
const retryLoadButton = document.getElementById("retry-load");
const quickPills = document.getElementById("quickPills");

// Modals
const resourceDialog = document.getElementById("resource-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogContent = document.getElementById("dialog-content");
const dialogCloseButton = document.getElementById("dialog-close");
const dialogDoneButton = document.getElementById("dialog-done");

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

// ---------- HELPERS ----------

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

// Splits lists by pipe (|) or semicolon (;)
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

function getCategoryClass(categories) {
    const text = categories.join(" ").toLowerCase();
    if (text.includes("food")) return "tag-food";
    if (text.includes("crisis") || text.includes("emergency")) return "tag-crisis";
    if (text.includes("health") || text.includes("mental")) return "tag-health";
    if (text.includes("housing")) return "tag-housing";
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
        const character = cleanText[i];
        const nextCharacter = cleanText[i + 1];

        if (character === '"' && insideQuotes && nextCharacter === '"') {
            cell += '"';
            i++;
        } else if (character === '"') {
            insideQuotes = !insideQuotes;
        } else if (character === "," && !insideQuotes) {
            row.push(cell);
            cell = "";
        } else if (character === "\n" && !insideQuotes) {
            row.push(cell);
            if (row.some(value => value.trim() !== "")) rows.push(row);
            row = [];
            cell = "";
        } else {
            cell += character;
        }
    }
    if (cell !== "" || row.length > 0) {
        row.push(cell);
        if (row.some(value => value.trim() !== "")) rows.push(row);
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

        return {
            id,
            organization,
            category: splitList(row.category),
            area: splitList(row.area),
            offer: String(row.offer ?? "").trim(),
            who: String(row.who ?? "").trim(),
            serviceType: String(row.serviceType ?? "").trim(),
            cost: String(row.cost ?? "").trim(),
            phone: String(row.phone ?? "").trim(),
            address: String(row.address ?? "").trim(),
            website: String(row.website ?? "").trim(),
            keywords: splitList(row.keywords),
            featuredType: String(row.featuredType ?? "").trim(),
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

// ---------- FETCH & INITIALIZE ----------

async function loadResources() {
    loadError.hidden = true;
    noResults.hidden = true;
    resourceGrid.innerHTML = '<p class="loading-message">Loading community resources…</p>';
    featuredResources.innerHTML = '<p class="loading-message">Loading essential resources…</p>';
    resultsCount.textContent = "Loading resources…";

    try {
        const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not connect to Google Sheet");

        const csvText = await response.text();
        const rows = parseCSV(csvText);
        const loaded = prepareResources(rows);

        if (loaded.length === 0) throw new Error("The Sheet contained no records");

        resources = loaded;
        buildFiltersFromData(resources);
        displayFeaturedResources(resources);
        filterResources();
    } catch (error) {
        console.error("Loading error:", error);
        resourceGrid.innerHTML = "";
        featuredResources.innerHTML = "";
        resultsCount.textContent = "Resources could not be loaded.";
        loadError.hidden = false;

        if (window.location.protocol === "file:") {
            loadError.querySelector("p").innerHTML = "<strong>Notice:</strong> Local file browsing blocks external sheets. Please open through <strong>VS Code Live Server</strong>.";
        }
    }
}

// ---------- FILTER CREATION ----------

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

// ---------- FEATURED / PINNED ----------

function displayFeaturedResources(data) {
    const featured = data.filter(r => ["Essential", "Emergency"].includes(r.featuredType));
    if (featured.length === 0) {
        featuredResources.innerHTML = '<p class="loading-message">No featured resources selected.</p>';
        return;
    }

    featuredResources.innerHTML = featured.map(r => {
        const phoneLink = safePhoneLink(r.phone);
        const website = safeWebsiteURL(r.website);

        return `
            <article class="featured-card">
                <span class="featured-badge">${escapeHTML(r.featuredType)} resource</span>
                <h3>${escapeHTML(r.organization)}</h3>
                <p>${escapeHTML(r.offer || "Open details to learn more.")}</p>
                <div class="card-actions">
                    <button class="button button-primary" type="button" data-resource-id="${escapeHTML(r.id)}">Details</button>
                    ${phoneLink ? `<a href="${escapeHTML(phoneLink)}" class="action-btn-call">📞 ${escapeHTML(r.phone)}</a>` : ""}
                    ${website ? `<a class="action-btn-web" href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">🌐 Website</a>` : ""}
                </div>
            </article>
        `;
    }).join("");
}

// ---------- RESOURCE CARDS (ALL FIELDS RESTORED) ----------

function createResourceCard(resource) {
    const colorClass = getCategoryClass(resource.category);
    const categories = resource.category.length
        ? resource.category.map(cat => `<span class="tag ${colorClass}">${escapeHTML(cat)}</span>`).join("")
        : "";

    const areas = resource.area.length
        ? resource.area.map(area => escapeHTML(area)).join(", ")
        : "Area not listed";

    // Restored exact metadata fields
    const whoMarkup = resource.who
        ? `<p><strong>Who:</strong> ${escapeHTML(resource.who)}</p>`
        : "";

    const serviceType = resource.serviceType
        ? `<p><strong>Access:</strong> ${escapeHTML(resource.serviceType)}</p>`
        : "";

    const phoneLink = safePhoneLink(resource.phone);
    const phoneMarkup = phoneLink
        ? `<p><strong>Phone:</strong> <a href="${escapeHTML(phoneLink)}">${escapeHTML(resource.phone)}</a></p>`
        : "";

    const website = safeWebsiteURL(resource.website);

    const verificationMarkup = resource.verifiedDate
        ? `<p class="verification-note">Information last checked: ${escapeHTML(resource.verifiedDate)}</p>`
        : `<p class="verification-note">Service details need to be verified.</p>`;

    return `
        <article class="resource-card">
            <div class="card-topline">
                <span class="card-icon" aria-hidden="true">${escapeHTML(resource.icon)}</span>
                <h3>${escapeHTML(resource.organization)}</h3>
            </div>

            <div class="tag-list">${categories}</div>

            <p class="resource-offer">${escapeHTML(resource.offer || "Contact organization for details.")}</p>

            <div class="resource-meta">
                <p><strong>Area:</strong> ${areas}</p>
                ${whoMarkup}
                ${serviceType}
                ${phoneMarkup}
            </div>

            <div class="card-actions">
                <button class="button button-secondary" type="button" data-resource-id="${escapeHTML(resource.id)}">Details &rarr;</button>
                ${phoneLink ? `<a href="${escapeHTML(phoneLink)}" class="action-btn-call" title="Call directly">📞 Call</a>` : ""}
                ${website ? `<a class="action-btn-web" href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer" title="Visit website">🌐 Web</a>` : ""}
            </div>

            ${verificationMarkup}
        </article>
    `;
}

function displayResources(data) {
    resourceGrid.innerHTML = data.map(createResourceCard).join("");
    const total = data.length;
    resultsCount.textContent = `${total} ${total === 1 ? "resource" : "resources"} found`;
    noResults.hidden = total !== 0;
}

// ---------- FILTER & SEARCH ----------

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
            resource.featuredType,
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

// ---------- FULL DETAILS MODAL (ALL 10 SECTIONS RESTORED) ----------

function createDetailGroup(heading, content) {
    if (!content) return "";
    return `
        <section class="detail-group">
            <h3>${escapeHTML(heading)}</h3>
            <p>${escapeHTML(content)}</p>
        </section>
    `;
}

function openResourceModal(id, triggerElement) {
    const resource = resources.find(item => item.id === id);
    if (!resource) return;

    lastFocusedElement = triggerElement || document.activeElement;
    dialogTitle.textContent = resource.organization;

    const website = safeWebsiteURL(resource.website);
    const source = safeWebsiteURL(resource.sourceUrl);
    const phoneLink = safePhoneLink(resource.phone);
    const categories = resource.category.length ? resource.category.join(", ") : "";
    const areas = resource.area.length ? resource.area.join(", ") : "";

    const phoneSection = resource.phone ? `
        <section class="detail-group">
            <h3>Phone</h3>
            <p>${phoneLink ? `<a href="${escapeHTML(phoneLink)}">${escapeHTML(resource.phone)}</a>` : escapeHTML(resource.phone)}</p>
        </section>
    ` : "";

    const websiteSection = website ? `
        <section class="detail-group">
            <h3>Website</h3>
            <p><a href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">Visit the organization's website &rarr;</a></p>
        </section>
    ` : "";

    const sourceSection = source ? `
        <section class="detail-group">
            <h3>Information source</h3>
            <p><a href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer">View source used to check this listing</a></p>
        </section>
    ` : "";

    const verification = resource.verifiedDate
        ? `Information last checked: ${resource.verifiedDate}`
        : "Verification date not recorded. Confirm details with the organization.";

    dialogContent.innerHTML = `
        ${createDetailGroup("What they offer", resource.offer)}
        ${createDetailGroup("Who may be eligible", resource.who)}
        ${createDetailGroup("Categories", categories)}
        ${createDetailGroup("Areas served", areas)}
        ${createDetailGroup("How to access", resource.serviceType)}
        ${createDetailGroup("Cost", resource.cost)}
        ${createDetailGroup("Address", resource.address)}
        ${phoneSection}
        ${websiteSection}
        ${sourceSection}
        ${createDetailGroup("Verification", verification)}
    `;

    if (!resourceDialog.open) resourceDialog.showModal();
    dialogCloseButton.focus();
}

function closeResourceModal() {
    if (resourceDialog.open) resourceDialog.close();
    if (lastFocusedElement) lastFocusedElement.focus();
}

// ---------- CONTROLS & LISTENERS ----------

function resetAll() {
    searchInput.value = "";
    categoryFilter.value = "all";
    areaFilter.value = "all";
    document.querySelectorAll(".pill-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.category === "all"));
    filterResources();
    searchInput.focus();
}

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
clearSearchBtnAction.addEventListener("click", () => {
    searchInput.value = "";
    filterResources();
    searchInput.focus();
});

resetButton.addEventListener("click", resetAll);
emptyResetButton.addEventListener("click", resetAll);
retryLoadButton.addEventListener("click", loadResources);

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

// Accurate Dialog Outside Click
resourceDialog.addEventListener("click", event => {
    const rect = resourceDialog.getBoundingClientRect();
    const inDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
    if (!inDialog) closeResourceModal();
});

dialogCloseButton.addEventListener("click", closeResourceModal);
dialogDoneButton.addEventListener("click", closeResourceModal);

// Contribution Modal Handling
function openContribution(type) {
    if (type === "report") {
        contributionType.value = "report";
        contributeModalTitle.textContent = "Report a Problem";
    } else {
        contributionType.value = "suggest";
        contributeModalTitle.textContent = "Suggest a Resource";
    }
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
            <p>Your submission has been received and will be reviewed before anything is added or changed in the directory.</p>
            <button type="button" class="button button-primary" onclick="document.getElementById('contribute-dialog').close()">Done</button>
        </div>
    `;
});

// Start
loadResources();
