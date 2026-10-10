package com.khabokothay.app.data.local.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "spend_entries")
public class SpendEntryEntity {
    @PrimaryKey(autoGenerate = true)
    public long id;
    @NonNull
    public String date;
    public double amountBdt;
    public int partySize;
    public String placeId;
    public String label;
    public String category;
    public boolean special;
    public String source;

    public SpendEntryEntity(@NonNull String date, double amountBdt, int partySize, String placeId, String label, String category, boolean special, String source) {
        this.date = date;
        this.amountBdt = amountBdt;
        this.partySize = partySize;
        this.placeId = placeId;
        this.label = label;
        this.category = category;
        this.special = special;
        this.source = source;
    }
}
