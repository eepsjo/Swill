document.addEventListener("DOMContentLoaded", function() {
    const quotes = [
        "bro get a job"
    ];

    // 获取版权所在容器
    const copyrightInfo = document.querySelector(".md-copyright");
    if (copyrightInfo) {
        // 设置容器为 flex 布局，并两端对齐
        copyrightInfo.parentElement.style.display = "flex";
        copyrightInfo.parentElement.style.justifyContent = "space-between";
        copyrightInfo.parentElement.style.alignItems = "center";
        copyrightInfo.parentElement.style.flexWrap = "wrap";

        // 创建名言容器
        const quoteSpan = document.createElement("span");
        quoteSpan.style.fontSize = "0.65rem";
        quoteSpan.style.opacity = "0.7";
        quoteSpan.style.fontStyle = "italic";
        quoteSpan.style.marginLeft = "auto"; // 确保推向右边
        
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteSpan.innerText = quotes[randomIndex];

        // 插入到版权容器同级
        copyrightInfo.parentElement.appendChild(quoteSpan);
    }
});