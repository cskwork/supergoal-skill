export function calculateInvoice(order) {
  let subtotal = 0;
  for (let i = 0; i < order.items.length; i++) {
    subtotal += order.items[i].price * order.items[i].qty;
  }
  let discount = 0;
  if (order.coupon) {
    if (order.coupon === 'SAVE10') {
      discount = subtotal * 0.1;
    } else if (order.coupon === 'SAVE20') {
      if (subtotal >= 100) {
        discount = subtotal * 0.2;
      } else {
        discount = subtotal * 0.1;
      }
    } else if (order.coupon === 'HALF' && order.vip) {
      discount = subtotal * 0.5;
    }
  }
  if (order.vip && discount < subtotal * 0.05) {
    discount = subtotal * 0.05;
  }
  let taxed = subtotal - discount;
  let tax = 0;
  if (order.region === 'US') {
    tax = taxed * 0.07;
  } else if (order.region === 'EU') {
    tax = taxed * 0.2;
  } else {
    tax = taxed * 0.1;
  }
  let shipping = 0;
  if (taxed < 50) {
    shipping = 7.5;
  } else if (taxed < 100) {
    shipping = 3;
  } else {
    shipping = 0;
  }
  if (order.express) {
    shipping += 12;
  }
  let total = taxed + tax + shipping;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
