// ---------------------------------------------------------------------------
// GET /saasevenly.js
//
// Serves the real embeddable widget as a JavaScript file. Drop this on any page:
//
//   <span data-saasevenly="19">$19</span>
//   <script src="https://yoursite.com/saasevenly.js"></script>
//
// The script finds every [data-saasevenly] element, asks /api/price for the
// visitor's localized prices, and rewrites each one with a short amber flash.
// ---------------------------------------------------------------------------

const SCRIPT = `/* saasevenly widget — localizes [data-saasevenly] prices */
(function () {
  // Where did this script load from? Use that origin for the API call so the
  // widget works no matter what domain it's embedded on.
  var me = document.currentScript;
  var origin = me ? new URL(me.src).origin : window.location.origin;

  // The site key lives in this script's own URL: /saasevenly.js?key=se_live_xxx
  // It ties the embed to one founder's account and their saved pricing rules.
  var siteKey = "";
  try { siteKey = me ? new URL(me.src).searchParams.get("key") || "" : ""; } catch (e) {}

  // Let a ?country=XX override on the host page flow through for testing.
  var pageParams = new URLSearchParams(window.location.search);
  var override = pageParams.get("country");

  function run() {
    var els = Array.prototype.slice.call(
      document.querySelectorAll("[data-saasevenly]")
    );
    if (!els.length) return;

    // Collect the unique base USD values present on the page.
    var bases = [];
    els.forEach(function (el) {
      var v = el.getAttribute("data-saasevenly");
      if (v && bases.indexOf(v) === -1) bases.push(v);
    });

    var url =
      origin +
      "/api/price?bases=" +
      encodeURIComponent(bases.join(",")) +
      (siteKey ? "&key=" + encodeURIComponent(siteKey) : "") +
      (override ? "&country=" + encodeURIComponent(override) : "");

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // On any error (unknown key, unauthorized domain, network) we leave the
        // original USD prices untouched — the embed simply does nothing.
        if (!data || !data.ok || !data.prices) return;

        // Expose the visitor's country/discount on window for the page to use
        // (e.g. the pricing page shows a "Localized for ..." banner).
        window.saasevenly = {
          siteKey: siteKey,
          country: data.country,
          countryName: data.countryName,
          flag: data.flag,
          currency: data.currency,
          discountPercent: data.discountPercent,
        };
        document.dispatchEvent(
          new CustomEvent("saasevenly:ready", { detail: window.saasevenly })
        );

        els.forEach(function (el) {
          var base = el.getAttribute("data-saasevenly");
          var price = data.prices[base];
          if (!price) return;
          // Rewrite the text, then flash amber so the change is visible.
          el.textContent = price.display;
          el.classList.remove("saasevenly-flash");
          // Force reflow so the animation restarts if it ran before.
          void el.offsetWidth;
          el.classList.add("saasevenly-flash");
        });
      })
      .catch(function (err) {
        // On any failure we leave the original USD prices in place.
        if (window.console) console.warn("[saasevenly] pricing failed:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // Expose a manual refresh so single-page apps (account pages, "current plan"
  // pages, billing screens that render AFTER load) can re-localize their prices:
  //   saasevenlyRefresh()   // call after your page renders new [data-saasevenly]
  window.saasevenlyRefresh = run;
  // Also re-localize automatically when the tab is shown again / history nav.
  window.addEventListener("pageshow", run);
})();
`;

export async function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Embeddable from anywhere.
      "Access-Control-Allow-Origin": "*",
      // Short cache; tweak for production.
      "Cache-Control": "public, max-age=300",
    },
  });
}
