const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const Category = require('./models/Category');
const Question = require('./models/Question');

const seedQuestions = async () => {
  try {
    await connectDB();
    
    const categories = await Category.find();
    
    if (categories.length === 0) {
      console.log('No categories found. Please create categories first before seeding questions.');
      process.exit(0);
    }

    let totalCreated = 0;

    for (const category of categories) {
      console.log(`Creating 20 questions for category: ${category.name}`);
      
      const newQuestions = [];
      for (let i = 1; i <= 20; i++) {
        // Sample question data
        newQuestions.push({
          question: `Sample Question ${i} for ${category.name}?`,
          options: [
            `Option A for Q${i}`, 
            `Option B for Q${i}`, 
            `Option C for Q${i}`, 
            `Option D for Q${i}`
          ],
          correctAnswer: Math.floor(Math.random() * 4), // Random correct answer 0-3
          categoryId: category._id,
          isCritical: Math.random() > 0.8 // 20% chance of being critical
        });
      }
      
      await Question.insertMany(newQuestions);
      totalCreated += 20;
    }
    
    console.log(`Successfully created ${totalCreated} questions!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
};

seedQuestions();
