var express = require("express");
const { Db } = require("mongodb");
const { response } = require("../app");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
var passport = require("passport");

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
  req.logout();
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
router.get("/view-product/:id", checkLoggedin, async (req, res) => {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  products = userHelpers.viewProducts(id).then((products) => {
    res.render("users/view-product", { products, id, user, cartCount });
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

  let products = await userHelpers.getCartProducts(req.session.user._id);
  let total = 0;
  if (products.length > 0) {
    total = await userHelpers.getTotalPrice(req.session.user._id);
  }

  res.render("users/cart", { products, user, total, userId, cartCount });
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
router.get("/checkout", async (req, res) => {
  user = req.session.user;
  address = await userHelpers.getAddress(user._id);
  console.log(address);
  userHelpers.getTotalPrice(req.session.user._id).then((total) => {
    res.render("users/checkout", { user, total, address });
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
router.get("/mens-only", async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    let id = req.session.user._id;
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  await userHelpers.mensOnly().then((products) => {
    res.render("users/index", { products, user, cartCount });
  });
});
router.get("/womens-only", async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    let id = req.session.user._id;
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  await userHelpers.womensOnly().then((products) => {
    res.render("users/index", { products, user, cartCount });
  });
});
router.get("/kids-only", async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    let id = req.session.user._id;
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  await userHelpers.kidsOnly().then((products) => {
    res.render("users/index", { products, user, cartCount });
  });
});
router.get("/profile", checkLoggedin, async (req, res) => {
  let profile = await userHelpers
    .getProfile(req.session.user._id)
    .then((profile) => {
      res.render("users/profile", { profile });
    });
});
router.post("/profile", async (req, res) => {
  await userHelpers
    .updateProfile(req.session.user._id, req.body)
    .then((response) => {
      res.redirect("/profile");
    });
});
router.get("/manage-address", async (req, res) => {
  let address = await userHelpers
    .getAddress(req.session.user._id)
    .then((address) => {
      console.log(address);
      res.render("users/address", { address });
    });
});
router.post("/manage-address", (req, res) => {
  userHelpers.manageAddress(req.session.user._id, req.body);
  res.redirect("/manage-address");
});
router.get("/failed", (req, res) => res.send("You Failed to log in!"));

router.get("/good", (req, res) => {
  console.log(req.user);
  res.render("users/index", { name: req.user });
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/failed" }),
  function (req, res) {
    console.log(req.user);
    res.redirect("/good");
  }
);

router.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
});

module.exports = router;
