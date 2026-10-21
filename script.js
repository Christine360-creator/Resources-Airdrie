// =========================================
// COMMUNITY RESOURCES DIRECTORY
// Connected to your Google Sheet CSV
// =========================================

"use strict";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBAoUdhRVsTr4vIEgFWNbAl40_L8DlgBZMAuG4lU9YDvt__SKGM7Ck6bfl0CCehPVGlpTxE9w6bHCQ/pub?gid=0&single=true&output=csv";

// Elements
const searchInput = document.getElementById("resource-search");
const categoryFilter = document.getElementById("category-filter");
const areaFilter = document.getElementById("area-filter");
const clearSearchButton = document.getElementById("clear-search");
const resetButton = document.getElementById("reset-filters");
const emptyResetButton = document.getElementById("empty-reset");
const resultsCount = document.getElementById("results-count");
const resourceGrid = document.getElementById("resource-grid");
const noResults = document.getElementById("no-results");
const loadError = document.getElementById("load-error");
const retryLoadButton = document.getElementById("retry-load");

const resourceDialog = document.getElementById("resource-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogContent = document.getElementById("dialog-content");
const dialogCloseButton = document.getElementById("dialog-close");
const dialogDoneButton = document.getElementById("dialog-done");

const contributeModal = document.getElementById("contributeModal");
const contributeModalTitle = document.getElementById("contributeModalTitle");
const closeContribution = document.getElementById("closeContribution");
const suggestResource = document.getElementById("suggestResource");
const reportProblem = document.getElementById("reportProblem");
const contributionForm = document.getElementById("contributionForm");
const contributionType = document.getElementById("contributionType");
const contributionBody = document.getElementById("contributionBody");

let resources = [];
let lastFocusedElement = null;

// Helpers
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return characters[character];
    });
}

function splitList(value) {
    return String(value ?? "")
        .split(/[|;]/)
        .map(item => item.trim())
        .filter(Boolean);
}

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
            if (row.some(value => value.trim() !== "")) {
                rows.push(row);
            }
            row = [];
            cell = "";
        } else {
            cell += character;
        }
    }

    if (cell !== "" || row.length > 0) {
        row.push(cell);
        if (row.some(value => value.trim() !== "")) {
            rows.push(row);
        }
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map(header => header.trim().replace(/^"|"$/g, ''));

    return rows.slice(1).map(values => {
        const record = {};
        headers.forEach((header, index) => {
            record[header] = (values[index] ?? "").trim().replace(/^"|"$/g, '');
        });
        return record;
    });
}

function safeWebsiteURL(value) {
    const urlText = String(value ?? "").trim();
    if (!urlText) return "";
    try {
        const url = new URL(urlText);
        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        return "";
    }
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

function prepareResources(rows) {
    const seenIDs = new Set();

    return rows
        .map(row => {
            const id = String(row.id ?? "").trim();
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
                verifiedDate: String(row.verifiedDate ?? "").trim(),
                sourceUrl: String(row.sourceUrl ?? "").trim(),
                icon: String(row.icon ?? "").trim() || "📍"
            };
        })
        .filter(resource => {
            if (!resource.id || !resource.organization) return false;
            if (seenIDs.has(resource.id)) return false;
            seenIDs.add(resource.id);
            return true;
        });
}

// Load resources from sheet
async function loadResources() {
    loadError.hidden = true;
    noResults.hidden = true;
    resourceGrid.innerHTML = '<p class="loading-message">Loading community resources…</p>';
    resultsCount.textContent = "Loading resources…";

    try {
        const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load Google Sheet");

        const csvText = await response.text();
        const rows = parseCSV(csvText);
        const loadedResources = prepareResources(rows);

        if (loadedResources.length === 0) {
            throw new Error("No records found in the spreadsheet.");
        }

        resources = loadedResources;
        buildFiltersFromData(resources);
        filterResources();
    } catch (error) {
        console.error("Resource directory loading error:", error);
        resourceGrid.innerHTML = "";
        resultsCount.textContent = "Resources could not be loaded.";
        loadError.hidden = false;
    }
}

// Build filter options
function buildFiltersFromData(data) {
    const categories = [...new Set(
        data.flatMap(resource => resource.category)
    )].sort((a, b) => a.localeCompare(b));

    const areas = [...new Set(
        data.flatMap(resource => resource.area)
    )].sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML = '<option value="">All categories</option>';
    areaFilter.innerHTML = '<option value="">All areas</option>';

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    areas.forEach(area => {
        const option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        areaFilter.appendChild(option);
    });
}

// Render cards
function createResourceCard(resource) {
    const categories = resource.category.length
        ? resource.category.map(category => `
            <span class="tag">${escapeHTML(category)}</span>
        `).join("")
        : "";

    const areas = resource.area.length
        ? resource.area.map(area => escapeHTML(area)).join(", ")
        : "Area not listed";

    const serviceType = resource.serviceType
        ? `<p><strong>Access:</strong> ${escapeHTML(resource.serviceType)}</p>`
        : "";

    const phoneLink = safePhoneLink(resource.phone);

    const phoneMarkup = phoneLink
        ? `<p><strong>Phone:</strong>
               <a href="${escapeHTML(phoneLink)}">${escapeHTML(resource.phone)}</a>
           </p>`
        : "";

    const website = safeWebsiteURL(resource.website);

    const websiteMarkup = website
        ? `<a class="text-link" href="${escapeHTML(website)}"
               target="_blank" rel="noopener noreferrer">Website</a>`
        : "";

    const verificationMarkup = resource.verifiedDate
        ? `<p class="verification-note">
               Information last checked: ${escapeHTML(resource.verifiedDate)}
           </p>`
        : `<p class="verification-note">
               Service details need to be verified.
           </p>`;

    return `
        <article class="resource-card">
            <div class="card-topline">
                <span class="card-icon" aria-hidden="true">
                    ${escapeHTML(resource.icon)}
                </span>
            </div>

            <h3>${escapeHTML(resource.organization)}</h3>

            <div class="tag-list">
                ${categories}
            </div>

            <p class="resource-offer">
                ${escapeHTML(resource.offer || "Contact the organization for details.")}
            </p>

            <div class="resource-meta">
                <p><strong>Area:</strong> ${areas}</p>
                ${serviceType}
                ${phoneMarkup}
            </div>

            <div class="card-actions">
                <button
                    class="button button-primary"
                    type="button"
                    data-resource-id="${escapeHTML(resource.id)}"
                >
                    Details
                </button>

                ${websiteMarkup}
            </div>

            ${verificationMarkup}
        </article>
    `;
}

function displayResources(data) {
    resourceGrid.innerHTML = data.map(createResourceCard).join("");
    const total = data.length;
    const word = total === 1 ? "resource" : "resources";

    resultsCount.textContent = `${total} ${word} found`;
    noResults.hidden = total !== 0;
}

// Search & filter
function filterResources() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedArea = areaFilter.value;

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
        const matchesCategory = !selectedCategory || resource.category.includes(selectedCategory);
        const matchesArea = !selectedArea || resource.area.includes(selectedArea);

        return matchesSearch && matchesCategory && matchesArea;
    });

    displayResources(filtered);
}

// Details Dialog
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

    const phoneSection = resource.phone
        ? `
            <section class="detail-group">
                <h3>Phone</h3>
                <p>
                    ${phoneLink
                        ? `<a href="${escapeHTML(phoneLink)}">${escapeHTML(resource.phone)}</a>`
                        : escapeHTML(resource.phone)}
                </p>
            </section>
        `
        : "";

    const websiteSection = website
        ? `
            <section class="detail-group">
                <h3>Website</h3>
                <p>
                    <a href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">
                        Visit the organization's website
                    </a>
                </p>
            </section>
        `
        : "";

    const sourceSection = source
        ? `
            <section class="detail-group">
                <h3>Information source</h3>
                <p>
                    <a href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer">
                        View source used to check this listing
                    </a>
                </p>
            </section>
        `
        : "";

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

    if (!resourceDialog.open) {
        resourceDialog.showModal();
    }

    dialogCloseButton.focus();
}

function closeResourceModal() {
    if (resourceDialog.open) {
        resourceDialog.close();
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

// Reset
function resetAll() {
    searchInput.value = "";
    categoryFilter.value = "";
    areaFilter.value = "";
    filterResources();
    searchInput.focus();
}

// Event Listeners
searchInput.addEventListener("input", filterResources);
categoryFilter.addEventListener("change", filterResources);
areaFilter.addEventListener("change", filterResources);

clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    filterResources();
    searchInput.focus();
});

resetButton.addEventListener("click", resetAll);
emptyResetButton.addEventListener("click", resetAll);
retryLoadButton.addEventListener("click", loadResources);

dialogCloseButton.addEventListener("click", closeResourceModal);
dialogDoneButton.addEventListener("click", closeResourceModal);

document.addEventListener("click", event => {
    const button = event.target.closest("[data-resource-id]");
    if (button) {
        openResourceModal(button.dataset.resourceId, button);
    }
});

resourceDialog.addEventListener("click", event => {
    const rect = resourceDialog.getBoundingClientRect();
    const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

    if (!inDialog) {
        closeResourceModal();
    }
});

// Contribution Dialog
function openContributionModal(type) {
    if (type === "report") {
        contributionType.value = "report";
        contributeModalTitle.textContent = "Report a Problem";
    } else {
        contributionType.value = "suggest";
        contributeModalTitle.textContent = "Suggest a Resource";
    }
    contributeModal.showModal();
    document.getElementById("organizationName").focus();
}

suggestResource.addEventListener("click", () => openContributionModal("suggest"));
reportProblem.addEventListener("click", () => openContributionModal("report"));

closeContribution.addEventListener("click", () => contributeModal.close());

contributeModal.addEventListener("click", event => {
    const rect = contributeModal.getBoundingClientRect();
    const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

    if (!inDialog) {
        contributeModal.close();
    }
});

contributionForm.addEventListener("submit", event => {
    event.preventDefault();
    contributionBody.innerHTML = `
        <div class="empty-state" style="border:none; padding: 20px 10px;">
            <div class="empty-icon" aria-hidden="true">✓</div>
            <h3>Thank you!</h3>
            <p>Your submission has been received and will be reviewed before anything is added or changed in the directory.</p>
            <button type="button" class="button button-primary" onclick="document.getElementById('contributeModal').close()">Done</button>
        </div>
    `;
});

// Run
loadResources();
