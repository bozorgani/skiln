const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('../src/modules/courses/course.model');

async function fixCourseIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms-bozorgani';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Drop all existing text indexes
    try {
      const indexes = await Course.collection.getIndexes();
      console.log('Existing indexes:', Object.keys(indexes));
      
      for (const indexName of Object.keys(indexes)) {
        // حذف تمام index های text (با هر نامی که دارند)
        if (indexName.includes('text') || (indexes[indexName].text && typeof indexes[indexName].text === 'object')) {
          console.log(`Dropping index: ${indexName}`);
          try {
            await Course.collection.dropIndex(indexName);
            console.log(`Index ${indexName} dropped successfully`);
          } catch (dropError) {
            console.log(`Error dropping ${indexName}:`, dropError.message);
          }
        }
      }
      
      // همچنین سعی می‌کنیم index با نام خاص را هم حذف کنیم
      try {
        await Course.collection.dropIndex('title_text_description_text');
        console.log('Index title_text_description_text dropped (if existed)');
      } catch (e) {
        // Ignore if doesn't exist
      }
    } catch (error) {
      console.log('Error in index drop process:', error.message);
    }

    // Wait a bit to ensure indexes are dropped
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create new text index with default_language: 'none'
    try {
      await Course.collection.createIndex(
        { title: 'text', description: 'text' },
        { 
          default_language: 'none',
          name: 'title_description_text'
        }
      );
      console.log('✅ New text index created successfully with default_language: none');
    } catch (error) {
      // If index exists, try to drop it first
      if (error.message.includes('already exists')) {
        console.log('Index exists, trying to recreate...');
        try {
          await Course.collection.dropIndex('title_text_description_text');
          await Course.collection.createIndex(
            { title: 'text', description: 'text' },
            { 
              default_language: 'none',
              name: 'title_description_text'
            }
          );
          console.log('✅ Index recreated successfully');
        } catch (recreateError) {
          console.error('Error recreating index:', recreateError.message);
        }
      } else {
        console.error('Error creating new index:', error.message);
      }
    }

    // Verify indexes
    const finalIndexes = await Course.collection.getIndexes();
    console.log('Final indexes:', Object.keys(finalIndexes));

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixCourseIndex();

