const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");

router.post("/", async (req, res) => {
  try {
    const newCart = await Cart.create({});
    res.status(201).json({ cart: newCart });
  } catch (error) {
    res.status(400).json({ message: "Error al crear el carrito" });
  }
});

router.get("/:cid", async (req, res) => {
  const cid = req.params.cid;

  try {
    const cart = await Cart.findById(cid).populate("products.product");
    if (cart) {
      res.render("carts/cartDetail", { cartId: cid, products: cart.products });
    } else {
      res.status(404).json({ message: "Carrito no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al cargar el carrito" });
  }
});

router.post("/:cid/product/:pid", async (req, res) => {
  const cid = req.params.cid;
  const pid = req.params.pid;
  const quantity = req.body.quantity || 1;

  try {
    const cart = await Cart.findById(cid);
    const product = await Product.findById(pid);

    if (!cart || !product) {
      return res
        .status(404)
        .json({ message: "Carrito o producto no encontrado" });
    }

    const existingProduct = cart.products.find((item) =>
      item.product.equals(pid)
    );

    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ product: pid, quantity });
    }

    await cart.save();
    res.status(201).json({ cart });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al agregar el producto al carrito" });
  }
});

router.delete("/:cid/products/:pid", async (req, res) => {
  const cid = req.params.cid;
  const pid = req.params.pid;

  try {
    const cart = await Cart.findById(cid);

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    cart.products = cart.products.filter((item) => !item.product.equals(pid));
    await cart.save();

    res.json({ message: "Producto eliminado del carrito correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto del carrito" });
  }
});

router.put("/:cid", async (req, res) => {
  const cid = req.params.cid;
  const newProducts = req.body.products;

  try {
    const cart = await Cart.findById(cid);

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    cart.products = newProducts;
    await cart.save();

    res.json({ message: "Carrito actualizado correctamente", cart });
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el carrito" });
  }
});

router.delete("/:cid", async (req, res) => {
  const cid = req.params.cid;

  try {
    const cart = await Cart.findById(cid);

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    cart.products = [];
    await cart.save();

    res.json({ message: "Productos eliminados del carrito correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar los productos del carrito" });
  }
});

module.exports = router;
