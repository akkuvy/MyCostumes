var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/login',(req,res)=>{
  res.render('users/login')
})
router.get('/register',(req,res)=>{
  res.render('users/register')
})

module.exports = router;
