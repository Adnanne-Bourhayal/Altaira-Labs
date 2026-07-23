package com.altaira.backend.dto.commercial;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateCheckoutRequest {
    @Min(value = 100, message = "Payment amount must be at least 1.00")
    @Max(value = 100000000, message = "Payment amount is above the supported limit")
    private long amountMinor;

    @Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a three-letter code")
    private String currency = "EUR";

    @Size(max = 500, message = "Payment description must be at most 500 characters")
    private String description;

    public long getAmountMinor() { return amountMinor; }
    public void setAmountMinor(long amountMinor) { this.amountMinor = amountMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
