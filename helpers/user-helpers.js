const { Db, ObjectId } = require("mongodb");
var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { response } = require("../app");
const { use } = require("../routes/admin");
module.exports = {
  signUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      console.log(userData.password);
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
      console.log(userData);
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
  // addtoCart: (userId, proId) => {
  //   console.log(proId);
  //   let proObj = {
  //     item: ObjectId(proId),
  //     quantity: 1,
  //   };
  //   return new Promise(async (resolve, reject) => {
  //    await db
  //       .get()
  //       .collection(collection.CART_COLLECTION)
  //       .findOne({ user: ObjectId(userId)},(err,userCart) => {

        
          
  //     if (userCart != null) {
  //       console.log("log");
  //       proIndex = userCart.products.findIndex((products) => {
         
  //         products.item == ObjectId(proId);
  //         console.log(products.item);
  //       });
  //       console.log(proIndex);
  //       if (proIndex != -1) {
  //         db.get()
  //           .collection(collection.CART_COLLECTION)
  //           .updateOne(
  //             {
  //               user: ObjectId(userId),
  //               "products.item": ObjectId(proId),
  //             },
  //             {
  //               $inc: {
  //                 "products.$.quantity": 1,
  //               },
  //             }
  //           )
  //           .then((response) => {
  //             resolve();
  //           });
  //       } else {
  //         db.get()
  //           .collection(collection.CART_COLLECTION)
  //           .updateOne(
  //             {
  //               user: ObjectId(userId),
  //             },
  //             { $push: { products: proObj } }
  //           )
  //           .then((response) => {
  //             resolve();
  //           });
  //       }
  //     } else {
  //       let cartObj = {
  //         user: ObjectId(userId),
  //         products: [proObj],
  //       };
  //       db.get()
  //         .collection(collection.CART_COLLECTION)
  //         .insertOne(cartObj)
  //         .then((response) => {
  //           resolve();
  //         });
  //     }
  //   });
  // });
  // },
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
            console.log(response);
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
            .updateOne({user:ObjectId(userId),
               "products.item": ObjectId(proId),
            },
              { $inc: { "products.$.quantity": 1 } }
            )
            .then((response)=>{
              resolve()
            })
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
};
