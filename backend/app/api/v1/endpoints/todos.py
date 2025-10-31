"""
Todo endpoints for managing collaborative todo lists.
"""
from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_user_household
from app.models.user import User
from app.models.household import Household, household_members
from app.models.todo import TodoList, TodoItem
from app.schemas.todo import (
    TodoListCreate,
    TodoListResponse,
    TodoListWithItemsResponse,
    TodoItemCreate,
    TodoItemUpdate,
    TodoItemResponse,
)

router = APIRouter()


@router.post("/lists", response_model=TodoListResponse, status_code=status.HTTP_201_CREATED)
def create_todo_list(
    todo_list_data: TodoListCreate,
    current_user: User = Depends(get_current_user),
    household: Household = Depends(get_user_household),
    db: Session = Depends(get_db),
):
    """
    Create a new todo list for the current user's household.
    """
    todo_list = TodoList(
        household_id=household.id,
        name=todo_list_data.name,
        created_by=current_user.id,
    )
    db.add(todo_list)
    db.commit()
    db.refresh(todo_list)
    return todo_list


@router.get("/lists", response_model=List[TodoListWithItemsResponse])
def get_todo_lists(
    household: Household = Depends(get_user_household),
    db: Session = Depends(get_db),
):
    """
    Get all todo lists for the current user's household.
    """
    todo_lists = db.query(TodoList).filter(
        TodoList.household_id == household.id
    ).all()
    return todo_lists


@router.get("/lists/{list_id}", response_model=TodoListWithItemsResponse)
def get_todo_list(
    list_id: UUID,
    household: Household = Depends(get_user_household),
    db: Session = Depends(get_db),
):
    """
    Get a specific todo list by ID.
    """
    todo_list = db.query(TodoList).filter(
        TodoList.id == list_id,
        TodoList.household_id == household.id
    ).first()
    
    if not todo_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo list not found"
        )
    
    return todo_list


@router.post("/lists/{list_id}/items", response_model=TodoItemResponse, status_code=status.HTTP_201_CREATED)
def create_todo_item(
    list_id: UUID,
    item_data: TodoItemCreate,
    current_user: User = Depends(get_current_user),
    household: Household = Depends(get_user_household),
    db: Session = Depends(get_db),
):
    """
    Create a new todo item in a list.
    """
    # Verify the list exists and belongs to user's household
    todo_list = db.query(TodoList).filter(
        TodoList.id == list_id,
        TodoList.household_id == household.id
    ).first()
    
    if not todo_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo list not found"
        )
    
    # If assigned user is specified, verify they are a household member
    if item_data.assigned_user_id:
        is_member = db.query(household_members).filter(
            household_members.c.household_id == household.id,
            household_members.c.user_id == item_data.assigned_user_id
        ).first()
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of the household"
            )
    
    todo_item = TodoItem(
        list_id=list_id,
        title=item_data.title,
        description=item_data.description,
        due_date=item_data.due_date,
        priority=item_data.priority,
        assigned_user_id=item_data.assigned_user_id,
    )
    db.add(todo_item)
    db.commit()
    db.refresh(todo_item)
    return todo_item


@router.patch("/items/{item_id}", response_model=TodoItemResponse)
def update_todo_item(
    item_id: UUID,
    item_update: TodoItemUpdate,
    current_user: User = Depends(get_current_user),
    household: Household = Depends(get_user_household),
    db: Session = Depends(get_db),
):
    """
    Update a todo item. Assignee can toggle completion, others can edit fields.
    """
    # Get the item and verify it belongs to a list in the user's household
    todo_item = db.query(TodoItem).join(TodoList).filter(
        TodoItem.id == item_id,
        TodoList.household_id == household.id
    ).first()
    
    if not todo_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo item not found"
        )
    
    # Check permissions for toggling completion
    if item_update.is_completed is not None:
        # Assignee can toggle completion
        if todo_item.assigned_user_id and todo_item.assigned_user_id != current_user.id:
            # Check if current user is the creator or owner
            todo_list = db.query(TodoList).filter(TodoList.id == todo_item.list_id).first()
            is_creator = todo_list.created_by == current_user.id
            is_owner = household.owner_id == current_user.id
            
            if not (is_creator or is_owner):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the assignee, list creator, or household owner can toggle completion"
                )
        
        todo_item.is_completed = item_update.is_completed
        todo_item.completed_at = datetime.utcnow() if item_update.is_completed else None
    
    # Update other fields
    if item_update.title is not None:
        todo_item.title = item_update.title
    if item_update.description is not None:
        todo_item.description = item_update.description
    if item_update.due_date is not None:
        todo_item.due_date = item_update.due_date
    if item_update.priority is not None:
        todo_item.priority = item_update.priority
    if item_update.assigned_user_id is not None:
        # Verify the user is a household member
        is_member = db.query(household_members).filter(
            household_members.c.household_id == household.id,
            household_members.c.user_id == item_update.assigned_user_id
        ).first()
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of the household"
            )
        todo_item.assigned_user_id = item_update.assigned_user_id
    
    db.commit()
    db.refresh(todo_item)
    return todo_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    household: Household = Depends(get_user_household),
    db: Session = Depends(get_db),
):
    """
    Delete a todo item. Only the list creator or household owner can delete.
    """
    # Get the item and verify it belongs to a list in the user's household
    todo_item = db.query(TodoItem).join(TodoList).filter(
        TodoItem.id == item_id,
        TodoList.household_id == household.id
    ).first()
    
    if not todo_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo item not found"
        )
    
    # Check permissions - only owner or creator can delete
    todo_list = db.query(TodoList).filter(TodoList.id == todo_item.list_id).first()
    is_creator = todo_list.created_by == current_user.id
    is_owner = household.owner_id == current_user.id
    
    if not (is_creator or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the list creator or household owner can delete items"
        )
    
    db.delete(todo_item)
    db.commit()
    return None
