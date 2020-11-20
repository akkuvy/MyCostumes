var express = require('express');
const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require("../helpers/user-helpers")
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('users/index',{products});
  })
  
});
router.get('/login',(req,res)=>{
  if (req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render("users/login",{"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }
})
router.post('/login',(req,res)=>{
  userHelpers.logIn(req.body).then((response)=>{
    if (response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/');
    }
    else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })
  
  })
  router.get('/logout',((req,res)=>{
    req.session.destroy()
    res.redirect('/')
  }))
router.get('/register',(req,res)=>{
  res.render('users/register')
})
router.post('/register',(req,res)=>{
  userHelpers.signUp(req.body).then((response)=>{
 
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/login')
  })
})
router.get('/view-product/:id',(req,res)=>{
  id=req.params.id
 products=userHelpers.viewProducts(id). then((products)=>{
  
  res.render('users/view-product',{products,id})
 })
})
router.get('/addto-cart/:id',((req,res)=>{
  userHelpers.addtoCart(req.session.user._id, req.params.id).then((response)=>{
    res.redirect('/')
  })
}))

module.exports = router;
