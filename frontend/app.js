(() => {
  "use strict";

  const SELLER = {
    name: "JAI CHAMMUNDA FABRICATION",
    address: "D/4, Om Society, NR. Bharat Party Plot, Rabari Colony, Amraiwadi, Ahmedabad, Gujarat - 380026",
    stateCode: "24",
    gstin: "24AYCPD6656K1ZC",
    pan: "AYCPD6656K",
    bank: "NIDHI CO-OP. BANK LTD. C.T.M, Amraiwadi, Ahmedabad-26.",
    account: "002111110008319",
    ifsc: "ICIC000NIDHI",
    contact: "+918128309214"
  };

  const ITEM_OPTIONS = [
    "SINGLE STUD CHAPLETS",
    "DOUBLE STUD CHAPLETS",
    "SINGLE STUD CHAPLETS (HEAVY STUD)",
    "SINGLE STUD CHAPLETS (SMALL CIRCLE)"
  ];

  const UNIT_OPTIONS = ["PER", "KG", "PCS", "MTR"];

  const state = {
    customers: [],
    selectedCustomerId: null,
    items: [createBlankItem()],
    totals: {
      subtotal: 0,
      freight: 0,
      cgst: 0,
      sgst: 0,
      total: 0
    }
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    setDefaultDate();
    bindEvents();
    renderItems();
    updateTotals();
    loadCustomers();
  }

  function cacheElements() {
    [
      "invoiceNo",
      "invoiceDate",
      "customerSelect",
      "customerLoadHint",
      "newCustomerButton",
      "customerEmptyState",
      "customerSummary",
      "selectedCustomerName",
      "selectedCustomerState",
      "selectedCustomerAddress",
      "selectedCustomerGstin",
      "buyerOrderNo",
      "destination",
      "itemsTableBody",
      "mobileItemsContainer",
      "addItemButton",
      "addItemButtonTop",
      "freightCharges",
      "summaryItemCount",
      "summarySubtotal",
      "summaryFreight",
      "summaryCgst",
      "summarySgst",
      "summaryTotal",
      "previewButton",
      "printButton",
      "customerDialog",
      "customerForm",
      "closeCustomerDialog",
      "cancelCustomerButton",
      "saveCustomerButton",
      "customerFormError",
      "newCustomerName",
      "newCustomerAddress",
      "newCustomerGstin",
      "newCustomerStateCode",
      "newCustomerPhone",
      "newCustomerEmail",
      "previewDialog",
      "previewPrintButton",
      "closePreviewButton",
      "invoiceContent",
      "printRoot",
      "toastRegion"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    els.customerSelect.addEventListener("change", handleCustomerChange);
    els.newCustomerButton.addEventListener("click", openCustomerDialog);
    els.closeCustomerDialog.addEventListener("click", closeCustomerDialog);
    els.cancelCustomerButton.addEventListener("click", closeCustomerDialog);
    els.customerForm.addEventListener("submit", saveCustomer);

    els.addItemButton.addEventListener("click", addItem);
    els.addItemButtonTop.addEventListener("click", addItem);

    els.freightCharges.addEventListener("input", updateTotals);

    els.previewButton.addEventListener("click", openPreview);
    els.printButton.addEventListener("click", printInvoice);
    els.previewPrintButton.addEventListener("click", printInvoice);
    els.closePreviewButton.addEventListener("click", () => els.previewDialog.close());

    els.customerDialog.addEventListener("click", (event) => {
      if (event.target === els.customerDialog) closeCustomerDialog();
    });

    els.previewDialog.addEventListener("click", (event) => {
      if (event.target === els.previewDialog) els.previewDialog.close();
    });

    window.addEventListener("resize", scalePreviewForSmallScreen);
  }

  function setDefaultDate() {
    if (!els.invoiceDate.value) {
      const today = new Date();
      const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      els.invoiceDate.value = local.toISOString().slice(0, 10);
    }
  }

  function createBlankItem() {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      description: "",
      size: "",
      hsn: "7326",
      quantity: "",
      rate: "",
      unit: "PER"
    };
  }

  async function loadCustomers() {
    setCustomerLoading(true);

    try {
      const response = await fetch("/api/customers", {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load customers.");
      }

      state.customers = Array.isArray(payload.customers) ? payload.customers : [];
      renderCustomerOptions();

      els.customerLoadHint.textContent = state.customers.length
        ? `${state.customers.length} saved customer${state.customers.length === 1 ? "" : "s"}`
        : "No saved customers yet";
    } catch (error) {
      console.error(error);
      els.customerLoadHint.textContent = "Could not load customers";
      showToast("Could not load saved customers. Refresh and try again.", "error");
    } finally {
      setCustomerLoading(false);
    }
  }

  function setCustomerLoading(isLoading) {
    els.customerSelect.disabled = isLoading;
    els.newCustomerButton.disabled = isLoading;
  }

  function renderCustomerOptions() {
    const currentValue = state.selectedCustomerId ? String(state.selectedCustomerId) : "";

    els.customerSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a customer";
    els.customerSelect.appendChild(placeholder);

    const customers = [...state.customers].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" })
    );

    customers.forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer.id;
      option.textContent = customer.gstin
        ? `${customer.name} · ${customer.gstin}`
        : customer.name;
      els.customerSelect.appendChild(option);
    });

    els.customerSelect.value = currentValue;
  }

  function handleCustomerChange() {
    const value = els.customerSelect.value;
    state.selectedCustomerId = value ? Number(value) : null;
    renderSelectedCustomer();
  }

  function getSelectedCustomer() {
    if (!state.selectedCustomerId) return null;

    return state.customers.find(
      (customer) => String(customer.id) === String(state.selectedCustomerId)
    ) || null;
  }

  function renderSelectedCustomer() {
    const customer = getSelectedCustomer();

    if (!customer) {
      els.customerEmptyState.hidden = false;
      els.customerSummary.hidden = true;
      return;
    }

    els.customerEmptyState.hidden = true;
    els.customerSummary.hidden = false;

    els.selectedCustomerName.textContent = customer.name || "Unnamed customer";
    els.selectedCustomerAddress.textContent = customer.address || "No address saved";
    els.selectedCustomerGstin.textContent = customer.gstin || "Not provided";
    els.selectedCustomerState.textContent = `State ${customer.state_code || "—"}`;
  }

  function openCustomerDialog() {
    clearCustomerForm();
    els.customerFormError.hidden = true;
    els.customerDialog.showModal();
    window.setTimeout(() => els.newCustomerName.focus(), 50);
  }

  function closeCustomerDialog() {
    if (els.customerDialog.open) els.customerDialog.close();
  }

  function clearCustomerForm() {
    els.customerForm.reset();
    els.newCustomerStateCode.value = SELLER.stateCode;
    clearInvalidStates(els.customerForm);
  }

  async function saveCustomer(event) {
    event.preventDefault();
    els.customerFormError.hidden = true;
    clearInvalidStates(els.customerForm);

    const customer = {
      name: els.newCustomerName.value.trim(),
      address: els.newCustomerAddress.value.trim(),
      gstin: els.newCustomerGstin.value.trim().toUpperCase(),
      state_code: els.newCustomerStateCode.value.trim(),
      phone: els.newCustomerPhone.value.trim(),
      email: els.newCustomerEmail.value.trim().toLowerCase()
    };

    const error = validateCustomer(customer);

    if (error) {
      showCustomerFormError(error.message);
      if (error.element) {
        error.element.setAttribute("aria-invalid", "true");
        error.element.focus();
      }
      return;
    }

    setSaveCustomerLoading(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(customer)
      });

      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.customer) {
        throw new Error(payload.error || "Unable to save customer.");
      }

      state.customers.push(payload.customer);
      state.selectedCustomerId = payload.customer.id;
      renderCustomerOptions();
      renderSelectedCustomer();
      closeCustomerDialog();
      showToast(`Saved ${payload.customer.name}.`, "success");
    } catch (error) {
      console.error(error);
      showCustomerFormError(error.message || "Unable to save customer.");
    } finally {
      setSaveCustomerLoading(false);
    }
  }

  function validateCustomer(customer) {
    if (!customer.name) {
      return { message: "Customer name is required.", element: els.newCustomerName };
    }

    if (!/^\d{2}$/.test(customer.state_code)) {
      return { message: "State code must contain exactly 2 digits.", element: els.newCustomerStateCode };
    }

    if (customer.email && !els.newCustomerEmail.validity.valid) {
      return { message: "Enter a valid email address.", element: els.newCustomerEmail };
    }

    return null;
  }

  function showCustomerFormError(message) {
    els.customerFormError.textContent = message;
    els.customerFormError.hidden = false;
  }

  function setSaveCustomerLoading(isLoading) {
    els.saveCustomerButton.disabled = isLoading;
    els.cancelCustomerButton.disabled = isLoading;
    els.closeCustomerDialog.disabled = isLoading;
    els.saveCustomerButton.textContent = isLoading ? "Saving…" : "Save customer";
  }

  function clearInvalidStates(container) {
    container.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
      element.removeAttribute("aria-invalid");
    });
  }

  function addItem() {
    state.items.push(createBlankItem());
    renderItems();
    updateTotals();

    const index = state.items.length - 1;
    const target = document.querySelector(`[data-item-index="${index}"] select, [data-mobile-item-index="${index}"] select`);
    if (target) target.focus();
  }

  function removeItem(index) {
    if (state.items.length === 1) {
      showToast("An invoice needs at least one item row.", "warning");
      return;
    }

    state.items.splice(index, 1);
    renderItems();
    updateTotals();
  }

  function updateItem(index, key, value) {
    const item = state.items[index];
    if (!item) return;

    item[key] = value;
    updateTotals();

    if (key === "quantity" || key === "rate") {
      updateRenderedAmount(index);
    }
  }

  function renderItems() {
    renderDesktopItems();
    renderMobileItems();
    updateItemCount();
  }

  function renderDesktopItems() {
    els.itemsTableBody.innerHTML = "";

    state.items.forEach((item, index) => {
      const row = document.createElement("tr");
      row.dataset.itemIndex = String(index);

      row.innerHTML = `
        <td class="cell-description">${descriptionSelectHtml(item.description, index, false)}</td>
        <td class="cell-size"><input data-key="size" type="text" value="${escapeAttribute(item.size)}" aria-label="Size for item ${index + 1}" placeholder="Size"></td>
        <td class="cell-hsn"><input data-key="hsn" type="text" value="${escapeAttribute(item.hsn)}" aria-label="HSN or SAC for item ${index + 1}" inputmode="numeric"></td>
        <td class="cell-qty"><input data-key="quantity" type="number" min="0" step="any" value="${escapeAttribute(item.quantity)}" aria-label="Quantity for item ${index + 1}" placeholder="0"></td>
        <td class="cell-rate"><input data-key="rate" type="number" min="0" step="0.01" value="${escapeAttribute(item.rate)}" aria-label="Rate for item ${index + 1}" placeholder="0.00"></td>
        <td class="cell-unit">${unitSelectHtml(item.unit, index, false)}</td>
        <td class="cell-amount amount-cell" data-amount-for="${index}">${formatMoney(calculateItemAmount(item))}</td>
        <td class="cell-action"><button class="row-remove" type="button" data-remove-index="${index}" aria-label="Remove item ${index + 1}" ${state.items.length === 1 ? "disabled" : ""}>×</button></td>
      `;

      bindItemRowEvents(row, index);
      els.itemsTableBody.appendChild(row);
    });
  }

  function renderMobileItems() {
    els.mobileItemsContainer.innerHTML = "";

    state.items.forEach((item, index) => {
      const card = document.createElement("section");
      card.className = "mobile-item-card";
      card.dataset.mobileItemIndex = String(index);
      card.setAttribute("aria-label", `Item ${index + 1}`);

      card.innerHTML = `
        <div class="mobile-item-card__header">
          <strong>Item ${index + 1}</strong>
          <button class="button button--danger" type="button" data-remove-index="${index}" ${state.items.length === 1 ? "disabled" : ""}>Remove</button>
        </div>

        <div class="mobile-item-grid">
          <div class="field field--full">
            <label for="m-desc-${index}">Description</label>
            ${descriptionSelectHtml(item.description, index, true)}
          </div>

          <div class="field">
            <label for="m-size-${index}">Size</label>
            <input id="m-size-${index}" data-key="size" type="text" value="${escapeAttribute(item.size)}" placeholder="e.g. 22">
          </div>

          <div class="field">
            <label for="m-hsn-${index}">HSN/SAC</label>
            <input id="m-hsn-${index}" data-key="hsn" type="text" value="${escapeAttribute(item.hsn)}" inputmode="numeric">
          </div>

          <div class="field">
            <label for="m-qty-${index}">Quantity</label>
            <input id="m-qty-${index}" data-key="quantity" type="number" min="0" step="any" value="${escapeAttribute(item.quantity)}" placeholder="0">
          </div>

          <div class="field">
            <label for="m-rate-${index}">Rate</label>
            <input id="m-rate-${index}" data-key="rate" type="number" min="0" step="0.01" value="${escapeAttribute(item.rate)}" placeholder="0.00">
          </div>

          <div class="field">
            <label for="m-unit-${index}">Unit</label>
            ${unitSelectHtml(item.unit, index, true)}
          </div>

          <div class="field">
            <span class="field__label">Amount</span>
            <div class="mobile-item-amount">
              <span>Total</span>
              <strong data-mobile-amount-for="${index}">${formatMoney(calculateItemAmount(item))}</strong>
            </div>
          </div>
        </div>
      `;

      bindItemRowEvents(card, index);
      els.mobileItemsContainer.appendChild(card);
    });
  }

  function descriptionSelectHtml(value, index, mobile) {
    const id = mobile ? `m-desc-${index}` : "";
    const options = [
      `<option value="">Select item</option>`,
      ...ITEM_OPTIONS.map((option) =>
        `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`
      )
    ].join("");

    return `<select ${id ? `id="${id}"` : ""} data-key="description" aria-label="${mobile ? "" : `Description for item ${index + 1}`}">${options}</select>`;
  }

  function unitSelectHtml(value, index, mobile) {
    const id = mobile ? `m-unit-${index}` : "";
    const options = UNIT_OPTIONS.map((option) =>
      `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`
    ).join("");

    return `<select ${id ? `id="${id}"` : ""} data-key="unit" aria-label="${mobile ? "" : `Unit for item ${index + 1}`}">${options}</select>`;
  }

  function bindItemRowEvents(container, index) {
    container.querySelectorAll("[data-key]").forEach((input) => {
      const eventName = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(eventName, (event) => {
        updateItem(index, event.currentTarget.dataset.key, event.currentTarget.value);
      });
    });

    const removeButton = container.querySelector("[data-remove-index]");
    if (removeButton) {
      removeButton.addEventListener("click", () => removeItem(index));
    }
  }

  function updateRenderedAmount(index) {
    const amount = formatMoney(calculateItemAmount(state.items[index]));

    document.querySelectorAll(`[data-amount-for="${index}"]`).forEach((node) => {
      node.textContent = amount;
    });

    document.querySelectorAll(`[data-mobile-amount-for="${index}"]`).forEach((node) => {
      node.textContent = amount;
    });
  }

  function calculateItemAmount(item) {
    const quantity = safeNumber(item.quantity);
    const rate = safeNumber(item.rate);
    return quantity * rate;
  }

  function updateTotals() {
    const subtotal = state.items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
    const freight = Math.max(0, safeNumber(els.freightCharges.value));
    const taxable = subtotal + freight;
    const cgst = taxable * 0.09;
    const sgst = taxable * 0.09;
    const total = taxable + cgst + sgst;

    state.totals = { subtotal, freight, cgst, sgst, total };

    els.summarySubtotal.textContent = formatMoney(subtotal);
    els.summaryFreight.textContent = formatMoney(freight);
    els.summaryCgst.textContent = formatMoney(cgst);
    els.summarySgst.textContent = formatMoney(sgst);
    els.summaryTotal.textContent = formatMoney(total);

    updateItemCount();
  }

  function updateItemCount() {
    const count = state.items.length;
    els.summaryItemCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
  }

  function validateInvoice() {
    clearInvoiceInvalidStates();

    if (!els.invoiceNo.value.trim()) {
      return invalid("Enter an invoice number.", els.invoiceNo);
    }

    if (!els.invoiceDate.value) {
      return invalid("Select an invoice date.", els.invoiceDate);
    }

    if (!getSelectedCustomer()) {
      return invalid("Select a customer before generating the invoice.", els.customerSelect);
    }

    for (let index = 0; index < state.items.length; index += 1) {
      const item = state.items[index];

      if (!item.description) {
        return invalid(`Select a description for item ${index + 1}.`, findDesktopItemControl(index, "description"));
      }

      if (safeNumber(item.quantity) <= 0) {
        return invalid(`Enter a quantity greater than 0 for item ${index + 1}.`, findDesktopItemControl(index, "quantity"));
      }

      if (safeNumber(item.rate) <= 0) {
        return invalid(`Enter a rate greater than 0 for item ${index + 1}.`, findDesktopItemControl(index, "rate"));
      }
    }

    return true;
  }

  function invalid(message, element) {
    if (element) {
      element.setAttribute("aria-invalid", "true");
      element.focus({ preventScroll: true });
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    showToast(message, "error");
    return false;
  }

  function clearInvoiceInvalidStates() {
    document.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
      if (!els.customerDialog.contains(element)) element.removeAttribute("aria-invalid");
    });
  }

  function findDesktopItemControl(index, key) {
    return document.querySelector(`[data-item-index="${index}"] [data-key="${key}"]`)
      || document.querySelector(`[data-mobile-item-index="${index}"] [data-key="${key}"]`);
  }

  function openPreview() {
    if (!validateInvoice()) return;

    buildInvoiceDocument();
    els.previewDialog.showModal();
    requestAnimationFrame(scalePreviewForSmallScreen);
  }

  function printInvoice() {
    if (!validateInvoice()) {
      return;
    }


    /*
     * Build the latest invoice in both:
     * 1. invoiceContent -> screen preview
     * 2. printRoot     -> print-only document
     */
    buildInvoiceDocument();


    /*
     * IMPORTANT:
     * A modal <dialog> is placed in the browser's top layer.
     * It must be closed before printing.
     */
    if (els.previewDialog.open) {
      els.previewDialog.close();
    }


    const previousTitle = document.title;


    const customer = getSelectedCustomer();


    const invoiceNo = sanitizeFilenamePart(
      els.invoiceNo.value.trim() || "invoice"
    );


    const buyerName = sanitizeFilenamePart(
      customer?.name || "customer"
    );


    document.title =
      `${buyerName}_(Invoice_${invoiceNo})`;


    /*
     * Restore the website title after printing.
     */
    const restoreTitle = () => {
      document.title = previousTitle;


      window.removeEventListener(
        "afterprint",
        restoreTitle
      );
    };


    window.addEventListener(
      "afterprint",
      restoreTitle
    );


    /*
     * Print THIS document.
     *
     * @media print in app.css hides everything
     * except #printRoot.
     */
    window.print();


    /*
     * Fallback for browsers where afterprint
     * behaves inconsistently.
     */
    window.setTimeout(() => {
      if (document.title !== previousTitle) {
        restoreTitle();
      }
    }, 1500);
  }

  function scalePreviewForSmallScreen() {
    const invoice = els.invoiceContent;
    if (!invoice || !els.previewDialog.open) return;

    invoice.style.transform = "";
    invoice.style.marginBottom = "";

    const available = Math.max(280, els.previewDialog.clientWidth - 36);
    const natural = invoice.getBoundingClientRect().width;

    if (available < natural) {
      const scale = available / natural;
      invoice.style.transform = `scale(${scale})`;
      invoice.style.marginBottom = `${-(invoice.offsetHeight * (1 - scale))}px`;
    }
  }

  function buildInvoiceDocument() {
    updateTotals();

    const customer = getSelectedCustomer();
    const date = formatInvoiceDate(els.invoiceDate.value);
    const orderNo = els.buyerOrderNo.value.trim() || "-";
    const destination = els.destination.value.trim() || "-";

    const itemRows = state.items.map((item, index) => {
      const amount = calculateItemAmount(item);

      return `
        <tr>
          <td>${index + 1}</td>
          <td class="text-left">${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.size || "")}</td>
          <td>${escapeHtml(item.hsn || "")}</td>
          <td>${escapeHtml(String(item.quantity || ""))}</td>
          <td>${formatNumber(safeNumber(item.rate))}</td>
          <td>${escapeHtml(item.unit || "PER")}</td>
          <td>${formatNumber(amount)}</td>
        </tr>
      `;
    }).join("");

    const invoiceMarkup = `
      <header>
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-company">${SELLER.name}</div>
        <div class="invoice-company-address">${SELLER.address}</div>
      </header>

      <div class="invoice-grid-2">
        ${invoiceKvBox([
          ["STATE Code", SELLER.stateCode],
          ["GSTIN", SELLER.gstin]
        ])}
        ${invoiceKvBox([
          ["Invoice no.", escapeHtml(els.invoiceNo.value.trim())],
          ["Date", date]
        ])}
      </div>

      <div class="invoice-grid-2">
        ${invoiceKvBox([
          ["PAN No.", SELLER.pan]
        ])}
        ${invoiceKvBox([
          ["Buyer's order no.", escapeHtml(orderNo)],
          ["Destination", escapeHtml(destination)]
        ])}
      </div>

      <section class="invoice-buyer-card">
        <div class="invoice-buyer-main">
          <div class="invoice-section-caption">Buyer Details</div>
          <div class="invoice-buyer-name">${escapeHtml(customer.name)}</div>
          <div class="invoice-buyer-address">${escapeHtml(customer.address || "")}</div>
        </div>

        <div class="invoice-buyer-meta">
          <div class="invoice-buyer-meta-row">
            <span>State Code</span>
            <strong>${escapeHtml(customer.state_code || "-")}</strong>
          </div>
          <div class="invoice-buyer-meta-row">
            <span>GSTIN/UID</span>
            <strong>${escapeHtml(customer.gstin || "-")}</strong>
          </div>
        </div>
      </section>

      <section class="invoice-items-section">
        <table class="invoice-items">
          <thead>
            <tr>
              <th>SR.NO</th>
              <th>Description of Goods</th>
              <th>Size (MM)</th>
              <th>HSN/SAC Code</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Unit</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="invoice-items-fill" aria-hidden="true"></div>
      </section>

      <div class="invoice-settlement">
        <div class="invoice-bank-box">
          <div class="invoice-bank-label">Bank Details</div>
          <div class="invoice-bank-content">
            <div>${SELLER.bank}</div>
            <div class="invoice-bank-line"><span>Account No.</span><strong>${SELLER.account}</strong></div>
            <div class="invoice-bank-line"><span>IFSC Code</span><strong>${SELLER.ifsc}</strong></div>
            <div class="invoice-bank-line"><span>Contact No.</span><strong>${SELLER.contact}</strong></div>
            <div>ONLINE PAYMENT AVAILABLE</div>
          </div>
        </div>

        <div class="invoice-total-box">
          ${invoiceTotalLine("Subtotal", state.totals.subtotal)}
          ${state.totals.freight > 0 ? invoiceTotalLine("Freight", state.totals.freight) : ""}
          ${invoiceTotalLine("Add CGST @ 9%", state.totals.cgst)}
          ${invoiceTotalLine("Add SGST @ 9%", state.totals.sgst)}
          <div class="invoice-total-line invoice-total-line--final">
            <span>TOTAL</span>
            <strong>${formatMoney(state.totals.total)}</strong>
          </div>
        </div>
      </div>

      <div class="invoice-note-box">
        <strong>Amount (In Words):</strong> - ${numberToWords(state.totals.total)}
      </div>

      <div class="invoice-note-box">
        <strong>CERTIFICATE:-</strong><br>
        Certified that the JAI CHAMMUNDA FABRICATION, AHMEDABAD are registered manufacturers in this state.<br>
        Certified that Particulars given above are true and correct and amount indicated represent the price actually charged and there is no additional consideration directly or indirectly from the buyer.<br>
        Interest @18% P.A. Will be Charged on Bills not paid within due date, as per MSMED Act 2006.
      </div>

      <div class="invoice-signature">
        <div class="invoice-signature__box">
          <strong>JAI CHAMMUNDA FABRICATION</strong>
          <div class="invoice-signature__label">Authorised Signature</div>
        </div>
      </div>

      <div class="invoice-footer">This is computer generated Invoice.</div>
    `;

    els.invoiceContent.innerHTML = invoiceMarkup;
    els.printRoot.innerHTML = `<article class="invoice-document">${invoiceMarkup}</article>`;
  }

  function invoiceKvBox(rows, allowHtml = false) {
    const html = rows.map(([label, value]) => `
      <tr>
        <td class="invoice-kv__label">${escapeHtml(label)}</td>
        <td>${allowHtml ? value : escapeHtml(String(value))}</td>
      </tr>
    `).join("");

    return `<div class="invoice-box"><table class="invoice-kv">${html}</table></div>`;
  }

  function invoiceTotalLine(label, amount) {
    return `
      <div class="invoice-total-line">
        <span>${escapeHtml(label)}</span>
        <strong>${formatMoney(amount)}</strong>
      </div>
    `;
  }

  function formatMoney(value) {
    return `₹${formatNumber(value)}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function safeNumber(value) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatInvoiceDate(value) {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
  }

  function sanitizeFilenamePart(value) {
    return String(value)
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80) || "invoice";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast${type !== "info" ? ` toast--${type}` : ""}`;
    toast.textContent = message;

    els.toastRegion.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 4200);
  }

  function numberToWords(amount) {
    const rounded = Math.round(safeNumber(amount));
    if (rounded === 0) return "ZERO ONLY";

    const ones = [
      "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
      "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
      "SEVENTEEN", "EIGHTEEN", "NINETEEN"
    ];

    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    function underHundred(number) {
      if (number < 20) return ones[number];
      const ten = tens[Math.floor(number / 10)];
      const one = ones[number % 10];
      return `${ten}${one ? ` ${one}` : ""}`;
    }

    function underThousand(number) {
      const hundred = Math.floor(number / 100);
      const rest = number % 100;
      return [
        hundred ? `${ones[hundred]} HUNDRED` : "",
        rest ? underHundred(rest) : ""
      ].filter(Boolean).join(" ");
    }

    const parts = [];
    let remaining = rounded;

    const crore = Math.floor(remaining / 10000000);
    if (crore) {
      parts.push(`${underThousand(crore)} CRORE`);
      remaining %= 10000000;
    }

    const lakh = Math.floor(remaining / 100000);
    if (lakh) {
      parts.push(`${underHundred(lakh)} LAKH`);
      remaining %= 100000;
    }

    const thousand = Math.floor(remaining / 1000);
    if (thousand) {
      parts.push(`${underHundred(thousand)} THOUSAND`);
      remaining %= 1000;
    }

    if (remaining) {
      parts.push(underThousand(remaining));
    }

    return `${parts.join(" ")} ONLY`;
  }
})();
