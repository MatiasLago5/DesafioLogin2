const express = require("express");
const router = express.Router();
const ProductManager = require("../productManager");
const productManager = new ProductManager();
const product = require("../models/product")

router.get("/products", async (req, res) => {
  const responseFormat = req.accepts(["html", "json"]);
  
  try {
    const DEFAULT_LIMIT = 10;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const sort = req.query.sort === "asc" ? 1 : req.query.sort === "desc" ? -1 : null;
    const query = req.query.query || "";

    const totalCount = await product.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    let productsQuery = Product.find({ title: { $regex: query, $options: "i" } })
      .sort({ price: sort })
      .skip((page - 1) * limit)
      .limit(limit);

    const products = await productsQuery.exec();

    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    const hasPrevPage = prevPage !== null;
    const hasNextPage = nextPage !== null;
    const prevLink = prevPage ? `/api/products?page=${prevPage}&limit=${limit}&sort=${sort}&query=${query}` : null;
    const nextLink = nextPage ? `/api/products?page=${nextPage}&limit=${limit}&sort=${sort}&query=${query}` : null;

    if (responseFormat === "json") {
      res.status(200).json({
        status: "success",
        payload: products,
        totalPages,
        prevPage,
        nextPage,
        page,
        hasPrevPage,
        hasNextPage,
        prevLink,
        nextLink,
      });
    } else {
      res.render("products/productsList", { products, user });
    }
  } catch (error) {
    res.status(404).json({ status: "error", message: "Error al cargar los productos" });
  }
});



router.post("/", async (req, res) => {
  try {
    const newProduct = await productManager.createProduct(req.body);
    res.status(200).json({ product: newProduct });
  } catch (error) {
    res.status(404).json({ message: "Error al crear el producto" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const product = await productManager.getProductById(id);
    if (product) {
      res.render("products/productDetail", product);
    } else {
      res.status(404).json({ message: "Producto no encontrado" });
    }
  } catch (error) {
    res.status(404).json({ message: "Error al cargar el producto" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await productManager.updateProduct(id, req.body);
      res.status(200).json({ product: updatedProduct });
    } catch (error) {
    res.status(400).json({ message: "Error al actualizar el producto" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await productManager.deleteProduct(id);
    res.status(200).json({ message: "Producto eliminado", product: deletedProduct })
  } catch (error) {
    res.status(404).json({ message: "Error al eliminar el producto" });
  }
});

module.exports = router;
