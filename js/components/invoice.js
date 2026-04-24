/**
 * Invoice - Render invoice for a meter record
 */
const Invoice = (() => {
    function render(meter, roomName, houseName, tenantName) {
        const rates = meter.ratesSnapshot || {};
        const electricUsage = (meter.electricNew || 0) - (meter.electricOld || 0);
        const waterUsage = (meter.waterNew || 0) - (meter.waterOld || 0);
        const electricCost = electricUsage * (rates.electric || 0);
        const waterCost = waterUsage * (rates.water || 0);

        return `
            <div class="invoice fade-in" id="invoice-printable">
                <div class="invoice-header">
                    <h2>🏠 ${houseName}</h2>
                    <div class="month">${Store.formatMonth(meter.month)}</div>
                </div>

                <div style="margin-bottom:12px;">
                    <div class="invoice-row">
                        <span class="label">📍 Phòng</span>
                        <span class="value">${roomName}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">👤 Người thuê</span>
                        <span class="value">${tenantName || '—'}</span>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="invoice-row">
                    <span class="label">🏠 Tiền phòng</span>
                    <span class="value">${Store.formatCurrency(rates.rent || 0)}</span>
                </div>

                <div class="invoice-row">
                    <span class="label">⚡ Tiền điện</span>
                    <span class="value">${Store.formatCurrency(electricCost)}</span>
                </div>
                <div class="invoice-row detail">
                    <span>${meter.electricOld} → ${meter.electricNew} = ${electricUsage} kWh × ${Store.formatCurrency(rates.electric || 0)}</span>
                </div>

                <div class="invoice-row">
                    <span class="label">💧 Tiền nước</span>
                    <span class="value">${Store.formatCurrency(waterCost)}</span>
                </div>
                <div class="invoice-row detail">
                    <span>${meter.waterOld} → ${meter.waterNew} = ${waterUsage} m³ × ${Store.formatCurrency(rates.water || 0)}</span>
                </div>

                <div class="invoice-row">
                    <span class="label">🗑️ Tiền rác</span>
                    <span class="value">${Store.formatCurrency(rates.garbage || 0)}</span>
                </div>

                <div class="invoice-row">
                    <span class="label">📶 Internet</span>
                    <span class="value">${Store.formatCurrency(rates.internet || 0)}</span>
                </div>

                <div class="invoice-total">
                    <span>TỔNG CỘNG</span>
                    <span class="value">${Store.formatCurrency(meter.totalAmount || 0)}</span>
                </div>

                <div style="text-align:center; margin-top:16px;">
                    <span class="status-badge ${meter.paid ? 'paid' : 'unpaid'}">
                        ${meter.paid ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                    </span>
                </div>
            </div>
        `;
    }

    function printInvoice() {
        window.print();
    }

    async function shareInvoice(meter, roomName, houseName, tenantName) {
        const rates = meter.ratesSnapshot || {};
        const electricUsage = (meter.electricNew || 0) - (meter.electricOld || 0);
        const waterUsage = (meter.waterNew || 0) - (meter.waterOld || 0);
        const electricCost = electricUsage * (rates.electric || 0);
        const waterCost = waterUsage * (rates.water || 0);

        const text = `🏠 ${houseName}
📍 ${roomName} - ${Store.formatMonth(meter.month)}
👤 ${tenantName || '—'}
─────────────────
🏠 Tiền phòng: ${Store.formatCurrency(rates.rent || 0)}
⚡ Điện: ${electricUsage} kWh = ${Store.formatCurrency(electricCost)}
💧 Nước: ${waterUsage} m³ = ${Store.formatCurrency(waterCost)}
🗑️ Rác: ${Store.formatCurrency(rates.garbage || 0)}
📶 Internet: ${Store.formatCurrency(rates.internet || 0)}
─────────────────
💰 TỔNG: ${Store.formatCurrency(meter.totalAmount || 0)}
${meter.paid ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: `Hóa đơn ${roomName}`, text: text });
            } catch (e) {
                // User cancelled
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(text);
                App.showToast('Đã sao chép hóa đơn!', 'success');
            } catch (e) {
                App.showToast('Không thể chia sẻ', 'error');
            }
        }
    }

    return { render, printInvoice, shareInvoice };
})();
