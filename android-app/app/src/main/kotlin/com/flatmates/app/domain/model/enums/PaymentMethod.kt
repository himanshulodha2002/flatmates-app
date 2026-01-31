package com.flatmates.app.domain.model.enums

enum class PaymentMethod(val displayName: String) {
    CASH("Cash"),
    CARD("Card"),
    BANK_TRANSFER("Bank Transfer"),
    DIGITAL_WALLET("Digital Wallet"),
    OTHER("Other");
    
    companion object {
        fun fromString(value: String): PaymentMethod = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: CASH
    }
}
