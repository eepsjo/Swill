document.addEventListener("DOMContentLoaded", function() {
    const quotes = [
        "恐惧是思维杀手",
        "希望会蒙蔽双眼",
        "心怀向往，将使人过于沉溺。此路危机四伏",
        "柳枝顺从风势，方能枝繁叶茂，终有一日会形成抵抗大风的铜墙铁壁",
        "如果没有一位懂得统治艺术的统治者，智识、公正与勇气将毫无用处",
        "理解必须融入过程之中，与其一同发展",
        "愿望不是鱼，否则世人都会去撒网",
        "知道陷阱在什么地方，这是避开它的第一步",
        "它就像生活——你每次拥有它时，它的面貌都不一样",
        "这世上并没有笔直通向终点的路。站在山顶，你看不到山",
        "最难用逻辑进行审查的，往往是那些与我们自身关系最密切的问题",
        "时光溜走，有人窃取了你的生命。你与琐事较劲，愚蠢断送了命运",
        "有留必有去，有爱必有恨，有和平，也会有战争",
        "石头是重的，沙是沉的，但一个傻瓜的愤怒比两者更沉",
        "新生的芦苇最容易枯死，起始之时总是最危险的时刻",
        "总是选择畅通无阻的安全航道，最终只会走向停滞",
        "世间万物无不有其局限，正是这种局限构成了事物的界限",
        "力量容易使人骄傲自负，行使力量的人常被其蒙蔽",
        "最致命的错误大多源自不合时宜的假设",
        "当我们自以为了解了某样东西时，正是需要继续深入了解的时候",
        "大多数人偏爱圈养的生活，直到死的那天都不曾离开过牲口棚",
        "你应该对付的是闯进你自己院子里的恶狼，院外的狼群也许并不存在",
        "做好事消除的是恶名，做坏事消除的是自我意识",
        "财富是实现自由的工具，但追求财富又是一条通向奴役之路",
        "谨小慎微只能通向平庸。碌碌无为一生是大部分人对自己的期望",
        "只有决心理性生活，尊重彼此，人生才会被赋予理性的意义",
        "如果你过分地适应于某种东西，其他方面的能力就会萎缩",
        "生活就是场游戏，如果你投入进去玩得尽兴，就能明白其中的规则",
        "人天生带有一种心疾：自欺欺人。此事无人可免，亟须时时自省",
        "将精力花在让你变强的人身上，懦弱之人最终会把你拽向深渊",
        "追求自由，你会落入欲望的圈套。寻求纪律，你会找到自由的入口"
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