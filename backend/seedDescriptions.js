const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const Category = require('./models/Category');

const seedDescriptions = async () => {
  try {
    await connectDB();
    
    const categories = await Category.find();
    
    for (const category of categories) {
      if (!category.description) {
        let defaultDesc = `Đây là danh mục về ${category.name}`;
        if (category.name === "Biển báo giao thông") {
          defaultDesc = "Danh mục bao gồm các câu hỏi về hệ thống biển báo giao thông đường bộ Việt Nam.";
        } else if (category.name === "Luật giao thông") {
          defaultDesc = "Danh mục bao gồm các quy tắc, khái niệm và luật giao thông đường bộ cơ bản.";
        } else if (category.name === "Sa hình") {
          defaultDesc = "Danh mục bao gồm các tình huống sa hình thực tế để rèn luyện kỹ năng xử lý.";
        }
        
        category.description = defaultDesc;
        await category.save();
        console.log(`Updated description for: ${category.name}`);
      }
    }
    
    console.log(`Finished updating descriptions!`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating descriptions:', error);
    process.exit(1);
  }
};

seedDescriptions();
