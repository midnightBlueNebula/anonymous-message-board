/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect        =   require('chai').expect;
var ObjectId      =   require('mongodb').ObjectId;
var bcrypt        =   require('bcrypt');

module.exports = function (app,db) {
  
   //Sample front-end
  app.route('/b/:board/')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/board.html');
    });
  
  app.route('/b/:board/:threadid')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/thread.html');
    });
  
  //Index page (static HTML)
  app.route('/')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/index.html');
    });
  
 
  
  app.route('/api/threads/:board')
    .get((req,res)=>{
      db.collection('message-board').find({"board":req.params.board}).toArray((err,result)=>{
        if(err){
          res.send('Error at route-> /api/threads/:board .get .find.toArray: '+err+'');
        }
        else if(result){
          let tempArr = result.sort((a,b)=>b.bumped_on-a.bumped_on).slice(0,10);
          let resArr = []
          tempArr.forEach((d,i)=>{resArr.push({_id:d._id,
                                               "text":d.text,
                                               "created_on":d.created_on,
                                               "bumped_on":d.bumped_on,
                                               "replycount":d.replycount,
                                               "replies":d.repToGet.sort((x,y)=>y.created_on-x.created_on).slice(0,3)
                                              })
                                })
          res.send(resArr);
        }
        else{
          console.log('No data available route-> /api/threads/:board .get .find.toArray');
          res.redirect('/');
        }
      })
    })
  
    .post((req,res)=>{
      let board = req.body.board;
      if(!board){
        board = req.params.board;
      }
      let text = req.body.text;
      
      db.collection('message-board').findOne({"board":board},(err,result)=>{
        if(err){
          res.send('Error at route-> /api/threads/:board .post .findOne: '+err+'');
        }
        /*else if(result){
          res.send('This board already exists.');
        }*/
        else{
          let hash = bcrypt.hashSync(req.body.delete_password,12);
          db.collection('message-board').insertOne({_id:new ObjectId(),
                                                    "text":text,
                                                    "created_on":new Date(),
                                                    "bumped_on":new Date(),
                                                    "reported":false,
                                                    "delete_password":hash,
                                                    "replies":[],
                                                    "repToGet":[],
                                                    "replycount":0,
                                                    "board":board});
          res.redirect('/b/'+board+'');
        }
      })
    
    })
  
    .put((req,res)=>{
      let id = req.body.thread_id;
      db.collection('message-board').findOne({_id:ObjectId(id)},(err,result)=>{
        if(err){
          res.send('Error at route-> /api/threads/:board .put .findOne: '+err+'');
        }
        else if(result){
          db.collection('message-board').findOneAndUpdate({_id:ObjectId(id)},{$set:{"reported":true}})
          res.send('success');
        }
        else{
          res.send('failed thread with id: '+id+' couldn\'t found.');
        }
      })
    })
  
    .delete((req,res)=>{
      let board    = req.body.board;
      let id       = req.body.thread_id;
      let password = req.body.delete_password;
      db.collection('message-board').findOne({_id:ObjectId(id)},(err,result)=>{
        if(err){
          res.send('Error at route-> /api/threads/:board .delete .findOne: '+err+'');
        }
        else if(result){
          if(bcrypt.compareSync(password,result.delete_password)){
            db.collection('message-board').deleteOne({_id:ObjectId(id)},(err2,result2)=>{
              if(err2){
                res.send('Error at route-> /api/threads/:board .delete .deleteOne: '+err2+'');
              }
              else{
                res.type('text').send('success');
              }
            });
          }
          else{
            res.type('text').send('incorrect password');
          }
        }
        else{
          res.send('No thread found with provided id -> '+id+'');
        }
      })
      
    })
  
  
  app.route('/api/replies/:board')
    .get((req,res)=>{
        if(req.query.thread_id){
          let id = req.query.thread_id;
          db.collection('message-board').find({"board":req.params.board,_id:ObjectId(id)}).toArray((err,result)=>{
            if(err){
              res.send('Error at route-> /api/replies/:board .get .find.toArray: '+err+'');
            }
            else if(result){
              /*let tempArr = result.replies;
              let resArr  = tempArr.forEach((d)=>{return {"_id":d.id,
                                                         "text":d.text,
                                                         "created_on":d.created_on}});*/
              //let repToGet = result.map((d)=>d.repToGet);
              res.send(result[0].repToGet);
            }
            else{
              console.log('No data available route-> /api/threads/:board .get .find.toArray');
              res.redirect('/');
            }
          })
        }
        else{
          db.collection('message-board').find({"board":req.params.board}).toArray((err,result)=>{
            if(err){
              res.send('Error at route-> /api/replies/:board .get .find.toArray: '+err+'');
            }
            else if(result){
              /*let tempArr = result.replies;
              let resArr  = tempArr.forEach((d)=>{return {"_id":d.id,
                                                         "text":d.text,
                                                         "created_on":d.created_on}});*/
              //let repToGet = result.map((d)=>d.repToGet);
              //let repToGet = result.map((d)=>d.repToGet)
              res.send(result);
            }
            else{
              console.log('No data available route-> /api/threads/:board .get .find.toArray');
              res.redirect('/');
            }
          })
        }
    })
  
    .post((req,res)=>{
      let board = req.body.board;
      let id    = req.body.thread_id;
      let text  = req.body.text;
      if(!board){
        db.collection('message-board').findOne({_id:ObjectId(id)},(err,result)=>{
          if(err){
            res.send('Error at route-> /api/replies/:board .post .findOne')
          }
          else if(result){
            board = result.board
          }
          else{
            res.send('Couldn\t find thread with id -> '+id+'')
          }
        })
      }
      db.collection('message-board').findOne({_id:ObjectId(id)},(err,result)=>{
        if(err){
          res.send('Error at route-> /api/replies/:board .post .findOne')
        }
        else  if(result){
          let repArr   = result.replies;
          let repToGet = result.repToGet;
          let hash = bcrypt.hashSync(req.body.delete_password,12);
          
          let r_id = new ObjectId()
          repArr.push({_id:r_id,"text":text,"created_on":new Date(),"delete_password":hash,"reported":false});
          repToGet.push({_id:r_id,"text":text,"created_on":new Date()});
          db.collection('message-board').findOneAndUpdate({_id:ObjectId(id)},{$set:{"replies":repArr,
                                                                                    "repToGet":repToGet,
                                                                                    "bumped_on":new Date()},
                                                                              $inc:{"replycount":1}
                                                                             });
          res.redirect('/b/'+board+'/'+id);
        }
        else{
          res.send('Couldn\t find thread with id -> '+id+'')
        }
      })
    })
  
    .put((req,res)=>{
      let t_id = req.body.thread_id;
      let r_id = req.body.reply_id;
      db.collection('message-board').findOne({_id:ObjectId(t_id)},(err,result)=>{
        if(err){
          res.send('Error at route-> /api/replies/:board .put .findOne')
        }
        else if(result){
          console.log('thread_id matched succesfully')
          let repArr = result.replies;
          let check = 0;
          repArr.forEach((d,i)=>{
            if(d._id == r_id){
              console.log('rep_id matched succesfully');
              repArr[i].reported=true;
              db.collection('message-board').findOneAndUpdate({_id:ObjectId(t_id)},{$set:{"replies":repArr}});
              check = 1;
              res.send('success');
            }
          })
          if(check == 0){
            res.send('fail');
          }
        }
        else{
          res.send('Couldn\t find thread with id -> '+t_id+'')
        }
      })
    })
  
    .delete((req,res)=>{
      let board    = req.body.board;
      let t_id     = req.body.thread_id;
      let r_id     = req.body.reply_id;
      db.collection('message-board').findOne({_id:ObjectId(t_id)},(err,result)=>{
        if(err){
          res.send('Error at route-> /api/replies/:board .delete .findOne')
        }
        else if(result){
          let repArr = result.replies;
          let repToGet = result.repToGet;
          repArr.forEach((d,i)=>{
            if(r_id==d._id){
              if(bcrypt.compareSync(req.body.delete_password,d.delete_password)){
                repArr[i].text = '[deleted]';
                console.log('deleted from replies.')
                repToGet.forEach((e,j)=>{
                  if(e._id == r_id){
                    console.log('deleted from repToGet');
                    repToGet[j].text = '[deleted]';
                  }
                })
                db.collection('message-board').findOneAndUpdate({_id:ObjectId(t_id)},{$set:{"replies":repArr,"repToGet":repToGet}})
                console.log('deletion successful.');
                res.send('success');
              }
              else{
                res.send('incorrect password');
              }
            }
          })
        }
        else{
          res.send('No thread found with provided id -> '+t_id+'');
        }
      })
    })

};
