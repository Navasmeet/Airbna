const mongoose = require('mongoose');
const mongoURI = 'mongodb://localhost:27017/airbnb';
const connectToMongo =() =>{
    mongoose.connect(mongoURI,()=>{
        console.log("connect mongo");
})
}

module.exports = connectToMongo;