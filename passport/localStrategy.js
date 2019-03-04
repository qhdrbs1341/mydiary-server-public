const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {User} = require('../models');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
require('dotenv').config();

const opts = {}
opts.jwtFromRequest = ExtractJWT.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;


module.exports = (passport) => {
  passport.use(new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password'
  }, async(email,password,done)=>{
      try{
        const exUser = await User.find({where : {email}});
        if(exUser){
            const result = await bcrypt.compare(password,exUser.password);
            if(result){
                done(null,exUser);
            }else{
                done(null,false,{message: '비밀번호가 일치하지 않습니다'})
            }
        }else{
            done(null,false,{ message: '가입되지 않은 회원입니다.'})
        }
      }catch(err){
          done(err);
      }
  })) 

  passport.use(new JwtStrategy(opts,
function (jwtPayload, cb) {
    //find the user in db if needed
    
    return User.findOne({where : {id: jwtPayload.id}})
        .then(user => {
            return cb(null, user);
        })
        .catch(err => {
            console.log(err);
            return cb(err,null);
        });
}
));

}
