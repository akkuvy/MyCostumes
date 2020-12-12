var express = require("express");
const { Db } = require("mongodb");
const { response } = require("../app");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();

checkLoggedin = (req, res, next) => {
  if (!req.session.user.loggedIn) {
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
    res.render("users/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});
router.post("/login", (req, res) => {
  userHelpers.logIn(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;

      res.redirect("/");
    } else {
      req.session.userLoginErr = true;
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});
router.get("/register", (req, res) => {
  res.render("users/register");
});
router.post("/register", (req, res) => {
  userHelpers.signUp(req.body).then((response) => {
    req.session.user = response;
    req.session.user.loggedIn = true;
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
      res.json({ status: true });
    });
});
router.get("/cart", checkLoggedin, async (req, res) => {
  let userId = req.session.user._id;
  let user = req.session.user;
  let cartCount = null;

  cartCount = await userHelpers.getCartCount(req.session.user._id);
  if(cartCount==0){
    cartCount=null
  }

  let products = await userHelpers.getCartProducts(req.session.user._id);
  let total = 0;
  if (products.length > 0) {
    total = await userHelpers.getTotalPrice(req.session.user._id);
  }

  res.render("users/cart", { products, user, total, userId,cartCount });
});
router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalPrice(req.body.user);
    res.json(response);
  });
});
router.post("/remove-product", (req, res, next) => {
  userHelpers.removeProduct(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/checkout", (req, res) => {
  user = req.session.user;
  userHelpers.getTotalPrice(req.session.user._id).then((total) => {
    res.render("users/checkout", { user, total });
  });
});
router.post("/checkout", async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  let order = req.body;
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let total = await userHelpers.getTotalPrice(req.session.user._id);
  userHelpers.placeOrder(order, products, total, userId).then((orderId) => {
    console.log(order);
    if (order.paymentMethod === "COD") {
      res.json({ codSuccess: true });
    } else {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response);
      });
    }
  });
});
router.get("/order-success", async (req, res) => {
  let user = req.session.user;
  res.render("users/order-placed", { user });
});
router.get("/order", checkLoggedin, async (req, res) => {
  user = req.session.user;
  let orderDetials = await userHelpers.getOrderDetials(req.session.user._id);
  console.log(orderDetials);
  res.render("users/orders", { orderDetials, user });
});
router.get("/view-ordered-products/:id", async (req, res) => {
  user = req.session.user;
  let orderedProducts = await userHelpers.getOrderedProducts(req.params.id);
  res.render("users/ordered-products", { orderedProducts });
});
router.post("/verify-payment", async (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers
      .changeOrderStatus(req.body["order[receipt]"])
      .then(() => {
        res.json({ status: true });
      })
      .catch(() => {
        res.json({ status: false });
      });
  });
});

module.exports = router;
