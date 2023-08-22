import React from 'react';
import { useMyVariable } from '../context/MyVariableContext'

const Report = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    console.log("contributions", myVariable.report)
    return (
        <div>
            <h2>This is the Report component</h2>
            <p>Content for the report goes here.</p>
        </div>
    );
};

export default Report;
