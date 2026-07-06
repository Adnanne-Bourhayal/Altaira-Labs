package com.altaira.backend.dto.note;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateInternalNoteRequest {

    @NotBlank(message = "Note content is required")
    @Size(min = 2, max = 2000, message = "Note content must be between 2 and 2000 characters")
    private String content;

    @Size(max = 80, message = "Author must be at most 80 characters")
    private String author;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
}
