# Example Quiz Templates

This folder contains example JSON files that you can use to quickly import quiz templates into Kuiz.

## 📁 Available Examples

### 1. `solar-system-quiz.json`
- **Category**: Science
- **Questions**: 8
- **Topics**: Planets, space facts, solar system

### 2. `programming-quiz.json`
- **Category**: Technology
- **Questions**: 8
- **Topics**: HTML, CSS, Python, programming basics

### 3. `movie-quiz.json`
- **Category**: Entertainment
- **Questions**: 6
- **Topics**: Famous movies, directors, actors

## 🚀 How to Use

### Method 1: Web Interface
1. Log in to Kuiz
2. Go to Dashboard
3. Click "Import Template"
4. Upload one of these JSON files or copy-paste the content
5. Click "Import"

### Method 2: API
```bash
curl -X POST http://localhost:3000/api/templates/import \
  -H "Content-Type: application/json" \
  -d @examples/solar-system-quiz.json
```

## 📝 JSON Format

Each quiz template follows this structure:

```json
{
  "title": "Quiz Title",
  "description": "Quiz description (optional)",
  "category": "Category Name",
  "isPublic": true,
  "questions": [
    {
      "text": "Question text",
      "type": "MULTIPLE_CHOICE",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "points": 10,
      "timeLimit": 15,
      "imageUrl": "https://example.com/image.jpg (optional)"
    }
  ]
}
```

### Question Types
- `MULTIPLE_CHOICE` - Single correct answer from multiple options
- `TRUE_FALSE` - True/False questions
- `CHECKBOX` - Multiple correct answers
- `TEXT_INPUT` - Text-based answer
- `IMAGE_CHOICE` - Multiple choice with images

## 🎨 Creating Your Own

You can create your own quiz templates by:
1. Copying one of these examples
2. Modifying the questions and answers
3. Importing through the web interface or API

## 💡 Tips

- Questions appear in the order listed in the JSON
- Points default to 10 if not specified
- Time limits are in seconds and optional
- Images can be added via URL
- Make sure `correctAnswer` matches exactly with one of the `options`
