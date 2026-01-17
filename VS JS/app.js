// Елдер мен тәуекел деңгейлері туралы деректер
const countryData = {
    'india': { level: 'high', name: 'Үндістан' },
    'china': { level: 'high', name: 'Қытай' },
    'russia': { level: 'high', name: 'Ресей' },
    'usa': { level: 'medium', name: 'АҚШ' },
    'brazil': { level: 'high', name: 'Бразилия' },
    'south-africa': { level: 'high', name: 'ОАР' },
    'greece': { level: 'high', name: 'Грекия' },
    'italy': { level: 'medium', name: 'Италия' },
    'spain': { level: 'medium', name: 'Испания' },
    'ukraine': { level: 'high', name: 'Украина' },
    'kazakhstan': { level: 'medium', name: 'Қазақстан' },
    'germany': { level: 'low', name: 'Германия' },
    'france': { level: 'low', name: 'Франция' },
    'japan': { level: 'low', name: 'Жапония' },
    'australia': { level: 'low', name: 'Австралия' }
};

// Әр ел үшін бактериялар туралы деректер
const bacteriaData = {
    'high': [
        {
            name: 'Staphylococcus aureus',
            scientific: 'Staphylococcus aureus (MRSA)',
            description: 'Метициллинге төзімді алтын стафилококк. Көптеген антибиотиктерге төзімді ең қауіпті патогендердің бірі. Терінің, жұмсақ тіндердің ауыр инфекцияларын және жүйелі инфекцияларды тудыруы мүмкін.'
        },
        {
            name: 'Pseudomonas aeruginosa',
            scientific: 'Pseudomonas aeruginosa',
            description: 'Көптеген антибиотиктерге жиі төзімді грам-теріс бактерия. Әсіресе иммунитеті әлсіз адамдарға қауіпті. Жаралардың, тыныс алу жолдарының және зәр шығару жолдарының инфекцияларын тудыруы мүмкін.'
        },
        {
            name: 'Klebsiella pneumoniae',
            scientific: 'Klebsiella pneumoniae (KPC)',
            description: 'KPC-ферменттерін өндіретін карбапенемге төзімді бактерия. Ауыр ауруханалық инфекцияларды, пневмонияны және зәр шығару жолдарының инфекцияларын тудырады.'
        }
    ],
    'medium': [
        {
            name: 'Escherichia coli',
            scientific: 'Escherichia coli (ESBL)',
            description: 'Кеңейтілген спектрлі бета-лактамазаларды өндіретін ішек таяқшасы. Зәр шығару жолдарының және асқазан-ішек трактының инфекцияларын тудыруы мүмкін.'
        },
        {
            name: 'Enterococcus faecium',
            scientific: 'Enterococcus faecium (VRE)',
            description: 'Ванкомицинген төзімді энтерококк. Медициналық мекемелерде жиі кездеседі және иммунитеті әлсіз науқастарда инфекцияларды тудыруы мүмкін.'
        }
    ],
    'low': [
        {
            name: 'Streptococcus pyogenes',
            scientific: 'Streptococcus pyogenes',
            description: 'A тобының бета-гемолитикалық стрептококк. Әдетте пенициллинге сезімтал, бірақ асқынуларды болдырмау үшін уақытында емдеуді талап етеді.'
        }
    ]
};

// Текущее состояние приложения
let currentState = {
    trackingLocation: false,
    homeCountry: null,
    lastCountry: null,
    userNumber: null
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadSavedState();
    setupEventListeners();
    requestNotificationPermission();
});

function initializeApp() {
    // Геолокацияны қолдауын тексеру
    if (!navigator.geolocation) {
        document.getElementById('locationStatus').innerHTML = 
            '<p>Геолокация сіздің браузеріңізде қолдау көрсетілмейді</p>';
        document.getElementById('toggleLocation').style.display = 'none';
    }
}

function loadSavedState() {
    const saved = localStorage.getItem('antibioticRiskApp');
    if (saved) {
        currentState = { ...currentState, ...JSON.parse(saved) };
        if (currentState.trackingLocation) {
            updateLocationButton(true);
            startLocationTracking();
        }
    }
}

function setupEventListeners() {
    const form = document.getElementById('riskForm');
    const resetBtn = document.getElementById('resetBtn');
    const toggleLocationBtn = document.getElementById('toggleLocation');
    const durationBtns = document.querySelectorAll('.duration-btn');
    const checkPatientBtn = document.getElementById('checkPatientBtn');

    form.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    toggleLocationBtn.addEventListener('click', toggleLocationTracking);
    checkPatientBtn.addEventListener('click', checkPatientRecord);
    
    // Проверка по Enter в поле ввода номера пациента
    document.getElementById('doctorCheckNumber').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPatientRecord();
        }
    });
    
    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            durationBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const duration = btn.dataset.duration;
            showDurationMessage(duration);
        });
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const personNumber = document.getElementById('personNumber').value;
    const country = document.getElementById('country').value;
    
    if (!country) {
        showNotification('Өтінеміз, елді таңдаңыз', 'error');
        return;
    }
    
    currentState.userNumber = personNumber;
    currentState.lastCountry = country;
    saveState();
    
    const countryInfo = countryData[country];
    displayRiskResult(countryInfo.level, countryInfo.name);
    
    // Сохраняем цифровой след о поездке
    saveTravelRecord(personNumber, country, countryInfo.level, countryInfo.name);
    
    // Сохраняем выбранную страну для отслеживания возвращения
    if (currentState.trackingLocation && !currentState.homeCountry) {
        detectHomeCountry();
    }
}

function displayRiskResult(level, countryName) {
    const resultDiv = document.getElementById('riskResult');
    const triangle = document.getElementById('riskTriangle');
    const riskLevel = document.getElementById('riskLevel');
    const riskDescription = document.getElementById('riskDescription');
    const durationBlock = document.getElementById('durationBlock');
    const antibioticWarning = document.getElementById('antibioticWarning');
    const guideTable = document.getElementById('guideTable');
    
    resultDiv.classList.remove('hidden');
    
    // Удаляем предыдущие классы
    triangle.className = 'triangle';
    
    // Устанавливаем уровень риска
    let levelText, description, color;
    
    switch(level) {
        case 'high':
            levelText = '🔴 ЖОҒАРЫ ТӘУЕКЕЛ';
            description = `${countryName} елінде тері микрофлорасының антибиотиктерге төзімділігінің жоғары деңгейі анықталды. Ерекше сақтықпен қарау және оралғаннан кейін скринингтен өту ұсынылады.`;
            color = '#f44336';
            triangle.classList.add('high');
            durationBlock.classList.remove('hidden');
            antibioticWarning.classList.remove('hidden');
            guideTable.classList.remove('hidden');
            break;
        case 'medium':
            levelText = '🟡 ОРТАША ТӘУЕКЕЛ';
            description = `${countryName} елінде тері микрофлорасының антибиотиктерге төзімділігінің орташа деңгейі. Негізгі сақтық шараларын сақтаңыз.`;
            color = '#ffeb3b';
            triangle.classList.add('medium');
            durationBlock.classList.add('hidden');
            antibioticWarning.classList.add('hidden');
            guideTable.classList.add('hidden');
            break;
        case 'low':
            levelText = '🟢 ТӨМЕН ТӘУЕКЕЛ';
            description = `${countryName} елінде тері микрофлорасының антибиотиктерге төзімділігінің төмен деңгейі. Тәуекел минималды, бірақ негізгі гигиена шаралары бәрібір маңызды.`;
            color = '#4CAF50';
            triangle.classList.add('low');
            durationBlock.classList.add('hidden');
            antibioticWarning.classList.add('hidden');
            guideTable.classList.add('hidden');
            break;
    }
    
    riskLevel.textContent = levelText;
    riskLevel.style.color = color;
    riskDescription.textContent = description;
    
    // Отображаем информацию о бактериях
    displayBacteriaInfo(level);
    
    // Прокрутка к результату
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayBacteriaInfo(level) {
    const container = document.getElementById('bacteriaInfo');
    const bacteria = bacteriaData[level];
    
    container.innerHTML = '<h3 style="margin-bottom: 20px; text-align: center;">⚠️ Аймақтағы ең қауіпті патогендер:</h3>';
    
    bacteria.forEach(bact => {
        const card = document.createElement('div');
        card.className = `bacteria-card ${level}`;
        card.innerHTML = `
            <div class="bacteria-name">${bact.name}</div>
            <div class="bacteria-scientific">${bact.scientific}</div>
            <div class="bacteria-description">${bact.description}</div>
        `;
        container.appendChild(card);
    });
}

function showDurationMessage(duration) {
    const message = duration === 'long' 
        ? '6 айдан көп тұрғанда тәуекел айтарлықтай артады. Оралғаннан кейін міндетті түрде скринингтен өтіңіз.'
        : '4-6 ай тұрғанда оралғаннан кейін скринингтен өту ұсынылады.';
    
    showNotification(message, 'warning');
}

function resetForm() {
    document.getElementById('riskForm').reset();
    document.getElementById('riskResult').classList.add('hidden');
    document.getElementById('durationBlock').classList.add('hidden');
    document.getElementById('guideTable').classList.add('hidden');
    document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('selected'));
}

function toggleLocationTracking() {
    currentState.trackingLocation = !currentState.trackingLocation;
    updateLocationButton(currentState.trackingLocation);
    saveState();
    
    if (currentState.trackingLocation) {
        startLocationTracking();
        if (!currentState.homeCountry) {
            detectHomeCountry();
        }
    } else {
        stopLocationTracking();
    }
}

function updateLocationButton(isActive) {
    const btn = document.getElementById('toggleLocation');
    const statusText = document.getElementById('locationText');
    
    if (isActive) {
        btn.textContent = 'Байқауды өшіру';
        btn.classList.add('active');
        statusText.textContent = 'Белсенді';
        statusText.style.color = '#4CAF50';
    } else {
        btn.textContent = 'Байқауды қосу';
        btn.classList.remove('active');
        statusText.textContent = 'Байқалмайды';
        statusText.style.color = '#666';
    }
}

function detectHomeCountry() {
    // Определяем страну по геолокации
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const country = await getCountryFromCoordinates(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    currentState.homeCountry = country;
                    saveState();
                } catch (error) {
                    console.error('Ошибка определения страны:', error);
                }
            },
            (error) => {
                console.error('Ошибка геолокации:', error);
            }
        );
    }
}

async function getCountryFromCoordinates(lat, lon) {
    // Используем бесплатный API для определения страны
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=kk`);
        const data = await response.json();
        return data.countryName || 'Unknown';
    } catch (error) {
        console.error('Ошибка API геокодирования:', error);
        return 'Unknown';
    }
}

let locationWatchId = null;

function startLocationTracking() {
    if (!navigator.geolocation) return;
    
    let lastPosition = null;
    
    locationWatchId = navigator.geolocation.watchPosition(
        async (position) => {
            try {
                const country = await getCountryFromCoordinates(
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                // Проверяем, вернулся ли пользователь в свою страну
                if (currentState.homeCountry && 
                    country === currentState.homeCountry && 
                    lastPosition && 
                    lastPosition !== country) {
                    showReturnNotification();
                }
                
                lastPosition = country;
            } catch (error) {
                console.error('Ошибка отслеживания:', error);
            }
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function stopLocationTracking() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
}

function showReturnNotification() {
    const message = '🔔 Скринингтен өтуді ұмытпаңыз';
    const description = 'Сіз елге оралдыңыз. Төзімді бактерия штаммдарын әкелу тәуекелі бар. Медициналық скринингтен өту ұсынылады.';
    
    // Сандық іздегі оралу күнін жаңарту
    if (currentState.userNumber) {
        updateReturnDate(currentState.userNumber);
    }
    
    showNotification(description, 'warning');
    
    // Рұқсат берілген болса браузер хабарландыруын көрсету
    if (Notification.permission === 'granted') {
        new Notification(message, {
            body: description,
            icon: '🔬',
            tag: 'screening-reminder'
        });
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Умные push-уведомления
function setupSmartNotifications() {
    // Проверяем погоду и отправляем уведомления
    checkWeatherAndNotify();
    
    // Периодические напоминания
    setInterval(() => {
        if (currentState.trackingLocation && currentState.lastCountry) {
            sendSmartReminder();
        }
    }, 3600000); // Каждый час
}

async function checkWeatherAndNotify() {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            // Используем бесплатный API погоды
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=demo&units=metric&lang=ru`
            );
            
            // Если API доступен, проверяем температуру
            // Для демо-версии используем симуляцию
            const temp = Math.random() * 30 + 20; // Симуляция температуры
            
            if (temp > 28 && currentState.lastCountry) {
                const message = '🌡️ Бүгін ыстық ауа райы, терлеуге байланысты бактериялардың тері арқылы ену тәуекелі артады. Антисептикті пайдалануды ұмытпаңыз.';
                showNotification(message, 'warning');
                
                if (Notification.permission === 'granted') {
                    new Notification('Маңызды еске салу', {
                        body: message,
                        icon: '🌡️'
                    });
                }
            }
        } catch (error) {
            // В демо-версии просто показываем случайное уведомление
            if (Math.random() > 0.7 && currentState.lastCountry) {
                sendSmartReminder();
            }
        }
    });
}

function sendSmartReminder() {
    const reminders = [
        '💧 Қолды сабынмен дұрыс жууды ұмытпаңыз, әсіресе қоғамдық орындарға барғаннан кейін.',
        '🧴 Спирт негізіндегі қол антисептигін пайдаланыңыз (спирт кемінде 60%).',
        '🧴 Теріде жара немесе кесу болса, оларды міндетті түрде антисептикпен өңдеп, пластырьмен жабыңыз.',
        '🚿 Саяхаттан оралғаннан кейін душ алып, денеңізді сабынмен мұқият жуыңыз.',
        '👕 Киімді дұрыс жуыңыз, әсіресе медициналық мекемелерге немесе қоғамдық орындарға барғаннан кейін.',
        '🌡️ Дене температурасы көтерілсе немесе инфекция белгілері пайда болса, дереу дәрігерге жүгініңіз.'
    ];
    
    const randomReminder = reminders[Math.floor(Math.random() * reminders.length)];
    
    if (Math.random() > 0.5) { // 50% ықтималдық хабарландыруды көрсету
        showNotification(randomReminder, 'warning');
        
        if (Notification.permission === 'granted') {
            new Notification('Қауіпсіздік туралы еске салу', {
                body: randomReminder,
                icon: '🔬'
            });
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

function saveState() {
    localStorage.setItem('antibioticRiskApp', JSON.stringify(currentState));
}

// Сохранение цифрового следа о поездке
function saveTravelRecord(personNumber, countryCode, riskLevel, countryName) {
    const travelRecords = JSON.parse(localStorage.getItem('travelRecords') || '[]');
    
    const record = {
        personNumber: personNumber,
        countryCode: countryCode,
        countryName: countryName,
        riskLevel: riskLevel,
        travelDate: new Date().toISOString(),
        returnDate: null // Будет установлена при возвращении
    };
    
    travelRecords.push(record);
    localStorage.setItem('travelRecords', JSON.stringify(travelRecords));
}

// Обновление даты возвращения при обнаружении возвращения в страну
function updateReturnDate(personNumber) {
    const travelRecords = JSON.parse(localStorage.getItem('travelRecords') || '[]');
    const activeRecords = travelRecords.filter(r => 
        r.personNumber === personNumber && r.returnDate === null
    );
    
    if (activeRecords.length > 0) {
        const latestRecord = activeRecords[activeRecords.length - 1];
        latestRecord.returnDate = new Date().toISOString();
        localStorage.setItem('travelRecords', JSON.stringify(travelRecords));
    }
}

// Проверка цифрового следа пациента (для врачей)
function checkPatientRecord() {
    const personNumber = document.getElementById('doctorCheckNumber').value.trim();
    const warningDiv = document.getElementById('doctorWarning');
    
    if (!personNumber) {
        showNotification('Науқас нөмірін енгізіңіз', 'error');
        return;
    }
    
    const travelRecords = JSON.parse(localStorage.getItem('travelRecords') || '[]');
    const patientRecords = travelRecords.filter(r => r.personNumber === personNumber);
    
    if (patientRecords.length === 0) {
        warningDiv.innerHTML = `
            <h4>✅ Жазба табылмады</h4>
            <p>Жүйеде бұл науқас үшін саяхат туралы жазбалар жоқ.</p>
        `;
        warningDiv.className = 'doctor-warning safe';
        warningDiv.classList.remove('hidden');
        return;
    }
    
    // Проверяем недавние поездки в красную зону (в течение последнего месяца)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentHighRiskTravels = patientRecords.filter(record => {
        const returnDate = record.returnDate ? new Date(record.returnDate) : new Date();
        return record.riskLevel === 'high' && returnDate >= oneMonthAgo;
    });
    
    if (recentHighRiskTravels.length > 0) {
        const latestTravel = recentHighRiskTravels[recentHighRiskTravels.length - 1];
        const returnDate = latestTravel.returnDate ? new Date(latestTravel.returnDate) : new Date();
        const daysAgo = Math.floor((new Date() - returnDate) / (1000 * 60 * 60 * 24));
        
        warningDiv.innerHTML = `
            <h4>⚠️ НАЗАР АУДАРЫҢЫЗ! Жоғары тәуекел</h4>
            <p><strong>Бұл адам ${daysAgo > 0 ? daysAgo + ' күн' : 'жақында'} бұрын супербактериялардың таралуының жоғары тәуекелі бар аймақтан келді.</strong></p>
            <div class="travel-info">
                <strong>Саяхат мәліметтері:</strong>
                <p>Ел: ${latestTravel.countryName}</p>
                <p>Тәуекел деңгейі: 🔴 ЖОҒАРЫ</p>
                <p>Оралу күні: ${returnDate.toLocaleDateString('kk-KZ')}</p>
            </div>
            <p style="margin-top: 15px; font-weight: 600; color: #f44336;">
                📋 Ұсыныстар:<br>
                • Стандартты антибиотикті емес, күшейтілген терапияны тағайындаңыз<br>
                • Емдеуді тағайындамас бұрын бактериологиялық егу нәтижелерін күтіңіз<br>
                • Бактериялардың басқа науқастарға таралуын болдырмау үшін шаралар қолданыңыз
            </p>
        `;
        warningDiv.className = 'doctor-warning alert';
    } else {
        // Жазбалар бар, бірақ жақында қызыл аймаққа саяхат жоқ
        const allRecords = patientRecords.map(r => r.countryName).join(', ');
        warningDiv.innerHTML = `
            <h4>ℹ️ Науқас туралы ақпарат</h4>
            <p>Жүйеде саяхат туралы жазбалар бар, бірақ жақында жоғары тәуекелді аймақтарға саяхат жоқ.</p>
            <p style="margin-top: 10px;"><strong>Барылған елдер:</strong> ${allRecords}</p>
        `;
        warningDiv.className = 'doctor-warning safe';
    }
    
    warningDiv.classList.remove('hidden');
}

// Запускаем умные уведомления при загрузке
setTimeout(setupSmartNotifications, 5000);
