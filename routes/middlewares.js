const jwt = require('jsonwebtoken');
const passport = require('passport');
require('dotenv').config();

exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()){
    next();
  }else{
    res.status(403).send('로그인 필요');
  }
};

exports.isNotLoggedIn = (req,res,next) => {
  if (!req.isAuthenticated()){
    next();
  }else{
    res.redirect('/');
  }
}

exports.verifyToken = async (req,res,next)=>{
  try{
    let token = req.headers.authorization;
    if(token.startsWith('Bearer ')){
      token = token.slice(7, token.length).trimLeft();
    }
    const tokenTest = await jwt.verify(token, process.env.JWT_SECRET);

    passport.authenticate('jwt',{session: false},(error,user)=>{
      if(error){
        return res.json({
          code: 408,
          message: '데이터 베이스 에러'
        })
      }
      if(!user){
        return res.json({
          code: 407,
          message: '일치하는 회원이 없습니다'
        })
      }
      req.user = user;
      return next();
    })(req,res,next);
  }catch(err){
      if(err.name === 'TokenExpiredError'){
        res.send({
          code: 406,
          message: '토큰이 만료 되었습니다.'
        })
      }else{
        res.json({
          code : 405,
          message : '유효하지 않은 토큰입니다.'
        })
      }
  }
}
