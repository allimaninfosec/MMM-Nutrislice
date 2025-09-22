Module.register("MMM-Nutrislice", {
    // Default module config.
    defaults: {
        district: "usd266",
        schoolName: "maize-elementary",
        updateInterval: 3600000, // 1 hour
        // Shift which day is considered "today" by hours. Use negative to show previous day,
        // positive to show a later day. Default 0 = use local current time.
        dateOffsetHours: -6,
    },

    start: function() {
        this.menuData = null;
        this.getMenuData();
        setInterval(() => {
            this.getMenuData();
        }, this.config.updateInterval);
    },

    getStyles: function() {
        return ["nutrislice.css"];
    },

    getMenuData: function() {
        // Apply configured hour offset so the module can be nudged to a different local day
        const offsetMs = (this.config.dateOffsetHours || 0) * 60 * 60 * 1000;
        const effectiveDate = new Date(Date.now() + offsetMs);

        const year = effectiveDate.getFullYear();
        const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
        const day = String(effectiveDate.getDate()).padStart(2, '0');

        const breakfastUrl = this.buildUrl("breakfast", year, month, day);
        const lunchUrl = this.buildUrl("lunch", year, month, day);

        this.sendSocketNotification("GET_MENU_DATA", {
            breakfastUrl: breakfastUrl,
            lunchUrl: lunchUrl
        });
    },

    buildUrl: function(menuType, year, month, day) {
        const district = this.config.district;
        const schoolName = this.config.schoolName;

        return `https://${district}.api.nutrislice.com/menu/api/weeks/school/${schoolName}/menu-type/${menuType}/${year}/${month}/${day}/`;
    },

    formatLocalDate: function(dateObj) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "MENU_DATA") {
            this.menuData = payload;
            this.updateDom();
        }
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-Nutrislice"; // Add this class to apply the CSS

        const header = document.createElement("header");
        header.className = "module-header";
        header.innerHTML = "School Menu";
        wrapper.appendChild(header);

        if (!this.menuData) {
            const loadingElement = document.createElement("div");
            loadingElement.innerHTML = "Loading menu data...";
            wrapper.appendChild(loadingElement);
            return wrapper;
        }

    // Use the configured offset so displayed day matches fetched data
    const offsetMs = (this.config.dateOffsetHours || 0) * 60 * 60 * 1000;
    const effectiveNow = new Date(Date.now() + offsetMs);

    const todayStr = this.formatLocalDate(effectiveNow);

    const tomorrowDate = new Date(effectiveNow);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = this.formatLocalDate(tomorrowDate);

        const menuToday = this.menuData.find(menu => menu.date === todayStr);
        const menuTomorrow = this.menuData.find(menu => menu.date === tomorrowStr);

        const renderMenu = (menu, label, fallbackMsg) => {
            const container = document.createElement("div");
            container.className = "menu-day";

            const title = document.createElement("div");
            title.className = "menu-day-title";
            title.innerHTML = label;
            container.appendChild(title);

            const content = document.createElement("div");
            content.className = "menu-day-content";
            content.innerHTML = menu ? menu.combinedMenu : fallbackMsg;
            container.appendChild(content);

            return container;
        };

        wrapper.appendChild(renderMenu(menuToday, "Today", "No menu available for today."));
        wrapper.appendChild(renderMenu(menuTomorrow, "Tomorrow", "No menu available for tomorrow."));

        return wrapper;
    }
});
