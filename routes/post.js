const express = require('express')
const router = express()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Post, Hashtag, User } = require('../models')
const sequelize = require('../models/index').sequelize
const axios = require('axios');
const AWS = require('aws-sdk')
const multerS3 = require('multer-s3')
const imager = require('multer-imager')

require('dotenv').config();


fs.readdir('uploads', error => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.')
    fs.mkdirSync('uploads')
  }
})

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2'
})

const s3 = new AWS.S3()

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'mydiarystorage',
    key (req, file, cb) {
      const ext = path.extname(file.originalname);
      const text = file.originalname;
      let ascii = "";
      for(index in text){
        ascii += text.charCodeAt(index);
      }
      cb(null, `original/${+new Date()}${ascii}${ext}`)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.post('/img', upload.single('img'), async (req, res) => {
  try{
    console.log("이미지 url-----");
    console.log(req.file.location);
  const data = {
    image_url : req.file.location
  }
  console.log("-----------키----------")
  console.log(req.file.key);
  let tagWithImg = [];
  tagWithImg = await axios.post('https://kapi.kakao.com/v1/vision/multitag/generate?image_url='+req.file.location,null,{
    headers : {
      'authorization' : 'KakaoAK '+process.env.KAKAO_ID,
      'content-type' : 'application/x-www-form-urlencoded',
    }
  })
  //res.json({ img: req.file.location, key: req.file.key, tags: tagWithImg });
  console.log("결과물: "+tagWithImg.data.result.label_kr);
  const result = {
    img : req.file.location,
    key : req.file.key,
    tag : tagWithImg.data.result.label_kr
  };
  console.log("-----------출력--------")
  console.log(result);
  res.json(result);
  }catch(err){
    console.log(err);
    console.log(req.file.location);
    console.log(req.file.key);
    res.send(`err: ${req.file.location}`);
  }
})





const upload2 = multer()




router.post('/write', upload2.none(), async (req, res, next) => {
  try {
    
    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      userId: req.user.id,
      weather: req.body.weather,
      img: req.body.img,
      key: req.body.key,
      date : req.body.date
    })
    let hashtagsArray = [];
    if (req.body.hashtag.length!==0) {
      const hashtags = req.body.hashtag

      const result = await Promise.all(
        hashtags.map(tag =>
          Hashtag.findOrCreate({
            where: { title: tag }
          })
        )
      )
      await post.addHashtags(result.map(r => r[0]))
      // const user = await User.find({
      //   where : { id : req.user.id }
      // });
      // await user.addHashtags(result.map(r => r[0]));
      hashtagsArray = result.map(r => r[0].title);
    }
    console.log("-----------date----------")
    
    const resultObj = {
      email: req.user.email,
      nick: req.user.nick,
      id : post.id,
      title: post.title,
      content: post.content,
      weather: post.weather,
      date: post.date,
      img: post.img,
      key: post.key,
      tag: hashtagsArray
    };
    
    res.json(resultObj);
  } catch (err) {
    console.log(err);
    next(err)
  }
})


router.patch('/write',upload2.none(),async (req,res,next)=>{
  try{
    console.log(req.body.date);
    const posts = await Post.find({where: {id : req.body.id }});
    console.log("보낸 정보");
    console.log(req.body);
    console.log("게시글 img");
    console.log(posts.img);
    //console.log("업데이트할 게시글--------",posts);
    if(req.body.img !== posts.img && posts.img !== "" && posts.key !== ""){
      
      const {img} = posts;
      const {key} = posts;


      //기존 게시판에 있던 이미지 S3에서 지우고
      const params = {
        Bucket: 'mydiarystorage',
        Delete: {
          Objects: [{ Key: key }],
          Quiet: false
        }
      }
      
      await s3.deleteObjects(params,(err,data)=>{
        if(err){
          console.log("에러발생!!!!!!!!!!",err);
          throw err;
        }else{
          console.log("S3 : "+data+"가 삭제되었습니다.")
        }
      })
    }

    // 기존 해쉬 관계 제거
    const removeHash = await posts.getHashtags();
    console.log(removeHash);
    const remove = await posts.removeHashtag(removeHash.map(r => r));
    console.log(remove);


    //새로운 해쉬 생성하기
    let resultTags = [];
    let resultHash = [];
    if (req.body.tag.length !== 0) {
      const hashtagsArray = req.body.tag
      resultHash = await Promise.all(
        hashtagsArray.map(tag =>
          Hashtag.findOrCreate({
            where: { title: tag }
          })
        )
      )

      //테이블이랑 관계 정의

      await posts.setHashtags(resultHash.map(r => r[0]))
      resultTags = resultHash.map(r => r[0].title);
    }
    //let korDate = req.body.date;
    //korDate = korDate.setHours(korDate.getHours()+9);

    // 게시글 업데이트
    const updated = await Post.update(
      {
        title: req.body.title,
        content: req.body.content,
        weather: req.body.weather,
        date: req.body.date,
        img: req.body.img,
        key: req.body.key,
      },
      { where: { id: req.body.id } }
    )
    
    // 데이터 가공
    const result = await Post.find({ where: { id: req.body.id } });
    const resultObj = {
      email: req.user.email,
      nick: req.user.nick,
      id : result.id,
      title: result.title,
      content: result.content,
      weather: result.weather,
      date: result.date,
      img: result.img,
      key: result.key,
      tag: resultTags
    };
    res.json(resultObj)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

router.get('/tag', async (req, res, next) => {
  try {
    const user = await User.find({ where: { id: req.user.id } })
    const posts = await user.getPosts({ include: { model: Hashtag } })
    //const posts = await hashtag.getPosts({where : {userId : req.user.id}});
    // const tempArray = await Promise.all(posts.map(post => {
    //   return post.getHashtags({attributes: ['title']})
    // }))
    let hashTitles = []
    console.log(posts.hashtags);
    let temp = posts.map(post => {
      return post.hashtags
    })
    let temp2 = temp.map(hashtags => {
      for (var index in hashtags) {
        hashTitles.push(hashtags[index].title)
      }
    })
    const data = {}
    hashTitles.map(title => {
      if (data[title]) {
        data[title]++
      } else if (!data[title]) {
        data[title] = 1
      }
    })

    dataKeys = Object.keys(data)
    let result = dataKeys.map(datakey => {
      const resultData = { label: datakey, value: data[datakey] }
      return resultData
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// router.get('/', async (req, res, next) => {
//   try {
//     const posts = await Post.findAll({
//       where: { userId: req.user.id },
//       include: [{ model: User, attributes: ['id', 'nick']}, { model: Hashtag }],
//       order: [['date','ASC']]
//     })
//     res.json(posts)
//   } catch (err) {
//     next(err)
//   }
// })

router.get('/:hash', async (req, res, next) => {
  try {
    // posts = await Hashtag.findAll({where : { title : req.params.hash }, include: [{model: Post, attributes:['title']},{model: User, attributes:['email'], where : { id : req.user.id }}]});
    // const posts = await Hashtag.find({where : { title : req.params.hash }, include: [{model : Post, attributes:['title','content','id','img','userId'], where : {userid : req.user.id}}]});
   
    //const test = decodeURIComponent(req.params.hash)
    //console.log(test);
    const hashtag = await Hashtag.find({ where: { title: req.params.hash } })
  
    const posts = await hashtag.getPosts({ where: { userId: req.user.id } })
    
    const tempArray = await Promise.all(
      posts.map(post => {
        return post.getHashtags({ attributes: ['title'] })
      })
    )
    const postInHashtags = []
    for (var index in posts) {
      const data = {
        email: req.user.email,
        nick: req.user.nick,
        id: posts[index].id,
        title: posts[index].title,
        content: posts[index].content,
        weather: posts[index].weather,
        img: posts[index].img,
        key: posts[index].key,
        date: posts[index].date,
        createdAt: posts[index].createdAt,
        updatedAt: posts[index].updatedAt,
        deletedAt: posts[index].deletedAt
      }
      data['tag'] = []
      if (index <= tempArray.length - 1) {
        data['tag'] = tempArray[index].map(hashtag => hashtag.title)
      }
      data['tag'] = []
      if (index <= tempArray.length - 1) {
        data['tag'] = tempArray[index].map(hashtag => hashtag.title)
      }
     
      postInHashtags.push(data)
    }
    
    res.json(postInHashtags)
  } catch (err) {
    console.log(err);
    res.status(406).json({
      code: 406,
      message: '해당하는 태그가 없습니다.'
    })
  }
})

router.delete('/write', async (req, res, next) => {
  //const postId = await req.body.postId
  
  try {
    const postId = req.body.id;
    const id = postId;
    console.log(postId);
    if (req.body.key.length !== 0 && req.body.key !== null) {
      const params = {
        Bucket: 'mydiarystorage',
        Key: req.body.key
      }
      await s3.deleteObject(params, function (err, data) {
        if (err) console.log(err, err.stack)
        else console.log(data)
      })
    }

    await Post.destroy({where : {id : postId}});
    res.send({
      code: 200,
      message : `${id}번 게시글이 삭제되었습니다.`
    })
  } catch (error) {
    next(error)
  }
})

router.get('/',async (req,res,next)=>{
  try{
    const user = await User.find({ where: { id: req.user.id } })
    const posts = await user.getPosts({ include: { model: Hashtag } })
    const dataArray = await Promise.all(
      posts.map(async post => {
        const data = {
          id: post.id,
          title: post.title,
          content: post.content,
          weather: post.weather,
          img: post.img,
          key: post.key,
          date: post.date,
          createdAt : post.createdAt,
          updatedAt : post.updatedAt,
        };
        const tempArray = await post.getHashtags({attributes: ['title']});
        const temp = tempArray.map(tagObj => {
          return tagObj.title
        })
        data['tag'] = temp;
        return data;
      })
    )
    res.json(dataArray);
  }catch(err){
    console.log(err);
    next(err);
  }
})

module.exports = router
