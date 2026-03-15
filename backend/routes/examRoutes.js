const express = require("express")
const router = express.Router()

const examController = require("../controllers/examController")

router.get("/generate",examController.generateExam)
router.post("/submit",examController.submitExam)
router.get("/history/:userId", examController.getHistory)

module.exports = router