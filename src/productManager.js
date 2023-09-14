const product = require("./models/product");

class ProductManager {
  async getProducts() {
    try {
      const products = await product.find();
      return products;
    } catch (error) {
      return error
    }
  }

  async createProduct(obj) {
    try {
      const newProduct = await product.create(obj);
      return newProduct;
    } catch (error) {
      return error
    }
  }

  async getProductById(id) {
    try {
      const product = await product.findById(id);
      if (product) {
        return product;
      } else {
        throw new Error("Producto no encontrado");
      }
    } catch (error) {
      return error
    }
  }

  async deleteProduct(id) {
    try {
      const deleteProduct = await product.findByIdAndDelete(id);
      return deleteProduct
    } catch (error) {
      return error
    }
  }
}

module.exports = ProductManager;
