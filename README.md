
# PEx-Management Panel

<div dir="rtl">

## پنل مدیریت PEx

این پروژه یک پنل مدیریت تحت وب قدرتمند و جامع است که با استفاده از جدیدترین تکنولوژی‌ها (Next.js, TypeScript, TailwindCSS) ساخته شده است. هدف اصلی این پنل، فراهم کردن یک راهکار مرکزی برای مدیریت و پیکربندی اکستنشن‌های کروم در یک سازمان است. با استفاده از این پنل، مدیران می‌توانند کاربران، واحدهای سازمانی (OUs)، پروکسی‌ها و قوانین مسیریابی ترافیک اینترنت را به صورت پویا و متمرکز کنترل کنند.

### ✨ ویژگی‌های کلیدی

- **مدیریت کاربران و واحدهای سازمانی (OUs):** کاربران را در گروه‌های مختلف سازماندهی کنید و برای هر گروه قوانین مشخصی تعریف کنید.
- **مدیریت پروکسی:** به راحتی پروکسی‌های مختلف (HTTP, HTTPS, SOCKS4, SOCKS5) را در سیستم تعریف و مدیریت کنید.
- **قوانین مسیریابی پیشرفته:** قوانین پیچیده‌ای برای هدایت ترافیک کاربران تعریف کنید. برای مثال، می‌توانید مشخص کنید که ترافیک یک واحد سازمانی خاص از یک پروکسی مشخص عبور کند یا برخی دامنه‌ها از پروکسی عبور نکنند.
- **پیکربندی سفارشی برای هر کاربر:** تنظیمات پیش‌فرض OU را برای یک کاربر خاص لغو کرده و یک پیکربندی کاملاً سفارشی برای او اعمال کنید.
- **ساخت اکستنشن داینامیک:** پنل به شما اجازه می‌دهد تا اکستنشن کروم را با نام و لوگوی شرکت خودتان سفارشی‌سازی و دانلود کنید. این اکستنشن به صورت خودکار تنظیمات را از پنل دریافت می‌کند.
- **سیستم پشتیبان‌گیری و بازیابی:** از کل دیتابیس برنامه به راحتی نسخه پشتیبان تهیه کرده، آن‌ها را در سرور مدیریت کنید، دانلود کرده و در صورت نیاز بازیابی کنید.
- **رابط کاربری مدرن و واکنش‌گرا:** طراحی شده با ShadCN UI و TailwindCSS برای بهترین تجربه کاربری در دستگاه‌های مختلف.

### 🚀 نصب و راه‌اندازی

#### نصب خودکار (توصیه شده)
برای نصب این پنل بر روی سرور اوبونتو یا دبیان خود، کافیست دستور زیر را اجرا کنید. این اسکریپت به صورت خودکار تمام وابستگی‌ها را نصب کرده، پروژه را پیکربندی و با استفاده از PM2 اجرا می‌کند.

</div>

```bash
curl -sL https://raw.githubusercontent.com/dwnilii/PEx-management/main/install.sh | bash
```

<div dir="rtl">

پس از اتمام نصب، یک فایل به نام `.env` در پوشه پروژه ایجاد می‌شود. لطفاً این فایل را باز کرده و اطلاعات ورود به پنل (ADMIN_USERNAME و ADMIN_PASSWORD) را تنظیم کنید.

#### نصب دستی

اگر ترجیح می‌دهید پروژه را به صورت دستی نصب کنید، مراحل زیر را دنبال کنید:

1.  **پیش‌نیازها را نصب کنید:**
    مطمئن شوید `git` و `Node.js` (نسخه 18 یا بالاتر) و `npm` روی سرور شما نصب شده باشند. همچنین `pm2` را به صورت سراسری نصب کنید: `npm install pm2 -g`
2.  **ریپازیتوری را کلون کنید:**
    ```bash
    git clone https://github.com/dwnilii/PEx-management.git
    cd PEx-management
    ```
3.  **فایل .env را بسازید:**
    یک فایل `.env` بسازید و متغیرهای `ADMIN_USERNAME` و `ADMIN_PASSWORD` را در آن قرار دهید.
    ```bash
    cp .env.example .env
    # nano .env
    ```
4.  **وابستگی‌ها را نصب کنید:**
    ```bash
    npm install
    ```
5.  **پروژه را بیلد کنید:**
    ```bash
    npm run build
    ```
6.  **برنامه را با PM2 اجرا کنید:**
    ```bash
    pm2 start npm --name "pex-management" -- start
    pm2 startup
    pm2 save
    ```

### ❗️ نکته مهم: راه‌اندازی مجدد سرویس

پس از **راه‌اندازی اولیه** و یا **تغییر رمز عبور مدیر** از طریق پنل، برای اعمال تغییرات لازم است که سرویس برنامه را یک بار ری‌استارت کنید. برای این کار از دستور زیر استفاده کنید:

</div>

```bash
pm2 restart pex-management
```

<div dir="rtl">


### 🛠️ مدیریت برنامه

پس از نصب موفقیت‌آمیز (از طریق اسکریپت خودکار)، یک اسکریپت مدیریتی به نام `pex-ui.sh` در پوشه پروژه برای شما ایجاد می‌شود. برای استفاده از آن، به پوشه پروژه بروید (`cd PEx-Management`) و دستور زیر را اجرا کنید:

</div>

```bash
./pex-ui.sh
```

<div dir="rtl">

این اسکریپت یک منوی ساده برای مدیریت برنامه در اختیار شما قرار می‌دهد، شامل گزینه‌هایی برای حذف، نصب مجدد، تهیه پشتیبان، تغییر رمز عبور و بررسی وضعیت سرویس.

---

</div>

<br>

---

<br>

<div dir="ltr">

## PEx-Management Panel

This project is a powerful and comprehensive web-based management panel built with the latest technologies (Next.js, TypeScript, TailwindCSS). The primary goal of this panel is to provide a central solution for managing and configuring Chrome extensions within an organization. Using this panel, administrators can dynamically and centrally control users, organizational units (OUs), proxies, and internet traffic routing rules.

### ✨ Key Features

-   **User and OU Management:** Organize users into different groups and define specific rules for each group.
-   **Proxy Management:** Easily define and manage various proxies (HTTP, HTTPS, SOCKS4, SOCKS5) in the system.
-   **Advanced Routing Rules:** Define complex rules to direct user traffic. For example, you can specify that traffic from a particular OU should pass through a specific proxy, or that certain domains should bypass the proxy.
-   **Custom Configuration per User:** Override the default OU settings for a specific user and apply a completely custom configuration.
-   **Dynamic Extension Builder:** The panel allows you to customize and download the Chrome extension with your company's name and logo. This extension automatically fetches its settings from the panel.
-   **Backup and Restore System:** Easily back up the entire application database, manage the backups on the server, download them, and restore when needed.
-   **Modern and Responsive UI:** Designed with ShadCN UI and TailwindCSS for the best user experience across various devices.

### 🚀 Installation and Setup

#### Automated Installation (Recommended)
To install this panel on your Ubuntu or Debian server, simply run the following command. This script will automatically install all dependencies, configure the project, and run it using PM2.

</div>

```bash
curl -sL https://raw.githubusercontent.com/dwnilii/PEx-management/main/install.sh | bash
```

<div dir="ltr">

After the installation is complete, a file named `.env` will be created in the project directory. Please open this file and set your admin login credentials (ADMIN_USERNAME and ADMIN_PASSWORD).

#### Manual Installation

If you prefer to install the project manually, follow these steps:

1.  **Install Prerequisites:**
    Make sure you have `git`, `Node.js` (v18 or newer), and `npm` installed. Also, install `pm2` globally: `npm install pm2 -g`
2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/dwnilii/PEx-management.git
    cd PEx-management
    ```
3.  **Create the .env File:**
    Create a `.env` file and set the `ADMIN_USERNAME` and `ADMIN_PASSWORD` variables.
    ```bash
    cp .env.example .env
    # nano .env
    ```
4linea. **Install Dependencies:**
    ```bash
    npm install
    ```
5.  **Build the Project:**
    ```bash
    npm run build
    ```
6.  **Run with PM2:**
    ```bash
    pm2 start npm --name "pex-management" -- start
    pm2 startup
    pm2 save
    ```

### ❗️ Important: Restarting the Service

After the **initial setup** or **changing the admin password** via the panel, you must restart the application service for the changes to take effect. Use the following command:

</div>

```bash
pm2 restart pex-management
```

<div dir="ltr">

### 🛠️ Application Management

After a successful installation (via the automated script), a management script named `pex-ui.sh` will be created for you in the project directory. To use it, navigate to the project directory (`cd PEx-Management`) and run the following command:

</div>

```bash
./pex-ui.sh
```

<div dir="ltr">

This script provides a simple menu for managing the application, including options to uninstall, reinstall, create a new backup, change the admin password, and check the service status.

</div>
