package com.khabokothay.app.data.local;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;
import com.khabokothay.app.data.local.entities.*;

@Database(
    entities = {
        FavoriteAlertEntity.class,
        BudgetSettingsEntity.class,
        SpendEntryEntity.class,
        WantToTryEntity.class,
        SavedGuideEntity.class,
        GuideReminderEntity.class
    },
    version = 1,
    exportSchema = true
)
public abstract class AppDatabase extends RoomDatabase {
    private static volatile AppDatabase INSTANCE;

    public static AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                        context.getApplicationContext(),
                        AppDatabase.class,
                        "khabo_kothay.db"
                    ).build();
                }
            }
        }
        return INSTANCE;
    }
}
