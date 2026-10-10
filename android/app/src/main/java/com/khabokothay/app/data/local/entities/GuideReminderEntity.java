package com.khabokothay.app.data.local.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "guide_reminder")
public class GuideReminderEntity {
    @PrimaryKey
    @NonNull
    public String id;
    public boolean enabled;
    public long at;

    public GuideReminderEntity(@NonNull String id, boolean enabled, long at) {
        this.id = id;
        this.enabled = enabled;
        this.at = at;
    }
}
