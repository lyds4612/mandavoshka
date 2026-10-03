export const getConnectionNotice = network => {
    if (network.mode !== 'online') return null;
    if (network.sessionReplaced) return {
        kind: 'warning', title: 'Ваше место открыто в другом окне',
        description: 'Продолжайте игру в том окне или выйдите из этой комнаты.',
    };
    if (network.sessionExpired) return {
        kind: 'warning', title: 'Сохранённая партия недоступна',
        description: 'Выйдите из комнаты и создайте новую партию.',
    };
    if (network.status !== 'connected') return {
        kind: 'warning', title: network.room ? 'Связь потеряна' : 'Восстанавливаем подключение',
        description: `Переподключаемся${network.reconnectAttempt ? ` · попытка ${network.reconnectAttempt}` : ''}. Ваше место и фишки сохранены.`,
        canRetry: true,
    };
    const offline = network.room?.players.filter(player => !player.connected && player.result !== 'winner') ?? [];
    if (offline.length) return {
        kind: network.room.phase === 'playing' && !network.room.paused ? 'info' : 'warning', title: offline.length === 1 ? `Игрок «${offline[0].name}» отключился`
            : `Игроки ${offline.map(player => `«${player.name}»`).join(', ')} отключились`,
        description: network.room.phase === 'playing' ? network.room.paused ? 'Партия на паузе. Ждём возвращения игроков — их места и фишки сохранены.' : 'Результаты партии сохранены.'
            : 'Место временно сохранено. Игрок может вернуться по прежней ссылке.',
    };
    const notice = network.room?.notice;
    if (notice?.type === 'reconnected') return {
        kind: 'success', title: `Игрок «${notice.name}» вернулся в игру`,
        description: network.room.phase === 'playing' ? 'Подключение восстановлено. Его место и результат сохранены.' : 'Подключение восстановлено.',
    };
    if (notice?.type === 'left') return {
        kind: 'info', title: `Игрок «${notice.name}» вышел из комнаты`,
        description: network.room.phase === 'playing' ? 'Его результат сохранён. Остальные игроки могут продолжать.' : 'Соберите участников и начните новую партию.',
    };
    return null;
};
