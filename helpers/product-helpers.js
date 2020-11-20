var db = require("../config/connection");
var collection = require("../config/collection");
const { response } = require("express");
const { ObjectID } = require("mongodb");
const objectID = require("mongodb").ObjectID;

module.exports = {
  addProduct: (product, callback) => {
    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.ops[0]._id);
      });
  },
  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      let products = db.get().collection("product").find().toArray();
      resolve(products);
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .removeOne({ _id: ObjectID(proId) })
        .then(response);
      resolve(response);
    });
  },
  getProduct: (proId) => {
    return new Promise((resolve, reject) => {
      products = db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectID(proId) })
        .then(response);

      resolve(products);

      console.log(error); 
    });
  },
  editProducts: (proId, proDet) => {
    return new Promise((resolve, reject) => {
     products= db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
        { _id: objectID(proId) },
        {
          $set: {
            name: proDet.name,
            category:proDet.category,
            description: proDet.description,
            price: proDet.price,
            OFF: proDet.off,
          },
        }
      )
      .then((response)=>{
        resolve(products)
      })
    });
  },
};
