const connectToMongo = require("./db");
const express = require("express");
const multer  = require('multer');
const fs = require('fs');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const download = require('image-downloader');

var cors = require("cors");
const User = require("./models/User.js");
const Place =require("./models/Place.js");
const Booking  =require("./models/Booking.js");

// const { JsonWebTokenError } = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

connectToMongo();

const app = express();
const port = 4000;
const bcryptSalt = bcrypt.genSaltSync(2);
const jwtSecret = "1234567qwerty";
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'))
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.get("/", (req, res) => {
  res.send("Hello World onecmore!");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk)
        jwt.sign(
          { email: userDoc.email, id: userDoc._id },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;

            res.cookie("token", token).json(userDoc);
          }
        );
      else res.status(422).json("password not found");
    } else res.json("not found");
  } catch (e) {
    res.status(422).json(e);
  }
});

app.get("/profile", async (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;
      const{name, email, id} = await User.findById(user.id)       
      res.json({name, email, id});
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", async (req, res) => {
    res.cookie('token', '').json(true);
}
)

app.post("/upload-by-link", async (req, res) => {
    const {link} =req.body;
    const newName = 'photo' + Date.now() + '.jpg'
    await download.image(
        {
            url: link,
            dest: __dirname + '/uploads/' + newName,
        });

    res.json(newName);    
    

})

const photosMiddleware = multer({dest: 'uploads/'})
//inside the middle it is photos as we have set the set the filename as photos in the form
app.post('/upload',photosMiddleware.array('photos',100), (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        const {path,originalname} = req.files[i];
        const parts =  originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path +"."+ext;
        fs.renameSync(path, newPath);
        uploadedFiles.push(newPath.replace('uploads/',''));

    }
    res.json(uploadedFiles);


});

app.post("/places", async (req, res) => {
    const { token } = req.cookies;
    const {
        title,address,addedPhotos,description,price,
        perks,extraInfo,checkIn,checkOut,maxGuests,
      } = req.body;
  
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.create({
            owner:userData.id,price,
            title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,
        });
        res.json(placeDoc);
    });

});

app.get("/user-places", async (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        const {id} = userData;
        res.json(await Place.find({owner:id}));
    });

});

app.get("/places/:id", async (req, res) => {
    const{id} = (req.params);
    res.json(await Place.findById(id));

  

});

app.put("/places", async (req, res) => {
    const { token } = req.cookies;
    const {
        id,title,address,addedPhotos,description,price,
        perks,extraInfo,checkIn,checkOut,maxGuests,
      } = req.body;
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.findById(id)
        if(userData.id === placeDoc.owner.toString()){
            placeDoc.set({price,
                title,address,photos:addedPhotos,description,
          perks,extraInfo,checkIn,checkOut,maxGuests});
          await placeDoc.save();
          res.json('ok');
        }
      });
});

app.get("/places", async (req, res) => {
    res.json(await Place.find());

});


app.post("/bookings", async (req, res) => {
    const {
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
      } = req.body;
    const {token} = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        Booking.create({
            place,checkIn,checkOut,numberOfGuests,name,phone,price,
            user: userData.id
           
          }).then((doc) => {
            res.json(doc);
          }).catch((err) => {
            throw err;
          });    })
    
     
   
});

app.get("/bookings", async (req, res) => {
    const {token} = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        res.json(await Booking.find({user:userData.id}).populate('place'));
        
    })
})





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
