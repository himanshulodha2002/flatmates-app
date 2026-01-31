package com.flatmates.app.ui.util

import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalView

/**
 * Utility object for providing haptic feedback in the app.
 * Provides different types of feedback for various user interactions.
 */
object HapticFeedbackUtils {
    
    /**
     * Perform a light click haptic feedback.
     * Use for standard taps and button clicks.
     */
    fun performClick(view: View) {
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
    }
    
    /**
     * Perform a success/confirm haptic feedback.
     * Use when an action completes successfully (e.g., completing a todo).
     */
    fun performSuccess(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
        } else {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        }
    }
    
    /**
     * Perform an error/reject haptic feedback.
     * Use when an action fails or is rejected.
     */
    fun performError(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            view.performHapticFeedback(HapticFeedbackConstants.REJECT)
        } else {
            view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
        }
    }
    
    /**
     * Perform a long press haptic feedback.
     * Use for long press actions or drag start.
     */
    fun performLongPress(view: View) {
        view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
    }
    
    /**
     * Perform a text handle move haptic feedback.
     * Use for drag and swipe gestures.
     */
    fun performDrag(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            view.performHapticFeedback(HapticFeedbackConstants.TEXT_HANDLE_MOVE)
        } else {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        }
    }
}

/**
 * Composable function to get HapticFeedback instance for use in Compose.
 */
@Composable
fun rememberHapticFeedback(): HapticFeedback {
    return LocalHapticFeedback.current
}

/**
 * Composable function to get the current View for haptic feedback.
 */
@Composable
fun rememberView(): View {
    return LocalView.current
}

/**
 * Extension function to perform haptic feedback on View with a specific type.
 */
fun View.performHaptic(type: HapticType) {
    when (type) {
        HapticType.CLICK -> HapticFeedbackUtils.performClick(this)
        HapticType.SUCCESS -> HapticFeedbackUtils.performSuccess(this)
        HapticType.ERROR -> HapticFeedbackUtils.performError(this)
        HapticType.LONG_PRESS -> HapticFeedbackUtils.performLongPress(this)
        HapticType.DRAG -> HapticFeedbackUtils.performDrag(this)
    }
}

/**
 * Types of haptic feedback available in the app.
 */
enum class HapticType {
    CLICK,
    SUCCESS,
    ERROR,
    LONG_PRESS,
    DRAG
}
