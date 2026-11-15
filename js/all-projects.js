/* ==========================================================================
   all-projects.js : interactive filtering and live search for
   projects/all-academic-projects.html
   ========================================================================== */
(function () {
  "use strict";

  const filterBtns = Array.prototype.slice.call(document.querySelectorAll(".filter[data-filter]"));
  const searchInput = document.getElementById("project-search");
  const resultNote = document.getElementById("result-note");
  const items = Array.prototype.slice.call(document.querySelectorAll(".pitem"));
  const groups = Array.prototype.slice.call(document.querySelectorAll(".uni-group"));
  const emptyState = document.getElementById("empty-state");

  if (!items.length) return;

  // Store original HTML for highlight-safe restoration
  const originals = items.map(function (item) {
    const title = item.querySelector("h3");
    const fields = Array.prototype.slice.call(item.querySelectorAll(".pfields p"));
    return {
      item: item,
      uni: item.getAttribute("data-uni"),
      isKey: item.getAttribute("data-key") === "true",
      titleEl: title,
      titleHTML: title ? title.innerHTML : "",
      fields: fields.map(function (p) { return { el: p, html: p.innerHTML }; }),
      searchText: item.textContent.toLowerCase()
    };
  });

  let activeFilter = "all";
  let query = "";

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightHTML(html, term) {
    if (!term) return html;
    const re = new RegExp("(" + escapeRegExp(term) + ")", "gi");
    // Only replace inside text nodes (outside HTML tags)
    return html.replace(/(<[^>]+>)|([^<]+)/g, function (match, tag, text) {
      if (tag) return tag;
      return text.replace(re, "<mark>$1</mark>");
    });
  }

  function apply() {
    const q = query.trim().toLowerCase();
    let visibleCount = 0;

    originals.forEach(function (entry) {
      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "key" && entry.isKey) ||
        entry.uni === activeFilter;

      const matchQuery = !q || entry.searchText.indexOf(q) !== -1;
      const show = matchFilter && matchQuery;

      entry.item.classList.toggle("is-hidden", !show);
      if (show) visibleCount++;

      if (entry.titleEl) {
        entry.titleEl.innerHTML = show && q ? highlightHTML(entry.titleHTML, q) : entry.titleHTML;
      }
      entry.fields.forEach(function (f) {
        f.el.innerHTML = show && q ? highlightHTML(f.html, q) : f.html;
      });
    });

    groups.forEach(function (group) {
      const hasVisible = group.querySelectorAll(".pitem:not(.is-hidden)").length > 0;
      group.style.display = hasVisible ? "" : "none";
    });

    if (emptyState) {
      emptyState.classList.toggle("is-visible", visibleCount === 0);
    }

    if (resultNote) {
      resultNote.textContent = visibleCount + (visibleCount === 1 ? " project" : " projects");
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeFilter = btn.getAttribute("data-filter") || "all";
      filterBtns.forEach(function (b) {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      apply();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      query = searchInput.value || "";
      apply();
    });
  }
})();
