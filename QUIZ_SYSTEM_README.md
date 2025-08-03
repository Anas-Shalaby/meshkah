# AI-Powered Islamic Quiz System

## Overview
This is an AI-powered Islamic quiz system that generates personalized questions based on users' reading history and Islamic knowledge. The system creates dynamic, educational quizzes that adapt to user preferences and learning levels.

## Features

### 🎯 Core Features
- **AI-Generated Questions**: Uses AI to create unique questions based on user's hadith reading history
- **Personalized Learning**: Adapts questions to user's preferred categories and difficulty levels
- **Multiple Categories**: Supports 6 Islamic categories (Aqeedah, Ibadah, Muamalat, Akhlaq, Seerah, Hadith)
- **Three Difficulty Levels**: Beginner, Intermediate, Advanced
- **Real-time Scoring**: Immediate feedback and detailed explanations
- **Progress Tracking**: Tracks user performance and learning progress

### 🏗️ Technical Features
- **Fallback System**: Pre-built questions when AI is unavailable
- **Session Management**: Complete quiz session lifecycle
- **Result Analytics**: Detailed performance analysis
- **Responsive Design**: Works on all devices
- **Arabic Interface**: Full Arabic language support

## Database Schema

### Tables Created
1. **quiz_sessions**: Stores quiz sessions and results
2. **quiz_questions**: Stores individual questions for each session
3. **quiz_answers**: Stores user answers and correctness
4. **quiz_categories**: Reference table for quiz categories
5. **quiz_difficulty_levels**: Reference table for difficulty levels

## API Endpoints

### Quiz Generation
```
POST /api/ai-quiz/generate-quiz
```
Generates AI-powered quiz questions based on user history.

**Parameters:**
- `category`: Quiz category (aqeedah, ibadah, etc.)
- `difficulty`: Difficulty level (beginner, intermediate, advanced)
- `question_count`: Number of questions to generate

### Quiz Session Management
```
POST /api/quiz-session/start
```
Starts a new quiz session.

```
POST /api/quiz-session/submit
```
Submits quiz answers and calculates results.

```
GET /api/quiz-session/history
```
Gets user's quiz history.

```
GET /api/quiz-session/stats
```
Gets user's quiz statistics.

### AI Integration
```
POST /api/ai/generate-quiz-question
```
AI endpoint for generating individual quiz questions.

## Frontend Components

### AIQuiz Component
Located at: `frontend/src/components/AIQuiz.jsx`

**Features:**
- Interactive quiz interface
- Progress tracking
- Real-time answer validation
- Detailed results display
- Responsive design

### QuizPage Component
Located at: `frontend/src/pages/QuizPage.jsx`

**Features:**
- Complete quiz page with SEO
- Category and difficulty selection
- Modern UI with Arabic support

## Installation & Setup

### 1. Database Setup
```sql
-- Run the quiz schema
mysql -u root -p hadith_auth < backend/database/quiz_schema.sql
```

### 2. Backend Routes
The quiz routes are automatically loaded in `backend/index.js`:
```javascript
app.use("/api/ai-quiz", require("./routes/ai-quiz"));
app.use("/api/quiz-session", require("./routes/quiz-session"));
```

### 3. Frontend Integration
Add the quiz route to your React app:
```javascript
<Route path="/quiz" element={<QuizPage />} />
```

## Usage

### For Users
1. Navigate to `/quiz` in your application
2. Select a category (Aqeedah, Ibadah, etc.)
3. Choose difficulty level (Beginner, Intermediate, Advanced)
4. Start the quiz
5. Answer questions and view detailed results

### For Developers
1. **Adding New Categories**: Update `quiz_categories` table
2. **Modifying Difficulty Levels**: Update `quiz_difficulty_levels` table
3. **Customizing AI Prompts**: Modify the context in `aiProxy.js`
4. **Adding Fallback Questions**: Update `generateFallbackQuestion()` function

## AI Integration Details

### Question Generation Process
1. **User History Analysis**: Analyzes user's hadith reading patterns
2. **AI Context Preparation**: Creates personalized context for AI
3. **Question Generation**: AI generates questions based on context
4. **Response Parsing**: Parses AI response into structured format
5. **Fallback Handling**: Uses pre-built questions if AI fails

### AI Prompt Structure
```
أنت مدرس إسلامي متخصص في إنشاء أسئلة اختبارية للأحاديث النبوية.

معلومات الطالب:
- الفئة المفضلة: [category]
- المستوى: [difficulty]
- الأحاديث التي قرأها: [user_history]

المطلوب: إنشاء سؤال اختبار متعدد الخيارات (4 خيارات) مع:
1. سؤال واضح ومفهوم
2. 4 خيارات إجابة (أ، ب، ج، د)
3. إجابة صحيحة واحدة
4. شرح للإجابة
5. مرجع الحديث المستخدم
```

## Customization

### Adding New Categories
1. Add category to `quiz_categories` table
2. Update frontend categories array in `AIQuiz.jsx`
3. Add fallback questions in `generateFallbackQuestion()`

### Modifying AI Behavior
1. Update context in `aiProxy.js` `generate-quiz-question` endpoint
2. Modify response parsing in `parseAIQuizResponse()`
3. Adjust fallback questions for better coverage

### Styling Customization
The quiz uses Tailwind CSS classes. Modify the styling in:
- `AIQuiz.jsx` for quiz interface
- `QuizPage.jsx` for page layout

## Testing

### Manual Testing
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `/quiz`
4. Test different categories and difficulty levels

### Automated Testing
Run the test script:
```bash
cd backend && node test-quiz.js
```

## Performance Considerations

### AI Rate Limiting
- Uses existing AI proxy rate limiting
- Fallback system prevents service disruption
- Caches quiz sessions for better performance

### Database Optimization
- Indexed foreign keys for fast queries
- JSON storage for flexible question options
- Efficient session management

## Security Features

### Authentication
- All quiz endpoints require authentication
- User session validation
- Secure token-based access

### Data Protection
- User data isolation
- Secure answer submission
- Protected AI API access

## Future Enhancements

### Planned Features
1. **Quiz Analytics Dashboard**: Detailed performance insights
2. **Social Features**: Share results with friends
3. **Achievement System**: Islamic learning milestones
4. **Multi-language Support**: English and Urdu versions
5. **Offline Mode**: Download quizzes for offline use

### Technical Improvements
1. **Caching**: Redis caching for better performance
2. **CDN Integration**: Faster content delivery
3. **Mobile App**: Native mobile application
4. **Voice Integration**: Voice-based quiz answering

## Troubleshooting

### Common Issues

**1. AI Not Responding**
- Check AI API credentials
- Verify rate limiting
- Check fallback questions are working

**2. Database Errors**
- Verify database schema is created
- Check foreign key constraints
- Ensure user authentication is working

**3. Frontend Issues**
- Check React component imports
- Verify API endpoint URLs
- Test with different browsers

### Debug Mode
Enable debug logging in backend:
```javascript
console.log('Quiz generation:', quizData);
console.log('AI response:', aiResponse);
```

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready 