package com.lmfinanz.budgets.application.service;

import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemPaymentRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemResponse;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetSummaryRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetSummaryResponse;
import com.lmfinanz.budgets.application.port.in.BudgetSummaryUseCase;
import com.lmfinanz.budgets.application.port.in.BudgetUseCase;
import com.lmfinanz.budgets.application.port.out.BudgetRepositoryPort;
import com.lmfinanz.budgets.application.port.out.BudgetSummaryRepositoryPort;
import com.lmfinanz.budgets.domain.model.MonthlyBudgetItem;
import com.lmfinanz.budgets.domain.model.MonthlyBudgetSummary;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BudgetService implements BudgetUseCase, BudgetSummaryUseCase {

    private final BudgetRepositoryPort budgetRepository;
    private final BudgetSummaryRepositoryPort budgetSummaryRepository;
    private final ReferenceDataRepositoryPort referenceDataRepository;

    public BudgetService(
            BudgetRepositoryPort budgetRepository,
            BudgetSummaryRepositoryPort budgetSummaryRepository,
            ReferenceDataRepositoryPort referenceDataRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.budgetSummaryRepository = budgetSummaryRepository;
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public BudgetItemResponse create(UUID userId, BudgetItemRequest request) {
        validateReferenceData(request.currencyCode(), request.countryCode());
        MonthlyBudgetItem item = new MonthlyBudgetItem(
                userId,
                request.budgetYear(),
                request.budgetMonth(),
                request.countryCode(),
                request.currencyCode(),
                request.name().trim(),
                request.plannedAmount(),
                request.actualAmount(),
                request.dueDay(),
                request.dueDate(),
                request.paid(),
                request.paidDate(),
                normalizeText(request.notes())
        );
        return toResponse(budgetRepository.save(item));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetItemResponse> list(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode) {
        return budgetRepository.findAllByPeriod(userId, budgetYear, budgetMonth).stream()
                .filter((item) -> countryCode == null || item.getCountryCode().equals(countryCode))
                .filter((item) -> currencyCode == null || item.getCurrencyCode().equals(currencyCode))
                .map(this::toResponse)
                .toList();
    }

    @Override
    public BudgetItemResponse update(UUID userId, UUID itemId, BudgetItemRequest request) {
        validateReferenceData(request.currencyCode(), request.countryCode());
        MonthlyBudgetItem item = findItem(userId, itemId);
        item.update(
                request.budgetYear(),
                request.budgetMonth(),
                request.countryCode(),
                request.currencyCode(),
                request.name().trim(),
                request.plannedAmount(),
                request.actualAmount(),
                request.dueDay(),
                request.dueDate(),
                request.paid(),
                request.paidDate(),
                normalizeText(request.notes())
        );
        return toResponse(budgetRepository.save(item));
    }

    @Override
    public BudgetItemResponse markPaid(UUID userId, UUID itemId, BudgetItemPaymentRequest request) {
        MonthlyBudgetItem item = findItem(userId, itemId);
        item.markPaid(request.actualAmount(), request.paidDate());
        return toResponse(budgetRepository.save(item));
    }

    @Override
    public BudgetItemResponse markUnpaid(UUID userId, UUID itemId) {
        MonthlyBudgetItem item = findItem(userId, itemId);
        item.markUnpaid();
        return toResponse(budgetRepository.save(item));
    }

    @Override
    public void delete(UUID userId, UUID itemId) {
        MonthlyBudgetItem item = findItem(userId, itemId);
        budgetRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetSummaryResponse get(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode) {
        validateReferenceData(currencyCode, countryCode);
        validatePeriod(budgetMonth);
        return budgetSummaryRepository.findByPeriod(userId, budgetYear, budgetMonth, countryCode, currencyCode)
                .map(this::toSummaryResponse)
                .orElseGet(() -> new BudgetSummaryResponse(
                        null,
                        budgetYear,
                        budgetMonth,
                        countryCode,
                        currencyCode,
                        BigDecimal.ZERO,
                        null
                ));
    }

    @Override
    public BudgetSummaryResponse save(UUID userId, BudgetSummaryRequest request) {
        validateReferenceData(request.currencyCode(), request.countryCode());
        validatePeriod(request.budgetMonth());
        MonthlyBudgetSummary summary = budgetSummaryRepository
                .findByPeriod(
                        userId,
                        request.budgetYear(),
                        request.budgetMonth(),
                        request.countryCode(),
                        request.currencyCode()
                )
                .orElseGet(() -> new MonthlyBudgetSummary(
                        userId,
                        request.budgetYear(),
                        request.budgetMonth(),
                        request.countryCode(),
                        request.currencyCode(),
                        BigDecimal.ZERO,
                        null
                ));
        summary.update(request.incomeAmount(), normalizeText(request.notes()));
        return toSummaryResponse(budgetSummaryRepository.save(summary));
    }

    private MonthlyBudgetItem findItem(UUID userId, UUID itemId) {
        return budgetRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new NotFoundException("Budget item not found"));
    }

    private void validateReferenceData(String currencyCode, String countryCode) {
        if (referenceDataRepository.findCurrencyByCode(currencyCode).isEmpty()) {
            throw new DomainException("Unsupported currency: " + currencyCode);
        }
        if (referenceDataRepository.findCountryByCode(countryCode).isEmpty()) {
            throw new DomainException("Unsupported country: " + countryCode);
        }
    }

    private void validatePeriod(int budgetMonth) {
        if (budgetMonth < 1 || budgetMonth > 12) {
            throw new DomainException("Budget month must be between 1 and 12");
        }
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BudgetItemResponse toResponse(MonthlyBudgetItem item) {
        return new BudgetItemResponse(
                item.getId(),
                item.getBudgetYear(),
                item.getBudgetMonth(),
                item.getCountryCode(),
                item.getCurrencyCode(),
                item.getName(),
                item.getPlannedAmount(),
                item.getActualAmount(),
                item.remainingAmount(),
                item.getDueDay(),
                item.getDueDate(),
                item.isPaid(),
                item.getPaidDate(),
                item.getNotes()
        );
    }

    private BudgetSummaryResponse toSummaryResponse(MonthlyBudgetSummary summary) {
        return new BudgetSummaryResponse(
                summary.getId(),
                summary.getBudgetYear(),
                summary.getBudgetMonth(),
                summary.getCountryCode(),
                summary.getCurrencyCode(),
                summary.getIncomeAmount(),
                summary.getNotes()
        );
    }
}
