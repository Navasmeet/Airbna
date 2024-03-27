const mongoose = require("mongoose");
const { Schema } = mongoose;

const placeSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
  },
  title: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  photos: {
    type: [String],
  },
  description: {
    type: String,
  },
  perks: {
    type: [String],
  },
  extraInfo: {
    type: String,
  },
  checkIn: {
    type: Number,
  },
  checkOut: {
    type: Number,
  },
  maxGuests: {
    type: Number,
  },
  price:{
    type: Number,
  },
});

const PlaceModel = mongoose.model("place", placeSchema);
module.exports = PlaceModel;
