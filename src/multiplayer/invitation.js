export const getInvitationCode = (search = window.location.search) =>
    new URLSearchParams(search).get('room')?.trim().toUpperCase() ?? '';
