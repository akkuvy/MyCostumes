var db = require("../config/connection");
var collection = require("../config/collection");
const { response } = require("express");
const { ObjectID } = require("mongodb");
const objectID = require("mongodb").ObjectID;
module.exports = {
  doLogin(adminDetials) {
    console.log(adminDetials);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ adminuserName: adminDetials.adminuserName })
        .then((response) => {
          console.log(response);
          if (
            response.adminUsername == adminDetials.userName &&
            response.password == adminDetials.password
          ) {
            console.log("Login success");
            resolve(response);
          } else {
            console.log("login error");
            resolve({ status: false });
          }
        });
    });
  },
  getUsers(){
      return new Promise(async(resolve,reject)=>{
        let users= await  db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
      })
  },
  removeUser(userId){
      return new Promise(async(resolve,reject)=>{
          await db.get().collection(collection.USER_COLLECTION).removeOne({_id:objectID(userId)})
          resolve()
      })
  },
  getFeedback(){
    return new Promise(async(resolve,reject)=>{
     let feedback= await db.get().collection(collection.FEEDBCK_COLLECTION).find().toArray()
     resolve(feedback)
      
    })
  }
};

