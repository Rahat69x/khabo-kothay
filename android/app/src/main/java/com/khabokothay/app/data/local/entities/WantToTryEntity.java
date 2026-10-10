package com.khabokothay.app.data.local.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "want_to_try")
public class WantToTryEntity {
    @PrimaryKey
    @NonNull
    public String placeId;
    public long addedAt;
    public String note;
    public String status; // want | visited | dismissed
    public double lat;
    public double lng;
    public long coordsRefreshedAt;
    public Long lastRemindedAt;
    public boolean reminderEnabled;

    public WantToTryEntity(@NonNull String placeId, long addedAt, String note, String status, double lat, double lng, long coordsRefreshedAt, Long lastRemindedAt, boolean reminderEnabled) {
        this.placeId = placeId;
        this.addedAt = addedAt;
        this.note = note;
        this.status = status;
        this.lat = lat;
        this.lng = lng;
        this.coordsRefreshedAt = coordsRefreshedAt;
        this.lastRemindedAt = lastRemindedAt;
        this.reminderEnabled = reminderEnabled;
    }
}
