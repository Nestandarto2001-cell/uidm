import{u as y,j as e,T as f,e as p,p as j,a as k}from"./index-DQyifkmp.js";import{R as N,r as x}from"./utils-Da15yrvB.js";import"./vendor-Bzgz95E1.js";const C=N.memo(()=>{const{items:i,activeId:m,openCreateModal:a,setActive:b,update:v,delete:u}=y(),g=i.find(s=>s.id===m),[h,t]=x.useState(null),r=s=>s.length<=8?s:`${s.slice(0,4)}…${s.slice(-4)}`,o=s=>!!(s.apiKey&&s.apiSecret);return e.jsxs("div",{className:"bg-slate-800/60 border border-slate-600/50 p-3",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("h3",{className:"text-sm font-medium text-slate-300",children:"Профили пользователей"}),e.jsx("button",{onClick:a,className:"text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors",children:"+ Новый профиль"})]}),e.jsxs("div",{className:"flex items-center gap-2 overflow-x-auto pb-1",children:[i.map(s=>e.jsxs("div",{className:"flex items-center gap-2 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer min-w-0 flex-shrink-0 border border-slate-600/30",onClick:()=>b(s.id),onMouseEnter:()=>t(s.id),onMouseLeave:()=>t(null),children:[e.jsx("div",{className:`w-2 h-2 ${g?.id===s.id?"bg-green-500":"bg-slate-500"}`}),e.jsxs("div",{className:"text-slate-200 min-w-0",children:[e.jsxs("div",{className:"truncate",children:["UID: ",s.uid?r(s.uid):"—"]}),e.jsxs("div",{className:"text-slate-400",children:["API: ",o(s)?"✓":"✗"]})]}),!o(s)&&e.jsx("div",{className:"px-1 py-0.5 bg-red-600 text-white text-xs",children:"Not Connected"}),h===s.id&&e.jsxs("div",{className:"flex items-center gap-1 ml-1",children:[e.jsx("button",{onClick:c=>{c.stopPropagation();const n=new CustomEvent("openProfileModal",{detail:{profile:s,mode:"edit"}});window.dispatchEvent(n);const l=new CustomEvent("openCreateModal");window.dispatchEvent(l)},className:"text-slate-400 hover:text-blue-400 transition-colors p-1",title:"Редактировать профиль",children:e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"})})}),e.jsx("button",{onClick:c=>{c.stopPropagation(),u(s.id)},className:"text-slate-400 hover:text-red-400 transition-colors",title:"Удалить",children:"🗑️"})]})]},s.id)),i.length===0&&e.jsx("div",{className:"text-slate-400 text-xs",children:"Нет профилей. Создайте новый профиль."})]})]})}),M=()=>{const[i,m]=x.useState([]),[a,b]=x.useState(null),v=(t,r)=>{switch(r){case"extension":if(t.includes("установлено и включено"))return p()?"ok":"error";if(t.includes("доступ к сайту"))return p()?"ok":"error";if(t.includes("CORS Unblock"))return"unknown";if(t.includes("Chrome/Edge"))return navigator.userAgent.includes("Chrome")||navigator.userAgent.includes("Edge")?"ok":"error";break;case"api":if(t.includes("API ключ создан"))return localStorage.getItem("mexcApiKey")&&localStorage.getItem("mexcApiSecret")?"ok":"error";break;case"public":if(t.includes("CORS Unblock"))return"unknown";if(t.includes("fetch API"))return typeof fetch<"u"?"ok":"error";if(t.includes("интернет соединение"))return navigator.onLine?"ok":"error";break}return"unknown"};x.useEffect(()=>{const t=async()=>{const o=p();let s="unknown";if(o)try{await j()?s=(await k()).type==="PROBE_OK"?"working":"error":s="warning"}catch{s="error"}m([{id:"extension",title:"Браузерное расширение",description:"Основной способ подключения через расширение Chrome/Edge",requirements:['Расширение "МексоЁБ" установлено и включено',"Расширение имеет доступ к сайту терминала","CORS Unblock расширение установлено (рекомендуется)","Браузер Chrome/Edge последней версии"],status:o?"working":"error",buttonText:"Настроить расширение",buttonAction:()=>{const n=document.createElement("div");n.className="fixed inset-0 z-50 grid place-items-center bg-black/80",n.innerHTML=`
              <div class="w-[500px] rounded-lg p-6 bg-black border border-gray-800">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-white">Настройка расширения</h3>
                  <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">×</button>
                </div>
                
                <div class="space-y-4 text-gray-300">
                  <div>
                    <h4 class="text-white font-medium mb-2">Chrome:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">chrome://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('chrome://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>
                  
                  <div>
                    <h4 class="text-white font-medium mb-2">Edge:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">edge://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('edge://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>
                  
                  <div class="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
                    <p class="text-yellow-400 text-sm">
                      <strong>Важно:</strong> Убедитесь что расширение "МексоЁБ" включено и имеет доступ к сайту терминала.
                    </p>
                  </div>
                </div>
                
                <div class="mt-6 flex justify-end">
                  <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors font-medium">Закрыть</button>
                </div>
              </div>
            `,document.body.appendChild(n)},details:`Расширение позволяет обходить CORS ограничения и получать данные напрямую от MEXC API. 
          
Требования:
• Установите расширение "МексоЁБ" 
• Разрешите доступ к сайту терминала
• Для лучшей работы установите "CORS Unblock" расширение
• Убедитесь что браузер поддерживает Manifest V3

Проблемы:
• Если статус "Не найдено" - проверьте установку расширения
• Если "Не отвечает" - перезагрузите страницу или переустановите расширение`},{id:"api",title:"API ключи MEXC",description:"Подключение через официальные API ключи для торговли",requirements:["API ключ создан в MEXC","API ключ имеет права на чтение и торговлю","IP адрес добавлен в белый список (если настроено)","Ключи актуальны и не истекли"],status:s,buttonText:"Настроить API",buttonAction:()=>{const n=new CustomEvent("openCreateModal");window.dispatchEvent(n)},details:`API ключи позволяют совершать реальные торговые операции.

Требования:
• Создайте API ключ в MEXC (Account → API Management)
• Установите права: "Read Info" и "Trade" 
• При необходимости добавьте IP в белый список
• Сохраните ключи в безопасном месте

Безопасность:
• Никогда не передавайте ключи третьим лицам
• Используйте ограничения по IP если возможно
• Регулярно обновляйте ключи`},{id:"public",title:"Публичные данные",description:"Получение рыночных данных без API ключей",requirements:["Расширение CORS Unblock установлено","Браузер поддерживает fetch API","Стабильное интернет соединение","MEXC API доступен"],status:s==="working"?"working":"warning",buttonText:"Проверить подключение",buttonAction:async()=>{try{const n=event?.target;if(n){const l=n.textContent;n.textContent="Проверяем...",n.disabled=!0;try{const d=await fetch("https://api.mexc.com/api/v3/time",{method:"GET",signal:AbortSignal.timeout(5e3)});if(d.ok){const w=await d.json();alert(`✅ Публичные данные доступны!

Серверное время MEXC: ${new Date(w.serverTime).toLocaleString("ru-RU")}`)}else alert(`❌ Ошибка доступа к публичным данным

HTTP ${d.status}: ${d.statusText}`)}finally{n.textContent=l,n.disabled=!1}}else(await fetch("https://api.mexc.com/api/v3/time")).ok?alert("✅ Публичные данные доступны!"):alert("❌ Ошибка доступа к публичным данным")}catch(n){alert(`❌ Ошибка подключения: ${n instanceof Error?n.message:"Неизвестная ошибка"}

Возможные причины:
• Проблемы с интернетом
• Блокировка CORS
• MEXC API недоступен`)}},details:`Публичные данные доступны без API ключей, но с ограничениями CORS.

Возможности:
• Получение курсов валют
• Просмотр ордербука
• История сделок
• Статистика 24ч

Ограничения:
• Нет доступа к личному балансу
• Невозможность размещения ордеров
• Могут быть задержки в данных`},{id:"assessment",title:"Assessment Zone Monitor",description:"Автоматическое отслеживание оценочной зоны MEXC",requirements:['Расширение "МексоЁБ" активно',"Доступ к сайту mexc.com","Работает парсер объявлений","Доступ к chrome.storage"],status:o?"working":"warning",buttonText:"Запустить мониторинг",buttonAction:()=>{const n=new CustomEvent("switchTab",{detail:"assessment"});window.dispatchEvent(n)},details:`Assessment Zone Monitor автоматически отслеживает новые токены в оценочной зоне.

Функции:
• Автоматическое сканирование объявлений
• Парсинг дат и токенов
• Уведомления о новых листингах
• История изменений

Настройки:
• Интервал проверки: 10 минут
• Уведомления в браузере
• Сохранение в chrome.storage`}])};t();const r=setInterval(t,3e4);return()=>clearInterval(r)},[]);const u=t=>{switch(t){case"working":return"text-green-400 bg-green-400/10 border-green-400/20";case"error":return"text-red-400 bg-red-400/10 border-red-400/20";case"warning":return"text-yellow-400 bg-yellow-400/10 border-yellow-400/20";default:return"text-gray-400 bg-gray-400/10 border-gray-400/20"}},g=t=>{switch(t){case"working":return"✅";case"error":return"❌";case"warning":return"⚠️";default:return"❓"}},h=t=>{b(a===t?null:t)};return e.jsxs("div",{className:"p-6 max-w-6xl mx-auto",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("h2",{className:"text-2xl font-bold text-white mb-2",children:"Настройка подключений"}),e.jsx("p",{className:"text-gray-400",children:"Настройте способы подключения к MEXC для получения данных и торговли"})]}),e.jsx("div",{className:"mb-6",children:e.jsx(C,{})}),e.jsx("div",{className:"mb-6",children:e.jsx(f,{onOpenMexc:()=>window.open("https://www.mexc.com","_blank"),onOpenExtensions:()=>{const t=document.createElement("div");t.className="fixed inset-0 z-50 grid place-items-center bg-black/80",t.innerHTML=`
              <div class="w-[500px] rounded-lg p-6 bg-black border border-gray-800">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-white">Управление расширениями</h3>
                  <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">×</button>
                </div>

                <div class="space-y-4 text-gray-300">
                  <div>
                    <h4 class="text-white font-medium mb-2">Chrome:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">chrome://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('chrome://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>

                  <div>
                    <h4 class="text-white font-medium mb-2">Edge:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">edge://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('edge://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>

                  <div class="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
                    <p class="text-yellow-400 text-sm">
                      <strong>Важно:</strong> Убедитесь что расширение "МексоЁБ" включено и имеет доступ к сайту терминала.
                    </p>
                  </div>
                </div>

                <div class="mt-6 flex justify-end">
                  <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors font-medium">Закрыть</button>
                </div>
              </div>
            `,document.body.appendChild(t)},onDiagnostic:()=>{const t=new CustomEvent("openDiagnosticModal");window.dispatchEvent(t)},onTestData:()=>{alert("Тестирование подключения к MEXC API...")},isDiagnosticRunning:!1,isTestDataRunning:!1})}),e.jsxs("div",{className:"mb-6 p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg",children:[e.jsx("h3",{className:"text-lg font-semibold text-blue-400 mb-2",children:"🔧 Обязательно: CORS Unblock"}),e.jsxs("p",{className:"text-gray-300 mb-3",children:["Для стабильной работы всех подключений ",e.jsx("strong",{children:"обязательно"})," установите расширение ",e.jsx("strong",{children:"CORS Unblock"}),":"]}),e.jsxs("div",{className:"grid md:grid-cols-2 gap-4 mb-4",children:[e.jsxs("div",{className:"p-3 bg-gray-800/50 rounded border border-gray-700",children:[e.jsx("h4",{className:"text-white font-medium mb-2",children:"Chrome:"}),e.jsx("p",{className:"text-sm text-gray-300 mb-2",children:"Установите из Chrome Web Store"}),e.jsx("a",{href:"https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino",target:"_blank",className:"inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors",children:"Установить для Chrome"})]}),e.jsxs("div",{className:"p-3 bg-gray-800/50 rounded border border-gray-700",children:[e.jsx("h4",{className:"text-white font-medium mb-2",children:"Edge:"}),e.jsx("p",{className:"text-sm text-gray-300 mb-2",children:"Установите из Edge Add-ons"}),e.jsx("a",{href:"https://microsoftedge.microsoft.com/addons/detail/cors-unblock/hkjklmhjbkdengblmahhkelfhbdbapgf",target:"_blank",className:"inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors",children:"Установить для Edge"})]})]}),e.jsx("div",{className:"p-3 bg-yellow-400/10 border border-yellow-400/20 rounded",children:e.jsxs("p",{className:"text-yellow-400 text-sm",children:[e.jsx("strong",{children:"⚠️ Важно:"})," Без CORS Unblock многие функции могут не работать из-за ограничений безопасности браузера."]})})]}),e.jsx("div",{className:"space-y-4",children:i.map(t=>e.jsxs("div",{className:"bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden",children:[e.jsx("div",{className:"p-4 cursor-pointer hover:bg-gray-700/50 transition-colors",onClick:()=>h(t.id),children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("span",{className:"text-xl",children:g(t.status)}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold text-white",children:t.title}),e.jsx("p",{className:"text-gray-400 text-sm",children:t.description})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("span",{className:`px-3 py-1 rounded-full text-xs font-medium border ${u(t.status)}`,children:t.status==="working"?"Работает":t.status==="error"?"Ошибка":t.status==="warning"?"Предупреждение":"Неизвестно"}),e.jsx("button",{onClick:r=>{r.stopPropagation(),t.buttonAction()},className:"px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md text-sm font-medium transition-colors",children:t.buttonText}),e.jsx("span",{className:"text-gray-400 text-lg",children:a===t.id?"▲":"▼"})]})]})}),a===t.id&&e.jsx("div",{className:"border-t border-gray-700 p-4 bg-gray-800/30",children:e.jsxs("div",{className:"grid md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-semibold text-white mb-3",children:"Требования:"}),e.jsx("ul",{className:"space-y-2",children:t.requirements.map((r,o)=>{const s=v(r,t.id);return e.jsxs("li",{className:"flex items-start space-x-2 text-gray-300",children:[e.jsx("span",{className:`mt-1 ${s==="ok"?"text-green-400":s==="error"?"text-red-400":"text-yellow-400"}`,children:s==="ok"?"✅":s==="error"?"❌":"⚠️"}),e.jsx("span",{className:`text-sm ${s==="ok"?"text-green-300":s==="error"?"text-red-300":"text-yellow-300"}`,children:r})]},o)})})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-semibold text-white mb-3",children:"Подробности:"}),e.jsx("div",{className:"text-gray-300 text-sm whitespace-pre-line",children:t.details})]})]})})]},t.id))})]})};export{M as default};
