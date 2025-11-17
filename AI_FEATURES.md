# Google Gemini AI Integration

This document describes the Google Gemini AI features integrated into the Flatmates App.

## Overview

The Flatmates App now uses Google Gemini AI to provide intelligent features for expense tracking and task management:

1. **Smart Expense Categorization** - Automatically categorize expenses using AI
2. **Receipt OCR** - Extract expense data from receipt images
3. **Smart Task Suggestions** - Get AI-powered task suggestions based on household context

## Features

### 1. Smart Expense Categorization

AI-powered automatic categorization of expenses based on title, description, and amount.

#### How it works:
- When creating an expense, the AI analyzes the expense details
- Suggests an appropriate category from predefined options
- Provides confidence score and reasoning for the categorization
- Can be triggered manually or automatically

#### API Endpoint:
```
POST /api/v1/expenses/ai/categorize
```

**Request:**
```json
{
  "description": "Whole Foods groceries",
  "amount": 85.50,
  "context": "Weekly shopping"
}
```

**Response:**
```json
{
  "category": "Groceries",
  "subcategory": "Weekly Shopping",
  "confidence": 0.95,
  "reasoning": "Clearly a grocery purchase based on merchant and description",
  "suggested_tags": ["food", "weekly shopping", "essentials"]
}
```

#### Categories:
- Groceries
- Utilities
- Rent
- Transportation
- Entertainment
- Dining
- Healthcare
- Shopping
- Home Maintenance
- Other

### 2. Receipt OCR (Optical Character Recognition)

Extract expense information from receipt images using AI vision capabilities.

#### How it works:
- Upload a receipt image or take a photo
- AI extracts merchant name, date, total, line items, and more
- Automatically populates expense form with extracted data
- Shows confidence score for accuracy

#### API Endpoint:
```
POST /api/v1/expenses/ai/ocr
```

**Request:**
- Multipart form data with receipt image file

**Response:**
```json
{
  "success": true,
  "merchant": "Whole Foods Market",
  "date": "2025-11-17",
  "total": 85.50,
  "currency": "USD",
  "items": [
    {"description": "Organic Bananas", "amount": 5.99},
    {"description": "Chicken Breast", "amount": 12.50},
    {"description": "Milk 2%", "amount": 4.99}
  ],
  "tax": 6.50,
  "payment_method": "Credit Card",
  "confidence": 0.92,
  "notes": "Receipt clearly visible and readable"
}
```

### 3. Smart Task Suggestions

Get AI-powered task suggestions based on household context, existing tasks, and recent expenses.

#### How it works:
- AI analyzes household member count, current tasks, and spending patterns
- Generates practical task suggestions relevant to shared living
- Categorizes tasks by type (chores, financial, shopping, maintenance)
- Assigns appropriate priority levels

#### API Endpoint:
```
POST /api/v1/expenses/ai/suggest-tasks?household_id={household_id}
```

**Response:**
```json
{
  "suggestions": [
    {
      "title": "Review Monthly Expenses",
      "description": "Review and discuss shared expenses from the past month to ensure fair distribution",
      "priority": "medium",
      "category": "financial",
      "reasoning": "Based on recent expense activity, it's a good time to review spending"
    },
    {
      "title": "Clean Common Areas",
      "description": "Deep clean kitchen and living room, focusing on high-traffic areas",
      "priority": "high",
      "category": "chores",
      "reasoning": "Regular household maintenance task for shared living spaces"
    }
  ],
  "count": 2
}
```

## Mobile App Features

### Expense Screen Features

1. **AI-Powered Expense Creation**
   - Tap "+" button to create new expense
   - AI automatically suggests category as you type
   - Manual override available
   - See AI confidence and reasoning

2. **Receipt Scanning**
   - Tap camera icon to take photo of receipt
   - Tap image icon to upload from gallery
   - AI extracts all expense details
   - Review and edit before saving

3. **Expense Statistics**
   - View total expenses and amount
   - See monthly spending
   - Category breakdown
   - AI-categorized expenses highlighted

### Todos Screen Features

1. **AI Task Suggestions Button**
   - Green "AI Suggestions" chip in filters
   - Click to get personalized task suggestions
   - Based on household context and recent activity
   - One-click task creation from suggestions

2. **Smart Suggestions Display**
   - Shows suggested tasks with priority
   - Includes category and reasoning
   - Create tasks directly from suggestions
   - Suggestions update based on household changes

## Configuration

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

The following packages are added:
- `google-generativeai==0.8.3` - Gemini AI SDK
- `pillow==10.2.0` - Image processing for OCR

2. **Set Environment Variables:**

Add to `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Run Database Migrations:**
```bash
cd backend
alembic upgrade head
```

This creates the `expenses` table with AI metadata fields.

### Mobile App Setup

1. **Install Dependencies:**
```bash
cd mobile
npm install
# or
yarn install
```

New dependency added:
- `expo-image-picker` - For camera and gallery access

2. **Permissions Required:**
- Camera access (for receipt scanning)
- Photo library access (for receipt upload)

These are automatically requested when features are used.

## Architecture

### Backend Architecture

```
backend/
├── app/
│   ├── services/
│   │   └── gemini_service.py      # AI service integration
│   ├── models/
│   │   └── expense.py             # Expense model with AI fields
│   ├── schemas/
│   │   └── expense.py             # API request/response schemas
│   └── api/v1/endpoints/
│       └── expenses.py            # Expense endpoints with AI features
```

**Key Components:**

1. **GeminiService** (`gemini_service.py`)
   - Singleton service for AI operations
   - Handles categorization, OCR, and suggestions
   - Configurable via environment variables
   - Graceful fallback if AI unavailable

2. **Expense Model** (`expense.py`)
   - Stores AI categorization metadata
   - Includes confidence scores and reasoning
   - Supports receipt data storage
   - Tracks AI vs manual categorization

3. **API Endpoints** (`expenses.py`)
   - CRUD operations for expenses
   - AI categorization endpoint
   - Receipt OCR endpoint
   - Task suggestions endpoint

### Frontend Architecture

```
mobile/
├── src/
│   ├── types/
│   │   └── index.ts               # Type definitions
│   └── store/services/
│       └── expenseApi.ts          # RTK Query API hooks
└── app/(tabs)/
    ├── expenses.tsx               # Expense screen with AI features
    └── todos.tsx                  # Todos screen with suggestions
```

**Key Components:**

1. **Expense API** (`expenseApi.ts`)
   - RTK Query hooks for all expense operations
   - AI categorization mutation
   - Receipt OCR mutation
   - Task suggestions mutation

2. **Expense Screen** (`expenses.tsx`)
   - FAB menu for multiple creation options
   - AI categorization integration
   - Receipt scanning with preview
   - Real-time AI suggestions display

3. **Todos Screen** (`todos.tsx`)
   - AI Suggestions filter chip
   - Suggestions modal with one-click creation
   - Task categorization by AI

## Testing

### Testing AI Features

1. **Test Smart Categorization:**
   - Create expense with description "Trader Joe's groceries"
   - Should suggest "Groceries" category
   - Verify confidence score is high

2. **Test Receipt OCR:**
   - Take photo of clear receipt
   - Verify merchant name extraction
   - Check total amount accuracy
   - Confirm line items parsed correctly

3. **Test Task Suggestions:**
   - Click "AI Suggestions" in Todos
   - Verify suggestions are relevant
   - Create task from suggestion
   - Confirm task appears in list

### Error Handling

All AI features include error handling:

1. **Network Errors:**
   - Graceful fallback to manual entry
   - User-friendly error messages
   - Retry capability

2. **AI Service Unavailable:**
   - Default categorization to "Other"
   - Manual category selection available
   - No blocking of core functionality

3. **Low Confidence Results:**
   - Show confidence scores to users
   - Allow manual override
   - Provide reasoning for transparency

## Performance Considerations

1. **API Rate Limits:**
   - Gemini API has rate limits
   - Implement request queuing if needed
   - Cache common categorizations

2. **Image Processing:**
   - Compress images before upload
   - Max file size: 5MB recommended
   - Support JPEG, PNG formats

3. **Response Times:**
   - Categorization: ~1-2 seconds
   - OCR: ~2-4 seconds (varies by image)
   - Suggestions: ~2-3 seconds

## Security & Privacy

1. **API Key Protection:**
   - Store GEMINI_API_KEY in environment variables
   - Never commit to version control
   - Rotate keys periodically

2. **Data Privacy:**
   - Receipt images processed server-side
   - No permanent storage of receipt images (optional feature)
   - User data stays within household

3. **Input Validation:**
   - Validate file types for uploads
   - Sanitize expense descriptions
   - Limit file sizes

## Future Enhancements

Potential improvements for AI features:

1. **Smart Expense Splitting:**
   - AI-suggested fair split calculations
   - Pattern recognition for recurring splits
   - Member preference learning

2. **Budget Recommendations:**
   - AI-powered budget suggestions
   - Spending pattern analysis
   - Category-wise limits

3. **Predictive Analytics:**
   - Forecast monthly expenses
   - Identify unusual spending
   - Suggest cost-saving opportunities

4. **Natural Language Processing:**
   - "Add $50 groceries to household" command
   - Voice input for expenses
   - Smart search and filtering

## Troubleshooting

### Common Issues

1. **AI Categorization Not Working:**
   - Check GEMINI_API_KEY is set correctly
   - Verify internet connection
   - Check Gemini API quota/billing

2. **Receipt OCR Failing:**
   - Ensure image is clear and well-lit
   - Check file format (JPEG/PNG)
   - Verify file size under 5MB
   - Try cropping to receipt only

3. **Task Suggestions Empty:**
   - Ensure household has some expenses/tasks
   - Check AI service is available
   - Verify household_id is correct

### Debug Mode

Enable debug logging in `gemini_service.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

This will print:
- AI request/response details
- Error stack traces
- Performance metrics

## Support

For issues or questions:
1. Check logs in backend console
2. Review API responses in network tab
3. Test with sample data first
4. Verify all dependencies installed

## Credits

- **Google Gemini AI**: Powering categorization, OCR, and suggestions
- **Expo Image Picker**: Mobile camera/gallery integration
- **React Native Paper**: Material Design UI components
