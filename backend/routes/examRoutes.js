const express = require("express")
const router = express.Router()

const examController = require("../controllers/examController")

router.get("/generate",examController.generateExam)
router.post("/submit",examController.submitExam)
router.get("/history/:userId", examController.getHistory)
router.get("/:id/details", examController.getExamDetails)

module.exports = router