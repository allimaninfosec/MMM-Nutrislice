Module.register("MMM-Nutrislice", {
    // Default module config.
    defaults: {
        district: "usd266",
        schoolName: "maize-elementary",
        updateInterval: 3600000, // 1 hour
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
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

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

        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];

        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

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
