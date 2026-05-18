tooltip_config.theme.dark = 'dark';
tooltip_config.arrow = false;
tooltip_config.animation = false;
tooltip_config.offset = [0, 0];

const zhTimeago = (number, index) => {
    return [
        ['now', 'right now'],
        ['%s s', 'in %s seconds'],
        ['1 m', 'in 1 minute'],
        ['%s m', 'in %s minutes'],
        ['1 h', 'in 1 hour'],
        ['%s h', 'in %s hours'],
        ['1 D', 'in 1 day'],
        ['%s D', 'in %s days'],
        ['1 W', 'in 1 week'],
        ['%s W', 'in %s weeks'],
        ['1 M', 'in 1 month'],
        ['%s M', 'in %s months'],
        ['1 Y', 'in 1 year'],
        ['%s Y', 'in %s years']
    ][index];
};
timeago.register('zh_CN', zhTimeago);

TooltipLanguage.register('zh', {
    created_time: "Created",
    updated_time: "Updated",
    author: "By",
    authors: "By"
});