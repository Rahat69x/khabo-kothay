package com.khabokothay.app.data.local.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "saved_guide")
public class SavedGuideEntity {
    @PrimaryKey
    @NonNull
    public String id;
    public long savedAt;

    public SavedGuideEntity(@NonNull String id, long savedAt) {
        this.id = id;
        this.savedAt = savedAt;
    }
}
