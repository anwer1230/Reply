import { AndroidFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (App)',
    category: 'gradle',
    language: 'kotlin',
    description: 'إعدادات بناء التطبيق، ملحقات KSP و Jetpack Compose ومكتبة Room',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp") version "2.0.0-1.0.21"
}

android {
    namespace = "com.example.autoreply"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.autoreply"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
}`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    description: 'تعريف أذونات الإشعارات والتشغيل، والخدمات والمستقبلات',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />

    <queries>
        <!-- WhatsApp and Clones -->
        <package android:name="com.whatsapp" />
        <package android:name="com.whatsapp.w4b" />
        <package android:name="com.gbwhatsapp" />
        <package android:name="com.whatsapp.plus" />
        <package android:name="com.fmwhatsapp" />
        <package android:name="com.yowhatsapp" />
        <package android:name="com.ogwhatsapp" />
        <package android:name="com.aerowhatsapp" />
        <!-- Telegram and Clones -->
        <package android:name="org.telegram.messenger" />
        <package android:name="org.thunderdog.challegram" />
        <package android:name="org.telegram.plus" />
        <package android:name="nekox.rubychina.org" />
        <package android:name="org.telegram.Bgram" />
        <package android:name="ir.ilm.teleplus" />
        <package android:name="org.vidogram.messenger" />
        <!-- Other messaging apps -->
        <package android:name="com.facebook.orca" />
        <package android:name="com.instagram.android" />
        <package android:name="org.thoughtcrime.securesms" />
        <package android:name="com.discord" />
        <package android:name="com.google.android.apps.messaging" />
    </queries>

    <application
        android:name=".App"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.AutoReply">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.AutoReply">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.AutoReplyNotificationListener"
            android:exported="true"
            android:label="@string/app_name"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService" />
            </intent-filter>
        </service>

        <receiver
            android:name=".service.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    category: 'res',
    language: 'xml',
    description: 'نصوص التطبيق العامة',
    content: `<!-- strings.xml -->
<resources>
    <string name="app_name">الرد التلقائي</string>
</resources>`,
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    name: 'themes.xml',
    category: 'res',
    language: 'xml',
    description: 'سمة التطبيق وألوان شريط الحالة',
    content: `<!-- themes.xml -->
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.AutoReply" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor" tools:targetApi="l">#00695C</item>
    </style>
</resources>`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/App.kt',
    name: 'App.kt',
    category: 'kotlin_core',
    language: 'kotlin',
    description: 'نقطة انطلاق التطبيق Application وزرع الكلمات الثابتة عند أول تشغيل',
    content: `package com.example.autoreply

import android.app.Application
import com.example.autoreply.data.RuleRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class App : Application() {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        appScope.launch {
            runCatching { RuleRepository(this@App).seedSystemRulesIfNeeded() }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/Rule.kt',
    name: 'Rule.kt',
    category: 'kotlin_core',
    language: 'kotlin',
    description: 'نموذج بيانات القاعدة للواجهة (Domain Model)',
    content: `package com.example.autoreply

data class Rule(
    val id: String = "0",
    val keyword: String = "",
    val reply: String = "",
    val targetApp: String = "all",
    val isEnabled: Boolean = true,
    val isExactMatch: Boolean = false,
    val source: String = "USER"  // USER أو SYSTEM
)`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/data/SystemKeywords.kt',
    name: 'SystemKeywords.kt',
    category: 'kotlin_data',
    language: 'kotlin',
    description: 'قائمة 25 كلمة نظامية ثابتة والرد الافتراضي الموحّد',
    content: `package com.example.autoreply.data

object SystemKeywords {

    /** القائمة الافتراضية الثابتة (بدون تكرار). */
    val LIST: List<String> = listOf(
        "اريد مساعدة",
        "ابي مساعدة",
        "من يسوي تكليف",
        "من يحل",
        "عندي بحث",
        "معي واجب",
        "عندي اسايمنت",
        "من يسوي اسايمنت",
        "ابي سكليف",
        "ابي عذر",
        "من يسوي سكليف",
        "ابي شخص مضمون",
        "ابي مختص",
        "هيليب",
        "من يستطيع",
        "تعرفون احد",
        "تعرفون شخص",
        "من يساعدني",
        "من يعرف مختص",
        "مين يعرف يحل واجب",
        "من يحل واجبات الجامعه",
        "أحتاج مساعدتكم",
        "ابي احد يسوي بحث",
        "مين يعرف مختص",
        "من يعرف احد كويس"
    ).distinct()

    /** الرد الافتراضي. */
    const val DEFAULT_REPLY = "أهلاً بك! سأرد عليك في أقرب وقت ممكن."

    const val SOURCE_SYSTEM = "SYSTEM"
    const val SOURCE_USER = "USER"
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/data/RuleEntity.kt',
    name: 'RuleEntity.kt',
    category: 'kotlin_data',
    language: 'kotlin',
    description: 'جدول قواعد الرد في قاعدة بيانات Room',
    content: `package com.example.autoreply.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "rules")
data class RuleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val keyword: String,
    val reply: String,
    val targetApp: String,
    val isEnabled: Boolean = true,
    val isExactMatch: Boolean = false,
    val source: String = SystemKeywords.SOURCE_USER,
    val createdAt: Long = System.currentTimeMillis()
)`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/data/RuleDao.kt',
    name: 'RuleDao.kt',
    category: 'kotlin_data',
    language: 'kotlin',
    description: 'واجهة استعلامات Room لقواعد الرد',
    content: `package com.example.autoreply.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface RuleDao {

    @Query("SELECT * FROM rules ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<RuleEntity>>

    @Query("SELECT * FROM rules WHERE isEnabled = 1")
    suspend fun getEnabledRules(): List<RuleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(rule: RuleEntity): Long

    @Update
    suspend fun update(rule: RuleEntity)

    @Delete
    suspend fun delete(rule: RuleEntity)

    @Query("SELECT COUNT(*) FROM rules WHERE source = 'SYSTEM'")
    suspend fun countSystemRules(): Int

    @Query("SELECT * FROM rules WHERE source = 'SYSTEM'")
    suspend fun getSystemRules(): List<RuleEntity>

    @Query("UPDATE rules SET reply = :newReply WHERE source = 'SYSTEM'")
    suspend fun updateAllSystemReplies(newReply: String)

    @Query("SELECT reply FROM rules WHERE source = 'SYSTEM' LIMIT 1")
    suspend fun getSystemReplySample(): String?
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/data/AppDatabase.kt',
    name: 'AppDatabase.kt',
    category: 'kotlin_data',
    language: 'kotlin',
    description: 'فئة بناء واتصال قاعدة بيانات Room (auto_reply.db)',
    content: `package com.example.autoreply.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [RuleEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun ruleDao(): RuleDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "auto_reply.db"
                ).fallbackToDestructiveMigration().build().also { INSTANCE = it }
            }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/data/RuleRepository.kt',
    name: 'RuleRepository.kt',
    category: 'kotlin_data',
    language: 'kotlin',
    description: 'مستودع البيانات مع دعم زرع الكلمات واستعادة المحذوف منها وتحديث الرد الموحد',
    content: `package com.example.autoreply.data

import android.content.Context
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class RuleRepository(context: Context) {

    private val dao = AppDatabase.getInstance(context).ruleDao()

    // ================= CRUD =================
    fun observeRules(): Flow<List<Rule>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }

    suspend fun addRule(rule: Rule): Long =
        dao.insert(rule.copy(id = "0").toEntity())

    suspend fun updateRule(rule: Rule) =
        dao.update(rule.toEntity())

    suspend fun deleteRule(rule: Rule) =
        dao.delete(rule.toEntity())

    suspend fun getEnabledRules(): List<Rule> =
        dao.getEnabledRules().map { it.toDomain() }

    // ================= نظامي =================

    /** تُزرع القائمة مرة واحدة عند أول تشغيل فقط. */
    suspend fun seedSystemRulesIfNeeded() {
        if (dao.countSystemRules() > 0) return
        val base = System.currentTimeMillis()
        SystemKeywords.LIST.forEachIndexed { index, keyword ->
            dao.insert(
                RuleEntity(
                    keyword = keyword,
                    reply = SystemKeywords.DEFAULT_REPLY,
                    targetApp = "all",
                    isEnabled = true,
                    source = SystemKeywords.SOURCE_SYSTEM,
                    createdAt = base + index
                )
            )
        }
    }

    /** تحديث الرد الموحّد لكل الكلمات النظامية. */
    suspend fun updateAllSystemReplies(newReply: String) =
        dao.updateAllSystemReplies(newReply)

    suspend fun getCurrentSystemReply(): String =
        dao.getSystemReplySample() ?: SystemKeywords.DEFAULT_REPLY

    /**
     * استعادة الكلمات النظامية المحذوفة فقط، دون المساس بالردود المخصّصة
     * للكلمات الموجودة. يعيد عدد الكلمات المستعادة.
     */
    suspend fun restoreMissingSystemKeywords(): Int {
        val existingKeywords = dao.getSystemRules().map { it.keyword }.toSet()
        val missing = SystemKeywords.LIST.filter { it !in existingKeywords }
        if (missing.isEmpty()) return 0

        val base = System.currentTimeMillis()
        missing.forEachIndexed { index, keyword ->
            dao.insert(
                RuleEntity(
                    keyword = keyword,
                    reply = SystemKeywords.DEFAULT_REPLY,
                    targetApp = "all",
                    isEnabled = true,
                    source = SystemKeywords.SOURCE_SYSTEM,
                    createdAt = base + index
                )
            )
        }
        return missing.size
    }

    /** عدد الكلمات النظامية الحالية مقارنة بالإجمالي. */
    suspend fun getSystemKeywordStats(): Pair<Int, Int> =
        dao.countSystemRules() to SystemKeywords.LIST.size
}

// محوّلات
fun RuleEntity.toDomain() = Rule(
    id = id.toString(),
    keyword = keyword,
    reply = reply,
    targetApp = targetApp,
    isEnabled = isEnabled,
    isExactMatch = isExactMatch,
    source = source
)

fun Rule.toEntity() = RuleEntity(
    id = id.toLongOrNull() ?: 0L,
    keyword = keyword,
    reply = reply,
    targetApp = targetApp,
    isEnabled = isEnabled,
    isExactMatch = isExactMatch,
    source = source
)`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/util/ArabicNormalizer.kt',
    name: 'ArabicNormalizer.kt',
    category: 'kotlin_util',
    language: 'kotlin',
    description: 'تطبيع النص العربي وإزالة التشكيل وتوحيد الحروف',
    content: `package com.example.autoreply.util

object ArabicNormalizer {

    private val DIACRITICS = Regex("[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]")
    private val EXTRA_SPACES = Regex("\\s+")

    fun normalize(input: String): String {
        return input
            .replace(DIACRITICS, "")
            .replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
            .replace('ى', 'ي')
            .replace('ة', 'ه')
            .replace('ؤ', 'و').replace('ئ', 'ي')
            .replace('٠','0').replace('١','1').replace('٢','2')
            .replace('٣','3').replace('٤','4').replace('٥','5')
            .replace('٦','6').replace('٧','7').replace('٨','8').replace('٩','9')
            .replace(EXTRA_SPACES, " ")
            .trim()
            .lowercase()
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/util/NegationFilter.kt',
    name: 'NegationFilter.kt',
    category: 'kotlin_util',
    language: 'kotlin',
    description: 'فلتر النفي لمنع الرد على الجمل المنفية مثل "ما ابي مساعدة"',
    content: `package com.example.autoreply.util

/**
 * فلتر بسيط لمنع الرد عندما يُنفي المرسل طلبه.
 * مثال: "ما ابي مساعدة" أو "لا اريد مساعدة" أو "لن اطلب مساعدة".
 *
 * الآلية: نبحث عن الكلمة المفتاحية داخل الرسالة، ثم نفحص **الكلمة التي
 * تسبقها مباشرة**. إذا كانت من كلمات النفي، نعتبر الطلب منفياً ونتجاهله.
 *
 * ملاحظة: الكلمات التي تسبقها كلمة وصفية (مثل «لا بأس، أبي مساعدة»)
 * لا تُحجب لأن الكلمة السابقة للكلمة المفتاحية هي «بأس» لا «لا».
 */
object NegationFilter {

    private val NEGATIONS: Set<String> = setOf(
        "ما", "لا", "لم", "لن", "مو", "مب", "ماهو", "ماهي",
        "غير", "بدون", "مستحيل", "ابدا", "لاابي", "ماابي",
        "مااريد", "لااريد", "ماحتاج", "لاحتاج"
    )

    /**
     * @param normalizedMessage الرسالة بعد التطبيع من ArabicNormalizer
     * @param keyword الكلمة المفتاحية (بعد التطبيع أيضاً)
     * @return true إذا كان الطلب منفياً ويجب تجاهله
     */
    fun shouldBlock(normalizedMessage: String, keyword: String): Boolean {
        if (keyword.isBlank()) return false

        val keywordIdx = normalizedMessage.indexOf(keyword)
        if (keywordIdx == -1) return false

        // الكلمة المفتاحية في بداية الرسالة = لا يوجد نفي قبلها
        if (keywordIdx == 0) return false

        val prefix = normalizedMessage.substring(0, keywordIdx).trimEnd()
        if (prefix.isEmpty()) return false

        val lastWord = prefix.split(Regex("\\s+")).lastOrNull().orEmpty()
        return lastWord in NEGATIONS
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/util/NotificationAccess.kt',
    name: 'NotificationAccess.kt',
    category: 'kotlin_util',
    language: 'kotlin',
    description: 'التحقق من صلاحية الوصول للإشعارات وفتح شاشة الإعدادات',
    content: `package com.example.autoreply.util

import android.content.Context
import android.content.Intent
import android.provider.Settings

object NotificationAccess {

    fun isGranted(context: Context): Boolean {
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        ) ?: return false
        return enabled.contains(context.packageName)
    }

    fun openSettings(context: Context) {
        context.startActivity(
            Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/util/AppPreferences.kt',
    name: 'AppPreferences.kt',
    category: 'kotlin_util',
    language: 'kotlin',
    description: 'تخزين إعدادات التطبيق SharedPreferences (فلتر النفي ونافذة التكرار)',
    content: `package com.example.autoreply.util

import android.content.Context

class AppPreferences(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    var negationFilterEnabled: Boolean
        get() = prefs.getBoolean("negation_filter", true)
        set(v) = prefs.edit().putBoolean("negation_filter", v).apply()

    var duplicateWindowSeconds: Int
        get() = prefs.getInt("dup_window_sec", 60)
        set(v) = prefs.edit().putInt("dup_window_sec", v).apply()
}
`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/util/SupportedApps.kt',
    name: 'SupportedApps.kt',
    category: 'kotlin_util',
    language: 'kotlin',
    description: 'فحص وتحديد تطبيقات المراسلة المثبتة بهاتف المستخدم (واتساب وتيليجرام وكل أنواعهما)',
    content: `package com.example.autoreply.util

import android.content.Context
import android.content.pm.PackageManager

data class MessagingApp(
    val packageName: String,
    val name: String,
    val category: String,
    val isInstalled: Boolean = false
)

object SupportedApps {
    val ALL_KNOWN_APPS = listOf(
        MessagingApp("com.whatsapp", "واتساب الرسمي", "whatsapp"),
        MessagingApp("com.whatsapp.w4b", "واتساب للأعمال (Business)", "whatsapp"),
        MessagingApp("com.gbwhatsapp", "جي بي واتساب (GBWhatsApp)", "whatsapp"),
        MessagingApp("com.whatsapp.plus", "واتساب بلس (Plus)", "whatsapp"),
        MessagingApp("com.fmwhatsapp", "إف إم واتساب (FMWhatsApp)", "whatsapp"),
        MessagingApp("com.yowhatsapp", "يو واتساب (YoWhatsApp)", "whatsapp"),
        MessagingApp("com.ogwhatsapp", "أو جي واتساب (OGWhatsApp)", "whatsapp"),
        MessagingApp("com.aerowhatsapp", "واتساب إيرو (Aero)", "whatsapp"),
        MessagingApp("org.telegram.messenger", "تيليجرام الرسمي", "telegram"),
        MessagingApp("org.thunderdog.challegram", "تيليجرام إكس (Telegram X)", "telegram"),
        MessagingApp("org.telegram.plus", "بلس مسنجر (Plus)", "telegram"),
        MessagingApp("nekox.rubychina.org", "نيكوغرام (Nekogram)", "telegram"),
        MessagingApp("org.telegram.Bgram", "بي غرام (BGram)", "telegram"),
        MessagingApp("ir.ilm.teleplus", "غراف مسنجر (Graph)", "telegram"),
        MessagingApp("org.vidogram.messenger", "فيدوغرام (Vidogram)", "telegram"),
        MessagingApp("com.facebook.orca", "فيسبوك ماسنجر", "other"),
        MessagingApp("com.instagram.android", "إنستغرام Direct", "other"),
        MessagingApp("org.thoughtcrime.securesms", "سيجنال (Signal)", "other")
    )

    fun isInstalled(context: Context, packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    fun getAppsWithInstallStatus(context: Context): List<MessagingApp> {
        return ALL_KNOWN_APPS.map { app ->
            app.copy(isInstalled = isInstalled(context, app.packageName))
        }
    }

    fun getDisplayLabel(targetApp: String): String {
        if (targetApp.isBlank() || targetApp == "all") return "جميع التطبيقات (All)"
        if (targetApp == "whatsapp" || targetApp == "whatsapp_all") return "كل نسخ واتساب"
        if (targetApp == "telegram" || targetApp == "telegram_all") return "كل نسخ تيليجرام"
        val parts = targetApp.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        if (parts.size == 1) {
            return ALL_KNOWN_APPS.find { it.packageName == parts[0] }?.name ?: parts[0]
        }
        val names = parts.map { pkg ->
            ALL_KNOWN_APPS.find { it.packageName == pkg }?.name?.split(" ")?.firstOrNull() ?: pkg
        }
        return if (names.size <= 3) names.joinToString(" + ") else "\${names.take(2).joinToString(" + ")} +\${names.size - 2}"
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/service/AutoReplyNotificationListener.kt',
    name: 'AutoReplyNotificationListener.kt',
    category: 'kotlin_service',
    language: 'kotlin',
    description: 'خدمة الاستماع للإشعارات في الخلفية وتطبيق الفلاتر والرد عبر RemoteInput',
    content: `package com.example.autoreply.service

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.RemoteInput
import com.example.autoreply.data.Rule
import com.example.autoreply.data.RuleRepository
import com.example.autoreply.util.AppPreferences
import com.example.autoreply.util.ArabicNormalizer
import com.example.autoreply.util.NegationFilter
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap

class AutoReplyNotificationListener : NotificationListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var repository: RuleRepository
    private lateinit var prefs: AppPreferences

    private val repliedMessages = ConcurrentHashMap<String, Long>()

    companion object {
        // حزم واتساب وكل أنواعه المعدلة
        val WA_PACKAGES = setOf(
            "com.whatsapp",
            "com.whatsapp.w4b",
            "com.gbwhatsapp",
            "com.whatsapp.plus",
            "com.fmwhatsapp",
            "com.yowhatsapp",
            "com.ogwhatsapp",
            "com.aerowhatsapp"
        )
        // حزم تيليجرام وكل أنواعه المعدلة والبديلة
        val TG_PACKAGES = setOf(
            "org.telegram.messenger",
            "org.thunderdog.challegram",
            "org.telegram.plus",
            "nekox.rubychina.org",
            "org.telegram.Bgram",
            "ir.ilm.teleplus",
            "org.vidogram.messenger",
            "org.telegram.messenger.web"
        )
    }

    override fun onCreate() {
        super.onCreate()
        repository = RuleRepository(this)
        prefs = AppPreferences(this)
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try { handleNotification(sbn) } catch (e: Exception) { e.printStackTrace() }
    }

    private fun handleNotification(sbn: StatusBarNotification) {
        val pkg = sbn.packageName

        val extras = sbn.notification.extras ?: return
        val senderName = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val rawMessage = extractMessageText(extras) ?: return

        if (rawMessage.isBlank() || senderName.isBlank()) return
        if (isGroupNotification(extras, senderName)) return

        // تطبيع الرسالة مرة واحدة
        val normalizedMessage = ArabicNormalizer.normalize(rawMessage)

        // منع التكرار
        val dupKey = "$pkg|$senderName|$normalizedMessage"
        val now = System.currentTimeMillis()
        val last = repliedMessages[dupKey]
        val windowMs = prefs.duplicateWindowSeconds * 1000L
        if (last != null && now - last < windowMs) return

        scope.launch {
            val rules = repository.getEnabledRules().filter {
                it.isEnabled && isTargetAppMatched(it.targetApp, pkg)
            }

            val matching = rules.firstOrNull { rule ->
                matchRule(rule, normalizedMessage)
            } ?: return@launch

            val sent = sendReply(sbn, matching.reply)
            if (sent) {
                repliedMessages[dupKey] = now
                if (repliedMessages.size > 300) {
                    val cutoff = now - windowMs
                    repliedMessages.entries.removeAll { it.value < cutoff }
                }
            }
        }
    }

    /** يطابق القاعدة مع الرسالة، مع تطبيق فلتر النفي إن كان مفعلاً. */
    private fun matchRule(rule: Rule, normalizedMessage: String): Boolean {
        val normalizedKeyword = ArabicNormalizer.normalize(rule.keyword)
        if (normalizedKeyword.isBlank()) return false

        val contains = if (rule.isExactMatch) {
            normalizedMessage == normalizedKeyword
        } else {
            normalizedMessage.contains(normalizedKeyword)
        }
        if (!contains) return false

        // فلتر النفي
        if (prefs.negationFilterEnabled &&
            NegationFilter.shouldBlock(normalizedMessage, normalizedKeyword)
        ) return false

        return true
    }

    private fun extractMessageText(extras: Bundle): String? {
        val texts = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
        if (!texts.isNullOrEmpty()) {
            val last = texts.lastOrNull()?.toString()?.trim().orEmpty()
            if (last.isNotBlank() && !last.matches(Regex("^\\\\d+ رسائل? جديدة$"))) return last
        }
        return extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()
    }

    private fun isGroupNotification(extras: Bundle, title: String): Boolean {
        val convTitle = extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()
        if (!convTitle.isNullOrBlank() && convTitle != title) return true
        val summary = extras.getString(Notification.EXTRA_SUB_TEXT)
        return summary?.contains("Group", ignoreCase = true) == true
    }

    private fun sendReply(sbn: StatusBarNotification, replyText: String): Boolean {
        val actions = sbn.notification.actions ?: return false
        for (action in actions) {
            val remoteInputs = action.remoteInputs ?: continue
            if (remoteInputs.isEmpty()) continue

            val intent = Intent()
            val bundle = Bundle()
            for (input in remoteInputs) {
                bundle.putCharSequence(input.resultKey, replyText)
            }
            RemoteInput.addResultsToIntent(remoteInputs, intent, bundle)
            try {
                action.actionIntent.send(this, 0, intent)
                return true
            } catch (e: Exception) { e.printStackTrace() }
        }
        return false
    }

    private fun isTargetAppMatched(ruleTargetApp: String, incomingPkg: String): Boolean {
        if (ruleTargetApp == "all") return true
        if (ruleTargetApp == "whatsapp" || ruleTargetApp == "whatsapp_all") {
            return WA_PACKAGES.contains(incomingPkg)
        }
        if (ruleTargetApp == "telegram" || ruleTargetApp == "telegram_all") {
            return TG_PACKAGES.contains(incomingPkg)
        }
        if (ruleTargetApp.contains(",")) {
            val list = ruleTargetApp.split(",").map { it.trim() }
            return list.contains(incomingPkg) ||
                   (list.contains("whatsapp") && WA_PACKAGES.contains(incomingPkg)) ||
                   (list.contains("telegram") && TG_PACKAGES.contains(incomingPkg))
        }
        return ruleTargetApp == incomingPkg
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/service/BootReceiver.kt',
    name: 'BootReceiver.kt',
    category: 'kotlin_service',
    language: 'kotlin',
    description: 'مستقبل إعادة تشغيل الجهاز لضمان بقاء الخدمة فعالة',
    content: `package com.example.autoreply.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // الخدمة تُشغَّل تلقائياً من النظام بعد منح صلاحية الوصول للإشعارات.
        // نحن فقط نتأكد أن النظام أبلغنا (لتسهيل إعادة التهيئة إن احتجت).
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // لا شيء مطلوب. الخدمة محفوظة من النظام.
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/MainViewModel.kt',
    name: 'MainViewModel.kt',
    category: 'kotlin_core',
    language: 'kotlin',
    description: 'نموذج العرض ViewModel لإدارة الحالة وتدفق البيانات مع Room',
    content: `package com.example.autoreply

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.autoreply.data.RuleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(app: Application) : AndroidViewModel(app) {

    private val repo = RuleRepository(app)

    val rules = repo.observeRules().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _systemReply = MutableStateFlow<String?>(null)
    val systemReply: StateFlow<String?> = _systemReply.asStateFlow()

    private val _systemStats = MutableStateFlow(0 to 0)
    val systemStats: StateFlow<Pair<Int, Int>> = _systemStats.asStateFlow()

    private val _toast = MutableStateFlow<String?>(null)
    val toast: StateFlow<String?> = _toast.asStateFlow()

    init {
        refreshSystemData()
    }

    fun saveRule(rule: Rule) = viewModelScope.launch {
        if (rule.id == "0") repo.addRule(rule) else repo.updateRule(rule)
    }

    fun deleteRule(rule: Rule) = viewModelScope.launch {
        repo.deleteRule(rule)
    }

    fun updateAllSystemReplies(newReply: String) = viewModelScope.launch {
        repo.updateAllSystemReplies(newReply)
        _systemReply.value = newReply
        _toast.value = "تم تحديث الرد الموحّد"
    }

    fun restoreMissingSystemKeywords() = viewModelScope.launch {
        val n = repo.restoreMissingSystemKeywords()
        _toast.value = if (n == 0) "كل الكلمات النظامية موجودة بالفعل"
        else "تمت استعادة $n كلمة نظامية"
        refreshSystemData()
    }

    private fun refreshSystemData() = viewModelScope.launch {
        _systemReply.value = repo.getCurrentSystemReply()
        _systemStats.value = repo.getSystemKeywordStats()
    }

    fun consumeToast() { _toast.value = null }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/Screens.kt',
    name: 'Screens.kt',
    category: 'kotlin_core',
    language: 'kotlin',
    description: 'شاشات Jetpack Compose الكاملة (HomeScreen, AddEditScreen, SystemKeywordsScreen, SettingsScreen)',
    content: `package com.example.autoreply

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.autoreply.util.AppPreferences
import com.example.autoreply.util.NotificationAccess
import kotlinx.coroutines.launch

// ==================== الشاشة الرئيسية ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(viewModel: MainViewModel, navController: NavController) {
    val rules by viewModel.rules.collectAsState()
    val context = LocalContext.current
    var hasAccess by remember { mutableStateOf(NotificationAccess.isGranted(context)) }

    // إعادة التحقق عند العودة للشاشة
    LaunchedEffect(Unit) { hasAccess = NotificationAccess.isGranted(context) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("الرد التلقائي") },
                actions = {
                    IconButton(onClick = { navController.navigate("settings") }) {
                        Icon(Icons.Default.Settings, contentDescription = null)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { navController.navigate("add_edit") }) {
                Icon(Icons.Default.Add, contentDescription = null)
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {

            if (!hasAccess) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("⚠️ الخدمة غير مفعّلة", fontWeight = FontWeight.Bold)
                        Text("يجب منح صلاحية الوصول إلى الإشعارات لتشغيل الرد التلقائي.")
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = {
                            NotificationAccess.openSettings(context)
                        }) { Text("فتح الإعدادات") }
                    }
                }
            }

            if (rules.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("جارٍ تحميل القواعد…")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(rules, key = { it.id }) { rule ->
                        RuleCard(
                            rule = rule,
                            onToggle = { en -> viewModel.saveRule(rule.copy(isEnabled = en)) },
                            onClick = { navController.navigate("add_edit?ruleId=\${rule.id}") }
                        )
                    }
                }
            }
        }
    }
}

// ==================== بطاقة القاعدة ====================
@Composable
fun RuleCard(rule: Rule, onToggle: (Boolean) -> Unit, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "الكلمة: \${rule.keyword}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (rule.source == "SYSTEM") {
                        Spacer(Modifier.width(8.dp))
                        AssistChip(
                            onClick = {},
                            label = { Text("ثابتة", style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text("الرد: \${rule.reply}", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(4.dp))
                Text(
                    "التطبيق: \${rule.targetApp}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Switch(checked = rule.isEnabled, onCheckedChange = onToggle)
        }
    }
}

// ==================== شاشة إضافة/تعديل ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditScreen(viewModel: MainViewModel, navController: NavController, ruleId: String?) {
    val existing = viewModel.rules.collectAsState().value.find { it.id == ruleId }

    var keyword by remember { mutableStateOf(existing?.keyword ?: "") }
    var reply by remember { mutableStateOf(existing?.reply ?: "") }
    var targetApp by remember { mutableStateOf(existing?.targetApp ?: "whatsapp") }
    var exact by remember { mutableStateOf(existing?.isExactMatch ?: false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showAppDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (ruleId == null) "إضافة قاعدة" else "تعديل القاعدة") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null)
                    }
                },
                actions = {
                    if (existing != null) {
                        IconButton(onClick = { showDeleteDialog = true }) {
                            Icon(Icons.Default.Delete, contentDescription = "حذف")
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = keyword,
                onValueChange = { keyword = it },
                label = { Text("الكلمة المفتاحية") },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("مثال: ابي مساعدة") }
            )
            OutlinedTextField(
                value = reply,
                onValueChange = { reply = it },
                label = { Text("نص الرد التلقائي") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )
            Text("التطبيق المستهدف:", fontWeight = FontWeight.Bold)
            OutlinedCard(
                modifier = Modifier.fillMaxWidth().clickable { showAppDialog = true }
            ) {
                Row(
                    modifier = Modifier.padding(12.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("التطبيقات المختارة للرد التلقائي:", style = MaterialTheme.typography.labelSmall)
                        Text(
                            com.example.autoreply.util.SupportedApps.getDisplayLabel(targetApp),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    TextButton(onClick = { showAppDialog = true }) {
                        Text("تحديد ✎")
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf(
                    "whatsapp" to "كل واتساب",
                    "telegram" to "كل تيليجرام",
                    "whatsapp,telegram" to "واتساب + تيليجرام",
                    "all" to "الكل"
                ).forEach { (appKey, label) ->
                    FilterChip(
                        selected = targetApp == appKey,
                        onClick = { targetApp = appKey },
                        label = { Text(label) }
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(checked = exact, onCheckedChange = { exact = it })
                Spacer(Modifier.width(8.dp))
                Text("مطابقة تامة (وليس احتواء)")
            }

            Spacer(Modifier.weight(1f))

            Button(
                onClick = {
                    if (keyword.isNotBlank() && reply.isNotBlank()) {
                        viewModel.saveRule(
                            Rule(
                                id = ruleId ?: "0",
                                keyword = keyword.trim(),
                                reply = reply.trim(),
                                targetApp = targetApp,
                                isExactMatch = exact,
                                source = existing?.source ?: "USER"
                            )
                        )
                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = keyword.isNotBlank() && reply.isNotBlank()
            ) {
                Text(if (ruleId == null) "إضافة" else "حفظ")
            }
        }
    }

    if (showDeleteDialog && existing != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("تأكيد الحذف") },
            text = {
                Text(
                    if (existing.source == "SYSTEM")
                        "ستُحذف هذه الكلمة النظامية. يمكنك استعادتها لاحقاً من إعدادات القائمة الثابتة."
                    else "هل تريد حذف هذه القاعدة؟"
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteRule(existing)
                    showDeleteDialog = false
                    navController.popBackStack()
                }) { Text("حذف") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("إلغاء") }
            }
        )
    }

    if (showAppDialog) {
        val apps = remember { com.example.autoreply.util.SupportedApps.getAppsWithInstallStatus(context) }
        var selectedSet by remember {
            mutableStateOf(
                if (targetApp == "all") apps.map { it.packageName }.toSet()
                else if (targetApp == "whatsapp" || targetApp == "whatsapp_all") apps.filter { it.category == "whatsapp" }.map { it.packageName }.toSet()
                else if (targetApp == "telegram" || targetApp == "telegram_all") apps.filter { it.category == "telegram" }.map { it.packageName }.toSet()
                else targetApp.split(",").map { it.trim() }.toSet()
            )
        }

        AlertDialog(
            onDismissRequest = { showAppDialog = false },
            title = { Text("التطبيق المستهدف (تحديد متعدد)", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth().heightIn(max = 420.dp)) {
                    Text(
                        "حدد التطبيقات لتطبيق الرد التلقائي عليها (يمكنك اختيار عدة نسخ لواتساب وتيليجرام معاً):",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        AssistChip(
                            onClick = {
                                selectedSet = selectedSet + apps.filter { it.category == "whatsapp" }.map { it.packageName }
                            },
                            label = { Text("+ واتساب", style = MaterialTheme.typography.labelSmall) }
                        )
                        AssistChip(
                            onClick = {
                                selectedSet = selectedSet + apps.filter { it.category == "telegram" }.map { it.packageName }
                            },
                            label = { Text("+ تيليجرام", style = MaterialTheme.typography.labelSmall) }
                        )
                        AssistChip(
                            onClick = {
                                selectedSet = apps.filter { it.isInstalled }.map { it.packageName }.toSet()
                            },
                            label = { Text("المثبتة فقط", style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(apps, key = { it.packageName }) { app ->
                            val isChecked = selectedSet.contains(app.packageName)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedSet = if (isChecked) selectedSet - app.packageName else selectedSet + app.packageName
                                    }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { chk ->
                                        selectedSet = if (chk) selectedSet + app.packageName else selectedSet - app.packageName
                                    }
                                )
                                Spacer(Modifier.width(8.dp))
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(app.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                                        if (app.isInstalled) {
                                            Spacer(Modifier.width(6.dp))
                                            Text("(✅ مثبت)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                        }
                                    }
                                    Text(app.packageName, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (selectedSet.size == apps.size) {
                        targetApp = "all"
                    } else if (selectedSet.isEmpty()) {
                        targetApp = "all"
                    } else {
                        targetApp = selectedSet.joinToString(",")
                    }
                    showAppDialog = false
                }) {
                    Text("موافق (\${selectedSet.size})")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAppDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

// ==================== إدارة الكلمات الثابتة ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SystemKeywordsScreen(viewModel: MainViewModel, navController: NavController) {
    val currentReply by viewModel.systemReply.collectAsState()
    val stats by viewModel.systemStats.collectAsState()
    var newReply by remember(currentReply) { mutableStateOf(currentReply ?: "") }
    var showApplyDialog by remember { mutableStateOf(false) }
    var showRestoreDialog by remember { mutableStateOf(false) }
    val toast by viewModel.toast.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(toast) {
        toast?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeToast()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("الكلمات الثابتة") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null)
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // إحصائية
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        "الكلمات الثابتة الموجودة: \${stats.first} من \${stats.second}",
                        fontWeight = FontWeight.Bold
                    )
                    if (stats.first < stats.second) {
                        Text(
                            "يوجد \${stats.second - stats.first} كلمة محذوفة، يمكنك استعادتها.",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }

            // الرد الموحد
            OutlinedTextField(
                value = newReply,
                onValueChange = { newReply = it },
                label = { Text("الرد الموحّد لكل الكلمات الثابتة") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 4
            )
            Button(
                onClick = { showApplyDialog = true },
                modifier = Modifier.fillMaxWidth(),
                enabled = newReply.isNotBlank() && newReply != currentReply
            ) {
                Text("تطبيق الرد على كل الكلمات الثابتة")
            }

            HorizontalDivider()

            // استعادة القائمة
            OutlinedButton(
                onClick = { showRestoreDialog = true },
                modifier = Modifier.fillMaxWidth(),
                enabled = stats.first < stats.second
            ) {
                Icon(Icons.Default.Restore, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("استعادة الكلمات المحذوفة")
            }

            Text(
                "ملاحظة: استعادة القائمة تضيف فقط الكلمات المحذوفة، ولا تُغيّر الردود المخصّصة للكلمات الموجودة.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }

    if (showApplyDialog) {
        AlertDialog(
            onDismissRequest = { showApplyDialog = false },
            title = { Text("تأكيد") },
            text = { Text("سيتم استبدال رد جميع الكلمات الثابتة بالرد الجديد. متابعة؟") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.updateAllSystemReplies(newReply.trim())
                    showApplyDialog = false
                }) { Text("تأكيد") }
            },
            dismissButton = {
                TextButton(onClick = { showApplyDialog = false }) { Text("إلغاء") }
            }
        )
    }

    if (showRestoreDialog) {
        AlertDialog(
            onDismissRequest = { showRestoreDialog = false },
            title = { Text("استعادة الكلمات") },
            text = {
                Text(
                    "سيتم إضافة \${stats.second - stats.first} كلمة نظامية مفقودة مع الرد الافتراضي. متابعة؟"
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.restoreMissingSystemKeywords()
                    showRestoreDialog = false
                }) { Text("استعادة") }
            },
            dismissButton = {
                TextButton(onClick = { showRestoreDialog = false }) { Text("إلغاء") }
            }
        )
    }
}

// ==================== الإعدادات ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: MainViewModel, navController: NavController) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences(context) }
    var negationEnabled by remember { mutableStateOf(prefs.negationFilterEnabled) }
    var hasAccess by remember { mutableStateOf(NotificationAccess.isGranted(context)) }

    LaunchedEffect(Unit) { hasAccess = NotificationAccess.isGranted(context) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("الإعدادات") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // حالة الصلاحية
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        if (hasAccess) "✅ الخدمة مفعّلة" else "❌ الخدمة غير مفعّلة",
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = { NotificationAccess.openSettings(context) },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("فتح إعدادات الوصول للإشعارات") }
                }
            }

            HorizontalDivider()

            // فلتر النفي
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text("فلتر النفي", fontWeight = FontWeight.Bold)
                    Text(
                        "تجاهل الرسائل مثل: «ما ابي مساعدة»، «لا اريد مساعدة»",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Switch(
                    checked = negationEnabled,
                    onCheckedChange = {
                        negationEnabled = it
                        prefs.negationFilterEnabled = it
                    }
                )
            }

            HorizontalDivider()

            // إدارة الكلمات الثابتة
            OutlinedButton(
                onClick = { navController.navigate("system_keywords") },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.List, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("إدارة الكلمات الثابتة والرد الموحّد")
            }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/example/autoreply/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin_core',
    language: 'kotlin',
    description: 'النشاط الرئيسي وتوجيه الشاشات Navigation Compose',
    content: `package com.example.autoreply

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface { AppNavigation() }
            }
        }
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val vm: MainViewModel = viewModel()

    NavHost(navController, startDestination = "home") {
        composable("home") { HomeScreen(vm, navController) }
        composable("settings") { SettingsScreen(vm, navController) }
        composable("system_keywords") { SystemKeywordsScreen(vm, navController) }
        composable(
            route = "add_edit?ruleId={ruleId}",
            arguments = listOf(
                navArgument("ruleId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { back ->
            AddEditScreen(vm, navController, back.arguments?.getString("ruleId"))
        }
    }
}`,
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts (Root)',
    category: 'gradle',
    language: 'kotlin',
    description: 'إعدادات مستودعات التبعيات لمشروع أندرويد ستوديو',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AutoReply"
include(":app")`,
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Root)',
    category: 'gradle',
    language: 'kotlin',
    description: 'ملف Gradle الرئيسي على مستوى المشروع مع إصدارات الملحقات',
    content: `plugins {
    id("com.android.application") version "8.5.0" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
    id("com.google.devtools.ksp") version "2.0.0-1.0.21" apply false
}`,
  },
];
