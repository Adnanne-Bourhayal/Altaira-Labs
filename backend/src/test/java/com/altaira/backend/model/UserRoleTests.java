package com.altaira.backend.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserRoleTests {

    @Test
    void missingRoleNeverDefaultsToAdmin() {
        assertThatThrownBy(() -> UserRole.parse(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("required");

        assertThatThrownBy(() -> UserRole.parse("  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("required");
    }
}
