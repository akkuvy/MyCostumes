const { response } = require("express");
var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

router.get("/", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});
router.get("/add-product", (req, res) => {
  res.render("admin/add-product",{admin:true});
});
router.post("/add-product", (req, res) => {
  console.log(req.body);
  productHelpers.addProduct(req.body, (id) => {
    console.log(req.files.image);
    let image = req.files.image;
    image.mv("./public/product-images/" + id + ".jpeg", (err) => {
      if (!err) {
        res.render("admin/add-product");
      } else {
        console.log("error", err);
      }
    });
  });
});
router.get("/delete-products/:id", (req, res) => {
  let id = req.params.id;
  console.log(id);
  productHelpers.deleteProduct(id).then(response);
  res.redirect("/admin");
});
router.get("/edit-products/:id", (req, res) => {
  let id = req.params.id;
  let products = productHelpers.getProduct(id).then((products) => {
    res.render("admin/edit-product", { products,admin:true });
  });
});
router.post("/edit-products/:id", (req, res) => {
  id = req.params.id;
  console.log(req.body);
  productHelpers.editProducts(id, req.body).then((response) => {
    res.redirect("/admin");
  });
});
router.get("/all-orderes", async (req, res) => {
  let orders = await productHelpers.getAllOrders();
  res.render("admin/view-orders", { orders, admin: true });
});
router.post('/change-orderstatus',(req,res)=>{
  productHelpers.changeOrderStatus(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/login',(req,res)=>{
  res.render('admin/adminLogin')
})

module.exports = router;
