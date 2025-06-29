const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');

const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || "I2RAE5T6",
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "F1YER2MAHGNO5YSW6A2ZJPTX2R5V607Z",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment/vnpay-return",
};

function sortObject(o) {
  const sorted = {};
  const keys = Object.keys(o).sort();
  
  for (const key of keys) {
    if (o[key] !== null && o[key] !== undefined && o[key] !== '') {
      sorted[key] = encodeURIComponent(o[key]).replace(/%20/g, "+");
    }
  }
  
  return sorted;
}

function createVnpayPaymentUrl(orderId, amount, ipAddr) {
  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  const txnRef = moment(date).format('HHmmss') + '_' + orderId;

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = txnRef;
  vnp_Params['vnp_OrderInfo'] = `ORDER:${orderId}`;
  vnp_Params['vnp_OrderType'] = '200000';
  vnp_Params['vnp_Amount'] = Math.round(amount * 100);
  vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  // Remove empty values
  Object.keys(vnp_Params).forEach(key => {
    if (vnp_Params[key] === null || vnp_Params[key] === undefined || vnp_Params[key] === '') {
      delete vnp_Params[key];
    }
  });

  // Sort parameters and encode values
  vnp_Params = sortObject(vnp_Params);

  // Create raw signature string (without encoding)
  const signData = Object.keys(vnp_Params)
    .map(key => `${key}=${vnp_Params[key]}`)
    .join('&');

  // Create secure hash
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

  // Add secure hash to params
  vnp_Params['vnp_SecureHash'] = signed;

  // Create final payment URL
  const finalUrl = vnpayConfig.vnp_Url + '?' + Object.keys(vnp_Params)
    .map(key => `${key}=${vnp_Params[key]}`)
    .join('&');
  
  console.log('Generated URL:', finalUrl);
  console.log('Raw sign data:', signData);
  console.log('Generated hash:', signed);
  console.log('OrderId being sent:', orderId);
  
  return finalUrl;
}

module.exports = {
  createVnpayPaymentUrl,
  vnpayConfig,
  sortObject
}; 