const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  const url = "mongodb+srv://vyshnavk:Tvelss6lfqMg4bmo@cluster0.qmvxs.mongodb.net/<dbname>?retryWrites=true&w=majority";
  const dbname = "MyCostumes";

  mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  });
};
module.exports.get = function () {
  return state.db;
};
