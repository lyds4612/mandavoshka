export const flattened = (data) => {
    return Object.values(data).flatMap((items) =>
        items.map(item => ({
            ...item
        }))
    )
};