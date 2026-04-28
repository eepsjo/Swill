tooltip_config.theme.dark = 'dark';
tooltip_config.arrow = false;
tooltip_config.animation = false;
tooltip_config.offset = [0, 0];

const userLanguages = {
    en: {
        created_time: "Created",
        updated_time: "Updated",
        author: "By",
        authors: "By"
    },
    zh: {
        created_time: "始",
        updated_time: "改",
        author: "撰",
        authors: "撰"
    }
};
Object.entries(userLanguages).forEach(([locale, data]) => {
    TooltipLanguage.register(locale, data);
});
