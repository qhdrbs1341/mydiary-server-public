const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const passport = require('passport')
const { User } = require('../models')
const { isAuth, isLoggedIn, isNotLoggedIn } = require('./middlewares')
const bcrypt = require('bcrypt')
const cors = require('cors');
const nodemailer = require('nodemailer');
const uuid = require('uuid/v4');

require('dotenv').config();

router.use(cors());

router.post('/emailjoin',async (req,res,next)=>{
    try{
    const {email} = req.body;
    const {password} = req.body;
    const {nick} = req.body;
    const hash = await bcrypt.hash(password, 12);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user : 'qhdrbs1341@gmail.com',
            pass : process.env.GMAIL_PASSWORD,
        }
    });
    const mailOptions = {
        from : 'qhdrbs1341@gmail.com',
        to : `${email}`,
        subject : 'Welcome to Mydiary',
        html : `<a href="http://13.209.41.118:3001/auth/emailcheck?email=${email}&nick=${nick}&password=${hash}">이메일 인증</a>`
    }
    transporter.sendMail(mailOptions,(err,info)=>{
        if(err){
            console.log(err);
            res.status(410).json({
                code: 410,
                message: "이메일 전송 오류 입니다."
            })
        }else{
            console.log(info);
            res.json({
                code: 200,
                message: "이메일 인증 중 입니다."
            })
        }
    })
    }catch(err){
        console.log("이메일 구성 오류");
        res.status(409).json({
            code: 409,
            message: "이메일 구성 오류 입니다."
        })
    }
})

router.get('/emailcheck',async (req,res,next)=>{
    try{
    console.log("파라미터 정보:",req.query);
    const {email} = req.query;
    const {password} = req.query;
    const {nick} = req.query;
    
    const exUser = await User.find({where : {email}});
    if(exUser){
        console.log("가입된 이메일 주소 입니다.");
        return res.status(412).json({
            code: 412,
            message : "이미 가입된 이메일 주소입니다."
        })
    }
    await User.create({
        email,
        nick,
        password: password,
        provider: 'email'
      })
      return res.json({
          code : 200,
          message : '회원가입 성공'
      })

    }catch(err){
        console.log("이메일 인증 중 에러");
        res.status(411).json({
            code: 411,
            message: "이메일 인증 중 에러"
        })
    }
})

router.post('/password',async(req,res,next)=>{
    try{
    const {email} = req.body;
    const user = await User.find({where : { email }});
    if(user){
    // if(user.provider === 'local'){
    //     const tempPass = uuidv4();
    //     const originPass = tempPass.replace(/-/gi,'');
    //     const hash = await bcrypt.hash(originPass, 12);
    //     await User.update({
    //         password : hash
    //     },{where : { email }})
    //     res.json({
    //         code: 200,
    //         message : originPass
    //     })
    // }
    if(user.provider === 'kakao' || user.provider === 'email' || user.provider === 'local'){
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user : 'qhdrbs1341@gmail.com',
                pass : process.env.GMAIL_PASSWORD,
            }
        });
        const mailOptions = {
            from : 'qhdrbs1341@gmail.com',
            to : `${email}`,
            subject : 'Password Modify Mydiary',
            html : `<form action="http://13.209.41.118:3001/auth/emailpassword?email=${email}" method="post">
            <label for="password">변경할 패스워드를 입력하세요.</label>
            <input id="password" type="text" name="password"/>
            <input type="submit" value="비밀번호 설정"/>
            </form>`
        }
        transporter.sendMail(mailOptions,(err,info)=>{
            if(err){
                console.log(err);
                res.status(410).json({
                    code: 410,
                    message: "이메일 전송 오류 입니다."
                })
            }else{
                console.log(info);
                res.json({
                    code: 200,
                    message: "패스워드 변경 중 입니다."
                })
            }
        })
    }
    }else{
        throw new Error();
    }
    }catch(err){
        console.log('잘못된 이메일 입력입니다.')
        res.status(412).json({
            code: 412,
            message: '잘못된 이메일 입력입니다.'
        })
    }
})

router.post('/emailpassword',async (req,res,next)=>{
    try{
        console.log(req.query.email);
        console.log(req.body.password);
        const {email} = req.query;
        const {password} = req.body;
        const hash = await bcrypt.hash(password, 12);
        await User.update({
            password : hash
        },{where : { email }})
        res.json({
            code: 200,
            message : "패스워드가 성공적으로 변경 됬습니다."
        })
    }catch(err){
        console.log(err);
        console.log("변경할 패스워드가 잘못 보내졌습니다.");
        res.status(412).json({
            code: 412,
            message: "변경할 패스워드가 잘못 보내졌습니다."
        })
    }
})

router.post('/email',async (req,res,next)=>{
    try{
        const {email} = req.body;
        const exUser = await User.find({where : { email }});
        if(exUser){
            res.json({
                code: 405,
                message: '가입된 이메일이 있습니다.'
            })
        }else{
            res.json({
                code: 200,
                message: '가입된 이메일이 없습니다.'
            })
        }
    }catch(err){
        console.log(err);
        next(err);
    }
})
router.get('/check', async (req,res,next)=>{
    try{
        
        let token = req.headers.authorization;
        console.log("-----토큰-----")
        console.log(token);
        if(token.startsWith('Bearer ')){
            token = token.slice(7, token.length).trimLeft();
        }
        console.log("----변환된 토큰----")
        console.log(token);
        const result = jwt.verify(token, process.env.JWT_SECRET);
        //회원 필터링까지 구현 
        console.log(result);
        const exUser = await User.find({where : {id: result.id}});
        if(!exUser){
            res.json({
                code: 407,
                message: '일치하는 회원이 없습니다.'
            })
        }else{
            res.json({
                code: 200,
                message: '정상적인 토큰 입니다.'
            })
        }

    }catch(err){
        if(err.name === 'TokenExpiredError'){
                res.json({
                code: 406,
                message: '토큰이 만료 되었습니다.'
            });
        }else{
            res.json({
            code : 405,
            message: '유효하지 않은 토큰 입니다.'
        })
        }
    }
})

router.post('/join', async (req, res, next) => {
  const { email, nick, password } = req.body
  try {
    const exUser = await User.find({ where: { email } })
    if (exUser) {
      return res.json({
        code: 405,
        message: '이미 가입된 회원입니다'
      })
    }
    const hash = await bcrypt.hash(password, 12)
    await User.create({
      email,
      nick,
      password: hash
    })
    return res.json({
        code : 200,
        message : '회원가입 성공'
    })
  } catch (err) {
    next(err)
  }
})

router.get('/kakao',passport.authenticate('kakao',{ session: false }));
router.get('/kakao/callback',passport.authenticate('kakao',{
    failureMessage : '잘못된 카카오 회원입니다.',
    session : false
}), async (req,res)=>{
    try{
    const token = jwt.sign({
        id : req.user.id,
        nick : req.user.nick,
    }, process.env.JWT_SECRET,{
        expiresIn : '6h',
        issuer: 'mydiary'
    });
    BearerToken = "Bearer " + token;
    res.redirect(`http://diary-my-log.s3-website-us-east-1.amazonaws.com/#/user?token=${BearerToken}&profile=${req.user.profile}&nick=${req.user.nick}`);
    }catch(err){
        console.log(err);
        next(err);
    }
})

//POST /auth/login
router.post('/login',(req,res,next)=>{
   
    passport.authenticate('local',{session:false},(error,user,info)=>{
        if(error){
            return res.status(405).json({
                code : 405,
                message : error
            })
        }
        if(!user){
            return res.status(405).json({
                code: 405,
                message : info.message
            })
        }
        return req.login(user, {session:false} , (loginError)=>{
            if(loginError){
            return res.status(405).json({
                    code : 405,
                    message : '부득이한 로그인 에러 다시 요청하세요.'
                });
            }
            return next();
        })
        })(req,res,next);
},async(req,res,next)=>{
    try{
            const token = jwt.sign({
                id : req.user.id,
                nick : req.user.nick,
            }, process.env.JWT_SECRET,{
                expiresIn : '6h',
                issuer: 'mydiary'
            });
                res.json({
                code : 200,
                message : '토큰이 발급되었습니다',
                token : "Bearer " + token,
                nick : req.user.nick
            })
        }catch(err){
        res.status(405).json({
            code: 406,
            message : '토큰 발급 에러'
        })
        }
});

//GET /auth/logout
router.get('/logout', passport.authenticate('jwt', {session: false}), async (req,res)=>{
    req.logout();
    res.json({
        code: 200,
        message: '로그아웃 성공'
    })
})

module.exports = router
