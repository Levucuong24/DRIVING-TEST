require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")

const connectDB = require("./config/db")

const authRoutes = require("./routes/authRoutes")
const questionRoutes = require("./routes/questionRoutes")
const examRoutes = require("./routes/examRoutes")
const uploadRoutes = require("./routes/uploadRoutes")
const categoryRoutes = require("./routes/categoryRoutes")

const app = express()

app.use(cors())
app.use(express.json())

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.use("/api/auth",authRoutes)
app.use("/api/questions",questionRoutes)
app.use("/api/exam",examRoutes)
app.use("/api/upload",uploadRoutes)
app.use("/api/categories",categoryRoutes)

const startServer = async () => {
  try {
    await connectDB()

    app.listen(process.env.PORT, () => {
      console.log("Server running on port " + process.env.PORT)
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

startServer()
