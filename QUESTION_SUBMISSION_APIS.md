# Question Submission APIs

## Overview
APIs for users to submit their answers to onboarding and daily check-in questions.

---

## Onboarding Questions Submission

### POST `/api/app/onboarding-questions/submit`
Submit answers to onboarding questions.

**Authentication:** Bearer token required

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439011",
      "answer": "Option 1"  // Can be string, array, number, date, or object
    },
    {
      "questionId": "507f1f77bcf86cd799439012",
      "answer": ["Option A", "Option B"]  // For multi-select
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Onboarding answers submitted successfully",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439011",
      "questionTitle": "What is your goal?",
      "answer": "Option 1",
      "answeredAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid JSON body or empty answers array
- `401 Unauthorized`: Missing or invalid token
- `400 Bad Request`: Some questions are invalid or inactive
- `500 Internal Server Error`: Server error

**Notes:**
- Validates that all questions exist and are active
- Replaces existing answers for the same questions
- Only stores questionId (normalized approach) - questionTitle is fetched when needed

---

### GET `/api/app/onboarding-questions/submit`
Get user's onboarding answers.

**Authentication:** Bearer token required

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439011",
      "questionTitle": "What is your goal?",
      "answer": "Option 1",
      "answeredAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

## Daily Check-In Questions Submission

### POST `/api/app/daily-checkin-questions/submit`
Submit answers to daily check-in questions.

**Authentication:** Bearer token required

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439021",
      "answer": "5"  // Can be string, array, number, or object
    },
    {
      "questionId": "507f1f77bcf86cd799439022",
      "answer": "Feeling great today!"
    }
  ],
  "checkInDate": "2024-01-15"  // Optional, defaults to today
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Daily check-in answers submitted successfully",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439021",
      "questionTitle": "How are you feeling?",
      "answer": "5",
      "answeredAt": "2024-01-15T10:30:00.000Z",
      "checkInDate": "2024-01-15T00:00:00.000Z"
    }
  ],
  "streak": 5
}
```

**Error Responses:**
- `400 Bad Request`: Invalid JSON body or empty answers array
- `401 Unauthorized`: Missing or invalid token
- `400 Bad Request`: Some questions are invalid or inactive
- `500 Internal Server Error`: Server error

**Notes:**
- Validates that all questions exist and are active
- Replaces existing answers for the same check-in date
- Automatically calculates and updates user's streak:
  - Increments streak if check-in is consecutive day
  - Resets to 1 if streak is broken
  - Sets to 1 for first check-in
- Updates user's activity (lastCheckIn, totalCheckIns)
- Stores check-in date for filtering by date

---

### GET `/api/app/daily-checkin-questions/submit`
Get user's daily check-in answers.

**Authentication:** Bearer token required

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD format)
  - Example: `?date=2024-01-15`

**Response (200 OK):**
```json
{
  "success": true,
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439021",
      "questionTitle": "How are you feeling?",
      "answer": "5",
      "answeredAt": "2024-01-15T10:30:00.000Z",
      "checkInDate": "2024-01-15T00:00:00.000Z"
    }
  ],
  "streak": 5
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

**Notes:**
- Returns all answers if no date filter is provided
- Returns only answers for the specified date if date parameter is provided
- Always includes current streak in response

---

## Data Model Updates

### User Model
Added `dailyCheckinAnswers` field to User model:

```typescript
dailyCheckinAnswers?: Array<{
    questionId: string;
    answer: any; // can be string, array, number
    answeredAt: Date;
    checkInDate: Date; // date of the check-in
  }>;
```

The `onboardingAnswers` field already existed:
```typescript
onboardingAnswers?: Array<{
    questionId: string;
    answer: any; // can be string, array, date, number
    answeredAt: Date;
  }>;
```

---

## Example Usage

### Submit Onboarding Answers
```bash
curl -X POST http://localhost:3000/api/app/onboarding-questions/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "507f1f77bcf86cd799439011",
        "answer": "Lose weight"
      },
      {
        "questionId": "507f1f77bcf86cd799439012",
        "answer": ["Morning", "Evening"]
      }
    ]
  }'
```

### Submit Daily Check-In Answers
```bash
curl -X POST http://localhost:3000/api/app/daily-checkin-questions/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "507f1f77bcf86cd799439021",
        "answer": "7"
      },
      {
        "questionId": "507f1f77bcf86cd799439022",
        "answer": "Feeling motivated!"
      }
    ],
    "checkInDate": "2024-01-15"
  }'
```

### Get Daily Check-In Answers for Specific Date
```bash
curl -X GET "http://localhost:3000/api/app/daily-checkin-questions/submit?date=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Features

✅ **Authentication**: All endpoints require Bearer token authentication  
✅ **Validation**: Validates questions exist and are active  
✅ **Data Integrity**: Replaces existing answers to prevent duplicates  
✅ **Streak Tracking**: Automatically calculates and updates user streak  
✅ **Activity Tracking**: Updates user's last check-in and total check-ins  
✅ **Date Filtering**: Can filter daily check-in answers by date  
✅ **Question Titles**: Fetched dynamically by questionId when needed (normalized data model)  

