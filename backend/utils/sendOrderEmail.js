const transporter = require("../config/nodemailer");

function formatCurrency(num) {
  return Number(num || 0).toLocaleString("vi-VN") + "đ";
}

const sendOrderEmail = async (userEmail, order) => {
  let itemsHtml = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding:8px; border:1px solid #eee; text-align:left;">${
        item.name
      }</td>
      <td style="padding:8px; border:1px solid #eee; text-align:right;">${formatCurrency(
        item.price
      )}</td>
      <td style="padding:8px; border:1px solid #eee; text-align:center;">${
        item.quantity
      }</td>
      <td style="padding:8px; border:1px solid #eee; text-align:right;">${formatCurrency(
        item.price * item.quantity
      )}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif; background:#f9f9f9; padding:24px;">
      <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; box-shadow:0 2px 8px #eee; padding:32px;">
        <div style="text-align:center; margin-bottom:24px;">
          <img src='https://i.imgur.com/0y0y0y0.png' alt='Shop Logo' style='height:48px; margin-bottom:8px;' onerror="this.style.display='none'"/>
          <h2 style="color:#1976d2; margin:0;">Xác nhận đơn hàng thành công!</h2>
        </div>
        <p>Xin chào <b>${order.shippingAddress.fullName}</b>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại <b>Shop Quần Áo</b>. Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>
        <div style="margin:24px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:15px;">
            <thead>
              <tr style="background:#f0f4f8; color:#1976d2;">
                <th style="padding:10px; border:1px solid #eee; text-align:left;">Sản phẩm</th>
                <th style="padding:10px; border:1px solid #eee; text-align:right;">Giá</th>
                <th style="padding:10px; border:1px solid #eee; text-align:center;">Số lượng</th>
                <th style="padding:10px; border:1px solid #eee; text-align:right;">Tổng</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        <div style="margin:24px 0;">
          <table style="width:100%; font-size:15px;">
            <tr>
              <td style="padding:4px 0;">Tạm tính:</td>
              <td style="padding:4px 0; text-align:right;">${formatCurrency(
                order.itemsPrice
              )}</td>
            </tr>
            ${
              order.discount > 0
                ? `<tr><td style='color:#d32f2f;'>Giảm giá:</td><td style='color:#d32f2f; text-align:right;'>- ${formatCurrency(
                    order.discount
                  )}</td></tr>`
                : ""
            }
            <tr>
              <td style="padding:4px 0;">Phí vận chuyển:</td>
              <td style="padding:4px 0; text-align:right;">${formatCurrency(
                order.shippingPrice
              )}</td>
            </tr>
            ${
              order.shippingDiscount > 0
                ? `<tr><td style='color:#1976d2;'>Giảm phí vận chuyển:</td><td style='color:#1976d2; text-align:right;'>- ${formatCurrency(
                    order.shippingDiscount
                  )}</td></tr>`
                : ""
            }
            <tr>
              <td style="padding:4px 0;">Thuế:</td>
              <td style="padding:4px 0; text-align:right;">${formatCurrency(
                order.taxPrice
              )}</td>
            </tr>
            <tr style="font-weight:bold; font-size:17px;">
              <td style="padding:8px 0; color:#1976d2;">Tổng cộng:</td>
              <td style="padding:8px 0; color:#1976d2; text-align:right;">${formatCurrency(
                order.totalPrice
              )}</td>
            </tr>
          </table>
        </div>
        <div style="margin:24px 0;">
          <b>Địa chỉ giao hàng:</b><br/>
          ${order.shippingAddress.address}, ${
    order.shippingAddress.district
  }, ${order.shippingAddress.city}<br/>
          <b>Số điện thoại:</b> ${order.shippingAddress.phoneNumber}
        </div>
        <div style="margin:24px 0;">
          <b>Phương thức thanh toán:</b> ${
            order.paymentMethod === "cod"
              ? "Thanh toán khi nhận hàng"
              : "Chuyển khoản"
          }<br/>
          <b>Trạng thái:</b> ${order.status}
        </div>
        <div style="margin:32px 0 0 0; text-align:center;">
          <p style="color:#388e3c; font-size:16px;">Cảm ơn bạn đã tin tưởng và mua sắm tại Shop Quần Áo!</p>
          <p style="font-size:14px; color:#888;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hỗ trợ: <a href="mailto:support@shopquanao.com">support@shopquanao.com</a></p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    to: userEmail,
    subject: `Xác nhận đơn hàng #${order.id}`,
    html,
  });
};

module.exports = sendOrderEmail;
