import React from 'react';
export default function Badge({children,variant='neutral'}){return <span className={`badge ${variant}`}>{children}</span>}
