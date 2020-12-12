const objectId = require("mongodb").ObjectID;
var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { response } = require("../app");
const { use } = require("../routes/admin");
const { CART_COLLECTION } = require("../config/collection");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { promises } = require("fs");
var instance = new Razorpay({
  key_id: "rzp_test_YW0yxpLz6IcM7R",
  key_secret: "8pD1YYwbn6vkbig5TCyFaV1a",
});
module.exports = {
  signUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(userData);
        });
    });
  },
  logIn: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email }, (err, user) => {
          if (user) {
            bcrypt.compare(userData.password, user.password).then((status) => {
              if (status) {
                console.log("Login successful");
                response.user = user;
                response.status = true;
                resolve(response);
              } else {
                console.log("Password Error !!");
                resolve({ status: false });
              }
            });
          } else {
            console.log("User not found!!");
            resolve({ status: false });
          }
        });
    });
  },
  viewProducts: (proId) => {
    return new Promise((resolve, reject) => {
      products = db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(proId) })
        .then(response);
      resolve(products);
    });
  },
  addtoCart(userId, proId) {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (!userCart) {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      } else {
        proIndex = userCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proIndex);
        if (proIndex != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(proId) },
              { $inc: { "products.$.quantity": 1 } }
            )
            .then((response) => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      }
    });
  },
  getCartProducts: (userId) =>
    new Promise(async (resolve, reject) => {
      const cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: {
              user: ObjectId(userId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    }),
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log("user" + userId);
      count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });

      if (cart) {
        count = cart.products.length;
        console.log(count);
      }
      resolve(count);
    });
  },
  changeProductQuantity(prodetials) {
    prodetials.count = parseInt(prodetials.count);
    return new Promise((resolve, reject) => {
      if (prodetials.count == -1 && prodetials.quantity == 1) {
        resolve({ removeProduct: true });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(prodetials.cart),
              "products.item": ObjectId(prodetials.product),
            },
            { $inc: { "products.$.quantity": prodetials.count } }
          )
          .then(() => {
            resolve({ status: true });
          });
      }
    });
  },
  removeProduct(prodetials) {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          {
            _id: objectId(prodetials.cart),
          },
          {
            $pull: {
              products: {
                item: objectId(prodetials.product),
              },
            },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  getTotalPrice(userId) {
    return new Promise(async (resolve, reject) => {
      const total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: {
              user: ObjectId(userId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$products.price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
    });
  },
  placeOrder(order, products, total, userId) {
    return new Promise((resolve, reject) => {
      let status = order.paymentMethod === "COD" ? "placed" : "pending";
      let orderObj = {
        user: userId,
        deliveryDetials: {
          mobile: order.mobile,
          address_line1: order.addressLine1,
          address_line2: order.addressLine2,
          city: order.city,
          pincode: order.pin,
        },

        paymentMethod: order.paymentMethod,
        totalAmount: total,
        products: products,
        status: status,
        date: new Date(),
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .removeOne({ user: objectId(userId) });
          resolve(response.ops[0]._id);
        });
    });
  },

  getOrderDetials(userId) {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ user: userId })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getOrderedProducts(orderId) {
    return new Promise(async (resolve, reject) => {
      let OrderedProducts = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              _id: ObjectId(orderId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();
      resolve(OrderedProducts);
    });
  },
  generateRazorpay(orderId, total) {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        resolve(order);
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject)  => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "8pD1YYwbn6vkbig5TCyFaV1a");

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changeOrderStatus(orderId) {
    console.log(orderId);

    return new Promise((resolve, reject) =>
      db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        })
    );
  },
  
};
