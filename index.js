require('dotenv').config();
const express = require('express');

const mongoose=require('mongoose');
const ejs = require("ejs");
const bodyParser = require('body-parser');
const app=express();
//MIDDLE WARES
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//

const facbookrequestpage=mongoose.createConnection(process.env.MONGOURI,{useNewUrlParser:true,useUnifiedTopology:true});

const userSchema=new mongoose.Schema({
username:String,
email:String,
password:String
});
const postSchema=new mongoose.Schema({
    content:String,
    email:String,
    visibility:String
});
const friendSchema=new mongoose.Schema({
    email:String,
    friends:[String],
    incoming:[String],
    outgoing:[String]

});
const postList=facbookrequestpage.model('post',postSchema);
const friendlist=facbookrequestpage.model('friend',friendSchema);

const userModel=facbookrequestpage.model('User',userSchema);

app.set('view engine', 'ejs');
app.get('/',(req,res)=>{
res.send("<p>/signup_login=> shows signup and login page </p> <p>/myprofile/:email =>show all the post of logged in user and there is option to add new post or delete new post in this route </p><p> /individual/:email=> shows all post of selected friend (from /friendlist/:email route) </p> <p>/community => shows all the post which have public visibility </p> /friendlist/:email=> shows all his/her friends and shows all incoming friend request and show all suggestion for you to send friend request")
}
);

app.post('/signup_data', (req,res)=>{  
    userModel.findOne({email:req.body.email},function(err,result){
        if(result)
        {
           
            res.status(403).send("email already exists");
           
        }
         else
{  
                                      
    const docs=new friendlist({email:req.body.email});
    docs.save();
            const doc=new userModel({
                username:req.body.username,
                email:req.body.email,
                password:req.body.password
        });     

        doc.save(function(err,result){
      if(err)
      {
    console.log(err);
      }
      else
      {
        res.redirect(`/myprofile/${req.body.email}`);
    console.log(result);
      }
        });

    }
        });
     
   
});


app.post('/login_data',(req,res)=>{
    userModel.findOne({email:req.body.email, password:req.body.password},(err,result)=>{
        if(result){
            
          res.redirect(`/friendlist/${req.body.email}`);
        }
        else
        {
            res.status(403).send("Invalid credentials");
        }
    })
});
app.get('/signup_login',(req,res)=>{

res.render('login');
});
app.get('/signup',(req,res)=>{

    res.render('signup');
    });
   
app.get('/friendlist/:email',(req,res)=>{
    const email=(req.params.email);
    friendlist.findOne({email:email}, (err,result)=>{
        if(result.friends!=null)
        {
           
            res.render('friendlist',{email:email,friends:result.friends,incoming:result.incoming,outgoing:result.outgoing});
        }
    });

});
app.post('/deletepost',(req,res)=>{
postList.findOneAndDelete({_id:req.body.id},(err, result)=>{
    if(result)
    {
        res.redirect(`/myprofile/${req.body.email}`);
    }
})
});
app.post('/removeFriend',(req,res)=>{
    console.log("s"+req.body.fname);
    friendlist.findOneAndUpdate({email:req.body.hidden},{
    
        $pull:{friends:req.body.fname}
    },{
        new:true
    }).exec((err,result)=>{
        if(err){return res.status(422).json({error:err})}
        else{res.redirect(`/friendlist/${req.body.hidden}`)}
    }
    
    )
});

app.post('/acceptFriend',(req,res)=>{

    friendlist.findOneAndUpdate({email:req.body.hidden},{
    
        $push:{friends:req.body.fincoming},
        $pull:{incoming:req.body.fincoming}

    },{
        new:true
    }).exec((err,result)=>{
        if(err){return res.status(422).json({error:err})}
        else{
            friendlist.findOneAndUpdate({email:req.body.fincoming},{
    
                $push:{friends:req.body.hidden},
               
        
            },{
                new:true
            }).exec((err,result)=>{
                if(err){return res.status(422).json({error:err})}
                else{
                    
                    
                    
                    res.redirect(`/friendlist/${req.body.hidden}`)
                }
            }
            
            )
            
            
            // res.redirect(`/friendlist/${req.body.hidden}`)
        }
    }
    
    )
});

app.post('/sendFriend',(req,res)=>{

    friendlist.findOneAndUpdate({email:req.body.foutgoing},{
    
        $push:{incoming:req.body.hidden},
        

    },{
        new:true
    }).exec((err,result)=>{
        if(err){return res.status(422).json({error:err})}
        else{
            
            friendlist.findOneAndUpdate({email:req.body.hidden},{
    
               
                $pull:{outgoing:req.body.foutgoing}
        
            },{
                new:true
            }).exec((err,result)=>{
                if(err){return res.status(422).json({error:err})}
                else{
                    
                    
                    
                    res.redirect(`/friendlist/${req.body.hidden}`)}
            }
            
            )
        
            
            // res.redirect(`/friendlist/${req.body.hidden}`)
        }
    }
    
    )
});
app.get('/individual/:email', (req, resp)=>{
    postList.find({email:req.params.email},(err, res)=>{
        if(res)
        {
            resp.render('individual',{res:res,email:req.params.email});
        }
    });

});
app.get('/myprofile/:email', (req, resp)=>{
    postList.find({email:req.params.email},(err, res)=>{
        if(res)
        {
            resp.render('profile',{res:res,email:req.params.email});
        }
    });

});
app.get('/community',(req,resp)=>{
    postList.find({visibility:"public"},(err, res)=>{
        if(res)
        {
            resp.render('community',{res:res});
        }
    });
});
app.post('/post', (req, res)=>{
    console.log(req.body);
const doc=new postList({email:req.body.email,
    content:req.body.content,
    visibility:req.body.visibility

});
doc.save();
res.redirect(`/myprofile/${req.body.email}`);
});
const PORT=process.env.PORT || 3001;
app.listen(PORT,()=>{console.log('listening on port 3001')});