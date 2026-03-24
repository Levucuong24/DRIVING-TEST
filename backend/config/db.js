const mongoose = require("mongoose")

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in backend/.env")
  }

  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB Connected")
  } catch (error) {
    const target = process.env.MONGO_URI
    console.error(`Failed to connect to MongoDB at ${target}`)
    throw error
  }
}

module.exports = connectDB
