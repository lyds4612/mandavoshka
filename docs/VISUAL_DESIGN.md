# Оформление Мандавошки

2 октября 2026. Поле строится по координатам игровой модели в квадратной сетке 13 × 13. Все 48 внешних клеток, 16 домашних клеток и 12 камер СИЗО подписаны. Внешние обозначения — 0–6, домашние — 1–4, СИЗО — I, II, III. Центральная тюрьма сохраняет отдельную восьмиугольную форму. Стрелки подворотен находятся внутри четырёх цветных областей.

Правила игры и идентификаторы игроков сохранены. Зелёные трефы соответствуют `green`, красные червы — `red`, золотые бубны — `orange`, синие пики — прежнему `black`. Панели игроков, окно правил и управление ходом адаптируются к размеру окна. Анимация кубиков и резервный CSS-вариант сохранены.

Оценка по диагностике `refactoring-ui`: **9/10**, 7 из 8 пунктов. Иерархия поля и управления, вторичность подписей, интервалы между группами, ограничение ширины текста, контраст и высота теней проверены. Для 10/10 остаётся привести небольшие декоративные интервалы 5, 6 и 10 px к общей шкале 4/8/16.

## Индикатор текущего хода

3 октября 2026 исправлена слабая заметность статуса у наблюдающих участников: яркое оформление раньше включалось только для «Ваш ход». Теперь оно относится к текущему игроку независимо от того, кто смотрит игру. Карточка выделена золотым контуром, верхней отметкой со стрелкой и контрастным нижним статусом. В компьютерной шапке показано «Сейчас ходит:» и имя игрока; при паузе — сохранённая очередь, после завершения партии — имя не успевшего. Победители отмечены в карточках и пропускаются в очереди, итоговая плашка на поле перечисляет всех победителей и одного проигравшего. Изменение шапки объявляется через `aria-live="polite"`. Мобильное поведение описано в [`MOBILE_GAME.md`](MOBILE_GAME.md).

Оценка именно индикатора по `refactoring-ui`: **10/10**, 8 из 8 пунктов. Иерархия читается по светлой плашке и толщине контура, включая представление без цвета; имя крупнее подписи; интервалы используют шкалу 4/8/16; текст ограничен шириной с полным именем в `title`; контраст статуса составляет 11,70:1, имени в тюремной шапке — 10,15:1; тени показывают небольшую высоту плашек, пространства вокруг текста достаточно. Оценка всей прежней декоративной системы выше остаётся отдельной.

В Edge проверены оба оформления на ширинах 1440, 1100, 981, 800, 390 и 320 px для всех игроков в партиях на двоих и четверых и мобильный размер 568 × 320. Два реальных онлайн-сеанса подтвердили равную заметность собственного и чужого хода, правильное имя, передачу очереди, отключение и автоматическое возвращение. Проверен полный цикл четырёх игроков и снятие отметок хода после победы. Горизонтального переполнения и пересечений шапки с меню нет, размеры рук сохранены. Production-сборка прошла, ошибок выполнения нет; временные сценарии находятся вне проекта.

## Фон

Мобильное оформление обновлено 4 октября: вся доска видна на одном экране, вертикальная рука занимает 56 px, горизонтально портреты находятся слева, рука в панели 104 px — справа. Кнопки фишек имеют область касания 44 px; фишки стоят раздельно, крупный выбор появляется только для различающихся ходов. Всё управление собрано в ☰, полные имена и лор доступны по нажатию на портрет. Расположение и проверки описаны в [`MOBILE_GAME.md`](MOBILE_GAME.md).

Сохранён в [`src/assets/gaming-table.png`](../src/assets/gaming-table.png). Создан встроенным инструментом `image_gen` по навыку `imagegen`. CLI не использовался. Пользователь повторно выбрал именно этот фон. Все подписи, фишки и управление отрисовываются отдельно от изображения.

Финальный промпт:

```text
Use case: photorealistic-natural. Asset type: background artwork for a real playable antique tabletop board game website, landscape 1536x1024. Primary request: a beautiful photorealistic top-down antique dark walnut gaming table, with finely detailed old wood grain and warm candlelight, inspired by a luxurious old board-game illustration. Composition: the central 78 percent of the canvas must be EMPTY continuous dark walnut table wood, low contrast, unobstructed, no game board because the real interactive board will be overlaid by code. Along the extreme outer margins only: a small cropped lit candle with a brass holder in the extreme top-left corner, rich dark forest-green velvet draped diagonally along the left edge, burgundy-red velvet draped along the extreme upper-right edge, two old brass coins near the left edge, a small cropped dark worn leather card box at the extreme lower-right. Keep objects confined to the outermost 10 percent around edges, leave generous completely bare wood in center and around the bottom center for interface panels. The candle should cast soft atmospheric amber light, deep shadows, realistic tactile textures, no perspective tilt, straight overhead flat lay. Colour palette: dark warm browns, antique gold, deep green, dark burgundy. Constraints: no text, no numbers, no lettering, no grid, no board, no UI, no watermark, no people. Premium photographic realism with subtle elegant vintage mood. The image must work as a dark background under an ornate parchment game board.
```

Проверка выполняется production-сборкой и временными браузерными сценариями; постоянный набор автотестов не добавляется, в соответствии с режимом проекта.

## Сменное тюремное оформление

Переключатель «Классика / Тюрьма» в меню ☰ меняет фон, поле, карточки игроков, окно правил, кнопки и палитру кубиков. Классическое оформление остаётся вариантом по умолчанию. Предпочтение хранится отдельно от игровой модели в `localStorage` под ключом `mandavoshka.visual-theme.v1`; при недоступном хранилище переключение продолжает работать. Переключатель доступен с клавиатуры и сообщает выбранный вариант через `aria-pressed`.

Тюремный стиль: бетон и потёртый металл, рамка с заклёпками, трафаретные номера камер, карточки-досье с решётками, приглушённые цвета игроков. Сетка, все 76 подписей, восемь стрелок, правила и ход партии сохраняются. Смена стиля обновляет материалы существующей 3D-сцены без её пересоздания и повторного броска.

Новый фон сохранён в [`src/assets/prison-table.png`](../src/assets/prison-table.png), 1536 × 1024. Создан встроенным инструментом `image_gen` по навыку `imagegen`; CLI не использовался. Детали расположены по краям: эмалированная кружка, домино, ткань, ключи и цепь, свет от решётки. Центр оставлен свободным для интерактивного поля.

Финальный промпт:

```text
Use case: photorealistic-natural. Asset type: premium background artwork for a playable prison-themed tabletop board game website, landscape 1536x1024. Primary request: a stunning photorealistic straight overhead flat lay of an old prison cell's large worn grey concrete and dark iron gaming table. Match the production quality of a luxurious antique tabletop photograph: exceptionally rich tactile materials, realistic lighting, carefully composed details and deep atmospheric shadows. The central 78 percent must be EMPTY continuous medium-dark grey concrete tabletop with subtle scratches, stone grain and worn patina, uncluttered and low contrast, because a real interactive square game board will be placed there. ONLY at the extreme outer margins: a chipped pale enamel tea mug with a dark rim in the upper-left corner, a small folded worn grey cloth and two domino tiles along the lower-left edge, old iron keys and a short heavy chain cropped along the extreme right edge, a folded charcoal prison blanket with one faded narrow blue stripe in the lower-right corner. A barely visible rusty metal border and coarse rivets at the far edges. Cold blue-grey daylight from barred windows casts elegant diagonal soft bar shadows across the far upper and left edges, with a small warm amber light accent on the mug and worn metal. Keep the center almost free of bar shadows so interface text remains readable. Straight 90-degree top-down camera, no perspective tilt, no people. Palette: charcoal, desaturated slate blue, distressed concrete grey, restrained rusty bronze highlights. Mood: cinematic prison atmosphere, authentic, beautifully crafted gritty game art, sophisticated rather than horror. Constraints: no words, no lettering, no numbers, no grid, no game board, no UI, no watermark, no weapons, no blood. Objects confined to the outermost 10 percent of the canvas. The final background must feel as realistic and high quality as a premium dark walnut board-game tabletop with candlelight.
```

В production-версии проверены оба оформления на ширинах 1366, 800, 390 и 320 px, одинаковый размер клеток, отсутствие горизонтальной прокрутки, окно правил, переключение мышью и клавиатурой, сохранение выбора, неизвестное значение и запрет хранилища. Состояние игры и выбранная фишка совпадают до и после переключения; WebGL-сцена сохраняется во время полёта кубиков. Проверены постановка и движение фишки после смены стиля, новая партия и восстановление оформления после перезагрузки.

При отключённом WebGL также проверены CSS-кубики в обычном режиме и с уменьшенным движением: результат броска и возможность поставить фишку сохраняются после переключения темы. Ошибок выполнения в браузере нет; production-сборка завершена успешно.
