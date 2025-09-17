// test.js
document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  let isFirst = localStorage.getItem("isFirst") !== "false";
  if (isFirst) {
    alert(
      "签到系统迎来重大更新！现增加翻牌福利系统，每天登录签到系统进行翻牌，有几率获得晚归卡，补签卡！快来参与吧！（晚归卡的获取几率为1/6，补签卡的几率为1/3）"
    );
    localStorage.setItem("isFirst", "false");
  }
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.querySelector(".month-year");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const signTodayBtn = document.getElementById("sign-today");
  const signNotYetBtn = document.getElementById("sign-notyet");
  const resetCalendarBtn = document.getElementById("reset-calendar");
  const useLateCardBtn = document.getElementById("use-late-card");
  const useAssetCardBtn = document.getElementById("use-asset-card");
  const useLetCardBtn = document.getElementById("use-let-card");
  const signedCountEl = document.getElementById("signed-count");
  const totalDaysEl = document.getElementById("total-days");
  const streakEl = document.getElementById("streak");
  const rewardNotification = document.getElementById("reward-notification");
  const lateCardCountEl = document.getElementById("late-card-count");
  const letCardCountEl = document.getElementById("let-card-count");

  // 卡片类型和对应的元素
  const cardTypes = {
    late: { count: 5, element: lateCardCountEl },
    asset: {
      count: 1,
      element: document.querySelector(".information p:nth-child(2) span"),
    },
    let: {
      count: 2,
      element: document.querySelector(".information p:nth-child(3) span"),
    },
    supplement: {
      count: 3,
      element: document.querySelector(".information p:nth-child(4) span"),
    },
    treat: {
      count: 0,
      element: document.querySelector(".information p:nth-child(5) span"),
    },
    magic: {
      count: 0,
      element: document.querySelector(".information p:nth-child(6) span"),
    },
  };

  // 当前日期和日历状态
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let signedDays = [];
  let streak = 0;

  // 初始化
  loadFromLocalStorage();
  updateCalendar();
  updateStats();

  // 事件监听器
  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendar();
  });

  signTodayBtn.addEventListener("click", signToday);
  signNotYetBtn.addEventListener("click", signNotYet);
  resetCalendarBtn.addEventListener("click", resetCalendar);
  useLateCardBtn.addEventListener("click", () => useCard("late"));
  useAssetCardBtn.addEventListener("click", () => useCard("asset"));
  useLetCardBtn.addEventListener("click", () => useCard("let"));

  // 其他卡片按钮（示例，可根据需要添加）
  document
    .getElementById("use-let-card")
    .addEventListener("click", () => useCard("treat"));
  // 注意：HTML中有重复的ID，实际应用中应避免

  // 生成日历
  function updateCalendar() {
    calendarEl.innerHTML = "";

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay(); // 0-6 (周日-周六)

    monthYearEl.textContent = `${currentYear}年${currentMonth + 1}月`;
    totalDaysEl.textContent = daysInMonth;

    // 添加空白日期（上个月的日期）
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.classList.add("day", "past");
      calendarEl.appendChild(emptyDay);
    }

    // 添加当前月的日期
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement("div");
      const dateStr = formatDate(currentYear, currentMonth, i);

      dayEl.classList.add("day");
      dayEl.dataset.date = dateStr;

      // 添加日期数字
      const dayNumber = document.createElement("div");
      dayNumber.classList.add("day-number");
      dayNumber.textContent = i;
      dayEl.appendChild(dayNumber);

      // 添加签到图标
      const checkIcon = document.createElement("i");
      checkIcon.classList.add("fas", "fa-check-circle", "check-icon");
      dayEl.appendChild(checkIcon);

      // 标记今天
      if (
        i === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear()
      ) {
        dayEl.classList.add("today");
        const todayHighlight = document.createElement("div");
        todayHighlight.classList.add("today-highlight");
        dayEl.appendChild(todayHighlight);
      }

      // 标记已过去但未签到的日期
      const thisDate = new Date(currentYear, currentMonth, i);
      if (thisDate < today && thisDate.getDate() !== today.getDate()) {
        dayEl.classList.add("past");
      }

      // 标记未来的日期
      if (thisDate > today) {
        dayEl.classList.add("future");
      }

      // 标记已签到的日期
      if (signedDays.includes(dateStr)) {
        dayEl.classList.add("signed");
      }

      calendarEl.appendChild(dayEl);
    }
  }

  // 更新统计信息
  function updateStats() {
    const signedCount = signedDays.length;
    signedCountEl.textContent = signedCount;

    // 计算连续签到天数
    streak = calculateStreak();
    streakEl.textContent = streak;

    // 检查是否达到奖励条件
    checkRewards();

    // 保存到本地存储
    saveToLocalStorage();
  }

  // 计算连续签到天数
  function calculateStreak() {
    if (signedDays.length === 0) return 0;

    // 将日期字符串转换为日期对象并排序
    const dates = signedDays
      .map((dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      })
      .sort((a, b) => b - a); // 从最近到最远排序

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今天是否已签到
    const todayStr = formatDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    if (signedDays.includes(todayStr)) {
      currentStreak = 1;
    } else {
      return 0;
    }

    // 检查连续签到
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currentDate = new Date(dates[i]);

      prevDate.setDate(prevDate.getDate() - 1);
      prevDate.setHours(0, 0, 0, 0);

      if (prevDate.getTime() === currentDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak;
  }

  // 今日签到
  function signToday() {
    const today = new Date();
    const todayStr = formatDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (!signedDays.includes(todayStr)) {
      signedDays.push(todayStr);

      // 更新UI
      const dayEl = document.querySelector(`.day[data-date="${todayStr}"]`);
      if (dayEl) {
        dayEl.classList.add("signed");
      }

      updateStats();
      showNotification("签到成功！", "success");
    } else {
      showNotification("今天已经签到过了！", "warning");
    }
  }

  // 补签
  function signNotYet() {
    if (cardTypes.supplement.count <= 0) {
      showNotification("补签卡不足！", "error");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 找到最近未签到的日期
    let dateToSign = null;
    for (let i = 1; i <= 31; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      if (checkDate.getTime() < today.getTime()) {
        const dateStr = formatDate(
          checkDate.getFullYear(),
          checkDate.getMonth(),
          checkDate.getDate()
        );

        if (!signedDays.includes(dateStr)) {
          dateToSign = dateStr;
          break;
        }
      }
    }

    if (dateToSign) {
      signedDays.push(dateToSign);
      cardTypes.supplement.count--;
      cardTypes.supplement.element.textContent = cardTypes.supplement.count;

      // 如果当前显示的是补签日期的月份，更新UI
      const [year, month, day] = dateToSign.split("-").map(Number);
      if (year === currentYear && month - 1 === currentMonth) {
        const dayEl = document.querySelector(`.day[data-date="${dateToSign}"]`);
        if (dayEl) {
          dayEl.classList.add("signed");
        }
      }

      updateStats();
      showNotification("补签成功！", "success");
      saveToLocalStorage();
    } else {
      showNotification("没有需要补签的日期！", "info");
    }
  }

  // 使用卡片
  function useCard(cardType) {
    if (cardTypes[cardType].count <= 0) {
      showNotification(`${getCardName(cardType)}不足！`, "error");
      return;
    }

    cardTypes[cardType].count--;
    cardTypes[cardType].element.textContent = cardTypes[cardType].count;

    showNotification(`使用${getCardName(cardType)}成功！`, "success");
    saveToLocalStorage();
  }

  // 获取卡片名称
  function getCardName(cardType) {
    const names = {
      late: "晚归卡",
      asset: "转移对象资产卡",
      let: "和好卡",
      supplement: "补签卡",
      treat: "让对象请客卡",
      magic: "神笔马良卡",
    };

    return names[cardType] || cardType;
  }

  // 重置日历
  function resetCalendar() {
    if (confirm("确定要重置日历吗？这将清除所有签到数据！")) {
      signedDays = [];
      streak = 0;

      // 重置卡片数量（根据需求决定是否重置）
      // cardTypes.late.count = 3;
      // cardTypes.asset.count = 1;
      // cardTypes.let.count = 2;
      // cardTypes.supplement.count = 2;
      // cardTypes.treat.count = 0;
      // cardTypes.magic.count = 0;

      // 更新UI
      // for (const type in cardTypes) {
      //     cardTypes[type].element.textContent = cardTypes[type].count;
      // }

      updateCalendar();
      updateStats();
      localStorage.removeItem("calendarData");
      showNotification("日历已重置！", "info");
    }
  }

  // 检查奖励
  function checkRewards() {
    if (streak > 0 && streak % 7 === 0) {
      // 避免重复奖励
      const lastReward = localStorage.getItem("lastReward");
      if (lastReward !== streak.toString()) {
        cardTypes.late.count++;
        lateCardCountEl.textContent = cardTypes.late.count;

        rewardNotification.querySelector(
          ".reward-text"
        ).textContent = `恭喜！连续签到满${streak}天，获得1张晚归卡！`;
        rewardNotification.classList.add("show");

        setTimeout(() => {
          rewardNotification.classList.remove("show");
        }, 3000);

        localStorage.setItem("lastReward", streak.toString());
        saveToLocalStorage();
      }
    }
  }

  // 显示通知
  function showNotification(message, type) {
    // 这里可以添加更复杂的通知系统
    alert(
      `${
        type === "error" ? "错误" : type === "warning" ? "警告" : "提示"
      }: ${message}`
    );
  }

  // 格式化日期为YYYY-MM-DD
  function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // 保存到本地存储
  function saveToLocalStorage() {
    const data = {
      signedDays,
      cards: {
        late: cardTypes.late.count,
        asset: cardTypes.asset.count,
        let: cardTypes.let.count,
        supplement: cardTypes.supplement.count,
        treat: cardTypes.treat.count,
        magic: cardTypes.magic.count,
      },
      streak,
    };

    localStorage.setItem("calendarData", JSON.stringify(data));
  }

  // 从本地存储加载
  function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem("calendarData"));

    if (data) {
      signedDays = data.signedDays || [];
      streak = data.streak || 0;

      // 加载卡片数量
      if (data.cards) {
        cardTypes.late.count =
          data.cards.late !== undefined
            ? data.cards.late
            : cardTypes.late.count;
        cardTypes.asset.count =
          data.cards.asset !== undefined
            ? data.cards.asset
            : cardTypes.asset.count;
        cardTypes.let.count =
          data.cards.let !== undefined ? data.cards.let : cardTypes.let.count;
        cardTypes.supplement.count =
          data.cards.supplement !== undefined
            ? data.cards.supplement
            : cardTypes.supplement.count;
        cardTypes.treat.count =
          data.cards.treat !== undefined
            ? data.cards.treat
            : cardTypes.treat.count;
        cardTypes.magic.count =
          data.cards.magic !== undefined
            ? data.cards.magic
            : cardTypes.magic.count;

        // 更新UI
        for (const type in cardTypes) {
          cardTypes[type].element.textContent = cardTypes[type].count;
        }
      }
    }
  }
  //抽奖系统
  const btn = document.getElementById("startshuffle");
  var arr = [
    "晚归卡一张",
    "补签卡一张",
    "补签卡一张",
    "谢谢参与",
    "谢谢参与",
    "谢谢参与",
  ];
  var shufflebox = document.getElementsByClassName("shufflebox");
  var shufflecard = document.getElementsByClassName("shufflecard");
  var divElement = document.getElementsByClassName("description--card");

  const baseTime = new Date(2025, 8, 16, 0);
  const now = new Date(2025, 1, 8);
  // 转换为布尔值
  const today = now.toISOString().split("T")[0];
  const lastClickedDate = localStorage.getItem("lastClickedDate");

  if (lastClickedDate === today) {
    btn.disabled = true;
  } else {
    btn.disabled = false;
  }
  function clicked() {
    btn.disabled = true;
    localStorage.setItem("lastClickedDate", today);
  }

  lastDaysDiff = 0;

  function checkAndUpdate() {
    const daysDiff = Math.floor((now - baseTime) / (1000 * 60 * 60 * 24));
    if (daysDiff > lastDaysDiff) {
      lastDaysDiff = daysDiff;
    }
  }

  for (let i = 0; i < shufflecard.length; i++) {
    shufflecard[i].style.display = "none";
    divElement[i].style.display = "none";
  }
  btn.addEventListener("click", () => {
    clicked();

    for (let i = 0; i < shufflecard.length; i++) {
      shufflecard[i].style.display = "flex";
      divElement[i].style.display = "none";
    }
    const shuffled = shuffle(arr);
    for (let j = 0; j < shufflecard.length; j++) {
      divElement[j].textContent = shuffled[j];
    }
  });
  // 生成 [start, start+1, ..., stop-1]
  const range = (start, stop, step = 1) => {
    // 计算序列长度（处理正/倒序）
    const length = Math.ceil((stop - start) / step);
    // 生成数组并映射为目标序列
    return Array.from({ length }, (_, index) => start + index * step);
  };
  for (let i = 0; i < shufflecard.length; i++) {
    (function (index) {
      shufflecard[index].addEventListener("click", () => {
        divElement[index].style.display = "block";
        const user_choose = divElement[index].textContent;
        for (let j = 0; j < shufflecard.length; j++) {
          if (j !== index) {
            shufflecard[j].style.display = "none";
            divElement[j].style.display = "none";
          }
        }
        switch (user_choose) {
          case "补签卡一张":
            cardTypes.supplement.count++;
            saveToLocalStorage();
            letCardCountEl.textContent = cardTypes.supplement.count;
            break;
          case "晚归卡一张":
            cardTypes.late.count++;
            saveToLocalStorage();
            lateCardCountEl.textContent = cardTypes.late.count;
            break;
          case "谢谢参与":
            break;
        }
      });
    })(i);
  }

  if (divElement.length > 0) {
    var text = divElement[0].textContent;
    console.log(text);
  }
  function shuffle(array) {
    // 创建原数组的副本，避免修改原数组
    const shuffledArray = [...array];

    // 从后向前遍历数组
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      // 随机选择一个0到i之间的索引
      const j = Math.floor(Math.random() * (i + 1));

      // 交换当前元素和随机选择的元素
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }

    return shuffledArray;
  }
  setInterval(checkAndUpdate, 1000);
  checkAndUpdate();
  // 初始化按钮状态
  function updateButtonStates() {
    // 这里可以根据卡片数量禁用按钮
    if (cardTypes.supplement.count <= 0) signNotYetBtn.disabled = true;
  }
});
