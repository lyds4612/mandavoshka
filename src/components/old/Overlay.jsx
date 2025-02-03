import React from 'react';

const Overlay = ({ message }) => (
    message ? <div className="overlay">{message}</div> : null
);

export default Overlay;