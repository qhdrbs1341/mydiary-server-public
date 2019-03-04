const express = require('express')
const morgan = require('morgan')
const path = require('path')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const session = require('express-session')
const { sequelize } = require('./models/index')
const { isLoggedIn, verifyToken } = require('./routes/middlewares')
const passport = require('passport')
const passportConfig = require('./passport/index')
const authRouter = require('./routes/auth')
const userRouter = require('./routes/user')
const cors = require('cors')
const postRouter = require('./routes/post')
require('dotenv').config()
const app = express()
const proxy = require('http-proxy-middleware');

sequelize.sync()
passportConfig(passport);
app.set('port', process.env.PORT)
app.set('views', path.join(__dirname, 'views'))
//Proxy


app.use(cors());
app.use(morgan('dev'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false
    }
  })
)

app.use(flash())
app.use(passport.initialize()); //passport 설정 초기화

//routers...

//인증
app.use('/auth', authRouter)


//게시글
app.use('/post', verifyToken, postRouter)

//유저정보
app.use('/user', verifyToken, userRouter)

//error router
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use((err, req, res) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.render('error')
})

app.listen(app.get('port'), () => {
  console.log(`${app.get('port')} 포트에서 서버 실행`)
})
