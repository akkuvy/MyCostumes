var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/',function(req, res, next) {
  res.render('admin/view-products', { admin:true});
})
router.get('/add-product',(req,res)=>{
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  console.log(req.body);
  res.render('admin/view-product')
})



module.exports = router;
