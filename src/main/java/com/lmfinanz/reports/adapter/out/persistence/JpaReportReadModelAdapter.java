package com.lmfinanz.reports.adapter.out.persistence;

import com.lmfinanz.reports.adapter.in.web.dto.FinancialReportResponse;
import com.lmfinanz.reports.adapter.in.web.dto.ReportBreakdownItem;
import com.lmfinanz.reports.adapter.in.web.dto.ReportPeriod;
import com.lmfinanz.reports.application.port.out.ReportReadModelPort;
import com.lmfinanz.transactions.domain.model.Transaction;
import com.lmfinanz.transactions.domain.model.TransactionStatus;
import com.lmfinanz.transactions.domain.model.TransactionType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaReportReadModelAdapter implements ReportReadModelPort {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final EntityManager entityManager;

    public JpaReportReadModelAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public FinancialReportResponse summarize(UUID userId, ReportPeriod period, LocalDate from, LocalDate to) {
        List<Transaction> transactions = findPostedTransactions(userId, from, to, null, null);
        return buildReport(period, from, to, transactions, transaction -> periodLabel(period, transaction));
    }

    @Override
    public FinancialReportResponse summarizeByCurrency(UUID userId, String currencyCode, LocalDate from, LocalDate to) {
        List<Transaction> transactions = findPostedTransactions(userId, from, to, currencyCode, null);
        return buildReport(ReportPeriod.CUSTOM, from, to, transactions, Transaction::getCountryCode);
    }

    @Override
    public FinancialReportResponse summarizeByCountry(UUID userId, String countryCode, LocalDate from, LocalDate to) {
        List<Transaction> transactions = findPostedTransactions(userId, from, to, null, countryCode);
        return buildReport(ReportPeriod.CUSTOM, from, to, transactions, Transaction::getCurrencyCode);
    }

    private List<Transaction> findPostedTransactions(
            UUID userId,
            LocalDate from,
            LocalDate to,
            String currencyCode,
            String countryCode
    ) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Transaction> query = builder.createQuery(Transaction.class);
        Root<Transaction> root = query.from(Transaction.class);
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(builder.equal(root.get("userId"), userId));
        predicates.add(builder.equal(root.get("status"), TransactionStatus.POSTED));
        predicates.add(builder.between(root.get("transactionDate"), from, to));
        if (currencyCode != null) {
            predicates.add(builder.equal(root.get("currencyCode"), currencyCode));
        }
        if (countryCode != null) {
            predicates.add(builder.equal(root.get("countryCode"), countryCode));
        }

        query.select(root)
                .where(predicates.toArray(Predicate[]::new))
                .orderBy(builder.asc(root.get("transactionDate")));

        return entityManager.createQuery(query).getResultList();
    }

    private FinancialReportResponse buildReport(
            ReportPeriod period,
            LocalDate from,
            LocalDate to,
            List<Transaction> transactions,
            BreakdownLabelStrategy labelStrategy
    ) {
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<BreakdownKey, BigDecimal> breakdown = new LinkedHashMap<>();

        for (Transaction transaction : transactions) {
            BigDecimal signedAmount = signedAmount(transaction);
            if (transaction.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(transaction.getAmount());
            } else if (transaction.getType() == TransactionType.EXPENSE) {
                totalExpenses = totalExpenses.add(transaction.getAmount());
            }

            BreakdownKey key = new BreakdownKey(
                    labelStrategy.label(transaction),
                    transaction.getCurrencyCode(),
                    transaction.getCountryCode()
            );
            breakdown.merge(key, signedAmount, BigDecimal::add);
        }

        List<ReportBreakdownItem> items = breakdown.entrySet().stream()
                .map(entry -> new ReportBreakdownItem(
                        entry.getKey().label(),
                        entry.getKey().currencyCode(),
                        entry.getKey().countryCode(),
                        entry.getValue()
                ))
                .sorted(Comparator.comparing(ReportBreakdownItem::label)
                        .thenComparing(ReportBreakdownItem::currencyCode)
                        .thenComparing(ReportBreakdownItem::countryCode))
                .toList();

        return new FinancialReportResponse(
                period,
                from,
                to,
                totalIncome,
                totalExpenses,
                totalIncome.subtract(totalExpenses),
                items
        );
    }

    private BigDecimal signedAmount(Transaction transaction) {
        if (transaction.getType() == TransactionType.EXPENSE) {
            return transaction.getAmount().negate();
        }
        if (transaction.getType() == TransactionType.TRANSFER) {
            return BigDecimal.ZERO;
        }
        return transaction.getAmount();
    }

    private String periodLabel(ReportPeriod period, Transaction transaction) {
        if (period == ReportPeriod.DAILY) {
            return transaction.getTransactionDate().toString();
        }
        if (period == ReportPeriod.MONTHLY) {
            return transaction.getTransactionDate().format(MONTH_FORMAT);
        }
        if (period == ReportPeriod.YEARLY) {
            return String.valueOf(transaction.getTransactionDate().getYear());
        }
        return "Custom";
    }

    private record BreakdownKey(String label, String currencyCode, String countryCode) {
    }

    @FunctionalInterface
    private interface BreakdownLabelStrategy {
        String label(Transaction transaction);
    }
}
