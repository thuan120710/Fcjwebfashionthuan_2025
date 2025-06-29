class OrderItem {
  constructor({ productId, name, quantity, price, image }) {
    this.productId = productId;
    this.name = name;
    this.quantity = quantity;
    this.price = price;
    this.image = image;
  }
}

module.exports = OrderItem;
