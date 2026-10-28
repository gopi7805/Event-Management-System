
const API_BASE = "http://localhost:8080/api";

let events = [];
let bookings = [];
let currentPage = "dashboard";
let toastTimer;

const pageContent = document.getElementById("pageContent");
const connectionDot = document.getElementById("connectionDot");
const connectionText = document.getElementById("connectionText");

const pageInfo = {
    dashboard: {
        icon: "📊",
        label: "Dashboard",
        title: "Your event overview",
        description: "Track events, bookings and categories in one place."
    },
    events: {
        icon: "🎉",
        label: "Explore Events",
        title: "Discover your next event",
        description: "Search by event name or filter events by category."
    },
    "add-event": {
        icon: "✨",
        label: "Add Event",
        title: "Create a new event",
        description: "Add event details and make it available for booking."
    },
    booking: {
        icon: "🎫",
        label: "Book Tickets",
        title: "Reserve your tickets",
        description: "Select an event and submit your booking details."
    },
    bookings: {
        icon: "📋",
        label: "All Bookings",
        title: "Manage your bookings",
        description: "View booking records saved in your backend."
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            navigate(link.dataset.page);
        });
    });

    document.querySelector(".brand").addEventListener("click", event => {
        event.preventDefault();
        navigate("dashboard");
    });

    document.getElementById("refreshBtn").addEventListener("click", async () => {
        await loadData();
        renderPage();
        showToast("Data refreshed.");
    });

    window.addEventListener("hashchange", () => {
        navigate(location.hash.slice(1) || "dashboard", false);
    });

    navigate(location.hash.slice(1) || "dashboard", false);
    await loadData();
    renderPage();
});

/* API request helper */
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
    }

    if (response.status === 204) return null;

    const text = await response.text();

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/* Load events and bookings from Spring Boot */
async function loadData() {
    const results = await Promise.allSettled([
        apiRequest("/events"),
        apiRequest("/bookings")
    ]);

    if (results[0].status === "fulfilled") {
        events = Array.isArray(results[0].value)
            ? results[0].value : [];
    }

    if (results[1].status === "fulfilled") {
        bookings = Array.isArray(results[1].value)
            ? results[1].value : [];
    }

    const connected = results.every(
        result => result.status === "fulfilled"
    );

    connectionDot.classList.toggle("offline", !connected);

    connectionText.textContent = connected
        ? "Backend connected"
        : "Backend unavailable";

    return connected;
}

/* Sidebar navigation */
function navigate(page, updateHash = true) {
    if (!pageInfo[page]) {
        page = "dashboard";
    }

    currentPage = page;

    if (updateHash && location.hash !== `#${page}`) {
        location.hash = page;
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    renderPage();
}

function pageHeader(page, actions = "") {
    const info = pageInfo[page];

    return `
        <div class="page-heading">
            <div>
                <div class="eyebrow">
                    ${info.icon} &nbsp; ${info.label}
                </div>
                <h1>${info.title}</h1>
                <p class="page-description">${info.description}</p>
            </div>
            ${actions
                ? `<div class="heading-actions">${actions}</div>`
                : ""}
        </div>
    `;
}

function renderPage() {
    const renderers = {
        dashboard: renderDashboard,
        events: renderEventsPage,
        "add-event": renderAddEventPage,
        booking: renderBookingPage,
        bookings: renderBookingsPage
    };

    renderers[currentPage]();
}

/* Dashboard */
function renderDashboard() {
    const categories = new Set(
        events.map(item => item.category).filter(Boolean)
    );

    const revenue = bookings.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0),
        0
    );

    pageContent.innerHTML = `
        ${pageHeader(
            "dashboard",
            `<button class="btn btn-primary" id="dashboardAdd">
                ＋ Add Event
            </button>`
        )}

        ${events.length === 0 ? `
            <div class="alert">
                No events found. Check your backend or add an event.
            </div>
        ` : ""}

        <div class="stats-grid">
            ${statCard("teal", "🎉", "Total Events", events.length)}
            ${statCard("blue", "🎫", "Total Bookings", bookings.length)}
            ${statCard("pink", "🏷️", "Categories", categories.size)}
            ${statCard("orange", "₹", "Booking Amount", formatMoney(revenue))}
        </div>

        <div class="section-heading">
            <h2>Available events</h2>
            <a class="text-link" href="#events">Explore all →</a>
        </div>

        ${eventCards(events.slice(0, 3))}

        <div class="section-heading">
            <h2>Recent bookings</h2>
            <a class="text-link" href="#bookings">View bookings →</a>
        </div>

        ${bookingTable([...bookings].reverse().slice(0, 5))}
    `;

    document.getElementById("dashboardAdd")
        .addEventListener("click", () => navigate("add-event"));
}

function statCard(color, icon, label, value) {
    return `
        <article class="stat-card ${color}">
            <div class="stat-icon">${icon}</div>
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div>
        </article>
    `;
}

/* Event page: name search and category filter */
function renderEventsPage() {
    const categories = [
        ...new Set(
            events.map(item => String(item.category || "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    pageContent.innerHTML = `
        ${pageHeader(
            "events",
            `<button class="btn btn-primary" id="eventsAdd">
                ＋ Add Event
            </button>`
        )}

        <div class="filter-panel">
            <div class="field">
                <label for="eventSearch">🔎 Search by event name</label>
                <input
                    id="eventSearch"
                    type="search"
                    placeholder="Type an event name..."
                >
            </div>

            <div class="field">
                <label for="categoryFilter">🏷️ Filter by category</label>
                <select id="categoryFilter">
                    <option value="">All categories</option>
                    ${categories.map(category => `
                        <option value="${escapeHTML(category)}">
                            ${escapeHTML(category)}
                        </option>
                    `).join("")}
                </select>
            </div>
        </div>

        <div class="section-heading">
            <h2>Available events</h2>
            <span class="text-link" id="eventCount">
                ${events.length} events
            </span>
        </div>

        <div id="filteredEvents">${eventCards(events)}</div>
    `;

    document.getElementById("eventsAdd")
        .addEventListener("click", () => navigate("add-event"));

    const search = document.getElementById("eventSearch");
    const category = document.getElementById("categoryFilter");

    function applyFilters() {
        const term = search.value.trim().toLowerCase();
        const selected = category.value.toLowerCase();

        const filtered = events.filter(item => {
            const nameMatches = String(item.eventName || "")
                .toLowerCase()
                .includes(term);

            const categoryMatches = !selected ||
                String(item.category || "").trim().toLowerCase()
                    === selected;

            return nameMatches && categoryMatches;
        });

        document.getElementById("eventCount").textContent =
            `${filtered.length} event${filtered.length === 1 ? "" : "s"}`;

        document.getElementById("filteredEvents").innerHTML =
            eventCards(filtered);
    }

    search.addEventListener("input", applyFilters);
    category.addEventListener("change", applyFilters);
}

/* Add event form */
function renderAddEventPage() {
    const categories = [
        ...new Set(events.map(item => item.category).filter(Boolean))
    ];

    pageContent.innerHTML = `
        ${pageHeader("add-event")}

        <div id="eventFormMessage"></div>

        <form class="form-card" id="eventForm">
            <div class="form-grid">

                <div class="field">
                    <label for="eventName">Event name *</label>
                    <input id="eventName" name="eventName"
                        required maxlength="150"
                        placeholder="e.g. Summer Music Festival">
                </div>

                <div class="field">
                    <label for="category">Category *</label>
                    <input id="category" name="category"
                        list="categorySuggestions"
                        required maxlength="80"
                        placeholder="e.g. Music, Sports, Food">

                    <datalist id="categorySuggestions">
                        ${categories.map(value => `
                            <option value="${escapeHTML(value)}"></option>
                        `).join("")}
                    </datalist>
                </div>

                <div class="field">
                    <label for="location">Location *</label>
                    <input id="location" name="location"
                        required maxlength="200"
                        placeholder="City or venue">
                </div>

                <div class="field">
                    <label for="eventDate">Event date and time *</label>
                    <input id="eventDate" name="eventDate"
                        type="datetime-local" required>
                </div>

                <div class="field">
                    <label for="ticketPrice">Ticket price (₹) *</label>
                    <input id="ticketPrice" name="ticketPrice"
                        type="number" min="0" step="0.01"
                        required placeholder="499">
                </div>

                <div class="field">
                    <label for="imageUrl">Event image filename or URL</label>
                    <input id="imageUrl" name="imageUrl"
                        placeholder="music.jpg or https://...">
                </div>

                <div class="field full-width">
                    <label for="featured">Featured event</label>
                    <select id="featured" name="featured">
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                    </select>
                </div>

            </div>

            <p class="page-description">
                Local images should be placed inside frontend/images/.
                Example: music.jpg
            </p>

            <div class="form-actions">
                <button class="btn btn-primary" type="submit">
                    ✓ Save Event
                </button>
                <button class="btn btn-secondary" type="reset">
                    Clear Form
                </button>
                <button class="btn btn-secondary" type="button" id="cancelEvent">
                    Cancel
                </button>
            </div>
        </form>
    `;

    document.getElementById("cancelEvent")
        .addEventListener("click", () => navigate("events"));

    document.getElementById("eventForm")
        .addEventListener("submit", async event => {
            event.preventDefault();

            const form = event.currentTarget;
            const button = form.querySelector('[type="submit"]');

            const payload = {
                eventName: form.elements.eventName.value.trim(),
                category: form.elements.category.value.trim(),
                location: form.elements.location.value.trim(),
                eventDate: form.elements.eventDate.value,
                ticketPrice: Number(form.elements.ticketPrice.value),
                imageUrl: form.elements.imageUrl.value.trim(),
                featured: form.elements.featured.value === "true"
            };

            button.disabled = true;
            button.textContent = "Saving...";

            try {
                await apiRequest("/events", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                await loadData();
                showToast("Event saved successfully!");
                navigate("events");
            } catch (error) {
                showFormError(
                    "eventFormMessage",
                    `Could not save event. ${error.message}`
                );
            } finally {
                button.disabled = false;
                button.textContent = "✓ Save Event";
            }
        });
}

/* Booking form */
function renderBookingPage() {
    pageContent.innerHTML = `
        ${pageHeader("booking")}

        <div id="bookingFormMessage"></div>

        ${events.length === 0 ? `
            <div class="alert">
                No events available. Add an event before booking.
            </div>
        ` : ""}

        <form class="form-card" id="bookingForm">
            <div class="form-grid">

                <div class="field">
                    <label for="customerName">Customer name *</label>
                    <input id="customerName" name="customerName"
                        required maxlength="120"
                        placeholder="Your full name">
                </div>

                <div class="field">
                    <label for="email">Email address *</label>
                    <input id="email" name="email" type="email"
                        required maxlength="180"
                        placeholder="you@example.com">
                </div>

                <div class="field full-width">
                    <label for="bookingEvent">Select event *</label>
                    <select id="bookingEvent" name="eventId"
                        required ${events.length ? "" : "disabled"}>
                        <option value="">Choose an event</option>
                        ${events.map(item => `
                            <option value="${escapeHTML(item.eventId)}">
                                ${escapeHTML(item.eventName)} —
                                ${escapeHTML(item.category)} —
                                ${formatMoney(item.ticketPrice)}
                            </option>
                        `).join("")}
                    </select>
                </div>

                <div class="field">
                    <label for="ticketCount">Number of tickets *</label>
                    <input id="ticketCount" name="ticketCount"
                        type="number" min="1" max="20"
                        value="1" required>
                </div>

                <div class="field">
                    <label for="totalAmount">Total amount</label>
                    <input id="totalAmount" readonly value="₹0.00">
                </div>

            </div>

            <div class="form-actions">
                <button class="btn btn-primary" type="submit"
                    ${events.length ? "" : "disabled"}>
                    🎫 Confirm Booking
                </button>
                <button class="btn btn-secondary" type="reset">
                    Clear Form
                </button>
            </div>
        </form>
    `;

    const form = document.getElementById("bookingForm");
    const eventSelect = form.elements.eventId;
    const quantityInput = form.elements.ticketCount;
    const amountInput = form.elements.totalAmount;

    function updateTotal() {
        const selected = events.find(
            item => String(item.eventId) === eventSelect.value
        );

        const quantity = Number(quantityInput.value || 0);
        const total = selected
            ? Number(selected.ticketPrice || 0) * quantity
            : 0;

        amountInput.value = formatMoney(total);
    }

    eventSelect.addEventListener("change", updateTotal);
    quantityInput.addEventListener("input", updateTotal);

    form.addEventListener("reset", () => {
        setTimeout(updateTotal, 0);
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const selected = events.find(
            item => String(item.eventId) === eventSelect.value
        );

        const quantity = Number(quantityInput.value);

        if (!selected) {
            showFormError(
                "bookingFormMessage",
                "Please select an event."
            );
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
            showFormError(
                "bookingFormMessage",
                "Choose between 1 and 20 tickets."
            );
            return;
        }

        const payload = {
            customerName: form.elements.customerName.value.trim(),
            email: form.elements.email.value.trim(),
            eventId: Number(selected.eventId),
            ticketCount: quantity,
            totalAmount: Number(selected.ticketPrice) * quantity
        };

        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        button.textContent = "Booking...";

        try {
            await apiRequest("/bookings", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            await loadData();
            showToast("Booking confirmed!");
            navigate("bookings");
        } catch (error) {
            showFormError(
                "bookingFormMessage",
                `Booking failed. ${error.message}`
            );
        } finally {
            button.disabled = false;
            button.textContent = "🎫 Confirm Booking";
        }
    });

    updateTotal();
}

/* All bookings */
function renderBookingsPage() {
    const tickets = bookings.reduce(
        (sum, item) => sum + Number(item.ticketCount || 0), 0
    );

    const total = bookings.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0), 0
    );

    const confirmed = bookings.filter(
        item => String(item.bookingStatus || "").toUpperCase() === "CONFIRMED"
    ).length;

    pageContent.innerHTML = `
        ${pageHeader(
            "bookings",
            `<button class="btn btn-secondary" id="bookingsRefresh">
                ↻ Refresh
            </button>
            <button class="btn btn-primary" id="newBooking">
                ＋ New Booking
            </button>`
        )}

        <div class="stats-grid">
            ${statCard("teal", "📋", "Total bookings", bookings.length)}
            ${statCard("blue", "🎟️", "Tickets booked", tickets)}
            ${statCard("orange", "₹", "Total amount", formatMoney(total))}
            ${statCard("pink", "✓", "Confirmed", confirmed)}
        </div>

        <div class="section-heading">
            <h2>Booking records</h2>
        </div>

        ${bookingTable([...bookings].reverse())}
    `;

    document.getElementById("bookingsRefresh")
        .addEventListener("click", async () => {
            await loadData();
            renderPage();
        });

    document.getElementById("newBooking")
        .addEventListener("click", () => navigate("booking"));
}

/* Event cards and images */
function eventCards(list) {
    if (!list.length) {
        return `
            <div class="empty-state">
                <div style="font-size:42px">🔎</div>
                <strong>No matching events found</strong>
                <p>Try a different event name or category.</p>
            </div>
        `;
    }

    const iconMap = {
        music: "🎵",
        sports: "🏆",
        technology: "💻",
        education: "📚",
        workshop: "🛠️",
        business: "💼",
        arts: "🎨"
    };

    return `
        <div class="events-grid">
            ${list.map(item => {
                const icon = iconMap[
                    String(item.category || "").toLowerCase()
                ] || "🎉";

                const image = resolveImage(item.imageUrl);

                return `
                    <article class="event-card">
                        <div class="event-image">
                            ${image ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(item.eventName || "Event")}"
                                    onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
                                >
                                <span class="event-placeholder" style="display:none">${icon}</span>
                            ` : `
                                <span class="event-placeholder">${icon}</span>
                            `}

                            <span class="event-category">
                                ${escapeHTML(item.category || "Other")}
                            </span>

                            ${item.featured ? `
                                <span class="featured-label">★ Featured</span>
                            ` : ""}
                        </div>

                        <div class="event-body">
                            <h3>${escapeHTML(item.eventName || "Untitled event")}</h3>

                            <div class="event-meta">
                                <span>📍 ${escapeHTML(item.location || "Location not provided")}</span>
                                <span>🗓️ ${escapeHTML(formatDate(item.eventDate))}</span>
                            </div>

                            <div class="event-bottom">
                                <div class="price">
                                    ${formatMoney(item.ticketPrice)}
                                    <small>/ ticket</small>
                                </div>

                                <button
                                    class="btn btn-primary btn-small"
                                    data-book-event="${escapeHTML(item.eventId)}">
                                    Book now →
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

/* Bookings table */
function bookingTable(list) {
    if (!list.length) {
        return `
            <div class="empty-state">
                <div style="font-size:42px">📋</div>
                <strong>No bookings available</strong>
                <p>Saved bookings will appear here.</p>
            </div>
        `;
    }

    return `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Customer</th>
                        <th>Event ID</th>
                        <th>Tickets</th>
                        <th>Total amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map(item => `
                        <tr>
                            <td>#${escapeHTML(item.bookingId ?? "-")}</td>
                            <td>
                                <strong>${escapeHTML(item.customerName || "-")}</strong><br>
                                <span style="color:#b1c1cd;font-size:12px">
                                    ${escapeHTML(item.email || "")}
                                </span>
                            </td>
                            <td>#${escapeHTML(item.eventId ?? "-")}</td>
                            <td>${escapeHTML(item.ticketCount ?? 0)}</td>
                            <td>${formatMoney(item.totalAmount)}</td>
                            <td>
                                <span class="status-pill">
                                    ${escapeHTML(item.bookingStatus || "CONFIRMED")}
                                </span>
                            </td>
                            <td>${escapeHTML(formatDate(item.bookingDate))}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

/* Convert an image filename into a frontend image path */
function resolveImage(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }

    if (raw.startsWith("/") || raw.includes("/")) {
        return raw;
    }

    return `images/${raw}`;
}

function formatMoney(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(value) {
    if (!value) return "Date not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).replace("T", " ");
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

function showFormError(containerId, message) {
    const container = document.getElementById(containerId);

    if (container) {
        container.innerHTML = `
            <div class="alert">${escapeHTML(message)}</div>
        `;
    }

    showToast(message, true);
}

/* Book now button opens booking page with that event selected */
document.addEventListener("click", event => {
    const button = event.target.closest("[data-book-event]");

    if (!button) return;

    const eventId = button.dataset.bookEvent;

    navigate("booking");

    const select = document.getElementById("bookingEvent");

    if (select) {
        select.value = eventId;
        select.dispatchEvent(new Event("change"));
    }
});
