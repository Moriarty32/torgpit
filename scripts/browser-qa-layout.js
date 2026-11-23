async (page) => {
  const checks = [], metrics = [], errors = [];
  const check = (ok, name) => checks.push({name, passed: Boolean(ok)});
  page.on('pageerror', e => errors.push(e.message));
  page.setDefaultTimeout(7000);
  await page.goto('http://localhost:4173/');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(async () => {
    sessionStorage.clear();
    await document.fonts.ready;
    for (const img of document.images) img.loading = 'eager';
    await Promise.allSettled([...document.images].map(img => img.decode()));
  });
  check(await page.locator('main > section').count() === 11, 'Все смысловые разделы остаются самостоятельными секциями');
  check(await page.locator('.category-group').count() === 3 && await page.locator('.category').count() === 9, 'Девять категорий объединены в три группы');
  check(await page.locator('h1').count() === 1, 'Сохраняется один главный заголовок');
  check(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every(a => a.hash === '' || a.hash === '#' || document.getElementById(a.hash.slice(1)))), 'Внутренние переходы ведут к существующим разделам');
  for (const [width,height] of [[2560,1440],[1920,1080],[1440,900],[1366,768],[1280,720],[1200,800],[1024,768],[900,600],[768,1024],[724,1000],[390,844],[360,800],[320,740],[844,390]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(() => {document.activeElement.blur(); window.scrollTo({top:0,behavior:'instant'});});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const m = await page.evaluate(() => {
      const rect = selector => {const r=document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
      const card = document.querySelector('.product');
      return {
        width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,
        masthead:document.querySelector('.topbar').offsetHeight+document.querySelector('.header').offsetHeight,
        hero:rect('.hero'),rail:rect('#catalog > .container'),primary:rect('.hero-actions a'),
        promises:rect('.hero-promises'),photo:rect('.hero-image'),productImage:rect('.product-image'),
        productTitle:rect('.product h3'),
        contactPadding:parseFloat(getComputedStyle(document.querySelector('.contact')).paddingLeft),
        standaloneVenueTargets:[...document.querySelectorAll('.other-formats a')].map(n=>n.getBoundingClientRect().height),
        smallType: Object.fromEntries(['.product-parameters','.category > p','.request-form label:not(.consent)','.form-note'].map(s=>[s,parseFloat(getComputedStyle(document.querySelector(s)).fontSize)])),
        categoryOverflow:[...document.querySelectorAll('.category h4')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent),
        productOverflow:[...card.querySelectorAll('h3,p,button')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent.trim()),
        backgrounds:[...document.querySelectorAll('main > section')].map(n=>({id:n.id||n.className,color:getComputedStyle(n).backgroundColor}))
      };
    });
    metrics.push(m);
    check(m.documentWidth <= width, 'Нет горизонтального переполнения: '+width+'×'+height);
    check(m.categoryOverflow.length === 0, 'Названия категорий помещаются: '+width+'px');
    check(m.productOverflow.length === 0, 'Содержимое карточки не обрезается: '+width+'px');
    check(m.smallType['.product-parameters']>=14, 'Параметры оборудования читаемы: '+width+'px');
    check(m.contactPadding===0, 'Бриф выровнен по общему контейнеру: '+width+'px');
    check(m.standaloneVenueTargets.every(h=>h>=44), 'Ссылки форматов имеют удобную область нажатия: '+width+'px');
    if (width >= 1600) {
      check(Math.abs(m.hero.bottom-height)<=2, 'Первый экран заполняет окно: '+width+'×'+height);
      check(m.rail.width>1240&&m.rail.width<=1600, 'Контент расширяется в разумных пределах: '+width+'px');
    }
    if (width >= 1024 && height >= 720 && height <= 900)
      check(m.hero.bottom<=height+2, 'Первый экран помещается на ноутбуке: '+width+'×'+height);
    if (width <= 700) {
      check(m.primary.bottom<=height, 'Основная кнопка видна без прокрутки: '+width+'px');
      check(m.productImage.width>=85, 'Изображение оборудования остаётся различимым: '+width+'px');
      check(Object.values(m.smallType).every(n=>n>=14), 'Рабочие подписи читаемого размера: '+width+'px');
      check(m.photo.height<=180&&m.promises.height<=115, 'Фото и преимущества не растягивают начало страницы: '+width+'px');
    }
    if ([2560,1920,1366,724,390,320].includes(width))
      await page.screenshot({path:'output/playwright/v4/top-'+width+'x'+height+'.png',animations:'disabled'});
  }
  await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:'.impeccable/review/desktop.png',animations:'disabled'});
  const captureSections = async (width,height,selectors) => {
    await page.setViewportSize({width,height});
    const style = await page.addStyleTag({content:'.header,.skip-link { visibility: hidden !important; }'});
    try {
      for (const selector of selectors) {
        await page.evaluate(() => document.activeElement.blur());
        await page.locator(selector).screenshot({path:'output/playwright/v4/'+width+'-'+selector.replace('#','')+'.png',animations:'disabled'});
      }
    } finally { await style.evaluate(n=>n.remove()); }
  };
  await captureSections(1920,1080,['#catalog','#selection','#formats','#planning','#neutral','#preflight','#conditions','#faq','#contact']);
  await captureSections(390,844,['#catalog','#selection','#contact']);
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:'.impeccable/review/mobile.png',animations:'disabled'});
  check(await page.evaluate(()=>[...document.images].every(n=>n.complete&&n.naturalWidth>0)), 'Все фотографии загружены');
  check(errors.length===0,'Нет ошибок JavaScript');
  return {passed:checks.filter(n=>n.passed).length,failed:checks.filter(n=>!n.passed),checks,metrics,errors};
}
