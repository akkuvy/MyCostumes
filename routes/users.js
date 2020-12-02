var express = require("express");
const { Db } = require("mongodb");
const { response } = require("../app");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();

checkLoggedin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
};
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    let id = req.session.user._id;
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  productHelpers.getAllProducts().then((products) => {
    res.render("users/index", { admin: false, products, user, cartCount });
  });
});
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("users/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});
router.post("/login", (req, res) => {
  userHelpers.logIn(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;

      res.redirect("/");
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
router.get("/register", (req, res) => {
  res.render("users/register");
});
router.post("/register", (req, res) => {
  userHelpers.signUp(req.body).then((response) => {
    req.session.loggedIn = true;
    req.session.user = response;
    res.redirect("/login");
  });
});
router.get("/view-product/:id", (req, res) => {
  let user = req.session.user;
  id = req.params.id;
  products = userHelpers.viewProducts(id).then((products) => {
    res.render("users/view-product", { products, id, user });
  });
});
router.get("/addto-cart/:id", (req, res) => {
  userHelpers
    .addtoCart(req.session.user._id, req.params.id)
    .then((response) => {
   res.json({status:true})
    });
});
router.get("/cart", checkLoggedin, async (req, res) => {
  let user = req.session.user;
  let products = await userHelpers.getCartProducts(req.session.user._id);
  res.render("users/cart", { products, user });
});
router.post('/change-product-quantity',(req,res,next)=>{
   userHelpers.changeProductQuantity(req.body).then((response)=>{
     res.json(response)
   })
})
router.post('/remove-product',(req,res,next)=>{
  userHelpers.removeProduct(req.body).then((response)=>{
    res.json(response)
  })
})
module.exports = router;
