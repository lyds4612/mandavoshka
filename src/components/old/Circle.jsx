import React, { forwardRef } from 'react';

const Circle = forwardRef((props, ref) => (
    <div className="circle" ref={ref} style={{ left: `${props.position.x}px`, top: `${props.position.y}px` }} />
));

export default Circle;