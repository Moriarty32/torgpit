const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const products = {
  oven: {
    name: "Пароконвектоматы",
    task: "Выпечка, жарка и приготовление на пару",
    checklist: [
      "Меню и загрузка в пиковый час",
      "Число уровней и формат гастроёмкостей",
      "Доступная мощность и напряжение",
      "Вода, слив, вентиляция и место обслуживания",
    ],
  },
  cold: {
    name: "Холодильные шкафы",
    task: "Хранение продуктов и заготовок",
    checklist: [
      "Объём и тип хранимых продуктов",
      "Температурный диапазон",
      "Габариты и направление открывания двери",
      "Температура в помещении и условия эксплуатации",
    ],
  },
  mixer: {
    name: "Планетарные миксеры",
    task: "Смешивание и взбивание",
    checklist: [
      "Объём дежи и масса загрузки",
      "Тип смеси и её плотность",
      "Насадки, скорости и режим работы",
      "Напряжение, габариты и место установки",
    ],
  },
};
const info = {
  delivery: {
    title: "Доставка и получение",
    body: "<p>Для расчёта нужны город, адрес и состав оборудования. Наличие и срок отгрузки подтверждают по конкретному заказу.</p><h3>Согласуйте до оплаты</h3><ul><li>Способ перевозки и стоимость доставки.</li><li>Разгрузку, подъём и занос в помещение.</li><li>Габариты проёмов и маршрут перемещения.</li><li>Порядок приёмки и проверки комплектации.</li></ul><p>Итоговые условия должны быть зафиксированы в предложении.</p>",
  },
  payment: {
    title: "Оплата и документы",
    body: "<p>До оплаты проверьте модель, комплектацию, количество, стоимость и согласованный срок поставки.</p><ul><li>Подготовьте реквизиты организации, если покупка оформляется на неё.</li><li>Согласуйте доставку и дополнительные работы.</li><li>Уточните состав передаваемых документов.</li></ul><p>Актуальные цены и порядок оплаты уточняются для конкретного заказа.</p>",
  },
  service: {
    title: "Подключение и гарантия",
    body: "<p>Помещение и инженерные сети должны соответствовать требованиям производителя выбранного оборудования.</p><ul><li>Уточните необходимость монтажа и пусконаладки.</li><li>Согласуйте доступность работ в вашем городе.</li><li>Сохраните паспорт, документы и серийный номер.</li><li>Проверьте контакты сервиса и порядок обращения.</li></ul><p>Срок и условия гарантии зависят от модели и должны быть подтверждены в документах.</p>",
  },
  privacy: {
    title: "Данные в демонстрационной форме",
    body: "<p>Это демонстрационная страница. Данные формы используются вашим браузером для подготовки текста запроса на info@torgpit.ru.</p><p>Черновик и подборка сохраняются в sessionStorage текущей вкладки. Данные не отправляются на сервер этой страницы. При недоступности хранилища форма продолжает работать без сохранения.</p><p>Вы сами открываете почтовую программу и подтверждаете отправку. Также можно скопировать или скачать текст. Файлы выбираются и прикладываются в почтовой программе.</p>",
  },
};
const dialog = $("#detail-dialog");
const form = $("#request-form");
const fieldNames = [
  "venue",
  "name",
  "contact",
  "contactMethod",
  "task",
  "city",
  "stage",
  "load",
  "power",
  "budget",
  "timing",
];
const readStorage = (key, fallback) => {
  try {
    return JSON.parse(sessionStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const saved = readStorage("torgpit-compare", []);
const selected = new Set(
  Array.isArray(saved) ? saved.filter((id) => products[id]) : [],
);
const savedIntents = readStorage("torgpit-intents", []);
const intents = new Set(
  Array.isArray(savedIntents)
    ? savedIntents.filter((x) => typeof x === "string").slice(0, 20)
    : [],
);
const draft = readStorage("torgpit-draft", {});
if (draft && typeof draft === "object")
  for (const name of fieldNames)
    if (typeof draft[name] === "string")
      if (form.elements[name]) form.elements[name].value = draft[name].slice(0, 2500);
let toastTimer;
function toast(message) {
  const node = $(".toast");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (node.hidden = true), 2700);
}
function saveDraft() {
  const data = {};
  for (const name of fieldNames)
    if (form.elements[name]) data[name] = form.elements[name].value;
  writeStorage("torgpit-draft", data);
}
function invalidateResult() {
  $(".form-result").hidden = true;
  document.body.classList.remove("request-prepared");
}
let dialogReturnFocus = null;
function showDialog(title, html) {
  const origin = document.activeElement;
  if (!dialog.open) {
    const sourcePanel = origin.closest(".nav-panel");
    dialogReturnFocus = sourcePanel
      ? (navigationMedia.matches ? mobileToggle : $('[aria-controls="' + sourcePanel.id + '"]'))
      : origin.closest("#mobile-menu") ? mobileToggle
      : origin.closest("#header-search") ? mobileSearch
      : origin;
  }
  closeMenu(false, true);
  closePanel(true);
  closeMobileSearch();
  $("#dialog-title").textContent = title;
  $("#dialog-content").innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
dialog.addEventListener("close", () => {
  if (dialogReturnFocus?.isConnected && !dialogReturnFocus.closest("[hidden], [inert]"))
    dialogReturnFocus.focus({preventScroll: true});
  dialogReturnFocus = null;
});
$(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  )
    dialog.close();
});
function syncSelection() {
  const selectionCount = selected.size + intents.size;
  $$("[data-compare]").forEach((button) => {
    const active = selected.has(button.dataset.compare);
    button.setAttribute("aria-pressed", String(active));
    $("span", button).textContent = active
      ? "В подборке"
      : "Добавить в подборку";
  });
  $$("[data-compare-count]").forEach((node) => {
    node.textContent = selectionCount;
    node.hidden = !selectionCount;
  });
  $(".compare-tray")?.remove();
  if (selectionCount) {
    const tray = document.createElement("div");
    tray.className = "compare-tray";
    tray.innerHTML =
      "<div><span>В подборке: <strong>" +
      selectionCount +
      '</strong></span></div><button class="button button-primary" type="button" data-open-compare><span>Посмотреть</span></button><button class="icon-button" type="button" data-clear-compare aria-label="Очистить подборку"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>';
    document.body.append(tray);
  }
  const all = [...selected].map((id) => products[id].name).concat([...intents]);
  $("#selection-summary").hidden = !all.length;
  $("#selection-summary p").textContent = all.join(" · ");
  $(".request-context").hidden = !intents.size;
  $(".request-context").textContent = intents.size
    ? "Дополнительно в запросе: " + [...intents].join(", ")
    : "";
  $$("[data-toggle-category]", dialog).forEach(updateCategoryToggle);
  writeStorage("torgpit-compare", [...selected]);
  writeStorage("torgpit-intents", [...intents]);
  invalidateResult();
}
function collectionDialog() {
  if (!selected.size && !intents.size) {
    showDialog(
      "Ваша подборка",
      '<p>Добавьте интересующие направления из карточек оборудования. Они войдут в запрос на комплектацию.</p><a class="button button-primary" href="#selection" data-close-dialog><span>Выбрать оборудование</span></a>',
    );
    return;
  }
  const list = [...selected]
    .map(
      (id) =>
        "<li><div><strong>" +
        products[id].name +
        "</strong><p>" +
        products[id].task +
        '</p></div><button class="icon-button" type="button" data-remove-selection="' +
        id +
        '" aria-label="Убрать ' +
        products[id].name +
        '"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button></li>',
    )
    .join("");
  const extra = [...intents]
    .map(
      (text, index) =>
        '<li><strong></strong><button class="icon-button" type="button" data-remove-intent="' +
        index +
        '" aria-label="Убрать категорию"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button></li>',
    )
    .join("");
  showDialog(
    "Ваша подборка",
    '<p>Это список направлений для обсуждения, а не сравнение конкретных моделей. Параметры и состав оборудования уточняются при подборе.</p><ul class="collection-list">' +
      list +
      extra +
      '</ul><a class="button button-primary" href="#contact" data-close-dialog><span>Перейти к запросу</span></a>',
  );
  $$("[data-remove-intent]", dialog).forEach(
    (button, index) =>
      ($("strong", button.closest("li")).textContent = [...intents][index]),
  );
}
document.addEventListener("click", (e) => {
  const compare = e.target.closest("[data-compare]");
  if (compare) {
    const id = compare.dataset.compare;
    if (selected.has(id)) selected.delete(id);
    else {
      selected.add(id);
      toast("Добавлено в подборку");
    }
    syncSelection();
  }
  if (e.target.closest("[data-open-compare]")) collectionDialog();
  if (e.target.closest("[data-clear-compare]")) {
    selected.clear();
    intents.clear();
    syncSelection();
    toast("Подборка очищена");
  }
  const remove = e.target.closest("[data-remove-selection]");
  const removeIntent = e.target.closest("[data-remove-intent]");
  if (remove || removeIntent) {
    if (remove) selected.delete(remove.dataset.removeSelection);
    else
      intents.delete([...intents][Number(removeIntent.dataset.removeIntent)]);
    syncSelection();
    collectionDialog();
    $(".dialog-close").focus();
  }
  const request = e.target.closest("[data-request]");
  if (request) {
    intents.add(request.dataset.request);
    syncSelection();
    saveDraft();
  }
  const venue = e.target.closest("[data-venue]");
  if (venue) {
    form.elements.venue.value = venue.dataset.venue;
    saveDraft();
    invalidateResult();
    toast("Формат добавлен в бриф: " + venue.dataset.venue);
  }
  if (e.target.closest("[data-close-dialog]")) dialog.close();
});
$$("[data-details]").forEach((button) =>
  button.addEventListener("click", () => {
    const id = button.dataset.details;
    const p = products[id];
    showDialog(
      p.name,
      "<p>" +
        p.task +
        ". Для выбора модели стоит определить:</p><ul>" +
        p.checklist.map((x) => "<li>" + x + "</li>").join("") +
        '</ul><p class="dialog-note">Иллюстрация не обозначает конкретную продаваемую модель. Характеристики, цена и наличие уточняются отдельно.</p><button class="button button-primary" type="button" data-add-from-dialog="' +
        id +
        '"><span>Добавить в подборку</span></button>',
    );
  }),
);
dialog.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add-from-dialog]");
  if (add) {
    selected.add(add.dataset.addFromDialog);
    syncSelection();
    dialog.close();
    toast("Добавлено в подборку");
  }
});
$$("[data-info]").forEach((button) =>
  button.addEventListener("click", () => {
    const p = info[button.dataset.info];
    showDialog(p.title, p.body);
  }),
);
const mobileToggle = $(".mobile-toggle");
const mobileMenu = $("#mobile-menu");
const mobileSearch = $(".mobile-search");
const header = $(".header");
const primaryNav = $(".primary-nav");
const searchPanel = $("#header-search");
const headerBackdrop = $(".header-backdrop");
const searchForm = $("#search-form");
const searchInput = $("#search-input");
const searchResults = $("#search-results");
const navigationMedia = matchMedia("(max-width: 1199px)");
const hoverMedia = matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const navTriggers = $$(".nav-trigger");
const surfaceTimers = new WeakMap();
let activeResult = -1;
let activeTrigger = null;
let drawerOpen = false;
let searchOpen = false;
let pinnedPanel = false;
let hoverTimer;
let leaveTimer;
let backgroundState = [];
let savedBodyStyle;

function showSurface(node) {
  clearTimeout(surfaceTimers.get(node));
  node.classList.remove("is-closing");
  node.hidden = false;
  node.inert = false;
}
function hideSurface(node, immediate = false) {
  clearTimeout(surfaceTimers.get(node));
  node.inert = true;
  if (node.hidden || immediate || reducedMotion.matches) {
    node.hidden = true;
    node.classList.remove("is-closing");
    return;
  }
  node.classList.add("is-closing");
  surfaceTimers.set(node, setTimeout(() => {
    node.hidden = true;
    node.classList.remove("is-closing");
  }, 160));
}
function clearNavigationTimers() {
  clearTimeout(hoverTimer);
  clearTimeout(leaveTimer);
}
function updateHeaderEdge() {
  header.style.setProperty("--header-edge", Math.max(0, header.getBoundingClientRect().bottom) + "px");
}
function syncBackdrop() {
  updateHeaderEdge();
  headerBackdrop.hidden = !(drawerOpen || searchOpen || activeTrigger);
  headerBackdrop.classList.toggle("is-drawer-backdrop", drawerOpen);
}
function closePanel(immediate = false) {
  clearNavigationTimers();
  if (activeTrigger) {
    activeTrigger.setAttribute("aria-expanded", "false");
    hideSurface(document.getElementById(activeTrigger.getAttribute("aria-controls")), immediate);
  }
  activeTrigger = null;
  pinnedPanel = false;
  syncBackdrop();
}
function setBackgroundInert(locked) {
  if (locked && !savedBodyStyle) {
    const gap = innerWidth - document.documentElement.clientWidth;
    savedBodyStyle = {overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight};
    document.body.style.paddingRight = parseFloat(getComputedStyle(document.body).paddingRight) + gap + "px";
    document.body.style.overflow = "hidden";
    backgroundState = $$("main, .footer, .topbar, .header-inner > .logo, .header-actions").map(node => ({node, inert: node.inert}));
    backgroundState.forEach(({node}) => { node.inert = true; });
  } else if (!locked && savedBodyStyle) {
    document.body.style.overflow = savedBodyStyle.overflow;
    document.body.style.paddingRight = savedBodyStyle.paddingRight;
    savedBodyStyle = null;
    backgroundState.forEach(({node, inert}) => { node.inert = inert; });
    backgroundState = [];
  }
}
function closeMenu(restoreFocus = false, immediate = false) {
  if (!drawerOpen) return;
  drawerOpen = false;
  closePanel(true);
  hideSurface(mobileMenu, immediate);
  setBackgroundInert(false);
  mobileMenu.removeAttribute("aria-modal");
  mobileMenu.removeAttribute("role");
  mobileMenu.removeAttribute("aria-labelledby");
  mobileToggle.setAttribute("aria-expanded", "false");
  mobileToggle.setAttribute("aria-label", "Открыть меню");
  syncBackdrop();
  if (restoreFocus) mobileToggle.focus({preventScroll: true});
}
function closeSearch() {
  searchResults.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  activeResult = -1;
}
function closeMobileSearch() {
  searchOpen = false;
  hideSurface(searchPanel);
  mobileSearch.setAttribute("aria-expanded", "false");
  mobileSearch.setAttribute("aria-label", "Открыть поиск");
  closeSearch();
  syncBackdrop();
}
function openSearch() {
  closeMenu(false, true);
  closePanel(true);
  searchOpen = true;
  showSurface(searchPanel);
  mobileSearch.setAttribute("aria-expanded", "true");
  mobileSearch.setAttribute("aria-label", "Закрыть поиск");
  syncBackdrop();
  searchInput.focus({preventScroll: true});
  if (searchInput.value) search();
}
function openPanel(trigger, pinned = false) {
  clearNavigationTimers();
  closeMobileSearch();
  if (activeTrigger !== trigger) {
    closePanel(true);
    activeTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    showSurface(document.getElementById(trigger.getAttribute("aria-controls")));
  }
  pinnedPanel = pinned;
  syncBackdrop();
}
mobileToggle.addEventListener("click", () => {
  if (drawerOpen) { closeMenu(true); return; }
  closeMobileSearch();
  closePanel(true);
  drawerOpen = true;
  showSurface(mobileMenu);
  mobileMenu.setAttribute("role", "dialog");
  mobileMenu.setAttribute("aria-modal", "true");
  mobileMenu.setAttribute("aria-labelledby", "drawer-title");
  mobileToggle.setAttribute("aria-expanded", "true");
  mobileToggle.setAttribute("aria-label", "Закрыть меню");
  setBackgroundInert(true);
  syncBackdrop();
  $("[data-close-navigation]").focus({preventScroll: true});
});
$("[data-close-navigation]").addEventListener("click", () => closeMenu(true));
$("[data-drawer-search]").addEventListener("click", openSearch);
navTriggers.forEach(trigger => {
  trigger.addEventListener("click", () => {
    if (activeTrigger === trigger) closePanel();
    else openPanel(trigger, true);
  });
  trigger.addEventListener("pointerenter", () => {
    if (navigationMedia.matches || !hoverMedia.matches) return;
    clearNavigationTimers();
    if (activeTrigger !== trigger) hoverTimer = setTimeout(() => openPanel(trigger), 300);
  });
  trigger.addEventListener("pointerleave", () => clearTimeout(hoverTimer));
});
const navigationBoundary = $(".header-inner");
navigationBoundary.addEventListener("pointerenter", () => clearTimeout(leaveTimer));
navigationBoundary.addEventListener("pointerleave", () => {
  clearTimeout(hoverTimer);
  const focusedInPanel = activeTrigger && (
    activeTrigger === document.activeElement ||
    document.getElementById(activeTrigger.getAttribute("aria-controls")).contains(document.activeElement)
  );
  if (!navigationMedia.matches && !pinnedPanel && !focusedInPanel)
    leaveTimer = setTimeout(() => closePanel(), 200);
});
primaryNav.addEventListener("focusout", () => {
  setTimeout(() => {
    if (!drawerOpen && !primaryNav.contains(document.activeElement)) closePanel();
  }, 0);
});
function focusDestination(hash) {
  if (!hash?.startsWith("#") || hash === "#") return;
  const target = document.getElementById(hash.slice(1));
  const node = target?.querySelector("h2, h1") || target;
  if (!node) return;
  if (!node.matches("a, button, input, select, textarea")) node.tabIndex = -1;
  requestAnimationFrame(() => node.focus({preventScroll: true}));
}
header.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  const infoButton = event.target.closest("[data-info]");
  const collectionButton = event.target.closest("[data-open-compare]");
  if (!link && !infoButton && !collectionButton) return;
  closeMenu(false, true);
  closePanel(true);
  closeMobileSearch();
  if (link) focusDestination(link.getAttribute("href"));
});
mobileSearch.addEventListener("click", () => {
  if (searchOpen) closeMobileSearch();
  else openSearch();
});
$("[data-close-search]").addEventListener("click", () => {
  closeMobileSearch();
  mobileSearch.focus({preventScroll: true});
});
headerBackdrop.addEventListener("click", () => {
  if (drawerOpen) closeMenu(true);
  else if (searchOpen) {
    closeMobileSearch();
    mobileSearch.focus({preventScroll: true});
  } else {
    const trigger = activeTrigger;
    closePanel();
    trigger?.focus({preventScroll: true});
  }
});
document.addEventListener("keydown", (e) => {
  if (dialog.open) return;
  if (e.key === "Tab" && drawerOpen) {
    const focusable = $$("a[href],button,input,[tabindex]", mobileMenu).filter(n => n.tabIndex >= 0 && !n.disabled && !n.closest("[hidden], [inert]") && n.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  if (e.key !== "Escape") return;
  if (drawerOpen) { e.preventDefault(); closeMenu(true); }
  else if (searchOpen) {
    e.preventDefault();
    closeMobileSearch();
    mobileSearch.focus({preventScroll: true});
  } else if (activeTrigger) {
    e.preventDefault();
    const trigger = activeTrigger;
    closePanel();
    trigger.focus({preventScroll: true});
  }
});
document.addEventListener("click", (e) => {
  if (!header.contains(e.target)) {
    closePanel();
    if (searchOpen) closeMobileSearch();
  }
});
searchPanel.addEventListener("focusout", () => {
  setTimeout(() => {
    if (searchOpen && !searchPanel.contains(document.activeElement) && document.activeElement !== mobileSearch)
      closeMobileSearch();
  }, 0);
});
function resetNavigation() {
  const wasInside = mobileMenu.contains(document.activeElement);
  closeMenu(false, true);
  closePanel(true);
  closeMobileSearch();
  hideSurface(searchPanel, true);
  mobileMenu.hidden = navigationMedia.matches;
  mobileMenu.inert = navigationMedia.matches;
  mobileMenu.classList.remove("is-closing");
  if (wasInside) (navigationMedia.matches ? mobileToggle : navTriggers[0]).focus({preventScroll: true});
  syncBackdrop();
}
navigationMedia.addEventListener("change", resetNavigation);
addEventListener("scroll", () => { if (activeTrigger || searchOpen) updateHeaderEdge(); }, {passive: true});
addEventListener("resize", updateHeaderEdge, {passive: true});
resetNavigation();
const normalize = (text) =>
  text.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
const categoryQuestions = {
  "Тепловое оборудование": ["Что входит в меню и какая загрузка в пиковый час?", "Какие способы приготовления нужны?", "Какая мощность и напряжение доступны?", "Где пройдут вода, слив и вентиляция?"],
  "Электромеханическое": ["Какие продукты предстоит обрабатывать?", "Какой объём нужен за смену?", "Какие насадки и операции необходимы?", "Где разместить и подключить оборудование?"],
  "Для пекарни": ["Какие изделия и виды теста планируются?", "Какой объём замеса и выпечки нужен?", "Какие форматы листов и ёмкостей используются?", "Как связаны зоны замеса, расстойки и выпечки?"],
  "Холодильное оборудование": ["Какие продукты и заготовки будут храниться?", "Какой объём и температурный режим нужен?", "Какие габариты и открывание двери подходят?", "Какие условия в помещении и доступ к обслуживанию?"],
  "Торговое оборудование": ["Какие продукты предстоит выкладывать?", "Нужно ли охлаждение и какой режим?", "Как покупатель и персонал подходят к витрине?", "Какие размеры и подключения доступны?"],
  "Барное и кофейное": ["Какие напитки входят в меню?", "Какая загрузка ожидается в пиковый час?", "Какие подключения воды и питания доступны?", "Как организованы рабочая зона и мойка?"],
  "Посудомоечное": ["Какая посуда и сколько её в пиковый час?", "Каковы размеры посуды и кассет?", "Где проходят вода, слив и питание?", "Как разделены потоки грязной и чистой посуды?"],
  "Нейтральное оборудование": ["Какие операции выполняются в рабочей зоне?", "Какие размеры и высота поверхности нужны?", "Нужны ли мойки, полки или борта?", "Как организованы проходы, слив и уборка?"],
  "Кухонный инвентарь": ["Для каких блюд и операций нужен инвентарь?", "Какие размеры и форматы ёмкостей используются?", "Какие материалы подходят рабочим процессам?", "Как организованы хранение, мойка и запас?"],
};
const categories = $$(".category[data-title]").map((node, index) => ({
  id: "category-" + index,
  name: node.dataset.title,
  terms: node.textContent,
  purpose: $("p", node)?.textContent.trim() || "",
  image: $("img", node),
  node,
}));
function updateCategoryToggle(button) {
  const category = categories.find(item => item.id === button.dataset.toggleCategory);
  if (!category) return;
  const active = intents.has(category.name);
  button.setAttribute("aria-pressed", String(active));
  $("span", button).textContent = active
    ? "В подборке · Убрать направление"
    : "Добавить направление в запрос";
}
function categoryDialog(category) {
  showDialog(category.name, '<p class="category-dialog-purpose"></p><div class="category-dialog-visual"></div><h3>Что уточнить для выбора</h3><ul class="category-dialog-questions"></ul><p class="dialog-note">Иллюстрация категории, а не конкретной модели. Характеристики, цена и наличие уточняются при подборе.</p><button class="button button-primary category-dialog-action" type="button" data-toggle-category="' + category.id + '" aria-pressed="false"><span></span></button><p class="category-dialog-status" role="status"></p>');
  $(".category-dialog-purpose", dialog).textContent = category.purpose;
  if (category.image) {
    const image = category.image.cloneNode(true);
    image.className = "category-dialog-image";
    image.loading = "eager";
    image.sizes = "(max-width: 700px) 70vw, 280px";
    $(".category-dialog-visual", dialog).append(image);
  }
  for (const question of categoryQuestions[category.name] || []) {
    const li = document.createElement("li");
    li.textContent = question;
    $(".category-dialog-questions", dialog).append(li);
  }
  updateCategoryToggle($("[data-toggle-category]", dialog));
}
const categoryAliases = {
  "холодильное": "Холодильное оборудование",
  "нейтральное": "Нейтральное оборудование",
  "столы и мойки": "Нейтральное оборудование",
};
function categoryForLink(link) {
  if (link.matches(".category")) return categories.find(item => item.node === link);
  if (!link.matches(".menu-link, .search-suggestions a")) return null;
  const text = normalize(link.querySelector("span")?.firstChild?.textContent || link.textContent);
  const name = categoryAliases[text] || text;
  return categories.find(item => normalize(item.name) === normalize(name));
}
$$(".category, .menu-link, .search-suggestions a").forEach(link => {
  if (!categoryForLink(link)) return;
  link.setAttribute("aria-haspopup", "dialog");
  link.setAttribute("aria-controls", dialog.id);
});
document.addEventListener("click", event => {
  const link = event.target.closest("a");
  const category = link && categoryForLink(link);
  if (!category) return;
  event.preventDefault();
  event.stopPropagation();
  categoryDialog(category);
}, true);
dialog.addEventListener("click", event => {
  const button = event.target.closest("[data-toggle-category]");
  if (!button) return;
  const category = categories.find(item => item.id === button.dataset.toggleCategory);
  if (!category) return;
  const removing = intents.has(category.name);
  if (removing) intents.delete(category.name);
  else intents.add(category.name);
  syncSelection();
  $(".category-dialog-status", dialog).textContent = (removing ? "Направление убрано. " : "Направление добавлено. ") + "В подборке: " + (selected.size + intents.size) + ".";
  toast((removing ? "Убрано из подборки: " : "Добавлено в подборку: ") + category.name);
});
function activateResult(index) {
  const nodes = $$("a", searchResults);
  if (!nodes.length) return;
  activeResult = (index + nodes.length) % nodes.length;
  nodes.forEach((n, i) =>
    n.setAttribute("aria-selected", String(i === activeResult)),
  );
  searchInput.setAttribute("aria-activedescendant", nodes[activeResult].id);
  nodes[activeResult].scrollIntoView({ block: "nearest" });
}
function search() {
  const query = normalize(searchInput.value);
  searchResults.replaceChildren();
  activeResult = -1;
  searchInput.removeAttribute("aria-activedescendant");
  if (!query) {
    closeSearch();
    $("#search-status").textContent = "";
    return;
  }
  const aliases = {
    пароконвект: "теплов",
    холодильник: "холодиль",
    мясоруб: "электромехан",
    овощерез: "электромехан",
    миксер: "электромехан",
    кофе: "кофейн",
    тестомес: "пекар",
    стол: "нейтраль",
    мойк: "нейтраль",
    витрин: "торгов",
    гастро: "инвентарь",
  };
  let needle = query;
  for (const [word, value] of Object.entries(aliases))
    if (query.includes(word)) needle = value;
  const found = categories.filter((c) =>
    normalize(c.name + " " + c.terms).includes(needle),
  );
  const entries = found.length
    ? found
    : [
        {
          name:
            "Обсудить задачу по запросу «" +
            searchInput.value.slice(0, 100) +
            "»",
          href: "#contact",
          request: searchInput.value.slice(0, 100),
        },
      ];
  if (!found.length) {
    const p = document.createElement("p");
    p.textContent = "Категория не найдена. Опишите, что нужно подобрать.";
    p.setAttribute("role", "presentation");
    searchResults.append(p);
  }
  entries.forEach((item, index) => {
    const a = document.createElement("a");
    a.href = item.id ? "#catalog" : item.href;
    a.id = "search-option-" + index;
    a.setAttribute("role", "option");
    a.setAttribute("aria-selected", "false");
    a.tabIndex = -1;
    a.textContent = item.name;
    if (item.id) a.setAttribute("aria-haspopup", "dialog");
    a.addEventListener("click", event => {
      if (item.id) {
        event.preventDefault();
        categoryDialog(item);
        return;
      }
      if (item.request) {
        intents.add(item.request);
        syncSelection();
      }
      closeMobileSearch();
      focusDestination(item.href);
    });
    searchResults.append(a);
  });
  searchResults.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
  $("#search-status").textContent = found.length
    ? "Найдено категорий: " + found.length
    : "Категория не найдена";
}
searchInput.addEventListener("input", search);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (searchResults.hidden) search();
    activateResult(activeResult + (e.key === "ArrowDown" ? 1 : -1));
  }
});
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (searchResults.hidden) search();
  const a = $$("a", searchResults)[activeResult < 0 ? 0 : activeResult];
  a?.click();
});
let draftTimer;
form.addEventListener("input", () => {
  invalidateResult();
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 150);
});
const contactMethod = form.elements.contactMethod;
function updateContactMethod() {
  const field = form.elements.contact;
  const type = contactMethod?.value === "tel" ? "tel" : "email";
  field.type = type;
  field.autocomplete = type;
  field.inputMode = type;
  field.placeholder = type === "tel" ? "+7 900 000-00-00" : "name@example.ru";
}
if (contactMethod) {
  if (!["tel", "email"].includes(contactMethod.value)) contactMethod.value = "email";
  // Older drafts stored a combined contact field without a preferred method.
  if (!draft.contactMethod && draft.contact && !draft.contact.includes("@")) contactMethod.value = "tel";
  updateContactMethod();
}
function fieldError(name) {
  const field = form.elements[name];
  if (name === "name") return field.value.trim() ? "" : "Укажите имя, чтобы к вам можно было обратиться.";
  if (name === "consent") return field.checked ? "" : "Подтвердите разрешение использовать данные для ответа на запрос.";
  const contact = field.value.trim();
  const type = contactMethod?.value || "email";
  const contactOK = type === "tel"
    ? /^[+\d\s().−–-]+$/.test(contact) && contact.replace(/\D/g, "").length >= 7 && contact.replace(/\D/g, "").length <= 20
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  return contactOK ? "" : type === "tel" ? "Укажите телефон с кодом страны или города." : "Укажите email в формате name@example.ru.";
}
function showFieldError(name, message) {
  const field = form.elements[name];
  const error = $("#error-" + name);
  field.setAttribute("aria-invalid", String(Boolean(message)));
  field.setCustomValidity(message);
  if (error) {
    error.textContent = message;
    error.hidden = !message;
    const descriptions = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    descriptions.add(error.id);
    field.setAttribute("aria-describedby", [...descriptions].join(" "));
  }
}
form.addEventListener("change", event => {
  if (event.target.name === "contactMethod") {
    updateContactMethod();
    invalidateResult();
    if (form.elements.contact.getAttribute("aria-invalid") === "true") showFieldError("contact", fieldError("contact"));
  }
  if (["name", "contact", "consent"].includes(event.target.name) && event.target.getAttribute("aria-invalid") === "true")
    showFieldError(event.target.name, fieldError(event.target.name));
  saveDraft();
});
["name", "contact"].forEach(name => form.elements[name].addEventListener("input", () => {
  if (form.elements[name].getAttribute("aria-invalid") === "true") showFieldError(name, fieldError(name));
}));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const invalid = ["name", "contact", "consent"].filter(name => {
    const message = fieldError(name);
    showFieldError(name, message);
    return Boolean(message);
  });
  if (invalid.length) {
    invalidateResult();
    form.elements[invalid[0]].focus();
    return;
  }
  const name = form.elements.name.value.trim();
  const contact = form.elements.contact.value.trim();
  const data = new FormData(form);
  const lines = [
    "Здравствуйте!",
    "Прошу помочь с подбором оборудования.",
    "",
    "Имя: " + name,
    "Контакт: " + contact,
  ];
  const labels = {
    venue: "Формат заведения",
    city: "Город",
    stage: "Этап проекта",
    load: "Загрузка",
    power: "Электропитание",
    budget: "Бюджет",
    timing: "Желаемый срок",
  };
  for (const [key, label] of Object.entries(labels)) {
    const v = String(data.get(key) || "").trim();
    if (v) lines.push(label + ": " + v);
  }
  const equipment = [...selected]
    .map((id) => products[id].name)
    .concat([...intents]);
  if (equipment.length)
    lines.push(
      "",
      "Оборудование и направления:",
      ...equipment.map((x) => "— " + x),
    );
  const task = String(data.get("task") || "").trim();
  if (task) lines.push("", "Описание задачи:", task);
  const text = lines.join("\n");
  $("#request-preview").value = text;
  $("#mailto-link").href =
    "mailto:info@torgpit.ru?subject=" +
    encodeURIComponent("Подбор оборудования — ТоргПит") +
    "&body=" +
    encodeURIComponent(text);
  $(".form-result").hidden = false;
  document.body.classList.add("request-prepared");
  $(".result-status").textContent = "";
  saveDraft();
  $("#request-result").focus({ preventScroll: true });
  $("#request-result").scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "nearest",
  });
});
$("[data-copy-request]").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#request-preview").value);
    $(".result-status").textContent =
      "Текст скопирован. Вставьте его в письмо на info@torgpit.ru.";
  } catch {
    $("#request-preview").focus();
    $("#request-preview").select();
    $(".result-status").textContent =
      "Выделили текст. Скопируйте его сочетанием Ctrl+C или через меню устройства.";
  }
});
function downloadText(filename, text) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("[data-download-request]").addEventListener("click", () => {
  downloadText("torgpit-request.txt", $("#request-preview").value);
  $(".result-status").textContent = "Текст запроса подготовлен для скачивания.";
});
$$("[data-download-checklist]").forEach(button => button.addEventListener("click", () => {
  const text = [
    "ТоргПит — что проверить перед заказом",
    "",
    ...$$(".preflight-list details").map(
      (n) =>
        $("summary", n).innerText.replace(/\s+/g, " ").trim() +
        "\n" +
        $(".faq-answer", n).innerText,
    ),
    "",
    "Ориентир для подготовки. Требования уточняют по паспорту оборудования и с профильными специалистами.",
  ].join("\n\n");
  downloadText("torgpit-kitchen-checklist.txt", text);
  toast("Чек-лист подготовлен для скачивания");
}));
syncSelection();

// The diagram explains relationships; it never selects equipment for the visitor.
const zoneDetails = {
  prep: ['Подготовка продуктов', 'Рабочие поверхности и механическое оборудование. Уточняют операции, объём заготовок и место для работы.'],
  cook: ['Приготовление блюд', 'Тепловая линия под меню и пиковую нагрузку. Уточняют способы приготовления, доступную мощность и подключения.'],
  store: ['Хранение продуктов', 'Холодильное оборудование и места для запасов. Уточняют объём, температурный режим и доступ персонала.'],
  wash: ['Мойка и чистая посуда', 'Мойки и посудомоечное оборудование. Уточняют поток посуды, воду, слив и организацию рабочих мест.'],
};
$$('[data-zone]').forEach(button => button.addEventListener('click', () => {
  const zone = button.dataset.zone;
  if (!zoneDetails[zone]) return;
  $('.zone-drawing').dataset.activeZone = zone;
  $$('[data-zone]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('#zone-name').textContent = zoneDetails[zone][0];
  $('#zone-description').textContent = zoneDetails[zone][1];
}));
