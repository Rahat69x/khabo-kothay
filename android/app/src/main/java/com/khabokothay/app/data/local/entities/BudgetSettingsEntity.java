package com.khabokothay.app.data.local.entities;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "budget_settings")
public class BudgetSettingsEntity {
    @PrimaryKey
    public int id = 1;
    public double monthlyBudgetBdt;
    public int cycleStartDay;
    public boolean budgetAwareRanking;

    public BudgetSettingsEntity(double monthlyBudgetBdt, int cycleStartDay, boolean budgetAwareRanking) {
        this.monthlyBudgetBdt = monthlyBudgetBdt;
        this.cycleStartDay = cycleStartDay;
        this.budgetAwareRanking = budgetAwareRanking;
    }
}
