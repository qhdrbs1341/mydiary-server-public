const KakaoStrategy = require('passport-kakao').Strategy;
require('dotenv').config();
const {User} = require('../models/index');

module.exports = (passport) => {
    passport.use(new KakaoStrategy({
        clientID : process.env.KAKAO_ID,
        callbackURL : '/auth/kakao/callback',
    },async (accessToken, refreshToken, profile, done)=>{
        try{
            console.log("--------카톡정보--------");
            console.dir(profile);
            const exUser = await User.find({ where : {snsId: profile.id, provider: 'kakao'}});
            if(exUser){
                console.dir(profile._json);
                done(null, exUser);
            }else{
                console.dir(profile._json);
                const newUser = await User.create({
                    email: profile.account_email,
                    nick: profile.displayName,
                    snsId: profile.id,
                    profile: profile._json.properties.profile_image,
                    provider: 'kakao'
                });
                done(null, newUser);
            }
        }catch(err){
            console.log(err);
            done(err);
        }
    }))
}
