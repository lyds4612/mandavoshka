import { useEffect, useRef } from 'react';
import { Fleur } from './Ornaments';

const RulesDialog = ({ open, onClose }) => {
    const dialog = useRef(null);
    useEffect(() => {
        if (open && !dialog.current.open) dialog.current.showModal();
        else if (!open && dialog.current.open) dialog.current.close();
    }, [open]);
    return (
        <dialog ref={dialog} className="rules-dialog" onClose={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }} aria-labelledby="rules-title">
            <div className="rules-content">
                <button className="dialog-close" onClick={onClose} aria-label="Закрыть правила">×</button>
                <Fleur /><span className="eyebrow">За игровым столом</span>
                <h2 id="rules-title">Правила Мандавошки</h2>
                <p className="rules-intro">От двух до четырёх игроков. По четыре фишки. Один путь домой.</p>
                <ol>
                    <li><strong>Бросьте два кубика.</strong> Когда в центре мигает подсказка, нажмите в любой точке поля. Значения используются от большего к меньшему. Дубль даёт ещё один бросок после доступных действий.</li>
                    <li><strong>Начните с шестёрки.</strong> За 6 можно поставить фишку из руки на собственный старт 0 или передвинуть фишку на поле.</li>
                    <li><strong>Пройдите круг.</strong> На внешней дорожке 48 клеток. Остановка на чужой фишке отправляет все фишки соперника с этой клетки в центральную тюрьму.</li>
                    <li><strong>Воспользуйтесь подворотней.</strong> Остановка на клетке 2 у цветной дуги автоматически переносит фишку на парную клетку этого угла. Переход работает в обе стороны; проход без остановки его не запускает.</li>
                    <li><strong>Пройдите СИЗО.</strong> Входы — клетки 3 рядом с римскими I, II, III. Для выхода из камер нужны соответственно 1, 2, 3. Разрешён один переход внутри СИЗО за ход, включая дополнительный бросок. После III фишка возвращается на круг через две клетки после входа.</li>
                    <li><strong>Выйдите из тюрьмы.</strong> Одна 6 возвращает выбранную фишку в руку; две 6 выводят её прямо на старт. Прогресс сбитой фишки теряется.</li>
                    <li><strong>Заведите фишки в хату.</strong> После полного круга открывается собственная дорожка 1–4. Требуется точное число, фишки здесь в безопасности. Все четыре на последней клетке — победа.</li>
                </ol>
                <p className="rules-note">Перетащите фишку на подсвеченную клетку или выберите её нажатием и нажмите на цель. Если ходов нет, очередь передаётся автоматически.</p>
                <button className="button button-gold" onClick={onClose}>Всё понятно, играем</button>
            </div>
        </dialog>
    );
};

export default RulesDialog;
