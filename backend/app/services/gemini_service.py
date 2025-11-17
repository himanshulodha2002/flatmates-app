"""
Google Gemini AI service for smart categorization, OCR, and suggestions.
"""

import google.generativeai as genai
from typing import Optional, Dict, Any, List
import json
import base64
from PIL import Image
import io

from app.core.config import settings


class GeminiService:
    """Service for interacting with Google Gemini AI."""

    def __init__(self):
        """Initialize Gemini AI with API key."""
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def _is_available(self) -> bool:
        """Check if Gemini AI is configured and available."""
        return self.model is not None

    async def categorize_expense(
        self,
        description: str,
        amount: float,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Categorize an expense using AI.

        Args:
            description: The expense description
            amount: The expense amount
            context: Optional context about the household or user preferences

        Returns:
            Dict containing category, confidence, and reasoning
        """
        if not self._is_available():
            # Return default categorization if AI is not available
            return {
                "category": "Other",
                "subcategory": None,
                "confidence": 0.0,
                "reasoning": "AI categorization unavailable",
                "suggested_tags": []
            }

        # Define expense categories
        categories = [
            "Groceries",
            "Utilities",
            "Rent",
            "Transportation",
            "Entertainment",
            "Dining",
            "Healthcare",
            "Shopping",
            "Home Maintenance",
            "Other"
        ]

        # Build prompt
        prompt = f"""You are an expense categorization assistant for a flatmates expense tracking app.

Analyze the following expense and categorize it:
- Description: {description}
- Amount: ${amount:.2f}
{f"- Context: {context}" if context else ""}

Categories available: {', '.join(categories)}

Provide a JSON response with:
1. category: Main category from the list above
2. subcategory: More specific subcategory if applicable (or null)
3. confidence: Confidence score between 0.0 and 1.0
4. reasoning: Brief explanation for the categorization
5. suggested_tags: Array of 1-3 relevant tags for filtering

Example response format:
{{
    "category": "Groceries",
    "subcategory": "Fresh Produce",
    "confidence": 0.95,
    "reasoning": "Clearly a grocery purchase based on description",
    "suggested_tags": ["food", "weekly shopping"]
}}

Respond ONLY with the JSON object, no additional text."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()

            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            result = json.loads(result_text.strip())

            # Validate category
            if result.get("category") not in categories:
                result["category"] = "Other"

            # Ensure confidence is between 0 and 1
            result["confidence"] = max(0.0, min(1.0, result.get("confidence", 0.5)))

            return result

        except Exception as e:
            print(f"Error in AI categorization: {str(e)}")
            return {
                "category": "Other",
                "subcategory": None,
                "confidence": 0.0,
                "reasoning": f"Error: {str(e)}",
                "suggested_tags": []
            }

    async def extract_receipt_data(
        self,
        image_data: bytes,
        mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """
        Extract data from a receipt image using OCR.

        Args:
            image_data: Binary image data
            mime_type: MIME type of the image

        Returns:
            Dict containing extracted expense information
        """
        if not self._is_available():
            return {
                "success": False,
                "error": "AI service unavailable",
                "expenses": []
            }

        prompt = """You are a receipt OCR assistant for a flatmates expense tracking app.

Analyze this receipt image and extract the following information:
1. Store/merchant name
2. Date of purchase (in YYYY-MM-DD format)
3. Total amount
4. Individual line items with descriptions and amounts
5. Payment method if visible
6. Tax amount if shown

Provide a JSON response with this structure:
{
    "success": true,
    "merchant": "Store Name",
    "date": "2025-11-17",
    "total": 45.67,
    "currency": "USD",
    "items": [
        {"description": "Item 1", "amount": 10.00},
        {"description": "Item 2", "amount": 35.67}
    ],
    "tax": 3.45,
    "payment_method": "Credit Card",
    "confidence": 0.95,
    "notes": "Any additional relevant information"
}

If you cannot read the receipt clearly, set success to false and explain in the error field.
Respond ONLY with the JSON object, no additional text."""

        try:
            # Load image and create prompt with image
            image = Image.open(io.BytesIO(image_data))

            response = self.model.generate_content([prompt, image])
            result_text = response.text.strip()

            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            result = json.loads(result_text.strip())
            return result

        except Exception as e:
            print(f"Error in receipt OCR: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to process receipt: {str(e)}",
                "expenses": []
            }

    async def suggest_tasks(
        self,
        household_context: Dict[str, Any],
        existing_tasks: List[Dict[str, Any]],
        recent_expenses: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate smart task suggestions based on household context.

        Args:
            household_context: Information about the household
            existing_tasks: List of current tasks
            recent_expenses: Optional list of recent expenses for context

        Returns:
            List of suggested tasks with titles, descriptions, and priorities
        """
        if not self._is_available():
            return []

        # Build context
        context_parts = []
        context_parts.append(f"Household members: {household_context.get('member_count', 0)}")

        if existing_tasks:
            context_parts.append(f"\nCurrent tasks ({len(existing_tasks)}):")
            for task in existing_tasks[:5]:  # Include up to 5 recent tasks
                context_parts.append(f"- {task.get('title')} (Status: {task.get('status')})")

        if recent_expenses:
            context_parts.append(f"\nRecent expenses ({len(recent_expenses)}):")
            for expense in recent_expenses[:5]:
                context_parts.append(
                    f"- ${expense.get('amount', 0):.2f} for {expense.get('description', 'unknown')}"
                )

        prompt = f"""You are a helpful assistant for a flatmates household management app.

Based on the following context, suggest 3-5 practical tasks for the household:

{chr(10).join(context_parts)}

Consider:
1. Recurring household chores
2. Maintenance tasks based on the season
3. Financial tasks (bill payments, expense reviews)
4. Shopping needs
5. General household organization

Provide a JSON array of task suggestions with this structure:
[
    {{
        "title": "Task title (clear and concise)",
        "description": "Detailed description of what needs to be done",
        "priority": "low" | "medium" | "high",
        "category": "chores" | "financial" | "shopping" | "maintenance" | "other",
        "reasoning": "Why this task is suggested"
    }}
]

Make suggestions practical, actionable, and relevant to a shared living situation.
Respond ONLY with the JSON array, no additional text."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()

            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            suggestions = json.loads(result_text.strip())

            # Validate and normalize suggestions
            valid_priorities = ["low", "medium", "high"]
            for suggestion in suggestions:
                if suggestion.get("priority") not in valid_priorities:
                    suggestion["priority"] = "medium"

            return suggestions[:5]  # Return at most 5 suggestions

        except Exception as e:
            print(f"Error in task suggestions: {str(e)}")
            return []


# Create a singleton instance
gemini_service = GeminiService()
