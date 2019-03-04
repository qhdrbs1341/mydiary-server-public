const express = require('express')
const router = express()
const bcrypt = require('bcrypt')
const { isAuth, User } = require('../models/index')
const passport = require('passport')
const {verifyToken} = require('./middlewares');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// get users listing
router.get('/',(req,res,next)=>{
  console.log(req.user);
})

router.get('/profile', (req,res,next)=>{
  console.log(req.isAuthenticated());
  res.send(req.user);
})

router.get('/delete', async (req,res,next)=>{
  try{
    console.log("보낸 정보--------------")
  console.log(req.user.id);
  console.log(req.user);
  await User.destroy({where : {id : req.user.id}});
  res.json({
    code: 200,
    message: `${req.user.email} 회원 탈퇴가 완료되었습니다.`
  })
  }catch(err){
    console.log(err);
    res.json({
      code: 200,
      message: '회원 탈퇴 오류'
    })
  }
})


module.exports = router
