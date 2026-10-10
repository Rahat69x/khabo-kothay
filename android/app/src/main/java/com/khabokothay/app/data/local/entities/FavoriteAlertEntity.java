package com.khabokothay.app.data.local.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "favorite_alert")
public class FavoriteAlertEntity {
    @PrimaryKey
    @NonNull
    public String placeId;
    public boolean enabled;
    public int leadMinutes;
    public String lastNotifiedDate;
    public Long mutedUntil;

    public FavoriteAlertEntity(@NonNull String placeId, boolean enabled, int leadMinutes, String lastNotifiedDate, Long mutedUntil) {
        this.placeId = placeId;
        this.enabled = enabled;
        this.leadMinutes = leadMinutes;
        this.lastNotifiedDate = lastNotifiedDate;
        this.mutedUntil = mutedUntil;
    }
}
