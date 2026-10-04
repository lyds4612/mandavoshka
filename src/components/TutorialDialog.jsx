import { useEffect, useState } from 'react';
import GameDialog from './GameDialog';
import './TutorialDialog.css';

const LESSONS = [
    { title: 'Бросок кубиков', text: 'В свой ход нажмите на поле. Сначала используйте больший кубик. Дубль даст ещё один бросок после доступных действий.' },
    { title: 'Выбор и ход', text: 'За шестёрку поставьте фишку из руки на старт. Затем выберите фишку и нажмите подсвеченную клетку или кнопку →. Можно перетащить её; × отменяет выбор.' },
    { title: 'Что делают клетки', text: 'Нажмите на обозначение, чтобы увидеть его правило.' },
    { title: 'Заполните хату', text: 'Доведите четыре фишки в собственные клетки 1–4 точным броском. На каждой клетке должна стоять одна фишка. Игра продолжается, пока не останется один не успевший.' },
];
const CELLS = [
    ['2 ↔', 'Подворотня', 'Остановка на 2 со стрелкой переносит фишку на парную клетку. Переход работает в обе стороны.'],
    ['I II III', 'СИЗО', 'Для переходов нужны 1, 2 и 3. Каждая фишка может сделать один переход внутри СИЗО за ход.'],
    ['↩', 'Тюрьма', 'Сбитая фишка попадает в центр. Одна шестёрка возвращает выбранную фишку в руку; другая нужна для отдельной постановки на старт.'],
    ['1–4', 'Хата', 'Фишки здесь защищены. Заполните четыре разные клетки, без наложения фишек друг на друга.'],
];

const TutorialDialog = ({ open, onClose, onComplete }) => {
    const [step, setStep] = useState(0), [demonstrated, setDemonstrated] = useState(false);
    const [cell, setCell] = useState(0), [homes, setHomes] = useState([]);
    useEffect(() => { if (open) { setStep(0); setDemonstrated(false); setHomes([]); setCell(0); } }, [open]);
    const lesson = LESSONS[step];
    const changeStep = next => { setStep(next); setDemonstrated(false); };
    return <GameDialog open={open} onClose={onClose} title={lesson.title} className="tutorial-dialog">
        <span className="tutorial-progress">{step + 1} / {LESSONS.length}</span><p className="tutorial-copy">{lesson.text}</p>
        {step === 0 && <button type="button" className={`tutorial-dice ${demonstrated ? 'is-thrown' : ''}`} aria-label="Бросить учебные кубики" onClick={() => setDemonstrated(value => !value)}>
            <span className="tutorial-cube">{demonstrated ? '⚅' : '⚀'}</span><span className="tutorial-cube">{demonstrated ? '⚂' : '⚀'}</span>
        </button>}
        {step === 1 && <div className="tutorial-track" aria-label="Учебное перемещение">{[0,1,2,3].map(index => <button type="button" key={index}
            disabled={index !== 2} className={index === 2 ? 'is-target' : ''} aria-label={index === 2 ? 'Передвинуть учебную фишку на два шага' : `Клетка ${index}`}
            onClick={() => setDemonstrated(true)}>{index === (demonstrated ? 2 : 0) ? <span className="tutorial-token" /> : index}</button>)}</div>}
        {step === 2 && <><div className="tutorial-cells">{CELLS.map(([symbol,name],index) => <button type="button" key={name}
            aria-pressed={cell === index} onClick={() => setCell(index)}><strong>{symbol}</strong><span>{name}</span></button>)}</div><p className="tutorial-cell-rule" role="status">{CELLS[cell][2]}</p></>}
        {step === 3 && <><div className="tutorial-track" aria-label="Учебная хата">{[1,2,3,4].map(index => <button type="button" key={index}
            aria-label={`Заполнить домашнюю клетку ${index}`} aria-pressed={homes.includes(index)} onClick={() => setHomes(values => values.includes(index) ? values : [...values,index])}>
            {homes.includes(index) ? <span className="tutorial-token" /> : index}</button>)}</div><p className="tutorial-cell-rule" role="status">{homes.length === 4 ? 'Все четыре клетки заполнены. Вы победили!' : `${homes.length} / 4`}</p></>}
        <div className="tutorial-actions"><button type="button" className="button button-quiet" disabled={step === 0} onClick={() => changeStep(step - 1)}>Назад</button>
            <button type="button" className="button button-primary tutorial-next" onClick={() => step === 3 ? onComplete() : changeStep(step + 1)}>{step === 3 ? 'Готово' : 'Дальше'}</button></div>
    </GameDialog>;
};
export default TutorialDialog;
