package com.lmfinanz.savings.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "savings_goals")
public class SavingsGoal extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal targetAmount;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal currentAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SavingsGoalStatus status = SavingsGoalStatus.ACTIVE;

    protected SavingsGoal() {
    }

    public SavingsGoal(UUID userId, String name, String currencyCode, BigDecimal targetAmount, LocalDate deadline) {
        this.userId = userId;
        this.name = name;
        this.currencyCode = currencyCode;
        this.targetAmount = targetAmount;
        this.deadline = deadline;
    }
}
