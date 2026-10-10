"use strict";

/* ---------- Global Config & State ---------- */
let BASE_PRICE = 29;
const MAX_ENGRAVING = 18;
const BACKEND_URL = "http://localhost:3000";

const VARIANTS = {
  small:  { label: "500 ml", bodyHeight: 230, extra: 0 },
  medium: { label: "750 ml", bodyHeight: 290, extra: 6 },
  large:  { label: "1 L",    bodyHeight: 340, extra: 12 },
};

const COLORS = {
  ocean: ["#2a8a94", "#145058"],
  slate: ["#5b6878", "#2c3440"],
  sand:  ["#dcc89b", "#b39a68"],
  aurora: ["#7b5cff", "#19c7a5"],
  gold:   ["#f0c85a", "#8a5f12"],
  rose:   ["#e8a29a", "#a4524a"],
};

const CAPS = { graphite: "#1d2b2e", brass: "#b8862b", pearl: "#e9e4d8" };
const FONTS = { sans: "inherit", serif: "Georgia, serif", mono: "Consolas, monospace" };
const DEFAULT_DESIGN = {
  cap: "graphite",
  font: "sans",
  color: "ocean",
  variant: "medium",
  finish: "matte",
  engraving: "",
  foil: false,
  shimmer: false
};

let design = { ...DEFAULT_DESIGN };
let isPremium = false;
let cart = [];
let toastTimer;

const money = (val) => `$${Number(val).toFixed(2)}`;

/* ==========================================================================
   Question 1: jQuery-Based DOM Manipulation & Event Handling
   ========================================================================== */

function showToast(message) {
  const $toast =$("#toast");
  $toast.text(message).addClass("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.removeClass("show"), 2600);
}

function currentPrice() {
  return BASE_PRICE + VARIANTS[design.variant].extra;
}

function renderDesign() {
  const [c1, c2] = COLORS[design.color];
  document.documentElement.style.setProperty("--c1", c1);
  document.documentElement.style.setProperty("--c2", c2);
  document.documentElement.style.setProperty("--cap", CAPS[design.cap]);

  const { bodyHeight } = VARIANTS[design.variant];
  $("#bottleBody").attr("height", bodyHeight);
  $("#shine").attr("height", bodyHeight);
  $("#gloss").attr("height", bodyHeight - 30);

  const middle = 58 + bodyHeight / 2;
  const $engraving =$("#engravingText");
  $engraving.attr("transform", `rotate(-90 100 ${middle})`);
  $engraving.attr("y", middle + 5);
  $engraving.attr("x", 100);
  $engraving.text(design.engraving);$engraving.css("font-family", FONTS[design.font]);

  // Swatches active state via jQuery
  $("[data-cap]").each(function () {
    $(this).attr("aria-pressed", $(this).data("cap") === design.cap);
  });
  $(".swatch[data-color]").each(function () {
    $(this).attr("aria-pressed", $(this).data("color") === design.color);
  });

  // SVG effect classes
  $("#bottleSvg").toggleClass("glossy", design.finish === "glossy")
                 .toggleClass("foil", design.foil)
                 .toggleClass("shimmer", design.shimmer);

  // Update product title and dynamic price
  const baseTitle = $("#productName").data("custom-title") || "Tidewell Flask";
  $("#productName").text(design.engraving ? `${baseTitle} – ${design.engraving}` : baseTitle);
  $("#productPrice").text(money(currentPrice()));

  // Counter update
  const length = design.engraving.length;
  $("#engravingCounter")
    .text(`${length} / ${MAX_ENGRAVING}`)
    .toggleClass("warn", length >= MAX_ENGRAVING);
}

function renderCart() {
  const $cartList =$("#cartList").empty();

  cart.forEach((item, index) => {
    const $li =$("<li></li>");
    const $span =$("<span></span>").text(item.label);
    const $strong =$("<strong></strong>").text(money(item.price));
    const $removeBtn =$("<button></button>")
      .addClass("remove")
      .attr("type", "button")
      .attr("aria-label", "Remove item")
      .attr("data-index", index)
      .text("✕");

    $li.append($span, $strong,$removeBtn);
    $cartList.append($li);
  });

  $("#cartEmpty").toggle(cart.length === 0);
  $("#cartCount").text(cart.length);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  $("#cartTotal").text(money(total));
}

function addToCart() {
  cart.push({
    label: `${VARIANTS[design.variant].label} ${design.color}${design.engraving ? ` – "${design.engraving}"` : ""}`,
    price: currentPrice(),
  });
  renderCart();
  const $zone =$("#cartZone").removeClass("dropped");
  setTimeout(() => $zone.addClass("dropped"), 10);
  showToast("Added to cart. Your custom flask is ready!");
}

/* ---------- Event Listeners with jQuery ---------- */
$(document).ready(() => {
  renderDesign();
  renderCart();

  // Swatch selection
  $("#freeColors").on("click", ".swatch", function () {
    design.color = $(this).data("color");
    renderDesign();
  });

  $("#capColors").on("click", ".swatch", function () {
    design.cap = $(this).data("cap");
    renderDesign();
  });

  // Variant & Finish change
  $("#variantSelect").on("change", function () {
    design.variant = $(this).val();
    renderDesign();
  });

  $('input[name="finish"]').on("change", function () {
    design.finish = $(this).val();
    renderDesign();
  });

  // Engraving Input
  $("#engravingInput").on("input", function () {
    design.engraving = $(this).val();$("#engravingError").text("");
    $(this).removeClass("invalid");

    if (design.engraving.length >= MAX_ENGRAVING) {
      $("#engravingError").text(`Limit reached: ${MAX_ENGRAVING} characters maximum.`);
    }
    renderDesign();
  });

  // Font Selection & Name Chips
  $("#fontSelect").on("change", function () {
    design.font = $(this).val();
    renderDesign();
  });

  $("#nameChips").on("click", ".chip", function () {
    const chipVal = $(this).data("name").slice(0, MAX_ENGRAVING);
    $("#engravingInput").val(chipVal).trigger("input").focus();
  });

  // 3D Spin Button
  $("#spinBtn").on("click", function () {
    $("#tilt").get(0).animate(
      [{ transform: "rotateY(0)" }, { transform: "rotateY(360deg)" }],
      { duration: 1400, easing: "ease-in-out" }
    );
  });

  // Cart item removal
  $("#cartList").on("click", ".remove", function () {
    const idx = Number($(this).data("index"));
    cart.splice(idx, 1);
    renderCart();
    showToast("Item removed from cart.");
  });

  // Form Submit
  $("#customForm").on("submit", function (e) {
    e.preventDefault();
    const $input =$("#engravingInput");
    const name = $input.val().trim();
    const $msg =$("#formMessage").removeClass("ok");

    if (!name) {
      $("#engravingError").text("Enter a name to engrave before adding to cart.");
      $input.addClass("invalid").focus();
      return;
    }
    if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) {
      $("#engravingError").text("Use only letters, numbers, spaces, . ' or -.");
      $input.addClass("invalid").focus();
      return;
    }

    design.engraving = name;
    renderDesign();
    addToCart();
    $msg.text("Design saved and added to cart.").addClass("ok");
  });

  // Reset Form
  $("#customForm").on("reset", function () {
    design = { ...DEFAULT_DESIGN };
    $("#variantSelect").val("medium");
    $("#foilToggle").prop("checked", false);
    $("#shimmerToggle").prop("checked", false);
    $("#formMessage").text("");
    $("#engravingError").text("");
    $("#engravingInput").removeClass("invalid");
    $("#lockMessage").hide();
    renderDesign();
    showToast("Design reset to defaults.");
  });

  // Copy protection on description
  $("#productDescription").on("copy cut", function (e) {
    e.preventDefault();
    showToast("Product description is protected from copying.");
  });

  // Tilt & Hover preview
  const $preview =$("#preview");
  $preview.on("pointerenter", () => $preview.addClass("active"));
  $preview.on("pointerleave", () => {
    $preview.removeClass("active");
    $("#tilt").css("transform", "rotateY(0) rotateX(0)");
    $("#hoverTag").text("Move over the bottle");
  });
  $preview.on("pointermove", (e) => {
    const offset = $preview.offset();
    const width = $preview.outerWidth();
    const height = $preview.outerHeight();
    const x = (e.pageX - offset.left) / width;
    const y = (e.pageY - offset.top) / height;

    $("#tilt").css("transform", `rotateY(${(x - 0.5) * 30}deg) rotateX(${(0.5 - y) * 30}deg)`);
    $preview.get(0).style.setProperty("--gx", `${x * 100}%`);
    $preview.get(0).style.setProperty("--gy", `${y * 100}%`);
  });

  $("#bottleSvg").on("mouseover", "[data-part]", function () {
    $("#hoverTag").text(`Hovering: ${$(this).data("part")}`);
  });

  // Theme Toggle
  $("#themeToggle").on("click", function () {
    const isDark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    $(this).text(isDark ? "☀️" : "🌙");
  });

  // Full demo reset
  $("#resetAll").on("click", function () {
    isPremium = false;
    $("body").attr("data-tier", "free");
    $("#statusText").text("Free User");
    cart = [];
    renderCart();
    $("#customForm").trigger("reset");
    showToast("Demo reset.");
  });

  setupDragAndDrop();
  setupPremiumGate();
  setupPaymentModal();
  setupApiIntegrations();
});

/* ---------- HTML5 Native Drag & Drop with Cart ---------- */
function setupDragAndDrop() {
  const card = document.getElementById("productCard");
  const zone = document.getElementById("cartZone");

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", "tidewell-flask");
    e.dataTransfer.effectAllowed = "copy";
    $(card).addClass("dragging");
  });
  card.addEventListener("dragend", () => $(card).removeClass("dragging"));

  zone.addEventListener("dragenter", (e) => { e.preventDefault(); $(zone).addClass("drag-over"); });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
  zone.addEventListener("dragleave", (e) => {
    if (!zone.contains(e.relatedTarget)) $(zone).removeClass("drag-over");
  });
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    $(zone).removeClass("drag-over");
    if (e.dataTransfer.getData("text/plain") === "tidewell-flask") addToCart();
  });
}

/* ---------- Premium Gating ---------- */
function setupPremiumGate() {
  function guardPremium(e, featureName) {
    if (isPremium) return true;
    e.preventDefault();
    e.stopPropagation();
    $("#lockText").text(`${featureName} is a premium feature. Upgrade to unlock it.`);
    $("#lockMessage").fadeIn();
    const $t = $(e.currentTarget);$t.removeClass("shake");
    void $t.get(0).offsetWidth;
    $t.addClass("shake");
    return false;
  }

  $("#premiumColors").on("click", ".swatch", function (e) {
    if (!guardPremium(e, "This premium color")) return;
    design.color = $(this).data("color");
    renderDesign();
  });

  $("#foilToggle").parent().on("click", function (e) {
    if (!guardPremium(e, "Gold foil engraving")) return;
  });
  $("#shimmerToggle").parent().on("click", function (e) {
    if (!guardPremium(e, "The shimmer effect")) return;
  });

  $("#foilToggle").on("change", function () {
    design.foil = $(this).is(":checked");
    renderDesign();
  });
  $("#shimmerToggle").on("change", function () {
    design.shimmer = $(this).is(":checked");
    renderDesign();
  });
}

/* ---------- Payment Modal Logic ---------- */
function setupPaymentModal() {
  const modal = document.getElementById("payDialog");

  $("[data-open-pay]").on("click", () => {
    $("#payView").show();
    $("#processingView, #successView").hide();
    modal.showModal();
  });
  $("#closePay").on("click", () => modal.close());
  $("#doneBtn").on("click", () => {
    modal.close();
    document.getElementById("premium").scrollIntoView();
  });

  $("#cardNumber").on("input", function () {
    const val = $(this).val().replace(/\D/g, "").slice(0, 16);
    $(this).val(val.replace(/(.{4})/g, "$1 ").trim());
  });

  $("#cardExpiry").on("input", function () {
    const val = $(this).val().replace(/\D/g, "").slice(0, 4);
    $(this).val(val.length > 2 ? `${val.slice(0, 2)}/${val.slice(2)}` : val);
  });

  $("#cardCvv").on("input", function () {
    $(this).val($(this).val().replace(/\D/g, "").slice(0, 4));
  });

  $("#payForm").on("submit", function (e) {
    e.preventDefault();
    const name = $("#cardName").val().trim();
    const num = $("#cardNumber").val().replace(/\s/g, "");
    const exp = $("#cardExpiry").val();
    const cvv = $("#cardCvv").val();

    let valid = true;
    if (!/^[A-Za-z ]{3,}$/.test(name)) { valid = false; $("#cardName").addClass("invalid"); }
    if (!/^\d{16}$/.test(num)) { valid = false; $("#cardNumber").addClass("invalid"); }
    if (!/^\d{2}\/\d{2}$/.test(exp)) { valid = false; $("#cardExpiry").addClass("invalid"); }
    if (!/^\d{3,4}$/.test(cvv)) { valid = false; $("#cardCvv").addClass("invalid"); }

    if (!valid) return;

    $("#payView").hide();
    $("#processingView").show();

    setTimeout(() => {
      isPremium = true;
      $("body").attr("data-tier", "premium");
      $("#statusText").text("Premium User");
      $("#lockMessage").hide();
      $("#processingView").hide();
      $("#successView").show();
      showToast("Premium unlocked!");
    }, 1500);
  });
}

/* ==========================================================================
   Questions 2 & 3: AJAX Communication (Public API & Express Backend)
   ========================================================================== */

function setStatusBanner(msg, type = "success") {
  const $banner =$("#apiStatusBanner");
  $banner.removeClass("success error").addClass(type).text(msg).fadeIn();
  setTimeout(() => $banner.fadeOut(), 6000);
}

function setupApiIntegrations() {
  // ----------------------------------------------------
  // QUESTION 2: Public API Integration (DummyJSON GET)
  // ----------------------------------------------------
  $("#fetchExternalApiBtn").on("click", function () {
    $("#apiLoadingIndicator").show();
    setStatusBanner("Requesting external public API...", "success");

    $.ajax({
      url: "https://dummyjson.com/products/96", // Sports Water Bottle item
      type: "GET",
      dataType: "json",
      success: function (response) {
        $("#apiLoadingIndicator").hide();
        console.log("Q2 Public API GET Response:", response);

        // Dynamic DOM updates with received JSON
        $("#productName").text(response.title).data("custom-title", response.title);
        $("#productDescription").text(response.description);
        $("#productCategory").text(`Category: ${response.category}`).show();

        if (response.price) {
          BASE_PRICE = Math.round(response.price);
          renderDesign();
        }

        setStatusBanner(`Success: Loaded "${response.title}" from DummyJSON Public API!`, "success");
        showToast("Public API product loaded successfully.");
      },
      error: function (xhr, status, error) {
        $("#apiLoadingIndicator").hide();
        console.error("Q2 Public API Error:", status, error);
        setStatusBanner(`Failed to fetch from public API: ${error || status}`, "error");
        showToast("Error retrieving external product data.");
      }
    });
  });

  // ----------------------------------------------------
  // QUESTION 3A: Backend GET Request (Express /api/product)
  // ----------------------------------------------------
  $("#fetchBackendDataBtn").on("click", function () {
    $("#apiLoadingIndicator").show();

    $.ajax({
      url: `${BACKEND_URL}/api/product`,
      type: "GET",
      dataType: "json",
      success: function (response) {
        $("#apiLoadingIndicator").hide();
        console.log("Q3 Express GET Response:", response);

        if (response.success && response.data) {
          const item = response.data;
          $("#productName").text(item.name).data("custom-title", item.name);
          $("#productDescription").text(item.description);
          $("#productCategory").text(`Category: ${item.category}`).show();
          BASE_PRICE = item.basePrice;
          renderDesign();

          setStatusBanner(`Retrieved catalog data from local Express backend (ID: ${item.id}).`, "success");
          showToast("Backend data synced.");
        }
      },
      error: function (xhr, status, error) {
        $("#apiLoadingIndicator").hide();
        console.error("Q3 GET Express Error:", status, error);
        setStatusBanner("Cannot connect to Express backend. Ensure 'node server.js' is running.", "error");
        showToast("Backend connection failed.");
      }
    });
  });

  // ----------------------------------------------------
  // QUESTION 3B: Backend POST Request (Express /api/customizations)
  // ----------------------------------------------------
  $("#submitBackendBtn").on("click", function () {
    const configPayload = {
      productName: $("#productName").text(),
      color: design.color,
      cap: design.cap,
      variant: design.variant,
      size: VARIANTS[design.variant].label,
      finish: design.finish,
      engraving: design.engraving || "None",
      font: design.font,
      foil: design.foil,
      shimmer: design.shimmer,
      price: currentPrice(),
      submittedAt: new Date().toISOString()
    };

    console.log("Q3 Express POST Sending:", configPayload);
    $("#apiLoadingIndicator").show();

    $.ajax({
      url: `${BACKEND_URL}/api/customizations`,
      type: "POST",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(configPayload), // JS object to JSON string
      dataType: "json",
      success: function (response) {
        $("#apiLoadingIndicator").hide();
        console.log("Q3 Express POST Response:", response);

        if (response.success) {
          setStatusBanner(`Server confirmed! Saved Order ID: ${response.order.orderId}`, "success");
          showToast(`Configuration saved to backend! Order: ${response.order.orderId}`);
        }
      },
      error: function (xhr, status, error) {
        $("#apiLoadingIndicator").hide();
        console.error("Q3 POST Express Error:", status, error);
        setStatusBanner(`POST request failed: ${xhr.responseJSON?.message || error}`, "error");
        showToast("Failed to save configuration to backend.");
      }
    });
  });
}